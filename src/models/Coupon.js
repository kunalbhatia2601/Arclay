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
        enum: ['percentage', 'fixed'],
        required: [true, 'Discount type is required']
    },
    discountValue: {
        type: Number,
        required: [true, 'Discount value is required'],
        min: [0, 'Discount value must be positive']
    },
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
    let eligibleTotal = cartTotal;

    // If restricted to specific products/categories, calculate eligible total
    const hasProductRestriction = this.applicableProducts && this.applicableProducts.length > 0;
    const hasCategoryRestriction = this.applicableCategories && this.applicableCategories.length > 0;

    if (hasProductRestriction || hasCategoryRestriction) {
        eligibleTotal = cartItems.reduce((total, item) => {
            const productId = (item.product?._id || item.product || item.productId || '').toString();
            const categoryId = (item.product?.category?._id || item.product?.category || '').toString();

            // Check product match
            let productMatch = !hasProductRestriction; // true if no restriction
            if (hasProductRestriction) {
                productMatch = this.applicableProducts.some(p => {
                    const pId = p._id ? p._id.toString() : p.toString();
                    return pId === productId;
                });
            }

            // Check category match
            let categoryMatch = !hasCategoryRestriction; // true if no restriction
            if (hasCategoryRestriction) {
                categoryMatch = this.applicableCategories.some(c => {
                    const cId = c._id ? c._id.toString() : c.toString();
                    return cId === categoryId;
                });
            }

            // Item is eligible if matches, add its value
            if (productMatch || categoryMatch) {
                return total + (item.priceAtOrder || item.variant?.price || 0) * (item.quantity || 1);
            }
            return total;
        }, 0);
    }

    let discount = 0;

    if (this.discountType === 'percentage') {
        discount = (eligibleTotal * this.discountValue) / 100;
        // Apply max discount cap if set
        if (this.maxDiscount && discount > this.maxDiscount) {
            discount = this.maxDiscount;
        }
    } else {
        // Fixed discount
        discount = Math.min(this.discountValue, eligibleTotal);
    }

    return Math.round(discount * 100) / 100; // Round to 2 decimal places
};

export default mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);
