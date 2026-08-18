import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category"; // Required for populate to work
import { withAdmin } from "@/lib/auth";
import { assignVariantBarcodes } from "@/lib/variantBarcodes";
import MetaFieldTemplate from "@/models/MetaFieldTemplate";
import { mergeFieldDefinitions, normalizeFields, sanitizeMetaValues } from "@/lib/meta";
import { resolveProductTaxonomy } from "@/lib/categories";
import { withAdminVariantFields } from "@/lib/productPublic";

// GET all products
async function getHandler(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 10;
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status");
        const category = searchParams.get("category");

        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        if (status === "active") {
            query.isActive = true;
        } else if (status === "inactive") {
            query.isActive = false;
        }

        if (category) {
            query.category = category;
        }

        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            Product.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("category", "name")
                .populate("subcategory", "name")
                .lean(),
            Product.countDocuments(query),
        ]);

        return Response.json({
            success: true,
            products,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get products error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

// POST create product
async function postHandler(req) {
    try {
        const {
            name, images, description, variationTypes, variants, category,
            subcategory, isActive, barcode, taxRate, hsn,
            metaTemplates, customMetaFields, meta
        } = await req.json();

        if (!name || !category) {
            return Response.json(
                { success: false, message: "Name and category are required" },
                { status: 400 }
            );
        }

        if (!variants || variants.length === 0) {
            return Response.json(
                { success: false, message: "At least one variant is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const taxonomy = await resolveProductTaxonomy(category, subcategory);

        // Every variant gets a printable barcode; blanks are auto-generated.
        const variantsWithBarcodes = await assignVariantBarcodes(withAdminVariantFields(variants));

        // Metadata is validated against the field definitions it claims to
        // use, so unknown or malformed keys never reach the document.
        const templateIds = Array.isArray(metaTemplates) ? metaTemplates : [];
        const ownFields = normalizeFields(customMetaFields || []);
        const templates = templateIds.length
            ? await MetaFieldTemplate.find({ _id: { $in: templateIds } }).lean()
            : [];
        const definitions = mergeFieldDefinitions(templates, ownFields);
        const { meta: safeMeta, errors: metaErrors } = sanitizeMetaValues(meta || {}, definitions);

        if (metaErrors.length) {
            return Response.json(
                { success: false, message: metaErrors[0], errors: metaErrors },
                { status: 400 }
            );
        }

        const product = await Product.create({
            name,
            images: images || [],
            description: description || "",
            variationTypes: variationTypes || [],
            variants: variantsWithBarcodes,
            category: taxonomy.categoryId,
            subcategory: taxonomy.subcategoryId,
            isActive: isActive !== false,
            barcode: barcode || "",
            taxRate: Math.min(100, Math.max(0, Number(taxRate) || 0)),
            hsn: hsn || "",
            metaTemplates: templateIds,
            customMetaFields: ownFields,
            meta: safeMeta,
        });

        const populatedProduct = await Product.findById(product._id)
            .populate("category", "name")
            .populate("subcategory", "name")
            .lean();

        return Response.json({
            success: true,
            message: "Product created successfully",
            product: populatedProduct,
        });
    } catch (error) {
        console.error("Create product error:", error);
        return Response.json(
            { success: false, message: error.message || "Server error" },
            { status: error.status || 500 }
        );
    }
}

export const GET = withAdmin(getHandler);
export const POST = withAdmin(postHandler);
