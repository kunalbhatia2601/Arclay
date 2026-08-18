import connectDB from "@/lib/mongodb";
import { withAdmin } from "@/lib/auth";
import { lowStockProducts } from "@/lib/dashboardProducts";

async function handler(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);

        const result = await lowStockProducts({ search, page, limit: 10 });

        return Response.json({ success: true, ...result });
    } catch (error) {
        console.error("Dashboard stock error:", error);
        return Response.json(
            { success: false, message: error.message || "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAdmin(handler);
