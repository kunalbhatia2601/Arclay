import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { withAdmin } from "@/lib/auth";
import { assignVariantBarcodes } from "@/lib/variantBarcodes";
import { withAdminVariantFields } from "@/lib/productPublic";
import { resolveProductTaxonomy } from "@/lib/categories";
import {
    trim,
    parseNumber,
    parseMoney,
    groupVariationJobs,
    buildVariantsForJob,
    attributesToOpt1,
} from "@/lib/catalogSheet";

// Same defaults as scripts/catalog-import.config.js so a row behaves the same
// whether it came from the Excel importer or was typed here.
const OPT_CFG = {
    untitledOptionName: "Option",
    normalizeOptionNames: true,
    flattenOptionsToSingleType: true,
    optionValueSeparator: " / ",
    salePriceFallsBackToMrp: true,
};

const isVariatedProduct = (p) => (p.variants || []).length > 1 || (p.variationTypes || []).length > 0;

async function getHandler() {
    try {
        await connectDB();
        const [allCategories, products] = await Promise.all([
            Category.find({}).lean(),
            Product.find({}).populate("category", "name").populate("subcategory", "name").lean(),
        ]);

        const categories = allCategories
            .filter((c) => !c.parent)
            .map((c) => ({
                categoryId: String(c._id),
                "Category Name": c.name,
                "Description (optional)": c.description || "",
            }));

        const parentById = new Map(allCategories.map((c) => [String(c._id), c]));
        const subCategories = allCategories
            .filter((c) => c.parent)
            .map((c) => ({
                subcategoryId: String(c._id),
                Category: parentById.get(String(c.parent))?.name || "",
                "Sub-Category Name": c.name,
                "Description (optional)": c.description || "",
            }));

        const productRows = products.map((p) => {
            const variated = isVariatedProduct(p);
            const firstVariant = p.variants?.[0];
            return {
                productId: String(p._id),
                "Product Name": p.name,
                "Image URL": (p.images || []).join(", "),
                Category: p.category?.name || "",
                "Sub-Category": p.subcategory?.name || "",
                "Short Description": p.description || "",
                "Long Description": p.long_description || "",
                // Simple products carry price/barcode here, same as the sheet —
                // variated ones carry it per-SKU on the Variations tab instead.
                MRP: variated ? "" : firstVariant?.regularPrice ?? "",
                CP: variated ? "" : firstVariant?.costPrice ?? "",
                SP: variated ? "" : firstVariant?.salePrice ?? "",
                Barcode: variated ? "" : firstVariant?.barcode || "",
                "GST %": p.taxRate ?? "",
                HSN: p.hsn || "",
                "Is Variated": variated ? "Yes" : "No",
                isActive: p.isActive !== false,
            };
        });

        const variationRows = products.filter(isVariatedProduct).flatMap((p) =>
            (p.variants || []).map((v) => ({
                "Product Name": p.name,
                ...attributesToOpt1(v.attributes),
                Barcode: v.barcode || "",
                MRP: v.regularPrice ?? "",
                CP: v.costPrice ?? "",
                SP: v.salePrice ?? "",
                Stock: v.stock ?? 0,
            }))
        );

        return Response.json({
            success: true,
            categories,
            subCategories,
            products: productRows,
            variations: variationRows,
        });
    } catch (error) {
        console.error("Catalog sheet GET error:", error);
        return Response.json({ success: false, message: error.message || "Server error" }, { status: 500 });
    }
}

/** Find a top-level category by name (case-insensitive), or create it. */
async function resolveOrCreateCategory(name, cache) {
    const key = `root::${name.toLowerCase()}`;
    if (cache.has(key)) return cache.get(key);

    let doc = await Category.findOne({
        name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        parent: null,
    });
    if (!doc) doc = await Category.create({ name, parent: null, isActive: true });

    cache.set(key, doc);
    return doc;
}

async function resolveOrCreateSubcategory(name, parentId, description, cache) {
    const key = `${parentId}::${name.toLowerCase()}`;
    if (cache.has(key)) return cache.get(key);

    let doc = await Category.findOne({
        name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        parent: parentId,
    });
    if (!doc) doc = await Category.create({ name, parent: parentId, description: description || "", isActive: true });

    cache.set(key, doc);
    return doc;
}

async function postHandler(req) {
    try {
        const body = await req.json();
        const categoryRows = (body.categories || []).filter((r) => trim(r["Category Name"]));
        const subCategoryRows = (body.subCategories || []).filter((r) => trim(r["Sub-Category Name"]));
        const productRows = (body.products || []).filter((r) => trim(r["Product Name"]));
        const variationRows = (body.variations || []).filter((r) => trim(r["Product Name"]));

        if (!productRows.length) {
            return Response.json({ success: false, message: "No products to save" }, { status: 400 });
        }

        await connectDB();

        const catCache = new Map();
        const errors = [];

        // 1. Categories tab, in order.
        for (const row of categoryRows) {
            await resolveOrCreateCategory(trim(row["Category Name"]), catCache).catch((e) =>
                errors.push(`Category "${row["Category Name"]}": ${e.message}`)
            );
        }

        // 2. Sub-Categories tab — parent must already exist (tab 1) or gets
        // created here too, same forgiving behavior as the import script.
        for (const row of subCategoryRows) {
            const parentName = trim(row.Category);
            const name = trim(row["Sub-Category Name"]);
            if (!parentName) {
                errors.push(`Sub-category "${name}" has no parent category`);
                continue;
            }
            try {
                const parent = await resolveOrCreateCategory(parentName, catCache);
                await resolveOrCreateSubcategory(name, parent._id, row["Description (optional)"], catCache);
            } catch (e) {
                errors.push(`Sub-category "${name}": ${e.message}`);
            }
        }

        // 3. Products tab, each paired with its Variations-tab rows (if any).
        const savedIds = [];
        for (const row of productRows) {
            const name = trim(row["Product Name"]);
            try {
                const categoryName = trim(row.Category);
                if (!categoryName) {
                    errors.push(`${name}: missing category`);
                    continue;
                }

                const categoryDoc = await resolveOrCreateCategory(categoryName, catCache);
                let subcategoryDoc = null;
                const subName = trim(row["Sub-Category"]);
                if (subName) {
                    subcategoryDoc = await resolveOrCreateSubcategory(subName, categoryDoc._id, "", catCache);
                }
                const taxonomy = await resolveProductTaxonomy(categoryDoc._id, subcategoryDoc?._id || null);

                const isVariated = trim(row["Is Variated"]).toLowerCase() === "yes";
                const varRows = isVariated
                    ? variationRows.filter((v) => trim(v["Product Name"]) === name)
                    : [];

                const jobs = groupVariationJobs(name, varRows, OPT_CFG);

                for (const job of jobs) {
                    const built = buildVariantsForJob(job, OPT_CFG);
                    const variants = built.hasVariationRows
                        ? built.variants
                        : [
                              {
                                  attributes: {},
                                  regularPrice: parseMoney(row.MRP, 0),
                                  salePrice: parseNumber(row.SP, null) ?? (OPT_CFG.salePriceFallsBackToMrp ? parseMoney(row.MRP, 0) : null),
                                  costPrice: parseNumber(row.CP, null),
                                  stock: 0,
                                  sku: "",
                                  barcode: trim(row.Barcode),
                              },
                          ];

                    const images = trim(row["Image URL"])
                        .split(",")
                        .map((u) => u.trim())
                        .filter(Boolean);

                    const fields = {
                        name: job.name,
                        images,
                        description: trim(row["Short Description"]),
                        long_description: trim(row["Long Description"]),
                        variationTypes: built.variationTypes,
                        category: taxonomy.categoryId,
                        subcategory: taxonomy.subcategoryId,
                        isActive: row.isActive !== false,
                        taxRate: Math.min(100, Math.max(0, Number(row["GST %"]) || 0)),
                        hsn: trim(row.HSN),
                    };

                    let saved;
                    const existing = row.productId
                        ? await Product.findById(row.productId)
                        : await Product.findOne({ name: job.name });

                    if (existing) {
                        Object.assign(existing, fields);
                        existing.variants = await assignVariantBarcodes(withAdminVariantFields(variants), {
                            excludeProductId: existing._id,
                        });
                        await existing.save();
                        saved = existing;
                    } else {
                        const variantsWithBarcodes = await assignVariantBarcodes(withAdminVariantFields(variants));
                        saved = await Product.create({ ...fields, variants: variantsWithBarcodes });
                    }

                    savedIds.push(saved._id);
                }
            } catch (err) {
                errors.push(`${name}: ${err.message}`);
            }
        }

        const savedProducts = await Product.find({ _id: { $in: savedIds } })
            .populate("category", "name")
            .populate("subcategory", "name")
            .lean();

        return Response.json({
            success: errors.length === 0,
            saved: savedProducts.length,
            errors,
        });
    } catch (error) {
        console.error("Catalog sheet POST error:", error);
        return Response.json({ success: false, message: error.message || "Server error" }, { status: error.status || 500 });
    }
}

export const GET = withAdmin(getHandler);
export const POST = withAdmin(postHandler);
