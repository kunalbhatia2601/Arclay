import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Coupon code is required'],
        unique: true,
        uppercase: true,
        trim: true,
        maxlength: [20, 'Coupon code cannot exceed 20 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [200, 'Description cannot exceed 200 characters'],
        default: ''
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed', 'buyXForY', 'buyXGetYFree', 'tierPricing'],
        required: [true, 'Discount type is required']
    },
    discountValue: {
        type: Number,
        default: 0,
        min: [0, 'Discount value must be positive']
    },

    // Buy X for Y configuration: Buy X items for a flat price
    buyXForY: {
        requiredQty: { type: Number, default: 0 },  // X - number of items required
        flatPrice: { type: Number, default: 0 }      // Y - flat price for those items
    },

    // Buy X Get Y Free configuration: Buy X items, get Y cheapest free
    buyXGetYFree: {
        buyQty: { type: Number, default: 0 },        // X - items to buy
        freeQty: { type: Number, default: 0 }        // Y - free items (cheapest)
    },

    // Quantity Tier Pricing: different discounts at different quantity levels
    quantityTiers: [{
        minQty: { type: Number, required: true },
        maxQty: { type: Number, default: null },     // null means unlimited
        discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
        discountValue: { type: Number, required: true }
    }],

    minPurchase: {
        type: Number,
        default: 0,
        min: 0
    },
    maxDiscount: {
        type: Number,
        default: null // null means no cap (for percentage discounts)
    },
    maxUsage: {
        type: Number,
        default: null // null means unlimited
    },
    usageCount: {
        type: Number,
        default: 0
    },
    perUserLimit: {
        type: Number,
        default: 1 // How many times a single user can use this coupon
    },
    validFrom: {
        type: Date,
        default: Date.now
    },
    validUntil: {
        type: Date,
        default: null // null means no expiry
    },
    // Restriction fields
    applicableCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    applicableProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    applicableUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    firstPurchaseOnly: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    showToUser: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
CouponSchema.index({ code: 1 });
CouponSchema.index({ isActive: 1, showToUser: 1 });

// Validate percentage discount (max 100%)
CouponSchema.pre('save', function () {
    if (this.discountType === 'percentage' && this.discountValue > 100) {
        this.discountValue = 100;
    }
});

// Method to calculate discount for a cart
CouponSchema.methods.calculateDiscount = function (cartItems, cartTotal) {
    // Calculate total quantity in cart
    const totalQty = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

    // Get all item prices for sorting (needed for free item calculation)
    const itemPrices = [];
    cartItems.forEach(item => {
        const price = item.priceAtOrder || item.variant?.price || item.price || 0;
        for (let i = 0; i < (item.quantity || 1); i++) {
            itemPrices.push(price);
        }
    });
    itemPrices.sort((a, b) => a - b); // Sort ascending (cheapest first)

    let discount = 0;

    // Handle different discount types
    switch (this.discountType) {
        case 'buyXForY': {
            // Buy X items for a flat price Y (cheapest items get the deal)
            const { requiredQty, flatPrice } = this.buyXForY || {};
            if (requiredQty && requiredQty > 0 && totalQty >= requiredQty) {
                // Calculate how many complete sets of X items
                const sets = Math.floor(totalQty / requiredQty);

                // Use cheapest items for the flat price sets (already sorted ascending)
                let originalPriceForSets = 0;
                for (let i = 0; i < sets * requiredQty; i++) {
                    originalPriceForSets += itemPrices[i] || 0;
                }

                // Discount = original price of cheapest items - (sets * flatPrice)
                discount = originalPriceForSets - (sets * flatPrice);
                discount = Math.max(0, discount); // Can't be negative
            }
            break;
        }

        case 'buyXGetYFree': {
            // Buy X items, get Y cheapest items free
            const { buyQty, freeQty } = this.buyXGetYFree || {};
            if (buyQty && freeQty && buyQty > 0 && freeQty > 0) {
                const setSize = buyQty + freeQty;
                if (totalQty >= setSize) {
                    // Calculate how many complete sets
                    const sets = Math.floor(totalQty / setSize);

                    // Free items are the cheapest ones (already sorted ascending)
                    const freeItemCount = sets * freeQty;
                    for (let i = 0; i < freeItemCount && i < itemPrices.length; i++) {
                        discount += itemPrices[i];
                    }
                }
            }
            break;
        }

        case 'tierPricing': {
            // Find the applicable tier based on quantity
            const tiers = this.quantityTiers || [];
            if (tiers.length > 0) {
                // Sort tiers by minQty descending to find highest applicable
                const sortedTiers = [...tiers].sort((a, b) => b.minQty - a.minQty);
                const applicableTier = sortedTiers.find(tier => {
                    const meetsMin = totalQty >= tier.minQty;
                    const meetsMax = tier.maxQty === null || totalQty <= tier.maxQty;
                    return meetsMin && meetsMax;
                });

                if (applicableTier) {
                    if (applicableTier.discountType === 'percentage') {
                        discount = (cartTotal * applicableTier.discountValue) / 100;
                    } else {
                        discount = Math.min(applicableTier.discountValue, cartTotal);
                    }
                }
            }
            break;
        }

        case 'percentage': {
            let eligibleTotal = cartTotal;

            // Check for product/category restrictions
            const hasProductRestriction = this.applicableProducts?.length > 0;
            const hasCategoryRestriction = this.applicableCategories?.length > 0;

            if (hasProductRestriction || hasCategoryRestriction) {
                eligibleTotal = cartItems.reduce((total, item) => {
                    const productId = (item.product?._id || item.product || item.productId || '').toString();
                    const categoryId = (item.product?.category?._id || item.product?.category || '').toString();

                    let productMatch = !hasProductRestriction;
                    if (hasProductRestriction) {
                        productMatch = this.applicableProducts.some(p => {
                            const pId = p._id ? p._id.toString() : p.toString();
                            return pId === productId;
                        });
                    }

                    let categoryMatch = !hasCategoryRestriction;
                    if (hasCategoryRestriction) {
                        categoryMatch = this.applicableCategories.some(c => {
                            const cId = c._id ? c._id.toString() : c.toString();
                            return cId === categoryId;
                        });
                    }

                    if (productMatch || categoryMatch) {
                        return total + (item.priceAtOrder || item.variant?.price || 0) * (item.quantity || 1);
                    }
                    return total;
                }, 0);
            }

            discount = (eligibleTotal * this.discountValue) / 100;
            if (this.maxDiscount && discount > this.maxDiscount) {
                discount = this.maxDiscount;
            }
            break;
        }

        case 'fixed':
        default: {
            let eligibleTotal = cartTotal;

            const hasProductRestriction = this.applicableProducts?.length > 0;
            const hasCategoryRestriction = this.applicableCategories?.length > 0;

            if (hasProductRestriction || hasCategoryRestriction) {
                eligibleTotal = cartItems.reduce((total, item) => {
                    const productId = (item.product?._id || item.product || item.productId || '').toString();
                    const categoryId = (item.product?.category?._id || item.product?.category || '').toString();

                    let productMatch = !hasProductRestriction;
                    if (hasProductRestriction) {
                        productMatch = this.applicableProducts.some(p => {
                            const pId = p._id ? p._id.toString() : p.toString();
                            return pId === productId;
                        });
                    }

                    let categoryMatch = !hasCategoryRestriction;
                    if (hasCategoryRestriction) {
                        categoryMatch = this.applicableCategories.some(c => {
                            const cId = c._id ? c._id.toString() : c.toString();
                            return cId === categoryId;
                        });
                    }

                    if (productMatch || categoryMatch) {
                        return total + (item.priceAtOrder || item.variant?.price || 0) * (item.quantity || 1);
                    }
                    return total;
                }, 0);
            }

            discount = Math.min(this.discountValue, eligibleTotal);
            break;
        }
    }

    return Math.round(discount * 100) / 100; // Round to 2 decimal places
};

export default mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);

