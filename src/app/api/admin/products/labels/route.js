import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category"; // Required for populate to work
import { withAdmin } from "@/lib/auth";

// GET every printable label — one row per product variant
async function getHandler(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const search = (searchParams.get("search") || "").trim();
        const category = searchParams.get("category");
        const status = searchParams.get("status");

        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { "variants.sku": { $regex: search, $options: "i" } },
                { "variants.barcode": { $regex: search, $options: "i" } },
            ];
        }

        if (category) query.category = category;
        if (status === "active") query.isActive = true;
        else if (status === "inactive") query.isActive = false;

        const products = await Product.find(query)
            .sort({ name: 1 })
            .populate("category", "name")
            .lean();

        // Flatten to one entry per variant so the client can treat each label as
        // an independent row.
        const labels = [];
        for (const product of products) {
            (product.variants || []).forEach((variant, variantIndex) => {
                labels.push({
                    id: `${product._id}-${variantIndex}`,
                    productId: product._id,
                    productName: product.name,
                    categoryName: product.category?.name || "",
                    isActive: product.isActive,
                    variantIndex,
                    variant: {
                        attributes: variant.attributes || {},
                        regularPrice: variant.regularPrice,
                        salePrice: variant.salePrice ?? null,
                        stock: variant.stock,
                        sku: variant.sku || "",
                        barcode: variant.barcode || "",
                    },
                });
            });
        }

        return Response.json({
            success: true,
            labels,
            total: labels.length,
            missingBarcodes: labels.filter((l) => !l.variant.barcode).length,
        });
    } catch (error) {
        console.error("Get labels error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAdmin(getHandler);
