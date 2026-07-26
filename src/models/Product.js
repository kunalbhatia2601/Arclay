import mongoose from 'mongoose';

// Defines the attribute types (e.g., Color, Size)
const VariationTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    options: [{
        type: String,
        trim: true
    }]
}, { _id: false });

// Each variant is a specific combination with its own price and stock
// e.g., { attributes: { Color: "Red", Size: "M" }, regularPrice: 200, stock: 10 }
const VariantSchema = new mongoose.Schema({
    attributes: {
        type: Map,
        of: String,
        required: true
    },
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
    stock: {
        type: Number,
        required: true,
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    sku: {
        type: String,
        trim: true,
        default: ''
    },
    // Scannable code printed on the shelf/product label. Assigned per variant
    // because each variant carries its own price.
    barcode: {
        type: String,
        trim: true,
        default: ''
    }
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
    description: {
        type: String,
        trim: true,
        maxlength: [10000, 'Description cannot be more than 10000 characters'],
        default: ''
    },
    long_description: {
        type: String,
        trim: true,
        maxlength: [100000, 'Description cannot be more than 100000 characters'],
        default: ''
    },
    subtitle: {
        type: String,
        trim: true,
        maxlength: 200,
        default: ''
    },
    spiceLevel: {
        type: Number,
        min: 1,
        max: 5,
        default: null
    },
    // Defines what variations exist (e.g., Color with Red/Blue/Green, Size with S/M/L)
    variationTypes: {
        type: [VariationTypeSchema],
        default: []
    },
    // Each variant is a specific combination with price and stock
    variants: {
        type: [VariantSchema],
        required: [true, 'At least one variant is required'],
        validate: {
            validator: function (v) {
                return v && v.length > 0;
            },
            message: 'Product must have at least one variant'
        }
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    barcode: {
        type: String,
        trim: true,
        default: ''
    },
    // GST percentage applied to this product. Whether the listed price already
    // contains it is a store-wide setting (Settings.store.priceIncludesTax).
    taxRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    // HSN/SAC code, required on a GST tax invoice
    hsn: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true
});

// Index for faster queries
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1, isActive: 1 });
// POS barcode lookups hit these on every scan.
ProductSchema.index({ 'variants.barcode': 1 });
ProductSchema.index({ barcode: 1 });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);


