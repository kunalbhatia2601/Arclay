import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import { withAdmin } from "@/lib/auth";

// GET single category
async function getHandler(req, { params }) {
    try {
        const { id } = await params;

        await connectDB();

        const category = await Category.findById(id).lean();

        if (!category) {
            return Response.json(
                { success: false, message: "Category not found" },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            category,
        });
    } catch (error) {
        console.error("Get category error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

// PUT update category
async function putHandler(req, { params }) {
    try {
        const { id } = await params;
        const { name, image, description, isActive } = await req.json();

        await connectDB();

        const category = await Category.findById(id);

        if (!category) {
            return Response.json(
                { success: false, message: "Category not found" },
                { status: 404 }
            );
        }

        if (name !== undefined) category.name = name;
        if (image !== undefined) category.image = image;
        if (description !== undefined) category.description = description;
        if (isActive !== undefined) category.isActive = isActive;

        await category.save();

        return Response.json({
            success: true,
            message: "Category updated successfully",
            category,
        });
    } catch (error) {
        console.error("Update category error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

// DELETE category
async function deleteHandler(req, { params }) {
    try {
        const { id } = await params;

        await connectDB();

        const category = await Category.findByIdAndDelete(id);

        if (!category) {
            return Response.json(
                { success: false, message: "Category not found" },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            message: "Category deleted successfully",
        });
    } catch (error) {
        console.error("Delete category error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAdmin(getHandler);
export const PUT = withAdmin(putHandler);
export const DELETE = withAdmin(deleteHandler);
