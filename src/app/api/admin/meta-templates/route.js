import connectDB from "@/lib/mongodb";
import MetaFieldTemplate from "@/models/MetaFieldTemplate";
import Category from "@/models/Category"; // Required for populate to work
import { withAdminProtection } from "@/lib/auth";
import { normalizeFields } from "@/lib/meta";
import { escapeRegex } from "@/lib/utils";

// GET /api/admin/meta-templates
//   ?category=<id>  also returns which templates would be suggested for it
async function getHandler(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const category = searchParams.get("category");

        const query = {};
        if (search) {
            query.name = { $regex: escapeRegex(search), $options: "i" };
        }

        const templates = await MetaFieldTemplate.find(query)
            .sort({ isDefault: -1, name: 1 })
            .populate("appliesTo.categories", "name")
            .lean();

        // A template is "suggested" for a product when it is marked default or
        // its category list contains the product's category.
        const suggestedIds = category
            ? templates
                .filter(t =>
                    t.isActive !== false &&
                    (t.isDefault ||
                        (t.appliesTo?.categories || []).some(c => String(c._id || c) === String(category)))
                )
                .map(t => String(t._id))
            : [];

        return Response.json({ success: true, templates, suggestedIds });
    } catch (error) {
        console.error("Get meta templates error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

// POST /api/admin/meta-templates
async function postHandler(req) {
    try {
        const body = await req.json();
        const { name, description, fields, appliesTo, isDefault, isActive } = body;

        if (!name || !name.trim()) {
            return Response.json(
                { success: false, message: "Template name is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const template = await MetaFieldTemplate.create({
            name: name.trim(),
            description: description || "",
            fields: normalizeFields(fields),
            appliesTo: { categories: appliesTo?.categories || [] },
            isDefault: !!isDefault,
            isActive: isActive !== false,
        });

        return Response.json({
            success: true,
            message: "Template created successfully",
            template,
        });
    } catch (error) {
        console.error("Create meta template error:", error);
        return Response.json(
            { success: false, message: error.message || "Server error" },
            { status: 400 }
        );
    }
}

export const GET = withAdminProtection(getHandler);
export const POST = withAdminProtection(postHandler);
