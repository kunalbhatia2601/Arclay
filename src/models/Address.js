import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    label: {
        type: String,
        enum: ['Home', 'Office', 'Other'],
        default: 'Home'
    },
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Phone is required'],
        trim: true
    },
    addressLine1: {
        type: String,
        required: [true, 'Address line 1 is required'],
        trim: true
    },
    addressLine2: {
        type: String,
        trim: true,
        default: ''
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
    },
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true
    },
    pincode: {
        type: String,
        required: [true, 'Pincode is required'],
        trim: true
    },
    country: {
        type: String,
        default: 'India',
        trim: true
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Compound index for user and default address
AddressSchema.index({ user: 1, isDefault: 1 });

// Ensure only one default address per user
AddressSchema.pre('save', async function () {
    if (this.isDefault) {
        // Remove default from other addresses for this user
        await mongoose.models.Address.updateMany(
            { user: this.user, _id: { $ne: this._id } },
            { $set: { isDefault: false } }
        );
    }
});

export default mongoose.models.Address || mongoose.model('Address', AddressSchema);
