import connectDB from "@/lib/mongodb";
import AppConfig from "@/models/AppConfig";
import { withAdminProtection } from "@/lib/auth";

// GET - fetch full app config (admin only)
async function getHandler() {
    try {
        await connectDB();

        let config = await AppConfig.findOne().lean();

        if (!config) {
            // Create default config
            config = await AppConfig.create({
                helpContacts: [
                    { type: "email", label: "Email Us", value: "support@essvora.com", isEnabled: true },
                    { type: "call", label: "Call Us", value: "+91 98765 43210", isEnabled: true },
                    { type: "live_chat", label: "Live Chat", value: "Available 9 AM - 6 PM", isEnabled: false }
                ],
                legalPolicies: [
                    { slug: "privacy", title: "Privacy Policy", content: "", isEnabled: true },
                    { slug: "terms", title: "Terms & Conditions", content: "", isEnabled: true },
                    { slug: "refund", title: "Refund Policy", content: "", isEnabled: true },
                    { slug: "shipping", title: "Shipping Policy", content: "", isEnabled: true }
                ],
                faqs: []
            });
            config = config.toObject();
        }

        return Response.json({ success: true, config });
    } catch (error) {
        console.error("Get app config error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

// PUT - update app config (admin only)
async function putHandler(req) {
    try {
        const body = await req.json();
        const { helpContacts, legalPolicies, faqs } = body;

        await connectDB();

        const updateData = {};
        if (helpContacts !== undefined) updateData.helpContacts = helpContacts;
        if (legalPolicies !== undefined) updateData.legalPolicies = legalPolicies;
        if (faqs !== undefined) updateData.faqs = faqs;

        const config = await AppConfig.findOneAndUpdate(
            {},
            { $set: updateData },
            { upsert: true, new: true, runValidators: true }
        ).lean();

        return Response.json({ success: true, config });
    } catch (error) {
        console.error("Update app config error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAdminProtection(getHandler);
export const PUT = withAdminProtection(putHandler);
