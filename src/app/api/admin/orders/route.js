import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product"; // Import to register schema
import User from "@/models/User"; // Import to register schema
import Customer from "@/models/Customer";
import { withAdminProtection } from "@/lib/auth";
import { releaseStock, reserveAll } from "@/lib/stock";

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
                // Counter sales are paid before the order exists
                { source: 'pos' },
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
                    source: 1,
                    subtotal: 1,
                    shippingFee: 1,
                    shippingAddress: 1,
                    paymentMethod: 1,
                    paymentStatus: 1,
                    paymentId: 1,
                    orderStatus: 1,
                    totalAmount: 1,
                    couponCode: 1,
                    discountAmount: 1,
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

const POS_PAYMENT_METHODS = ['cash', 'card', 'upi'];

// POST - Create order from POS
async function postHandler(req) {
    try {
        const body = await req.json();
        const { items, customerInfo, paymentMethod, notes, discountAmount = 0 } = body;

        if (!Array.isArray(items) || items.length === 0) {
            return Response.json(
                { success: false, message: "Order must have at least one item" },
                { status: 400 }
            );
        }

        const method = POS_PAYMENT_METHODS.includes(paymentMethod) ? paymentMethod : 'cash';

        await connectDB();

        // Prices are resolved from the database, never taken from the client.
        const orderItems = [];
        const reservations = [];
        let subtotal = 0;

        for (const item of items) {
            const quantity = parseInt(item.quantity, 10);

            if (!item.product || !(quantity > 0)) {
                return Response.json(
                    { success: false, message: "Every item needs a product and a positive quantity" },
                    { status: 400 }
                );
            }

            const product = await Product.findById(item.product);
            if (!product) {
                return Response.json(
                    { success: false, message: "One of the products no longer exists" },
                    { status: 400 }
                );
            }

            // Resolve the variant by barcode when given, otherwise by index.
            let variantIndex = -1;
            if (item.barcode) {
                variantIndex = product.variants.findIndex((v) => v.barcode === item.barcode);
            }
            if (variantIndex < 0 && Number.isInteger(item.variantIndex)) {
                variantIndex = item.variantIndex;
            }
            if (variantIndex < 0) variantIndex = 0;

            const variant = product.variants[variantIndex];
            if (!variant) {
                return Response.json(
                    { success: false, message: `No matching variant for ${product.name}` },
                    { status: 400 }
                );
            }

            if (variant.stock < quantity) {
                return Response.json(
                    {
                        success: false,
                        message: `Insufficient stock for ${product.name} (${variant.stock} left)`,
                    },
                    { status: 400 }
                );
            }

            const price = variant.salePrice || variant.regularPrice;
            subtotal += price * quantity;

            orderItems.push({
                product: product._id,
                variant: {
                    attributes: variant.attributes,
                    price,
                    sku: variant.sku,
                },
                quantity,
                priceAtOrder: price,
            });

            reservations.push({ productId: product._id, variantIndex, quantity });
        }

        const discount = Math.min(Math.max(0, Number(discountAmount) || 0), subtotal);
        const totalAmount = subtotal - discount;

        const phone = customerInfo?.phone?.trim() || "";
        const name = customerInfo?.name?.trim() || "";

        // Counter sales hand over goods immediately, so stock comes off now.
        const reserved = await reserveAll(reservations);
        if (!reserved.ok) {
            return Response.json(
                { success: false, message: "Insufficient stock for one or more items" },
                { status: 400 }
            );
        }

        let order;
        try {
            order = await Order.create({
                user: null,
                source: 'pos',
                items: orderItems,
                shippingAddress: {
                    fullName: name || "Walk-in Customer",
                    phone: phone || "0000000000",
                    addressLine1: "POS Sale",
                    addressLine2: "",
                    city: "N/A",
                    state: "N/A",
                    pincode: "000000",
                    country: "India",
                },
                subtotal,
                shippingFee: 0,
                discountAmount: discount,
                totalAmount,
                paymentMethod: method,
                paymentStatus: 'completed',
                orderStatus: 'delivered',
                notes: notes || "POS Walk-in Sale",
            });
        } catch (createError) {
            // Put the stock back so a failed insert cannot lose inventory.
            for (const r of reservations) {
                await releaseStock(r.productId, r.variantIndex, r.quantity);
            }
            throw createError;
        }

        // Remember the walk-in customer so the next visit only needs their phone.
        // Done after the order exists so a failed sale never inflates their totals.
        if (phone) {
            try {
                const customer = await Customer.findOneAndUpdate(
                    { phone },
                    {
                        $setOnInsert: { phone },
                        // Only overwrite a stored name when a new one was typed
                        ...(name ? { $set: { name } } : {}),
                        $inc: { totalOrders: 1, totalSpent: totalAmount },
                        $currentDate: { lastOrderAt: true },
                    },
                    { new: true, upsert: true }
                );

                order.customer = customer._id;
                await order.save();
            } catch (customerError) {
                // The sale itself is done; never fail it over the address book.
                console.error("Failed to record POS customer:", customerError);
            }
        }

        const populatedOrder = await Order.findById(order._id)
            .populate('items.product', 'name images')
            .lean();

        return Response.json({
            success: true,
            message: "Order created successfully",
            order: populatedOrder,
        });
    } catch (error) {
        console.error("Create POS order error:", error);
        return Response.json(
            { success: false, message: error.message || "Server error" },
            { status: 500 }
        );
    }
}

export const POST = withAdminProtection(postHandler);
