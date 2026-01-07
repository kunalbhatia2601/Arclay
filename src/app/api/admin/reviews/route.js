import connectDB from "@/lib/mongodb";
import Review from "@/models/Review";
import { withAdminProtection } from "@/lib/auth";

// GET all reviews (admin)
async function getHandler(req) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 20;
        const status = searchParams.get("status"); // 'active', 'inactive', or null for all

        await connectDB();

        const query = {};
        if (status === 'active') query.isActive = true;
        if (status === 'inactive') query.isActive = false;

        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            Review.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('user', 'name email')
                .populate('product', 'name images')
                .lean(),
            Review.countDocuments(query)
        ]);

        return Response.json({
            success: true,
            reviews,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get admin reviews error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAdminProtection(getHandler);
