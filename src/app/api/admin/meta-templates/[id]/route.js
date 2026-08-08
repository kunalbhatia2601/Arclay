import connectDB from "@/lib/mongodb";
import MetaFieldTemplate from "@/models/MetaFieldTemplate";
import Product from "@/models/Product";
import Category from "@/models/Category"; // Required for populate to work
import { withAdminProtection } from "@/lib/auth";
import { normalizeFields } from "@/lib/meta";

async function getHandler(req, { params }) {
    try {
        await connectDB();
        const { id } = await params;

        const template = await MetaFieldTemplate.findById(id)
            .populate("appliesTo.categories", "name")
            .lean();

        if (!template) {
            return Response.json(
                { success: false, message: "Template not found" },
                { status: 404 }
            );
        }

        // Surfaced in the UI so the admin knows the blast radius before editing.
        const usageCount = await Product.countDocuments({ metaTemplates: id });

        return Response.json({ success: true, template, usageCount });
    } catch (error) {
        console.error("Get meta template error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

async function putHandler(req, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await req.json();

        const template = await MetaFieldTemplate.findById(id);
        if (!template) {
            return Response.json(
                { success: false, message: "Template not found" },
                { status: 404 }
            );
        }

        if (body.name !== undefined) template.name = String(body.name).trim();
        if (body.description !== undefined) template.description = body.description;
        if (body.isDefault !== undefined) template.isDefault = !!body.isDefault;
        if (body.isActive !== undefined) template.isActive = !!body.isActive;
        if (body.appliesTo !== undefined) {
            template.appliesTo = { categories: body.appliesTo?.categories || [] };
        }

        // Editing fields never touches stored product values. Removing a field
        // here leaves its values on products as orphans, which the product
        // editor surfaces for explicit deletion rather than silently dropping.
        if (body.fields !== undefined) {
            template.fields = normalizeFields(body.fields);
        }

        await template.save();

        return Response.json({
            success: true,
            message: "Template updated successfully",
            template,
        });
    } catch (error) {
        console.error("Update meta template error:", error);
        return Response.json(
            { success: false, message: error.message || "Server error" },
            { status: 400 }
        );
    }
}

async function deleteHandler(req, { params }) {
    try {
        await connectDB();
        const { id } = await params;

        const template = await MetaFieldTemplate.findById(id);
        if (!template) {
            return Response.json(
                { success: false, message: "Template not found" },
                { status: 404 }
            );
        }

        // Detach from products rather than leaving dangling references. Their
        // stored values survive as orphans so no product data is lost by
        // deleting a template.
        await Product.updateMany(
            { metaTemplates: id },
            { $pull: { metaTemplates: id } }
        );

        await template.deleteOne();

        return Response.json({
            success: true,
            message: "Template deleted. Existing product values were kept.",
        });
    } catch (error) {
        console.error("Delete meta template error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAdminProtection(getHandler);
export const PUT = withAdminProtection(putHandler);
export const DELETE = withAdminProtection(deleteHandler);
