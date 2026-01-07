import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
    stars: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },
    comment: {
        type: String,
        required: [true, 'Comment is required'],
        trim: true,
        maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    isActive: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Unique compound index - one review per user per product
ReviewSchema.index({ user: 1, product: 1 }, { unique: true });
ReviewSchema.index({ product: 1, isActive: 1 });
ReviewSchema.index({ isActive: 1, stars: 1 });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
