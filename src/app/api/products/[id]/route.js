import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";

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

        return Response.json({
            success: true,
            product,
        });
    } catch (error) {
        console.error("Get product error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}
