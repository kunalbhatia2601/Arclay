import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
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
    }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
        type: String,
        enum: ['razorpay', 'stripe', 'cod'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentId: {
        type: String,
        default: ''
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
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
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ paymentStatus: 1 });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
