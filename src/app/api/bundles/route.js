import connectDB from "@/lib/mongodb";
import Bundle from "@/models/Bundle";
import Product from "@/models/Product";
import { withPublicProtection } from "@/lib/auth";

// GET active bundles for homepage
async function getHandler(req) {
    try {
        await connectDB();

        const bundles = await Bundle.find({ isActive: true })
            .sort({ createdAt: -1 })
            .populate('products', 'name images')
            .lean();

        return Response.json({
            success: true,
            bundles
        });
    } catch (error) {
        console.error("Get public bundles error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withPublicProtection(getHandler);
