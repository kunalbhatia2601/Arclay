import mongoose from 'mongoose';

/**
 * Walk-in / counter customer. Kept separate from User because these people have
 * no login, no password and no email — they are identified by phone number.
 */
const CustomerSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: [true, 'Phone is required'],
        unique: true,
        trim: true
    },
    name: {
        type: String,
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters'],
        default: ''
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        default: ''
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
    },
    // Running totals so the counter can see a returning customer at a glance
    totalOrders: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    lastOrderAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

CustomerSchema.index({ name: 1 });

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
