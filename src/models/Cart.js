import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    // Reference to specific variant (stored as attributes map)
    variantAttributes: {
        type: Map,
        of: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    }
}, { _id: true });

const CartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: {
        type: [CartItemSchema],
        default: []
    },
    emails_sent_count: {
        type: Number,
        default: 0
    },
    last_email_sent_at: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for faster user lookups
CartSchema.index({ user: 1 });

export default mongoose.models.Cart || mongoose.model('Cart', CartSchema);
