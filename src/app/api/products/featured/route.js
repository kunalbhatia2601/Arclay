import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import { withPublicProtection } from "@/lib/auth";

// GET featured products
async function getHandler(req) {
    try {
        await connectDB();

        const products = await Product.find({
            isActive: true,
            isFeatured: true
        })
            .sort({ updatedAt: -1 })
            .limit(12)
            .populate('category', 'name')
            .lean();

        return Response.json({
            success: true,
            products
        });
    } catch (error) {
        console.error("Get featured products error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withPublicProtection(getHandler);
