import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product"; // Import to register schema
import { withAdminProtection } from "@/lib/auth";

// GET all orders (admin)
async function getHandler(req) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 20;
        const orderStatus = searchParams.get("orderStatus");
        const paymentStatus = searchParams.get("paymentStatus");
        const search = searchParams.get("search") || "";

        await connectDB();

        // Auto-cleanup: Delete pending Razorpay/Stripe orders older than 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        await Order.deleteMany({
            paymentMethod: { $in: ['razorpay', 'stripe'] },
            paymentStatus: 'pending',
            createdAt: { $lt: sevenDaysAgo }
        });

        const query = {};

        // Exclude orders with Razorpay/Stripe that have pending payment status
        // These are incomplete payment attempts
        query.$or = [
            { paymentMethod: 'cod' }, // Show all COD orders
            {
                paymentMethod: { $in: ['razorpay', 'stripe'] },
                paymentStatus: { $ne: 'pending' } // Only show paid Razorpay/Stripe orders
            }
        ];

        if (orderStatus) {
            query.orderStatus = orderStatus;
        }

        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }

        // Search by order ID or user email (requires additional user lookup)
        if (search) {
            // Try to match order ID only if it's a valid ObjectId (24 char hex string)
            if (/^[0-9a-fA-F]{24}$/.test(search)) {
                query._id = search;
            }
            // If not a valid ObjectId, skip the search (could extend to search by user email later)
        }

        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('user', 'name email phone')
                .populate('items.product', 'name images')
                .lean(),
            Order.countDocuments(query),
        ]);

        return Response.json({
            success: true,
            orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get admin orders error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAdminProtection(getHandler);
