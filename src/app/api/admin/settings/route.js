import connectDB from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { withAdminProtection } from "@/lib/auth";
import { clearSettingsCache } from "@/lib/auth";

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
                    keyId: settings.payment.razorpay.keyId,
                    keySecret: settings.payment.razorpay.keySecret
                        ? '••••••••' + settings.payment.razorpay.keySecret.slice(-4)
                        : '',
                    isEnabled: settings.payment.razorpay.isEnabled,
                    _hasSecret: !!settings.payment.razorpay.keySecret
                },
                stripe: {
                    publishableKey: settings.payment.stripe.publishableKey,
                    secretKey: settings.payment.stripe.secretKey
                        ? '••••••••' + settings.payment.stripe.secretKey.slice(-4)
                        : '',
                    isEnabled: settings.payment.stripe.isEnabled,
                    _hasSecret: !!settings.payment.stripe.secretKey
                },
                cod: {
                    isEnabled: settings.payment.cod.isEnabled
                }
            },
            mail: {
                email: settings.mail?.email || '',
                password: settings.mail?.password
                    ? '••••••••' + settings.mail.password.slice(-4)
                    : '',
                host: settings.mail?.host || '',
                port: settings.mail?.port || 587,
                isSSL: settings.mail?.isSSL || false,
                isEnabled: settings.mail?.isEnabled || false,
                _hasPassword: !!settings.mail?.password
            },
            gemini_ai: {
                apiKey: settings.gemini_ai?.apiKey
                    ? '••••••••' + settings.gemini_ai.apiKey.slice(-4)
                    : '',
                isEnabled: settings.gemini_ai?.isEnabled || false,
                _hasApiKey: !!settings.gemini_ai?.apiKey
            },
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

// PUT update settings
async function putHandler(req) {
    try {
        const updates = await req.json();

        await connectDB();
        let settings = await Settings.getSettings();

        // Update fields if provided
        if (typeof updates.isDemo === 'boolean') {
            settings.isDemo = updates.isDemo;
        }

        if (typeof updates.isMaintenance === 'boolean') {
            settings.isMaintenance = updates.isMaintenance;
        }

        // Update payment settings
        if (updates.payment) {
            // Razorpay
            if (updates.payment.razorpay) {
                if (updates.payment.razorpay.keyId !== undefined) {
                    settings.payment.razorpay.keyId = updates.payment.razorpay.keyId;
                }
                if (updates.payment.razorpay.keySecret !== undefined &&
                    !updates.payment.razorpay.keySecret.includes('••••')) {
                    // Only update if not masked
                    settings.payment.razorpay.keySecret = updates.payment.razorpay.keySecret;
                }
                if (typeof updates.payment.razorpay.isEnabled === 'boolean') {
                    settings.payment.razorpay.isEnabled = updates.payment.razorpay.isEnabled;
                }
            }

            // Stripe
            if (updates.payment.stripe) {
                if (updates.payment.stripe.publishableKey !== undefined) {
                    settings.payment.stripe.publishableKey = updates.payment.stripe.publishableKey;
                }
                if (updates.payment.stripe.secretKey !== undefined &&
                    !updates.payment.stripe.secretKey.includes('••••')) {
                    settings.payment.stripe.secretKey = updates.payment.stripe.secretKey;
                }
                if (typeof updates.payment.stripe.isEnabled === 'boolean') {
                    settings.payment.stripe.isEnabled = updates.payment.stripe.isEnabled;
                }
            }

            // COD
            if (updates.payment.cod) {
                if (typeof updates.payment.cod.isEnabled === 'boolean') {
                    settings.payment.cod.isEnabled = updates.payment.cod.isEnabled;
                }
            }
        }

        // Update mail settings
        if (updates.mail) {
            if (updates.mail.email !== undefined) {
                settings.mail.email = updates.mail.email;
            }
            if (updates.mail.password !== undefined &&
                !updates.mail.password.includes('••••')) {
                // Only update if not masked
                settings.mail.password = updates.mail.password;
            }
            if (updates.mail.host !== undefined) {
                settings.mail.host = updates.mail.host;
            }
            if (updates.mail.port !== undefined) {
                settings.mail.port = updates.mail.port;
            }
            if (typeof updates.mail.isSSL === 'boolean') {
                settings.mail.isSSL = updates.mail.isSSL;
            }
            if (typeof updates.mail.isEnabled === 'boolean') {
                settings.mail.isEnabled = updates.mail.isEnabled;
            }
        }

        // Update Gemini AI settings
        if (updates.gemini_ai) {
            if (!settings.gemini_ai) {
                settings.gemini_ai = {};
            }
            if (updates.gemini_ai.apiKey !== undefined &&
                !updates.gemini_ai.apiKey.includes('••••')) {
                // Only update if not masked
                settings.gemini_ai.apiKey = updates.gemini_ai.apiKey;
            }
            if (typeof updates.gemini_ai.isEnabled === 'boolean') {
                settings.gemini_ai.isEnabled = updates.gemini_ai.isEnabled;
            }
        }

        await settings.save();

        // Clear the settings cache so next request gets fresh data
        clearSettingsCache();

        return Response.json({
            success: true,
            message: "Settings updated successfully",
            settings
        });
    } catch (error) {
        console.error("Update settings error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAdminProtection(getHandler);
export const PUT = withAdminProtection(putHandler);
