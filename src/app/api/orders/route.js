import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import Settings from "@/models/Settings";
import User from "@/models/User";
import Coupon from "@/models/Coupon";
import { getSettings, withProtection } from "@/lib/auth";
import { sendOrderConfirmationEmail } from "@/lib/mailer";
import { calculateShippingFee } from "@/lib/shiprocket";
import { claimCouponUsage, releaseCouponUsage, validateCouponForCart } from "@/lib/coupons";
import { findVariantIndex, releaseStock, reserveAll } from "@/lib/stock";

// GET user's orders
async function getHandler(req) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 10;
        const status = searchParams.get("status");

        await connectDB();

        // Auto-cleanup: Delete user's pending Razorpay/Stripe orders older than 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        await Order.deleteMany({
            user: req.user._id,
            paymentMethod: { $in: ['razorpay', 'stripe'] },
            paymentStatus: 'pending',
            createdAt: { $lt: sevenDaysAgo }
        });

        const query = { user: req.user._id };

        // Only show COD orders or online payment orders with completed payment
        query.$or = [
            { paymentMethod: 'cod' }, // Show all COD orders
            {
                paymentMethod: { $in: ['razorpay', 'stripe'] },
                paymentStatus: { $ne: 'pending' } // Only show paid Razorpay/Stripe orders
            }
        ];

        if (status) {
            query.orderStatus = status;
        }

        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
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
        console.error("Get orders error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

// POST create new order
async function postHandler(req) {
    try {
        // shippingFee is deliberately NOT read from the request body: it is
        // recalculated server-side from Settings below.
        const { shippingAddress, paymentMethod, notes, couponCode } = await req.json();

        if (!shippingAddress || !paymentMethod) {
            return Response.json(
                { success: false, message: "Shipping address and payment method are required" },
                { status: 400 }
            );
        }

        // Validate shipping address
        const requiredFields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];
        for (const field of requiredFields) {
            if (!shippingAddress[field]) {
                return Response.json(
                    { success: false, message: `${field} is required in shipping address` },
                    { status: 400 }
                );
            }
        }

        // Validate payment method
        if (!['razorpay', 'stripe', 'cod'].includes(paymentMethod)) {
            return Response.json(
                { success: false, message: "Invalid payment method" },
                { status: 400 }
            );
        }

        await connectDB();

        // Get user's cart
        const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

        if (!cart || cart.items.length === 0) {
            return Response.json(
                { success: false, message: "Cart is empty" },
                { status: 400 }
            );
        }

        // Validate cart items and calculate total
        const orderItems = [];
        const couponItems = [];
        const reservations = [];
        let subtotal = 0;

        for (const cartItem of cart.items) {
            if (!cartItem.product || !cartItem.product.isActive) {
                return Response.json(
                    { success: false, message: "Some products are no longer available" },
                    { status: 400 }
                );
            }

            // Find matching variant (attribute order independent)
            const variantIndex = findVariantIndex(cartItem.product, cartItem.variantAttributes);
            const variant = variantIndex >= 0 ? cartItem.product.variants[variantIndex] : null;

            if (!variant) {
                return Response.json(
                    { success: false, message: "Some product variants are no longer available" },
                    { status: 400 }
                );
            }

            // Pre-check for a fast, friendly error. The authoritative check is the
            // atomic reservation below.
            if (variant.stock < cartItem.quantity) {
                return Response.json(
                    { success: false, message: `Insufficient stock for ${cartItem.product.name}` },
                    { status: 400 }
                );
            }

            const price = variant.salePrice || variant.regularPrice;
            subtotal += price * cartItem.quantity;

            orderItems.push({
                product: cartItem.product._id,
                variant: {
                    attributes: cartItem.variantAttributes,
                    price,
                    sku: variant.sku
                },
                quantity: cartItem.quantity,
                priceAtOrder: price
            });

            // Same lines, but with the product document attached so coupon
            // product/category restrictions can be evaluated.
            couponItems.push({
                product: cartItem.product,
                quantity: cartItem.quantity,
                priceAtOrder: price
            });

            reservations.push({
                productId: cartItem.product._id,
                variantIndex,
                quantity: cartItem.quantity
            });
        }

        // Process coupon if provided — validated fully server-side.
        let discountAmount = 0;
        let coupon = null;
        let appliedCouponCode = '';

        if (couponCode) {
            coupon = await Coupon.findOne({
                code: couponCode.toUpperCase(),
                isActive: true
            }).populate('applicableCategories applicableProducts applicableUsers');

            if (!coupon) {
                return Response.json(
                    { success: false, message: "Invalid or inactive coupon code" },
                    { status: 400 }
                );
            }

            const validation = await validateCouponForCart({
                coupon,
                userId: req.user._id,
                cartItems: couponItems,
                cartTotal: subtotal
            });

            if (!validation.valid) {
                return Response.json(
                    { success: false, message: validation.message },
                    { status: 400 }
                );
            }

            discountAmount = coupon.calculateDiscount(couponItems, subtotal);
            appliedCouponCode = coupon.code;
        }

        const discountedSubtotal = Math.max(0, subtotal - discountAmount);

        // Shipping fee is computed from Settings, never trusted from the client.
        const settings = await getSettings();
        const shippingResult = await calculateShippingFee(
            settings,
            discountedSubtotal,
            shippingAddress.pincode
        );
        const shippingFee = Math.max(0, Number(shippingResult?.fee) || 0);

        const totalAmount = discountedSubtotal + shippingFee;

        const isCod = paymentMethod === 'cod';

        // Claim coupon usage before creating the order so a race cannot push
        // usageCount past maxUsage. For online payments the claim happens on
        // successful verification instead, so abandoned checkouts do not consume it.
        let couponClaimed = false;
        if (coupon && discountAmount > 0 && isCod) {
            couponClaimed = await claimCouponUsage(coupon._id);
            if (!couponClaimed) {
                return Response.json(
                    { success: false, message: "This coupon has reached its usage limit" },
                    { status: 400 }
                );
            }
        }

        // Reserve stock atomically for COD. Online payments reserve at verification.
        if (isCod) {
            const reserved = await reserveAll(reservations);
            if (!reserved.ok) {
                if (couponClaimed) await releaseCouponUsage(coupon._id);
                return Response.json(
                    { success: false, message: "Insufficient stock for one or more items" },
                    { status: 400 }
                );
            }
        }

        // Create order
        let order;
        try {
            order = await Order.create({
                user: req.user._id,
                items: orderItems,
                shippingAddress,
                paymentMethod,
                paymentStatus: 'pending',
                orderStatus: isCod ? 'confirmed' : 'pending',
                subtotal,
                discountAmount,
                coupon: coupon?._id || null,
                couponCode: appliedCouponCode,
                totalAmount,
                shippingFee,
                notes: notes || ''
            });
        } catch (createError) {
            // Undo everything already committed so a failed insert cannot strand
            // reserved stock or a consumed coupon use.
            if (isCod) {
                for (const r of reservations) {
                    await releaseStock(r.productId, r.variantIndex, r.quantity);
                }
            }
            if (couponClaimed) await releaseCouponUsage(coupon._id);
            throw createError;
        }

        // Only clear cart for COD, defer for online payments
        if (isCod) {
            cart.items = [];
            cart.emails_sent_count = 0;
            cart.last_email_sent_at = null;
            await cart.save();
        }

        // Populate order for response
        const populatedOrder = await Order.findById(order._id)
            .populate('items.product', 'name images')
            .lean();

        // Send order confirmation email for COD orders
        if (isCod) {
            try {
                if (settings.mail?.isEnabled && settings.mail?.email && settings.mail?.password && settings.mail?.host) {
                    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'ESSVORA';
                    await sendOrderConfirmationEmail(populatedOrder, req.user.email, settings.mail, siteName);
                }
            } catch (emailError) {
                console.error('Failed to send order confirmation email:', emailError);
                // Don't fail the order if email fails
            }
        }

        return Response.json({
            success: true,
            message: "Order created successfully",
            order: populatedOrder
        });
    } catch (error) {
        console.error("Create order error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withProtection(getHandler);
export const POST = withProtection(postHandler);
