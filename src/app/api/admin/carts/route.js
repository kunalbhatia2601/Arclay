import connectDB from "@/lib/mongodb";
import Cart from "@/models/Cart";
import User from "@/models/User";
import Product from "@/models/Product";
import Settings from "@/models/Settings";
import { withAdminProtection } from "@/lib/auth";
import { sendCartReminderEmail } from "@/lib/mailer";

// GET abandoned carts (admin)
async function getHandler(req) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 20;
        const hoursParam = searchParams.get("hours");
        const hours = hoursParam !== null ? parseInt(hoursParam) : 24;

        await connectDB();

        // Build match stage - carts with at least one item
        const matchStage = {
            'items.0': { $exists: true } // Has at least one item
        };

        // Only apply time filter if hours > 0
        if (hours > 0) {
            const cutoffTime = new Date();
            cutoffTime.setHours(cutoffTime.getHours() - hours);
            matchStage.updatedAt = { $lt: cutoffTime };
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
            // Lookup product data for items
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            }
        ];

        // Get total count
        const countPipeline = [...pipeline, { $count: 'total' }];
        const countResult = await Cart.aggregate(countPipeline);
        const total = countResult[0]?.total || 0;

        // Add sorting and pagination
        pipeline.push(
            { $sort: { updatedAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
            // Reshape to include user and product details
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
                    productInfo: 1,
                    emails_sent_count: 1,
                    last_email_sent_at: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        );

        const carts = await Cart.aggregate(pipeline);

        console.log(carts);

        // Helper to convert Map or plain object to plain object
        const toPlainObject = (val) => {
            if (val instanceof Map) return Object.fromEntries(val);
            if (typeof val === 'object' && val !== null) return val;
            return {};
        };

        // Calculate cart totals and format items
        const formattedCarts = carts.map(cart => {
            let totalValue = 0;
            const formattedItems = cart.items.map(item => {
                const product = cart.productInfo?.find(p => p._id.toString() === item.product.toString());
                if (product) {
                    // Find matching variant - handle both Map and plain object
                    const variant = product.variants?.find(v => {
                        const vAttrs = toPlainObject(v.attributes);
                        const cartAttrs = toPlainObject(item.variantAttributes);
                        return JSON.stringify(vAttrs) === JSON.stringify(cartAttrs);
                    });
                    const price = variant?.salePrice || variant?.regularPrice || 0;
                    totalValue += price * item.quantity;
                    return {
                        ...item,
                        productName: product.name,
                        productImage: product.images?.[0],
                        price,
                        variantInfo: variant
                    };
                }
                return item;
            });

            return {
                ...cart,
                items: formattedItems,
                totalValue,
            };
        });

        return Response.json({
            success: true,
            carts: formattedCarts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get abandoned carts error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

// POST send reminder email
async function postHandler(req) {
    try {
        const { cartId } = await req.json();

        if (!cartId) {
            return Response.json(
                { success: false, message: "Cart ID is required" },
                { status: 400 }
            );
        }

        await connectDB();

        // Get cart with user and product data
        const cart = await Cart.findById(cartId)
            .populate('user', 'name email')
            .populate('items.product', 'name images variants');

        if (!cart) {
            return Response.json(
                { success: false, message: "Cart not found" },
                { status: 404 }
            );
        }

        if (!cart.user || !cart.user.email) {
            return Response.json(
                { success: false, message: "User email not found" },
                { status: 400 }
            );
        }

        // Get settings for email
        const settings = await Settings.getSettings();

        if (!settings.mail?.isEnabled || !settings.mail?.email || !settings.mail?.password || !settings.mail?.host) {
            return Response.json(
                { success: false, message: "Email service is not configured" },
                { status: 400 }
            );
        }

        // Calculate cart total
        let totalValue = 0;
        const cartItems = cart.items.map(item => {
            const product = item.product;
            if (product) {
                const variant = product.variants?.find(v => {
                    const vAttrs = Object.fromEntries(v.attributes);
                    const cartAttrs = Object.fromEntries(item.variantAttributes);
                    return JSON.stringify(vAttrs) === JSON.stringify(cartAttrs);
                });
                const price = variant?.salePrice || variant?.regularPrice || 0;
                totalValue += price * item.quantity;
                return {
                    productName: product.name,
                    productImage: product.images?.[0],
                    variantAttributes: item.variantAttributes,
                    quantity: item.quantity,
                    price
                };
            }
            return null;
        }).filter(Boolean);

        const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'ESSVORA';

        // Send reminder email
        const result = await sendCartReminderEmail(
            cart.user.email,
            cart.user.name,
            cartItems,
            totalValue,
            settings.mail,
            siteName
        );

        if (!result.success) {
            return Response.json(
                { success: false, message: "Failed to send email: " + result.error },
                { status: 500 }
            );
        }

        // Update cart email tracking
        cart.emails_sent_count = (cart.emails_sent_count || 0) + 1;
        cart.last_email_sent_at = new Date();
        await cart.save();

        return Response.json({
            success: true,
            message: "Reminder email sent successfully",
            emails_sent_count: cart.emails_sent_count,
            last_email_sent_at: cart.last_email_sent_at
        });
    } catch (error) {
        console.error("Send cart reminder error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAdminProtection(getHandler);
export const POST = withAdminProtection(postHandler);
