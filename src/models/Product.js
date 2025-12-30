import mongoose from 'mongoose';

const VariationOptionSchema = new mongoose.Schema({
    value: {
        type: String,
        required: true,
        trim: true
    },
    priceModifier: {
        type: Number,
        default: 0
    }
}, { _id: false });

const VariationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    options: [VariationOptionSchema]
}, { _id: false });

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [200, 'Name cannot be more than 200 characters']
    },
    images: [{
        type: String
    }],
    regularPrice: {
        type: Number,
        required: [true, 'Regular price is required'],
        min: [0, 'Price cannot be negative']
    },
    salePrice: {
        type: Number,
        min: [0, 'Sale price cannot be negative'],
        default: null
    },
    description: {
        type: String,
        trim: true,
        maxlength: [2000, 'Description cannot be more than 2000 characters'],
        default: ''
    },
    variations: [VariationSchema],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster queries
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1, isActive: 1 });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
