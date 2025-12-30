import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import { withAdmin } from "@/lib/auth";

// GET all categories
async function getHandler(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 10;
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status"); // 'active', 'inactive', or null for all

        const query = {};

        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        if (status === "active") {
            query.isActive = true;
        } else if (status === "inactive") {
            query.isActive = false;
        }

        const skip = (page - 1) * limit;

        const [categories, total] = await Promise.all([
            Category.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Category.countDocuments(query),
        ]);

        return Response.json({
            success: true,
            categories,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get categories error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

// POST create category
async function postHandler(req) {
    try {
        const { name, image, description, isActive } = await req.json();

        if (!name) {
            return Response.json(
                { success: false, message: "Category name is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const category = await Category.create({
            name,
            image: image || "",
            description: description || "",
            isActive: isActive !== false,
        });

        return Response.json({
            success: true,
            message: "Category created successfully",
            category,
        });
    } catch (error) {
        console.error("Create category error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAdmin(getHandler);
export const POST = withAdmin(postHandler);
