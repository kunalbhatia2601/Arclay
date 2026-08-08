import connectDB from "@/lib/mongodb";
import { withAdminProtection } from "@/lib/auth";
import { countProductQuery, resolveProductQuery } from "@/lib/productQuery";

/**
 * Preview endpoint for the query builder.
 *
 * Returns the match count plus a small sample, so the admin sees "matches 23
 * products" and thumbnails while adjusting filters — no guessing what a
 * filter will actually select.
 */
async function postHandler(req) {
    try {
        const { query, sample = 8 } = await req.json();
        await connectDB();

        const [total, products] = await Promise.all([
            countProductQuery(query),
            resolveProductQuery({ ...query, limit: Math.min(12, Math.max(1, Number(sample) || 8)) }),
        ]);

        return Response.json({
            success: true,
            total,
            products: products.map(p => ({
                _id: p._id,
                name: p.name,
                image: p.images?.[0] || "",
                minPrice: p.minPrice,
                hasSale: p.hasSale,
            })),
        });
    } catch (error) {
        console.error("Product query preview error:", error);
        return Response.json({ success: false, message: "Server error" }, { status: 500 });
    }
}

export const POST = withAdminProtection(postHandler);
