import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Settings from "@/models/Settings";
import { createRazorpayOrder } from "@/lib/razorpay";
import { withProtection } from "@/lib/auth";

async function postHandler(req) {
    try {
        const { orderId } = await req.json();

        if (!orderId) {
            return Response.json(
                { success: false, message: "Order ID is required" },
                { status: 400 }
            );
        }

        await connectDB();

        // Get order
        const order = await Order.findById(orderId);

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

        // Get settings
        const settings = await Settings.getSettings();

        if (!settings.payment.razorpay.isEnabled) {
            return Response.json(
                { success: false, message: "Razorpay is not enabled" },
                { status: 400 }
            );
        }

        // Create Razorpay order
        const razorpayOrder = await createRazorpayOrder(
            Math.round(order.totalAmount * 100), // Convert to paise
            order._id.toString(),
            settings.payment.razorpay.keyId,
            settings.payment.razorpay.keySecret
        );

        return Response.json({
            success: true,
            razorpayOrderId: razorpayOrder.id,
            keyId: settings.payment.razorpay.keyId,
            amount: order.totalAmount,
            currency: 'INR',
            name: process.env.NEXT_PUBLIC_SITE_NAME || 'Store',
            orderId: order._id.toString()
        });
    } catch (error) {
        console.error("Create Razorpay order error:", error);
        return Response.json(
            { success: false, message: error.message || "Server error" },
            { status: 500 }
        );
    }
}

export const POST = withProtection(postHandler);
