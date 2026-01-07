import connectDB from "@/lib/mongodb";
import Bundle from "@/models/Bundle";
import Product from "@/models/Product";
import { withAdminProtection } from "@/lib/auth";

// GET single bundle
async function getHandler(req, { params }) {
    try {
        const { id } = await params;

        await connectDB();

        const bundle = await Bundle.findById(id)
            .populate('products', 'name images variants')
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
        console.error("Get bundle error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

// PUT update bundle
async function putHandler(req, { params }) {
    try {
        const { id } = await params;
        const updates = await req.json();

        await connectDB();

        const bundle = await Bundle.findById(id);

        if (!bundle) {
            return Response.json(
                { success: false, message: "Bundle not found" },
                { status: 404 }
            );
        }

        // Update fields
        if (updates.title !== undefined) {
            bundle.title = updates.title;
            // Regenerate slug if title changed
            bundle.slug = await Bundle.generateSlug(updates.title);
        }
        if (updates.btnTxt !== undefined) bundle.btnTxt = updates.btnTxt;
        if (updates.products !== undefined) bundle.products = updates.products;
        if (updates.isActive !== undefined) bundle.isActive = updates.isActive;

        await bundle.save();

        // Populate for response
        const populatedBundle = await Bundle.findById(bundle._id)
            .populate('products', 'name images')
            .lean();

        return Response.json({
            success: true,
            message: "Bundle updated successfully",
            bundle: populatedBundle
        });
    } catch (error) {
        console.error("Update bundle error:", error);
        return Response.json(
            { success: false, message: error.message || "Server error" },
            { status: 500 }
        );
    }
}

// DELETE bundle
async function deleteHandler(req, { params }) {
    try {
        const { id } = await params;

        await connectDB();

        const bundle = await Bundle.findByIdAndDelete(id);

        if (!bundle) {
            return Response.json(
                { success: false, message: "Bundle not found" },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            message: "Bundle deleted successfully"
        });
    } catch (error) {
        console.error("Delete bundle error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAdminProtection(getHandler);
export const PUT = withAdminProtection(putHandler);
export const DELETE = withAdminProtection(deleteHandler);
