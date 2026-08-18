import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category"; // Required for populate to work
import { escapeRegex } from "@/lib/utils";
import { buildMetaFilter } from "@/lib/meta";
import { stripAdminProducts } from "@/lib/productPublic";

// Sort keys the storefront may ask for, mapped to real index-backed sorts.
// Price and bestselling lean on the denormalized fields on Product.
const SORT_MAP = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    "price-low": { minPrice: 1 },
    "price-high": { minPrice: -1 },
    "name-asc": { name: 1 },
    "name-desc": { name: -1 },
    bestselling: { salesCount: -1, createdAt: -1 },
    popular: { salesCount: -1, createdAt: -1 },
};

export async function GET(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page")) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit")) || 12));
        const search = searchParams.get("search") || "";
        const category = searchParams.get("category");
        const subcategory = searchParams.get("subcategory");
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const isFeatured = searchParams.get("isFeatured");
        const onSale = searchParams.get("onSale");
        const inStock = searchParams.get("inStock");
        const sort = searchParams.get("sort") || "newest";

        // Build query - only active products
        const query = { isActive: true };

        if (search) {
            const safe = escapeRegex(search);
            query.$or = [
                { name: { $regex: safe, $options: "i" } },
                { description: { $regex: safe, $options: "i" } },
            ];
        }

        if (category) {
            query.category = category;
        }

        if (subcategory) {
            query.subcategory = subcategory;
        }

        if (isFeatured === "true") {
            query.isFeatured = true;
        }

        if (onSale === "true") {
            query.hasSale = true;
        }

        if (inStock === "true") {
            query.totalStock = { $gt: 0 };
        }

        // Price filtering runs against the denormalized range rather than
        // pulling every variant into memory. A product matches when its
        // cheapest variant falls inside the requested window.
        const priceFilter = {};
        if (minPrice !== null && minPrice !== "") {
            const min = parseFloat(minPrice);
            if (!Number.isNaN(min)) priceFilter.$gte = min;
        }
        if (maxPrice !== null && maxPrice !== "") {
            const max = parseFloat(maxPrice);
            if (!Number.isNaN(max)) priceFilter.$lte = max;
        }
        if (Object.keys(priceFilter).length) {
            query.minPrice = priceFilter;
        }

        // Custom-field facets, sent as JSON: [{key, op, value}, ...]
        const metaParam = searchParams.get("meta");
        if (metaParam) {
            try {
                const metaFilter = buildMetaFilter(JSON.parse(metaParam));
                if (metaFilter) Object.assign(query, metaFilter);
            } catch {
                // Malformed filter is ignored rather than failing the listing.
            }
        }

        // Restricts the whole listing to a fixed set of ids, which is how a
        // catalogue block becomes a curated collection.
        const only = searchParams.get("only");
        if (only) {
            const ids = only.split(",").filter(Boolean).slice(0, 200);
            if (ids.length) query._id = { $in: ids };
        }

        const sortOption = SORT_MAP[sort] || SORT_MAP.newest;
        const skip = (page - 1) * limit;

        const [products, total, categories] = await Promise.all([
            Product.find(query)
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .populate("category", "name image")
                .populate("subcategory", "name")
                .lean(),
            Product.countDocuments(query),
            Category.find({ isActive: true }).select("name image parent").lean(),
        ]);

        return Response.json({
            success: true,
            products: stripAdminProducts(products),
            categories,
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
