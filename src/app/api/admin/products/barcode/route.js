import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category"; // Required for populate to work
import { withAdmin } from "@/lib/auth";

// GET resolve a scanned barcode to a product + the exact variant it belongs to
async function getHandler(req) {
    try {
        const { searchParams } = new URL(req.url);
        const code = (searchParams.get("code") || "").trim();

        if (!code) {
            return Response.json(
                { success: false, message: "Barcode is required" },
                { status: 400 }
            );
        }

        await connectDB();

        // Prefer a variant-level match, then fall back to the legacy
        // product-level barcode so older labels keep working.
        let variantIndex = -1;
        let product = await Product.findOne({ "variants.barcode": code })
            .populate("category", "name")
            .lean();

        if (product) {
            variantIndex = product.variants.findIndex((v) => v.barcode === code);
        } else {
            product = await Product.findOne({ barcode: code })
                .populate("category", "name")
                .lean();
            if (product) variantIndex = 0;
        }

        if (!product || variantIndex < 0) {
            return Response.json(
                { success: false, message: "No product found for this barcode" },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            product,
            variantIndex,
            variant: product.variants[variantIndex],
        });
    } catch (error) {
        console.error("Barcode lookup error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAdmin(getHandler);
