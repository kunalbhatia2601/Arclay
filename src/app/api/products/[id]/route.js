import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category"; // Required for populate to work
import Review from "@/models/Review";

export async function GET(req, { params }) {
    try {
        const { id } = await params;

        await connectDB();

        const product = await Product.findOne({ _id: id, isActive: true })
            .populate("category", "name")
            .lean();

        if (!product) {
            return Response.json(
                { success: false, message: "Product not found" },
                { status: 404 }
            );
        }

        // Get active reviews for this product
        const reviews = await Review.find({
            product: id,
            isActive: true
        })
            .sort({ createdAt: -1 })
            .populate('user', 'name')
            .lean();

        // Get related products (same category, excluding current product)
        const relatedProducts = await Product.find({
            category: product.category._id,
            _id: { $ne: id },
            isActive: true
        })
            .limit(4)
            .select('name images variants category')
            .populate('category', 'name')
            .lean();

        return Response.json({
            success: true,
            product,
            reviews,
            relatedProducts
        });
    } catch (error) {
        console.error("Get product error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}
