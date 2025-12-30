import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";

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

        // Price filter
        if (minPrice || maxPrice) {
            query.$and = query.$and || [];
            if (minPrice) {
                query.$and.push({
                    $or: [
                        { salePrice: { $gte: parseFloat(minPrice) } },
                        { $and: [{ salePrice: null }, { regularPrice: { $gte: parseFloat(minPrice) } }] },
                    ],
                });
            }
            if (maxPrice) {
                query.$and.push({
                    $or: [
                        { salePrice: { $lte: parseFloat(maxPrice) } },
                        { $and: [{ salePrice: null }, { regularPrice: { $lte: parseFloat(maxPrice) } }] },
                    ],
                });
            }
        }

        // Sort options
        let sortOption = { createdAt: -1 }; // default: newest
        switch (sort) {
            case "oldest":
                sortOption = { createdAt: 1 };
                break;
            case "price-low":
                sortOption = { regularPrice: 1 };
                break;
            case "price-high":
                sortOption = { regularPrice: -1 };
                break;
            case "name-asc":
                sortOption = { name: 1 };
                break;
            case "name-desc":
                sortOption = { name: -1 };
                break;
        }

        const skip = (page - 1) * limit;

        const [products, total, categories] = await Promise.all([
            Product.find(query)
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .populate("category", "name")
                .lean(),
            Product.countDocuments(query),
            Category.find({ isActive: true }).select("name").lean(),
        ]);

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
