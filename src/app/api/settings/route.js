import connectDB from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { withProtection } from "@/lib/auth";

// GET current settings
async function getHandler(req) {
    try {
        await connectDB();
        const settings = await Settings.getSettings();

        // Don't expose sensitive keys in full - mask them
        const safeSettings = {
            isDemo: settings.isDemo,
            isMaintenance: settings.isMaintenance,
            payment: {
                razorpay: {
                    keyId: settings.payment.razorpay.isEnabled ? "YES" : "",
                    keySecret: settings.payment.razorpay.isEnabled ? "YES" : "",
                    isEnabled: settings.payment.razorpay.isEnabled,
                    _hasSecret: settings.payment.razorpay.isEnabled ? true : false
                },
                stripe: {
                    publishableKey: settings.payment.stripe.isEnabled ? "YES" : "",
                    secretKey: settings.payment.stripe.isEnabled ? "YES" : "",
                    isEnabled: settings.payment.stripe.isEnabled,
                    _hasSecret: settings.payment.stripe.isEnabled ? true : false
                },
                cod: {
                    isEnabled: settings.payment.cod.isEnabled
                }
            }
        };

        return Response.json({
            success: true,
            settings: safeSettings,
            _fullSettings: safeSettings
        });
    } catch (error) {
        console.error("Get settings error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withProtection(getHandler);