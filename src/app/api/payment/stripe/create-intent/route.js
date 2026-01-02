import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Settings from "@/models/Settings";
import { createStripePaymentIntent } from "@/lib/stripe";
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

        if (!settings.payment.stripe.isEnabled) {
            return Response.json(
                { success: false, message: "Stripe is not enabled" },
                { status: 400 }
            );
        }

        // Create Stripe Payment Intent
        const paymentIntent = await createStripePaymentIntent(
            Math.round(order.totalAmount * 100), // Convert to paise
            order._id.toString(),
            settings.payment.stripe.secretKey
        );

        return Response.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            publishableKey: settings.payment.stripe.publishableKey,
            amount: order.totalAmount
        });
    } catch (error) {
        console.error("Create Stripe payment intent error:", error);
        return Response.json(
            { success: false, message: error.message || "Server error" },
            { status: 500 }
        );
    }
}

export const POST = withProtection(postHandler);
