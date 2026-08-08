import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product"; // Import to register schema
import User from "@/models/User"; // Import to register schema
import Customer from "@/models/Customer";
import Coupon from "@/models/Coupon";
import { getSettings, withAdminProtection } from "@/lib/auth";
import { releaseStock, reserveAll } from "@/lib/stock";
import { recordSales } from "@/lib/sales";
import { computeBill } from "@/lib/billing";
import { nextBillNumber } from "@/lib/counters";
import { resolveCartLines, toCouponItems } from "@/lib/posCart";
import { claimCouponUsage, releaseCouponUsage, validateCouponForCart } from "@/lib/coupons";

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
            // User input goes into a $regex, so metacharacters must be neutralised.
            const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            pipeline.push({
                $match: {
                    $or: [
                        // Match partial order ID (last 8 characters shown in UI)
                        { orderIdStr: { $regex: safeSearch, $options: 'i' } },
                        // Match user email
                        { 'userInfo.email': { $regex: safeSearch, $options: 'i' } },
                        // Match user name
                        { 'userInfo.name': { $regex: safeSearch, $options: 'i' } },
                        // Match user phone
                        { 'userInfo.phone': { $regex: safeSearch, $options: 'i' } },
                        // POS orders have no user account: the customer's details
                        // live on the order itself.
                        { 'shippingAddress.fullName': { $regex: safeSearch, $options: 'i' } },
                        { 'shippingAddress.phone': { $regex: safeSearch, $options: 'i' } },
                        { couponCode: { $regex: safeSearch, $options: 'i' } }
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
        const {
            items,
            customerInfo,
            paymentMethod,
            notes,
            discountType = 'flat',
            discountValue = 0,
            couponCode = '',
        } = body;

        if (!Array.isArray(items) || items.length === 0) {
            return Response.json(
                { success: false, message: "Order must have at least one item" },
                { status: 400 }
            );
        }

        const method = POS_PAYMENT_METHODS.includes(paymentMethod) ? paymentMethod : 'cash';

        await connectDB();

        // Prices, tax rates and stock all come from the database.
        const resolved = await resolveCartLines(items);
        if (!resolved.ok) {
            return Response.json({ success: false, message: resolved.message }, { status: 400 });
        }
        const { lines, reservations } = resolved;

        const settings = await getSettings();
        const taxEnabled = !!settings.store?.taxEnabled;
        const priceIncludesTax = settings.store?.priceIncludesTax !== false;

        const phone = customerInfo?.phone?.trim() || "";
        const name = customerInfo?.name?.trim() || "";

        // A returning customer is matched up front so coupon per-user limits can
        // be checked against their history.
        let customer = phone ? await Customer.findOne({ phone }) : null;

        // Coupon, validated server-side against the same engine the web uses
        let coupon = null;
        let couponDiscount = 0;

        if (couponCode) {
            coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true })
                .populate('applicableCategories applicableProducts applicableUsers');

            if (!coupon) {
                return Response.json(
                    { success: false, message: "Invalid or inactive coupon code" },
                    { status: 400 }
                );
            }

            const couponItems = toCouponItems(lines);
            const cartTotal = couponItems.reduce((s, i) => s + i.priceAtOrder * i.quantity, 0);

            const validation = await validateCouponForCart({
                coupon,
                customerId: customer?._id,
                cartItems: couponItems,
                cartTotal,
            });

            if (!validation.valid) {
                return Response.json(
                    { success: false, message: validation.message },
                    { status: 400 }
                );
            }

            couponDiscount = coupon.calculateDiscount(couponItems, cartTotal);
        }

        // Same pure function the POS screen used to quote the customer.
        const bill = computeBill(lines, {
            discountType,
            discountValue,
            couponDiscount,
            taxEnabled,
            priceIncludesTax,
        });

        const orderItems = bill.lines.map((line, i) => ({
            product: lines[i].product._id,
            variant: {
                attributes: lines[i].variant.attributes,
                price: lines[i].price,
                sku: lines[i].variant.sku,
            },
            quantity: line.quantity,
            priceAtOrder: lines[i].price,
            name: lines[i].name,
            lineDiscount: line.lineDiscount,
            taxRate: line.taxRate,
            taxAmount: line.taxAmount,
            hsn: lines[i].hsn,
        }));

        // Claim coupon usage before the sale so a race cannot exceed maxUsage.
        let couponClaimed = false;
        if (coupon && couponDiscount > 0) {
            couponClaimed = await claimCouponUsage(coupon._id);
            if (!couponClaimed) {
                return Response.json(
                    { success: false, message: "This coupon has reached its usage limit" },
                    { status: 400 }
                );
            }
        }

        // Counter sales hand over goods immediately, so stock comes off now.
        const reserved = await reserveAll(reservations);
        if (!reserved.ok) {
            if (couponClaimed) await releaseCouponUsage(coupon._id);
            return Response.json(
                { success: false, message: "Insufficient stock for one or more items" },
                { status: 400 }
            );
        }
        await recordSales(reservations);

        let order;
        let billNumber = '';
        try {
            billNumber = await nextBillNumber(settings.store?.invoicePrefix || 'INV');

            order = await Order.create({
                user: null,
                source: 'pos',
                billNumber,
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
                subtotal: bill.subtotal,
                shippingFee: 0,
                lineDiscountTotal: bill.lineDiscountTotal,
                discountAmount: bill.billDiscount + bill.couponDiscount,
                coupon: coupon?._id || null,
                couponCode: couponDiscount > 0 ? coupon.code : '',
                taxAmount: bill.taxAmount,
                taxBreakup: bill.taxBreakup,
                totalAmount: bill.total,
                paymentMethod: method,
                paymentStatus: 'completed',
                orderStatus: 'delivered',
                notes: notes || "POS Walk-in Sale",
            });
        } catch (createError) {
            // Undo everything already committed so a failed insert cannot strand
            // reserved stock or a consumed coupon use.
            for (const r of reservations) {
                await releaseStock(r.productId, r.variantIndex, r.quantity);
            }
            await recordSales(reservations, { reverse: true });
            if (couponClaimed) await releaseCouponUsage(coupon._id);
            throw createError;
        }

        // Remember the walk-in customer so the next visit only needs their phone.
        // Done after the order exists so a failed sale never inflates their totals.
        if (phone) {
            try {
                customer = await Customer.findOneAndUpdate(
                    { phone },
                    {
                        $setOnInsert: { phone },
                        // Only overwrite a stored name when a new one was typed
                        ...(name ? { $set: { name } } : {}),
                        $inc: { totalOrders: 1, totalSpent: bill.total },
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
