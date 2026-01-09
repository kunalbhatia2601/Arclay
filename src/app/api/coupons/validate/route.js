import connectDB from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import Order from "@/models/Order";
import { withAuth } from "@/lib/auth";

// POST validate coupon and calculate discount
async function postHandler(req) {
    try {
        const { code, cartItems, cartTotal } = await req.json();
        const userId = req.user._id;

        if (!code) {
            return Response.json(
                { success: false, message: "Coupon code is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const coupon = await Coupon.findOne({
            code: code.toUpperCase(),
            isActive: true
        }).populate('applicableCategories applicableProducts applicableUsers');

        if (!coupon) {
            return Response.json(
                { success: false, message: "Invalid or inactive coupon code" },
                { status: 400 }
            );
        }

        console.log(coupon);

        // Check validity dates
        const now = new Date();
        if (coupon.validFrom && now < coupon.validFrom) {
            return Response.json(
                { success: false, message: "This coupon is not yet active" },
                { status: 400 }
            );
        }
        if (coupon.validUntil && now > coupon.validUntil) {
            return Response.json(
                { success: false, message: "This coupon has expired" },
                { status: 400 }
            );
        }

        // Check max usage
        if (coupon.maxUsage !== null && coupon.usageCount >= coupon.maxUsage) {
            return Response.json(
                { success: false, message: "This coupon has reached its usage limit" },
                { status: 400 }
            );
        }

        // Check per-user limit
        const userUsageCount = await Order.countDocuments({
            user: userId,
            coupon: coupon._id
        });
        if (coupon.perUserLimit && userUsageCount >= coupon.perUserLimit) {
            return Response.json(
                { success: false, message: `You have already used this coupon ${coupon.perUserLimit} time(s)` },
                { status: 400 }
            );
        }

        // Check minimum purchase
        if (cartTotal < coupon.minPurchase) {
            return Response.json(
                { success: false, message: `Minimum purchase of ₹${coupon.minPurchase} required` },
                { status: 400 }
            );
        }

        // Check first purchase only
        if (coupon.firstPurchaseOnly) {
            const previousOrders = await Order.countDocuments({ user: userId });
            if (previousOrders > 0) {
                return Response.json(
                    { success: false, message: "This coupon is only for first-time customers" },
                    { status: 400 }
                );
            }
        }

        // Calculate total quantity in cart
        const totalQty = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

        // Bundle-specific quantity validations
        if (coupon.discountType === 'buyXForY') {
            const requiredQty = coupon.buyXForY?.requiredQty || 0;
            if (requiredQty > 0 && totalQty < requiredQty) {
                return Response.json(
                    { success: false, message: `Add ${requiredQty - totalQty} more item(s) to get this deal (need ${requiredQty} items)` },
                    { status: 400 }
                );
            }
        }

        if (coupon.discountType === 'buyXGetYFree') {
            const buyQty = coupon.buyXGetYFree?.buyQty || 0;
            const freeQty = coupon.buyXGetYFree?.freeQty || 0;
            const minRequired = buyQty + freeQty;
            if (minRequired > 0 && totalQty < minRequired) {
                return Response.json(
                    { success: false, message: `Add ${minRequired - totalQty} more item(s) for Buy ${buyQty} Get ${freeQty} Free` },
                    { status: 400 }
                );
            }
        }

        if (coupon.discountType === 'tierPricing') {
            const tiers = coupon.quantityTiers || [];
            if (tiers.length > 0) {
                const lowestTier = tiers.reduce((min, t) => t.minQty < min ? t.minQty : min, Infinity);
                if (totalQty < lowestTier) {
                    return Response.json(
                        { success: false, message: `Add ${lowestTier - totalQty} more item(s) to qualify for tier pricing` },
                        { status: 400 }
                    );
                }
            }
        }

        // Check applicable users restriction
        if (coupon.applicableUsers && coupon.applicableUsers.length > 0) {
            const userIdStr = userId.toString();
            const isUserApplicable = coupon.applicableUsers.some(u => {
                // Handle both populated (object with _id) and non-populated (ObjectId) cases
                const uId = u._id ? u._id.toString() : u.toString();
                return uId === userIdStr;
            });
            if (!isUserApplicable) {
                return Response.json(
                    { success: false, message: "This coupon is not available for your account" },
                    { status: 400 }
                );
            }
        }

        // Check product/category restrictions
        if ((coupon.applicableProducts && coupon.applicableProducts.length > 0) ||
            (coupon.applicableCategories && coupon.applicableCategories.length > 0)) {

            const hasEligibleItem = cartItems.some(item => {
                const productId = (item.product?._id || item.productId || '').toString();
                const categoryId = (item.product?.category?._id || item.product?.category || '').toString();

                // Check product match
                let productMatch = false;
                if (!coupon.applicableProducts || coupon.applicableProducts.length === 0) {
                    productMatch = true; // No product restriction
                } else {
                    productMatch = coupon.applicableProducts.some(p => {
                        const pId = p._id ? p._id.toString() : p.toString();
                        return pId === productId;
                    });
                }

                // Check category match
                let categoryMatch = false;
                if (!coupon.applicableCategories || coupon.applicableCategories.length === 0) {
                    categoryMatch = true; // No category restriction
                } else {
                    categoryMatch = coupon.applicableCategories.some(c => {
                        const cId = c._id ? c._id.toString() : c.toString();
                        return cId === categoryId;
                    });
                }

                // Item is eligible if it matches product OR category restriction
                // But if both restrictions exist, we check if at least one matches
                if (coupon.applicableProducts?.length > 0 && coupon.applicableCategories?.length > 0) {
                    return productMatch || categoryMatch;
                } else if (coupon.applicableProducts?.length > 0) {
                    return productMatch;
                } else {
                    return categoryMatch;
                }
            });

            if (!hasEligibleItem) {
                return Response.json(
                    { success: false, message: "This coupon is not applicable to items in your cart" },
                    { status: 400 }
                );
            }
        }

        // Calculate discount
        const discountAmount = coupon.calculateDiscount(cartItems, cartTotal);
        const finalTotal = Math.max(0, cartTotal - discountAmount);

        return Response.json({
            success: true,
            coupon: {
                _id: coupon._id,
                code: coupon.code,
                description: coupon.description,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue
            },
            discountAmount,
            subtotal: cartTotal,
            finalTotal
        });
    } catch (error) {
        console.error("Validate coupon error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const POST = withAuth(postHandler);
