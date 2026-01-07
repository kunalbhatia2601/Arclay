import connectDB from "@/lib/mongodb";
import Bundle from "@/models/Bundle";
import Product from "@/models/Product";
import { withAdminProtection } from "@/lib/auth";

// GET all bundles (admin)
async function getHandler(req) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 20;

        await connectDB();

        const skip = (page - 1) * limit;

        const [bundles, total] = await Promise.all([
            Bundle.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('products', 'name images')
                .lean(),
            Bundle.countDocuments(),
        ]);

        return Response.json({
            success: true,
            bundles,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get bundles error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

// POST create new bundle
async function postHandler(req) {
    try {
        const { title, btnTxt, products } = await req.json();

        if (!title) {
            return Response.json(
                { success: false, message: "Title is required" },
                { status: 400 }
            );
        }

        await connectDB();

        // Generate slug from title
        const slug = await Bundle.generateSlug(title);

        const bundle = await Bundle.create({
            title,
            btnTxt: btnTxt || 'View Bundle',
            slug,
            products: products || [],
            isActive: true
        });

        // Populate products for response
        const populatedBundle = await Bundle.findById(bundle._id)
            .populate('products', 'name images')
            .lean();

        return Response.json({
            success: true,
            message: "Bundle created successfully",
            bundle: populatedBundle
        });
    } catch (error) {
        console.error("Create bundle error:", error);
        return Response.json(
            { success: false, message: error.message || "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAdminProtection(getHandler);
export const POST = withAdminProtection(postHandler);
