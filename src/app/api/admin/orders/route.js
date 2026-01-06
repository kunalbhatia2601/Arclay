import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product"; // Import to register schema
import User from "@/models/User"; // Import to register schema
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

        // Build match stage
        const matchStage = {
            $or: [
                { paymentMethod: 'cod' },
                {
                    paymentMethod: { $in: ['razorpay', 'stripe'] },
                    paymentStatus: { $ne: 'pending' }
                }
            ]
        };

        if (orderStatus) {
            matchStage.orderStatus = orderStatus;
        }

        if (paymentStatus) {
            matchStage.paymentStatus = paymentStatus;
        }

        // Build aggregation pipeline
        const pipeline = [
            { $match: matchStage },
            // Lookup user data
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
            // Add string version of _id for search
            {
                $addFields: {
                    orderIdStr: { $toString: '$_id' }
                }
            }
        ];

        // Add search conditions if search term exists
        if (search) {
            const searchLower = search.toLowerCase();
            pipeline.push({
                $match: {
                    $or: [
                        // Match partial order ID (last 8 characters shown in UI)
                        { orderIdStr: { $regex: search, $options: 'i' } },
                        // Match user email
                        { 'userInfo.email': { $regex: search, $options: 'i' } },
                        // Match user name
                        { 'userInfo.name': { $regex: search, $options: 'i' } },
                        // Match user phone
                        { 'userInfo.phone': { $regex: search, $options: 'i' } }
                    ]
                }
            });
        }

        // Get total count
        const countPipeline = [...pipeline, { $count: 'total' }];
        const countResult = await Order.aggregate(countPipeline);
        const total = countResult[0]?.total || 0;

        // Add sorting and pagination
        pipeline.push(
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
            // Lookup product data for items
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            // Reshape to match expected format
            {
                $project: {
                    _id: 1,
                    user: {
                        _id: '$userInfo._id',
                        name: '$userInfo.name',
                        email: '$userInfo.email',
                        phone: '$userInfo.phone'
                    },
                    items: 1,
                    shippingAddress: 1,
                    paymentMethod: 1,
                    paymentStatus: 1,
                    paymentId: 1,
                    orderStatus: 1,
                    totalAmount: 1,
                    notes: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        );

        const orders = await Order.aggregate(pipeline);

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
