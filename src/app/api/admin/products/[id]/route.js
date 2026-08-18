import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category"; // Required for populate to work
import { withAdmin } from "@/lib/auth";
import { assignVariantBarcodes } from "@/lib/variantBarcodes";
import MetaFieldTemplate from "@/models/MetaFieldTemplate";
import {
    loadTemplatesForProduct,
    mergeFieldDefinitions,
    normalizeFields,
    resolveProductMeta,
    sanitizeMetaValues,
} from "@/lib/meta";
import { resolveProductTaxonomy } from "@/lib/categories";
import { withAdminVariantFields } from "@/lib/productPublic";

// GET single product
async function getHandler(req, { params }) {
    try {
        const { id } = await params;

        await connectDB();

        const product = await Product.findById(id)
            .populate("category", "name")
            .populate("subcategory", "name")
            .lean();

        if (!product) {
            return Response.json(
                { success: false, message: "Product not found" },
                { status: 404 }
            );
        }

        // The editor needs the field definitions alongside the values, plus
        // whichever templates this product's category would suggest.
        const templates = await loadTemplatesForProduct(product, { includeSuggested: true });
        const appliedIds = new Set((product.metaTemplates || []).map(String));
        const resolvedMeta = resolveProductMeta(
            product,
            templates.filter(t => appliedIds.has(String(t._id)))
        );

        return Response.json({
            success: true,
            product,
            meta: resolvedMeta,
            availableTemplates: templates,
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
        const body = await req.json();
        const {
            name, images, description, variationTypes, variants, category,
            subcategory, isActive, isFeatured, long_description, barcode, taxRate, hsn,
            metaTemplates, customMetaFields, meta, removeOrphanKeys
        } = body;

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
        if (variants !== undefined) {
            // Keeps existing barcodes intact and fills any newly added variant.
            product.variants = await assignVariantBarcodes(withAdminVariantFields(variants), {
                excludeProductId: product._id,
            });
        }
        if (category !== undefined || subcategory !== undefined) {
            const taxonomy = await resolveProductTaxonomy(
                category !== undefined ? category : product.category,
                subcategory !== undefined ? subcategory : product.subcategory
            );
            product.category = taxonomy.categoryId;
            product.subcategory = taxonomy.subcategoryId;
        }
        if (isActive !== undefined) product.isActive = isActive;
        if (isFeatured !== undefined) product.isFeatured = isFeatured;
        if (long_description !== undefined) product.long_description = long_description;
        if (barcode !== undefined) product.barcode = barcode;
        if (taxRate !== undefined) product.taxRate = Math.min(100, Math.max(0, Number(taxRate) || 0));
        if (hsn !== undefined) product.hsn = hsn;

        // ── Custom metadata ──────────────────────────────────────────
        if (metaTemplates !== undefined) {
            product.metaTemplates = Array.isArray(metaTemplates) ? metaTemplates : [];
        }
        if (customMetaFields !== undefined) {
            product.customMetaFields = normalizeFields(customMetaFields);
        }

        if (meta !== undefined) {
            const templates = product.metaTemplates?.length
                ? await MetaFieldTemplate.find({ _id: { $in: product.metaTemplates } }).lean()
                : [];
            const definitions = mergeFieldDefinitions(templates, product.customMetaFields || []);
            const { meta: safeMeta, errors } = sanitizeMetaValues(meta, definitions);

            if (errors.length) {
                return Response.json(
                    { success: false, message: errors[0], errors },
                    { status: 400 }
                );
            }

            // Values whose definition disappeared (template edited or detached)
            // are preserved by default so no product data is lost silently.
            // The editor deletes them explicitly via removeOrphanKeys.
            const existing = product.meta instanceof Map
                ? Object.fromEntries(product.meta)
                : (product.meta || {});
            const definedKeys = new Set(definitions.map(d => d.key));
            const discard = new Set(Array.isArray(removeOrphanKeys) ? removeOrphanKeys : []);

            const preservedOrphans = {};
            for (const [key, value] of Object.entries(existing)) {
                if (!definedKeys.has(key) && !discard.has(key)) {
                    preservedOrphans[key] = value;
                }
            }

            product.meta = { ...preservedOrphans, ...safeMeta };
        }

        await product.save();

        const populatedProduct = await Product.findById(product._id)
            .populate("category", "name")
            .populate("subcategory", "name")
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
            { status: error.status || 500 }
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
