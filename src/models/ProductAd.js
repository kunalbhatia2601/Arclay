import mongoose from 'mongoose';

const ProductAdSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [200, 'Title cannot be more than 200 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot be more than 500 characters'],
        default: ''
    },
    mediaUrl: {
        type: String,
        required: [true, 'Media URL is required']
    },
    mediaType: {
        type: String,
        enum: ['image', 'video'],
        default: 'image'
    },
    linkUrl: {
        type: String,
        trim: true,
        default: ''
    },
    position: {
        type: String,
        enum: ['hero', 'banner', 'popup'],
        default: 'banner'
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    startDate: {
        type: Date,
        default: null
    },
    endDate: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for efficient queries
ProductAdSchema.index({ isActive: 1, position: 1, order: 1 });
ProductAdSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.models.ProductAd || mongoose.model('ProductAd', ProductAdSchema);
