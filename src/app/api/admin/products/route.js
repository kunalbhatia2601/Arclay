import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category"; // Required for populate to work
import { withAdmin } from "@/lib/auth";

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
        const { name, images, description, variationTypes, variants, category, isActive } = await req.json();

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

        const product = await Product.create({
            name,
            images: images || [],
            description: description || "",
            variationTypes: variationTypes || [],
            variants: variants,
            category,
            isActive: isActive !== false,
        });

        const populatedProduct = await Product.findById(product._id)
            .populate("category", "name")
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
            { status: 500 }
        );
    }
}

export const GET = withAdmin(getHandler);
export const POST = withAdmin(postHandler);
