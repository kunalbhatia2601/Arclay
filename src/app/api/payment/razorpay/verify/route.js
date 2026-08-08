import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import Settings from "@/models/Settings";
import User from "@/models/User";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { withProtection } from "@/lib/auth";
import { sendOrderConfirmationEmail } from "@/lib/mailer";
import { claimCouponUsage } from "@/lib/coupons";
import { findVariantIndex, reserveStock } from "@/lib/stock";
import { recordSales } from "@/lib/sales";

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

        // Idempotency guard: a replayed verification must not deduct stock or
        // consume coupon usage a second time.
        if (order.paymentStatus === 'completed') {
            return Response.json({
                success: true,
                message: "Payment already verified",
                order
            });
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

        // Payment is successful - now deduct stock and clear cart.
        // Stock is decremented atomically; any line that cannot be fulfilled is
        // recorded rather than silently skipped, because the customer has paid.
        const shortfalls = [];
        const fulfilled = [];

        for (const orderItem of order.items) {
            const product = await Product.findById(orderItem.product._id);

            if (!product) {
                shortfalls.push('unknown product');
                continue;
            }

            const variantIndex = findVariantIndex(product, orderItem.variant.attributes);
            const reserved = await reserveStock(product._id, variantIndex, orderItem.quantity);

            if (!reserved) {
                shortfalls.push(`${product.name} x${orderItem.quantity}`);
            } else {
                fulfilled.push({ productId: product._id, quantity: orderItem.quantity });
            }
        }

        // Only lines that actually came out of stock count as sales.
        await recordSales(fulfilled);

        // Consume coupon usage only now that the payment has actually landed.
        if (order.coupon && order.discountAmount > 0) {
            await claimCouponUsage(order.coupon);
        }

        // Clear user's cart
        await Cart.findOneAndUpdate(
            { user: order.user },
            { $set: { items: [], emails_sent_count: 0, last_email_sent_at: null } }
        );

        // Update order
        order.paymentStatus = 'completed';
        order.paymentId = razorpayPaymentId;

        if (shortfalls.length > 0) {
            // Payment succeeded but stock ran out. Hold the order for manual
            // review instead of confirming something that cannot ship.
            order.orderStatus = 'pending';
            order.notes = [order.notes, `STOCK SHORTFALL: ${shortfalls.join(', ')}`]
                .filter(Boolean)
                .join(' | ')
                .slice(0, 500);
            console.error(
                `Order ${order._id} paid but out of stock:`,
                shortfalls.join(', ')
            );
        } else {
            order.orderStatus = 'confirmed';
        }

        await order.save();

        // Send order confirmation email
        try {
            if (settings.mail?.isEnabled && settings.mail?.email && settings.mail?.password && settings.mail?.host) {
                const populatedOrder = await Order.findById(order._id)
                    .populate('items.product', 'name images')
                    .lean();
                const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'ESSVORA';
                await sendOrderConfirmationEmail(populatedOrder, req.user.email, settings.mail, siteName);
            }
        } catch (emailError) {
            console.error('Failed to send order confirmation email:', emailError);
            // Don't fail the order if email fails
        }

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
