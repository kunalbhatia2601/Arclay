import connectDB from "@/lib/mongodb";
import Bundle from "@/models/Bundle";
import Product from "@/models/Product";
import { withPublicProtection } from "@/lib/auth";

// GET bundle by slug with full product details
async function getHandler(req, { params }) {
    try {
        const { slug } = await params;

        await connectDB();

        const bundle = await Bundle.findOne({ slug, isActive: true })
            .populate({
                path: 'products',
                match: { isActive: true },
                populate: { path: 'category', select: 'name' }
            })
            .lean();

        if (!bundle) {
            return Response.json(
                { success: false, message: "Bundle not found" },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            bundle
        });
    } catch (error) {
        console.error("Get bundle by slug error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withPublicProtection(getHandler);
