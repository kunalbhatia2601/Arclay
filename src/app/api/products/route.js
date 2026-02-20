import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category"; // Required for populate to work


export async function GET(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 12;
        const search = searchParams.get("search") || "";
        const category = searchParams.get("category");
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const isFeatured = searchParams.get("isFeatured");
        const sort = searchParams.get("sort") || "newest";

        // Build query - only active products
        const query = { isActive: true };

        // Search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        // Category filter
        if (category) {
            query.category = category;
        }

        // Featured filter
        if (isFeatured === 'true') {
            query.isFeatured = true;
        }

        // Sort options
        let sortOption = { createdAt: -1 }; // default: newest
        switch (sort) {
            case "oldest":
                sortOption = { createdAt: 1 };
                break;
            case "price-low":
            case "price-high":
                // Will sort in memory based on first variant price
                sortOption = { createdAt: -1 };
                break;
            case "name-asc":
                sortOption = { name: 1 };
                break;
            case "name-desc":
                sortOption = { name: -1 };
                break;
        }

        let [products, categories] = await Promise.all([
            Product.find(query)
                .sort(sortOption)
                .populate("category", "name")
                .lean(),
            Category.find({ isActive: true }).select("name image").lean(),
        ]);

        // Helper to get effective price from product (first variant's price)
        const getProductPrice = (product) => {
            const firstVariant = product.variants?.[0];
            if (!firstVariant) return Infinity;
            return firstVariant.salePrice || firstVariant.regularPrice;
        };

        // Price filter in memory (since prices are in variants)
        if (minPrice) {
            const min = parseFloat(minPrice);
            products = products.filter(p => getProductPrice(p) >= min);
        }
        if (maxPrice) {
            const max = parseFloat(maxPrice);
            products = products.filter(p => getProductPrice(p) <= max);
        }

        // Sort by price if requested
        if (sort === "price-low") {
            products.sort((a, b) => getProductPrice(a) - getProductPrice(b));
        } else if (sort === "price-high") {
            products.sort((a, b) => getProductPrice(b) - getProductPrice(a));
        }

        // Pagination
        const total = products.length;
        const skip = (page - 1) * limit;
        products = products.slice(skip, skip + limit);

        return Response.json({
            success: true,
            products,
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
