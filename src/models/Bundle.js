import mongoose from 'mongoose';

const BundleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Bundle title is required'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    btnTxt: {
        type: String,
        trim: true,
        default: 'View Bundle'
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster queries
BundleSchema.index({ slug: 1 });
BundleSchema.index({ isActive: 1 });

// Static method to generate slug from title
BundleSchema.statics.generateSlug = async function (title) {
    let slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    // Check if slug exists and make it unique
    const existingBundle = await this.findOne({ slug });
    if (existingBundle) {
        slug = `${slug}-${Date.now()}`;
    }

    return slug;
};

export default mongoose.models.Bundle || mongoose.model('Bundle', BundleSchema);
