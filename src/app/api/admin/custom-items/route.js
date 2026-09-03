import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { withAdmin } from "@/lib/auth";
import { assignVariantBarcodes } from "@/lib/variantBarcodes";
import { resolveProductTaxonomy } from "@/lib/categories";

/**
 * Everything rung up at the POS that was not in the catalog.
 *
 * Grouped by the name the cashier typed, so "Loose sugar 1kg" sold eleven times
 * is one row to act on rather than eleven. Each row carries the prices seen and
 * the last time it was sold, which is what you need to decide whether it is
 * worth adding as a real product.
 */
async function getHandler(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const days = Math.min(365, Math.max(1, parseInt(searchParams.get("days"), 10) || 90));
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const rows = await Order.aggregate([
            { $match: { createdAt: { $gte: since }, "items.isCustom": true } },
            { $unwind: "$items" },
            { $match: { "items.isCustom": true } },
            {
                $group: {
                    _id: { $toLower: { $trim: { input: "$items.name" } } },
                    name: { $last: "$items.name" },
                    timesSold: { $sum: 1 },
                    unitsSold: { $sum: "$items.quantity" },
                    revenue: {
                        $sum: {
                            $subtract: [
                                { $multiply: ["$items.priceAtOrder", "$items.quantity"] },
                                { $ifNull: ["$items.lineDiscount", 0] },
                            ],
                        },
                    },
                    lastPrice: { $last: "$items.priceAtOrder" },
                    lastCost: { $last: "$items.costAtOrder" },
                    lastTaxRate: { $last: "$items.taxRate" },
                    lastHsn: { $last: "$items.hsn" },
                    lastSoldAt: { $max: "$createdAt" },
                    prices: { $addToSet: "$items.priceAtOrder" },
                },
            },
            { $sort: { unitsSold: -1 } },
            { $limit: 200 },
        ]);

        // A name already in the catalog means someone added it since — surface
        // that so it is not offered for creation twice.
        const names = rows.map((r) => r.name);
        const existing = names.length
            ? await Product.find({ name: { $in: names } }, { name: 1 }).lean()
            : [];
        const existingNames = new Set(existing.map((p) => p.name.toLowerCase()));

        return Response.json({
            success: true,
            days,
            items: rows.map((r) => ({
                key: r._id,
                name: r.name,
                timesSold: r.timesSold,
                unitsSold: r.unitsSold,
                revenue: Math.round(r.revenue * 100) / 100,
                lastPrice: r.lastPrice,
                lastCost: r.lastCost,
                lastTaxRate: r.lastTaxRate,
                lastHsn: r.lastHsn,
                lastSoldAt: r.lastSoldAt,
                priceVaried: (r.prices || []).length > 1,
                inCatalog: existingNames.has(String(r.name).toLowerCase()),
            })),
        });
    } catch (error) {
        console.error("Custom items GET error:", error);
        return Response.json({ success: false, message: error.message || "Server error" }, { status: 500 });
    }
}

/** Turn one reviewed custom item into a real single-variant product. */
async function postHandler(req) {
    try {
        const { name, category, subcategory, price, costPrice, taxRate, hsn, stock } = await req.json();

        if (!String(name || "").trim()) {
            return Response.json({ success: false, message: "Name is required" }, { status: 400 });
        }
        if (!category) {
            return Response.json({ success: false, message: "Category is required" }, { status: 400 });
        }

        await connectDB();

        const trimmedName = String(name).trim();
        const clash = await Product.findOne({ name: trimmedName });
        if (clash) {
            return Response.json(
                { success: false, message: `"${trimmedName}" is already in the catalog` },
                { status: 400 }
            );
        }

        const taxonomy = await resolveProductTaxonomy(category, subcategory || null);
        const regularPrice = Math.max(0, Number(price) || 0);

        const variants = await assignVariantBarcodes([
            {
                attributes: {},
                regularPrice,
                salePrice: regularPrice,
                costPrice: costPrice == null || costPrice === "" ? null : Math.max(0, Number(costPrice) || 0),
                stock: Math.max(0, parseInt(stock, 10) || 0),
                sku: "",
                barcode: "",
            },
        ]);

        const product = await Product.create({
            name: trimmedName,
            images: [],
            description: "",
            variationTypes: [],
            variants,
            category: taxonomy.categoryId,
            subcategory: taxonomy.subcategoryId,
            isActive: true,
            taxRate: Math.min(100, Math.max(0, Number(taxRate) || 0)),
            hsn: String(hsn || "").trim(),
        });

        return Response.json({
            success: true,
            message: `"${trimmedName}" added to the catalog`,
            product: { _id: product._id, name: product.name },
        });
    } catch (error) {
        console.error("Custom items POST error:", error);
        return Response.json(
            { success: false, message: error.message || "Server error" },
            { status: error.status || 500 }
        );
    }
}

export const GET = withAdmin(getHandler);
export const POST = withAdmin(postHandler);
