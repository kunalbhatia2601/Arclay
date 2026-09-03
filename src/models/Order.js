import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
    // Null only for a custom (off-catalog) POS line — see isCustom below.
    // A catalog line without a product would break restock and P/L silently,
    // so the two fields are validated against each other.
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        default: null,
        validate: {
            validator: function (value) {
                return this.isCustom || value != null;
            },
            message: 'Order item needs a product unless it is a custom line'
        }
    },
    // Rung up at the counter for something not in the catalog. Such a line has
    // no product, no variant and no stock behind it: nothing to reserve at sale
    // time and nothing to restock on a return. The name/price are whatever the
    // cashier typed, so these are listed for review in admin afterwards.
    isCustom: {
        type: Boolean,
        default: false
    },
    // Store variant details as they were at time of order
    variant: {
        attributes: {
            type: Map,
            of: String
        },
        price: {
            type: Number,
            required: true
        },
        sku: String
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    // Price at time of order (in case product price changes later)
    priceAtOrder: {
        type: Number,
        required: true
    },
    // Cost snapshot at sale time so P/L does not rewrite history if cost changes
    costAtOrder: {
        type: Number,
        default: null,
        min: 0
    },
    // Name captured at sale time so a renamed product does not rewrite history
    name: {
        type: String,
        default: ''
    },
    // Discount applied to this line only, before any bill-wide discount
    lineDiscount: {
        type: Number,
        default: 0,
        min: 0
    },
    // GST snapshot for this line
    taxRate: {
        type: Number,
        default: 0
    },
    taxAmount: {
        type: Number,
        default: 0
    },
    hsn: {
        type: String,
        default: ''
    },
    // Units sent back through a return
    returnedQuantity: {
        type: Number,
        default: 0,
        min: 0
    }
}, { _id: false });

const RefundSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    reason: {
        type: String,
        trim: true,
        maxlength: 300,
        default: ''
    },
    // Which lines came back, and how many of each
    items: [{
        itemIndex: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        _id: false
    }],
    restocked: {
        type: Boolean,
        default: true
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const OrderSchema = new mongoose.Schema({
    // Absent for POS walk-in sales, which have no account behind them.
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    source: {
        type: String,
        enum: ['web', 'pos'],
        default: 'web'
    },
    // Counter customer behind a POS sale, matched on phone number
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        default: null
    },
    items: {
        type: [OrderItemSchema],
        required: true,
        validate: {
            validator: function (v) {
                return v && v.length > 0;
            },
            message: 'Order must have at least one item'
        }
    },
    shippingAddress: {
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        addressLine1: {
            type: String,
            required: true,
            trim: true
        },
        addressLine2: {
            type: String,
            trim: true,
            default: ''
        },
        city: {
            type: String,
            required: true,
            trim: true
        },
        state: {
            type: String,
            required: true,
            trim: true
        },
        pincode: {
            type: String,
            required: true,
            trim: true
        },
        country: {
            type: String,
            required: true,
            default: 'India',
            trim: true
        }
    },
    paymentMethod: {
        // cash/card/upi are counter payments taken through the POS
        type: String,
        enum: ['razorpay', 'stripe', 'cod', 'cash', 'card', 'upi'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'],
        default: 'pending'
    },
    paymentId: {
        type: String,
        default: ''
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'partially_returned'],
        default: 'pending'
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    // Coupon tracking
    subtotal: {
        type: Number,
        default: 0
    },
    coupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        default: null
    },
    couponCode: {
        type: String,
        default: ''
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    // Sequential invoice serial, allocated once at sale time
    billNumber: {
        type: String,
        default: ''
    },
    // GST totals. Counter sales are intra-state, so tax splits evenly into
    // CGST and SGST; taxBreakup keeps the per-slab rows a tax invoice needs.
    taxAmount: {
        type: Number,
        default: 0
    },
    taxBreakup: [{
        rate: { type: Number, required: true },
        taxable: { type: Number, required: true },
        tax: { type: Number, required: true },
        _id: false
    }],
    // Sum of per-line discounts, kept apart from the bill-wide discountAmount
    lineDiscountTotal: {
        type: Number,
        default: 0
    },
    refunds: {
        type: [RefundSchema],
        default: []
    },
    refundedAmount: {
        type: Number,
        default: 0
    },
    notes: {
        type: String,
        default: '',
        maxlength: 500
    },
    shippingFee: {
        type: Number,
        default: 0
    },
    shipping: {
        shiprocketOrderId: {
            type: String,
            default: ''
        },
        shipmentId: {
            type: String,
            default: ''
        },
        awbCode: {
            type: String,
            default: ''
        },
        courierName: {
            type: String,
            default: ''
        },
        courierId: {
            type: Number,
            default: null
        },
        label: {
            type: String,
            default: ''
        },
        trackingUrl: {
            type: String,
            default: ''
        },
        estimatedDelivery: {
            type: Date,
            default: null
        },
        status: {
            type: String,
            default: ''
        },
        lastUpdate: {
            type: Date,
            default: null
        }
    }
}, {
    timestamps: true
});

// Indexes for faster queries
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ source: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ paymentStatus: 1 });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
