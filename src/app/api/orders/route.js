import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import Settings from "@/models/Settings";
import User from "@/models/User";
import { withProtection } from "@/lib/auth";
import { sendOrderConfirmationEmail } from "@/lib/mailer";

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
        const { shippingAddress, paymentMethod, notes } = await req.json();

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
        let totalAmount = 0;

        for (const cartItem of cart.items) {
            if (!cartItem.product || !cartItem.product.isActive) {
                return Response.json(
                    { success: false, message: "Some products are no longer available" },
                    { status: 400 }
                );
            }

            // Find matching variant
            const variant = cartItem.product.variants.find(v => {
                const vAttrs = Object.fromEntries(v.attributes);
                const cartAttrs = Object.fromEntries(cartItem.variantAttributes);
                return JSON.stringify(vAttrs) === JSON.stringify(cartAttrs);
            });

            if (!variant) {
                return Response.json(
                    { success: false, message: "Some product variants are no longer available" },
                    { status: 400 }
                );
            }

            if (variant.stock < cartItem.quantity) {
                return Response.json(
                    { success: false, message: `Insufficient stock for ${cartItem.product.name}` },
                    { status: 400 }
                );
            }

            const price = variant.salePrice || variant.regularPrice;
            const itemTotal = price * cartItem.quantity;
            totalAmount += itemTotal;

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

            // Only reduce stock for COD, defer for online payments
            if (paymentMethod === 'cod') {
                variant.stock -= cartItem.quantity;
                await cartItem.product.save();
            }
        }

        // Create order
        const order = await Order.create({
            user: req.user._id,
            items: orderItems,
            shippingAddress,
            paymentMethod,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
            orderStatus: paymentMethod === 'cod' ? 'confirmed' : 'pending',
            totalAmount,
            notes: notes || ''
        });

        // Only clear cart for COD, defer for online payments
        if (paymentMethod === 'cod') {
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
        if (paymentMethod === 'cod') {
            try {
                const settings = await Settings.getSettings();
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
