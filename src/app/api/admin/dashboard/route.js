import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import Product from "@/models/Product";
import User from "@/models/User";
import { withAdmin } from "@/lib/auth";

async function handler(req) {
    try {
        await connectDB();

        const [
            totalProducts,
            activeProducts,
            totalCategories,
            activeCategories,
            totalUsers,
            activeUsers,
        ] = await Promise.all([
            Product.countDocuments(),
            Product.countDocuments({ isActive: true }),
            Category.countDocuments(),
            Category.countDocuments({ isActive: true }),
            User.countDocuments(),
            User.countDocuments({ isActive: true }),
        ]);

        // Get recent products
        const recentProducts = await Product.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("category", "name")
            .lean();

        // Get recent categories
        const recentCategories = await Category.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        return Response.json({
            success: true,
            stats: {
                products: {
                    total: totalProducts,
                    active: activeProducts,
                },
                categories: {
                    total: totalCategories,
                    active: activeCategories,
                },
                users: {
                    total: totalUsers,
                    active: activeUsers,
                },
            },
            recentProducts,
            recentCategories,
        });
    } catch (error) {
        console.error("Dashboard error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAdmin(handler);
