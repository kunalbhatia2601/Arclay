import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import Settings from "@/models/Settings";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { withProtection } from "@/lib/auth";

async function postHandler(req) {
    try {
        const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

        if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return Response.json(
                { success: false, message: "Missing payment details" },
                { status: 400 }
            );
        }

        await connectDB();

        // Get order
        const order = await Order.findById(orderId).populate('items.product');

        if (!order) {
            return Response.json(
                { success: false, message: "Order not found" },
                { status: 404 }
            );
        }

        // Verify ownership
        if (order.user.toString() !== req.user._id.toString()) {
            return Response.json(
                { success: false, message: "Unauthorized" },
                { status: 403 }
            );
        }

        // Get settings for key secret
        const settings = await Settings.getSettings();

        // Verify signature
        const isValid = verifyRazorpaySignature(
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            settings.payment.razorpay.keySecret
        );

        if (!isValid) {
            // Update order to failed
            order.paymentStatus = 'failed';
            await order.save();

            return Response.json(
                { success: false, message: "Invalid payment signature" },
                { status: 400 }
            );
        }

        // Payment is successful - now deduct stock and clear cart

        // Deduct stock for each item
        for (const orderItem of order.items) {
            const product = await Product.findById(orderItem.product._id);
            if (product) {
                // Find matching variant
                const variant = product.variants.find(v => {
                    const vAttrs = Object.fromEntries(v.attributes);
                    const orderAttrs = Object.fromEntries(orderItem.variant.attributes);
                    return JSON.stringify(vAttrs) === JSON.stringify(orderAttrs);
                });

                if (variant && variant.stock >= orderItem.quantity) {
                    variant.stock -= orderItem.quantity;
                    await product.save();
                }
            }
        }

        // Clear user's cart
        await Cart.findOneAndUpdate(
            { user: order.user },
            { $set: { items: [] } }
        );

        // Update order
        order.paymentStatus = 'completed';
        order.paymentId = razorpayPaymentId;
        order.orderStatus = 'confirmed';
        await order.save();

        return Response.json({
            success: true,
            message: "Payment verified successfully",
            order
        });
    } catch (error) {
        console.error("Verify Razorpay payment error:", error);
        return Response.json(
            { success: false, message: error.message || "Server error" },
            { status: 500 }
        );
    }
}

export const POST = withProtection(postHandler);
