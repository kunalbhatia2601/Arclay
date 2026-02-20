import connectDB from "@/lib/mongodb";
import AppConfig from "@/models/AppConfig";

// GET - public, returns only enabled items
export async function GET() {
    try {
        await connectDB();

        const config = await AppConfig.findOne().lean();

        if (!config) {
            return Response.json({
                success: true,
                config: {
                    helpContacts: [],
                    legalPolicies: [],
                    faqs: []
                }
            });
        }

        // Filter to only enabled items
        const filtered = {
            helpContacts: (config.helpContacts || []).filter(c => c.isEnabled),
            legalPolicies: (config.legalPolicies || []).filter(p => p.isEnabled),
            faqs: (config.faqs || [])
                .filter(f => f.isEnabled)
                .sort((a, b) => (a.order || 0) - (b.order || 0))
        };

        return Response.json({ success: true, config: filtered });
    } catch (error) {
        console.error("Get public app config error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}
