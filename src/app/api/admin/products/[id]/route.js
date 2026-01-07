import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category"; // Required for populate to work
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
        const { name, images, description, variationTypes, variants, category, isActive, isFeatured } = await req.json();

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
        if (description !== undefined) product.description = description;
        if (variationTypes !== undefined) product.variationTypes = variationTypes;
        if (variants !== undefined) product.variants = variants;
        if (category !== undefined) product.category = category;
        if (isActive !== undefined) product.isActive = isActive;
        if (isFeatured !== undefined) product.isFeatured = isFeatured;

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
            { success: false, message: error.message || "Server error" },
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
