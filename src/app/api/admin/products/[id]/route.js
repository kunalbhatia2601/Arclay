import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import { withAdmin } from "@/lib/auth";

// GET single product
async function getHandler(req, { params }) {
    try {
        const { id } = await params;

        await connectDB();

        const product = await Product.findById(id)
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

// PUT update product
async function putHandler(req, { params }) {
    try {
        const { id } = await params;
        const { name, images, regularPrice, salePrice, description, variations, category, isActive } = await req.json();

        await connectDB();

        const product = await Product.findById(id);

        if (!product) {
            return Response.json(
                { success: false, message: "Product not found" },
                { status: 404 }
            );
        }

        if (name !== undefined) product.name = name;
        if (images !== undefined) product.images = images;
        if (regularPrice !== undefined) product.regularPrice = regularPrice;
        if (salePrice !== undefined) product.salePrice = salePrice;
        if (description !== undefined) product.description = description;
        if (variations !== undefined) product.variations = variations;
        if (category !== undefined) product.category = category;
        if (isActive !== undefined) product.isActive = isActive;

        await product.save();

        const populatedProduct = await Product.findById(product._id)
            .populate("category", "name")
            .lean();

        return Response.json({
            success: true,
            message: "Product updated successfully",
            product: populatedProduct,
        });
    } catch (error) {
        console.error("Update product error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

// DELETE product
async function deleteHandler(req, { params }) {
    try {
        const { id } = await params;

        await connectDB();

        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            return Response.json(
                { success: false, message: "Product not found" },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            message: "Product deleted successfully",
        });
    } catch (error) {
        console.error("Delete product error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAdmin(getHandler);
export const PUT = withAdmin(putHandler);
export const DELETE = withAdmin(deleteHandler);
