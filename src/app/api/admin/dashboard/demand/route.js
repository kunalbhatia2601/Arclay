import connectDB from "@/lib/mongodb";
import { withAdmin } from "@/lib/auth";
import { resolveDashboardRange } from "@/lib/dashboardRange";
import { demandProducts, orderMatch } from "@/lib/dashboardProducts";

async function handler(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const bounds = resolveDashboardRange(
            searchParams.get("range"),
            searchParams.get("from"),
            searchParams.get("to")
        );
        const search = searchParams.get("search") || "";
        const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
        const limit = search ? 10 : 5;

        const result = await demandProducts({
            match: orderMatch(bounds),
            search,
            page,
            limit,
        });

        return Response.json({ success: true, ...result });
    } catch (error) {
        console.error("Dashboard demand error:", error);
        return Response.json(
            { success: false, message: error.message || "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAdmin(handler);
