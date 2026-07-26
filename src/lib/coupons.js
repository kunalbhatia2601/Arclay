import Coupon from '@/models/Coupon';
import Order from '@/models/Order';

// Only orders that actually consumed the coupon count against usage limits.
// Unpaid online orders are excluded so an abandoned checkout does not burn a
// customer's allowance.
function consumedCouponQuery(buyer, couponId) {
    return {
        ...buyer,
        coupon: couponId,
        orderStatus: { $ne: 'cancelled' },
        $or: [
            { paymentMethod: 'cod' },
            { source: 'pos', paymentStatus: 'completed' },
            { paymentMethod: { $in: ['razorpay', 'stripe'] }, paymentStatus: 'completed' },
        ],
    };
}

function idOf(value) {
    if (!value) return '';
    return (value._id ? value._id : value).toString();
}

/**
 * Full server-side coupon validation. `cartItems` entries must expose a
 * populated `product` (with `category`), a `quantity`, and a unit price via
 * `priceAtOrder` or `variant.price`.
 *
 * The buyer is either a registered `userId` (web checkout) or a `customerId`
 * (POS counter customer). Per-user limits apply to whichever is given; a
 * walk-in with no phone on file gets no per-user restriction, because there is
 * nobody to attribute past usage to.
 *
 * Returns { valid: true } or { valid: false, message }.
 */
export async function validateCouponForCart({ coupon, userId, customerId, cartItems, cartTotal }) {
    if (!coupon || !coupon.isActive) {
        return { valid: false, message: 'Invalid or inactive coupon code' };
    }

    const buyer = userId ? { user: userId } : customerId ? { customer: customerId } : null;

    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
        return { valid: false, message: 'This coupon is not yet active' };
    }
    if (coupon.validUntil && now > coupon.validUntil) {
        return { valid: false, message: 'This coupon has expired' };
    }

    if (coupon.maxUsage !== null && coupon.usageCount >= coupon.maxUsage) {
        return { valid: false, message: 'This coupon has reached its usage limit' };
    }

    if (coupon.perUserLimit && buyer) {
        const used = await Order.countDocuments(consumedCouponQuery(buyer, coupon._id));
        if (used >= coupon.perUserLimit) {
            return {
                valid: false,
                message: `This coupon has already been used ${coupon.perUserLimit} time(s)`,
            };
        }
    }

    if (cartTotal < coupon.minPurchase) {
        return { valid: false, message: `Minimum purchase of ₹${coupon.minPurchase} required` };
    }

    if (coupon.firstPurchaseOnly && buyer) {
        const previousOrders = await Order.countDocuments({
            ...buyer,
            orderStatus: { $ne: 'cancelled' },
            $or: [
                { paymentMethod: 'cod' },
                { source: 'pos', paymentStatus: 'completed' },
                { paymentMethod: { $in: ['razorpay', 'stripe'] }, paymentStatus: 'completed' },
            ],
        });
        if (previousOrders > 0) {
            return { valid: false, message: 'This coupon is only for first-time customers' };
        }
    }

    const totalQty = (cartItems || []).reduce((sum, item) => sum + (item.quantity || 1), 0);

    if (coupon.discountType === 'buyXForY') {
        const requiredQty = coupon.buyXForY?.requiredQty || 0;
        if (requiredQty > 0 && totalQty < requiredQty) {
            return {
                valid: false,
                message: `Add ${requiredQty - totalQty} more item(s) to get this deal (need ${requiredQty} items)`,
            };
        }
    }

    if (coupon.discountType === 'buyXGetYFree') {
        const buyQty = coupon.buyXGetYFree?.buyQty || 0;
        const freeQty = coupon.buyXGetYFree?.freeQty || 0;
        const minRequired = buyQty + freeQty;
        if (minRequired > 0 && totalQty < minRequired) {
            return {
                valid: false,
                message: `Add ${minRequired - totalQty} more item(s) for Buy ${buyQty} Get ${freeQty} Free`,
            };
        }
    }

    if (coupon.discountType === 'tierPricing') {
        const tiers = coupon.quantityTiers || [];
        if (tiers.length > 0) {
            const lowestTier = tiers.reduce((min, t) => (t.minQty < min ? t.minQty : min), Infinity);
            if (totalQty < lowestTier) {
                return {
                    valid: false,
                    message: `Add ${lowestTier - totalQty} more item(s) to qualify for tier pricing`,
                };
            }
        }
    }

    if (coupon.applicableUsers?.length > 0) {
        // Restricted to named accounts, which a walk-in customer cannot satisfy
        if (!userId) {
            return { valid: false, message: 'This coupon is limited to specific accounts' };
        }
        const userIdStr = userId.toString();
        const applicable = coupon.applicableUsers.some((u) => idOf(u) === userIdStr);
        if (!applicable) {
            return { valid: false, message: 'This coupon is not available for your account' };
        }
    }

    const restrictedProducts = coupon.applicableProducts?.length > 0;
    const restrictedCategories = coupon.applicableCategories?.length > 0;

    if (restrictedProducts || restrictedCategories) {
        const hasEligibleItem = (cartItems || []).some((item) => {
            const productId = idOf(item.product?._id || item.product || item.productId);
            const categoryId = idOf(item.product?.category);

            const productMatch =
                restrictedProducts && coupon.applicableProducts.some((p) => idOf(p) === productId);
            const categoryMatch =
                restrictedCategories &&
                coupon.applicableCategories.some((c) => idOf(c) === categoryId);

            return productMatch || categoryMatch;
        });

        if (!hasEligibleItem) {
            return { valid: false, message: 'This coupon is not applicable to items in your cart' };
        }
    }

    return { valid: true };
}

/**
 * Atomically claim one use of a coupon. The maxUsage guard is part of the query
 * filter, so concurrent checkouts cannot push usageCount past the limit.
 * Returns true when the claim succeeded.
 */
export async function claimCouponUsage(couponId) {
    const claimed = await Coupon.findOneAndUpdate(
        {
            _id: couponId,
            isActive: true,
            $or: [
                { maxUsage: null },
                { $expr: { $lt: ['$usageCount', '$maxUsage'] } },
            ],
        },
        { $inc: { usageCount: 1 } },
        { new: true }
    );

    return !!claimed;
}

export async function releaseCouponUsage(couponId) {
    await Coupon.updateOne({ _id: couponId }, { $inc: { usageCount: -1 } });
}
