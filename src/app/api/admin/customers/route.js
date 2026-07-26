import connectDB from "@/lib/mongodb";
import Customer from "@/models/Customer";
import { withAdmin } from "@/lib/auth";

// User input goes into a $regex, so metacharacters must be neutralised.
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET lookup a counter customer by phone, or search the list
async function getHandler(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const phone = (searchParams.get("phone") || "").trim();
        const phoneSearch = (searchParams.get("phoneSearch") || "").trim();
        const search = (searchParams.get("search") || "").trim();
        const limit = Math.min(parseInt(searchParams.get("limit"), 10) || 20, 100);

        // Exact phone lookup
        if (phone) {
            const customer = await Customer.findOne({ phone }).lean();
            return Response.json({ success: true, customer: customer || null });
        }

        // Partial phone match — the POS typeahead. Most-recent customers first
        // so the person most likely at the counter is at the top.
        if (phoneSearch) {
            const customers = await Customer.find({
                phone: { $regex: escapeRegex(phoneSearch), $options: "i" },
            })
                .sort({ lastOrderAt: -1, createdAt: -1 })
                .limit(Math.min(limit, 10))
                .lean();

            return Response.json({ success: true, customers });
        }

        const query = search
            ? {
                  $or: [
                      { name: { $regex: escapeRegex(search), $options: "i" } },
                      { phone: { $regex: escapeRegex(search), $options: "i" } },
                  ],
              }
            : {};

        const customers = await Customer.find(query)
            .sort({ lastOrderAt: -1, createdAt: -1 })
            .limit(limit)
            .lean();

        return Response.json({ success: true, customers });
    } catch (error) {
        console.error("Customer lookup error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAdmin(getHandler);
