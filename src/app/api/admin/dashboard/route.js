import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import Product from "@/models/Product";
import User from "@/models/User";
import Order from "@/models/Order";
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
            totalOrders,
            deliveredOrders,
        ] = await Promise.all([
            Product.countDocuments(),
            Product.countDocuments({ isActive: true }),
            Category.countDocuments(),
            Category.countDocuments({ isActive: true }),
            User.countDocuments(),
            User.countDocuments({ isActive: true }),
            Order.countDocuments(),
            Order.countDocuments({ orderStatus: 'delivered' }),
        ]);

        // Calculate revenue - all orders and delivered only
        const [allOrdersRevenue, deliveredRevenue] = await Promise.all([
            Order.aggregate([
                { $match: { paymentStatus: { $ne: 'failed' } } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ]),
            Order.aggregate([
                { $match: { orderStatus: 'delivered' } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ])
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

        // Get recent users
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select("name email role isActive createdAt")
            .lean();

        // Get recent orders
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("user", "name email")
            .select("_id user totalAmount orderStatus paymentStatus paymentMethod couponCode discountAmount createdAt")
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
                orders: {
                    total: totalOrders,
                    delivered: deliveredOrders,
                    totalRevenue: allOrdersRevenue[0]?.total || 0,
                    deliveredRevenue: deliveredRevenue[0]?.total || 0,
                },
            },
            recentProducts,
            recentCategories,
            recentUsers,
            recentOrders,
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
