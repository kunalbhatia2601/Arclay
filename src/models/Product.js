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
    },
    // ─── Custom metadata ────────────────────────────────────────
    // Templates whose fields are applied to this product. The field
    // definitions live on the template, only the values live here, so editing
    // a template never requires touching product documents.
    metaTemplates: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MetaFieldTemplate'
    }],
    // One-off fields defined for this product alone, not from any template.
    // Same shape as a template field so both render through one code path.
    customMetaFields: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    // key -> value for every applied field, template or one-off.
    meta: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: () => new Map()
    },
    // Flattened mirror of `meta`, rebuilt on save. A Map cannot be indexed per
    // key without knowing keys ahead of time, but this array form is covered
    // by a single compound index no matter what fields the admin invents.
    // `n` holds a numeric cast so range queries work on numbers.
    metaIndex: {
        type: [{
            k: String,
            v: mongoose.Schema.Types.Mixed,
            n: Number,
            _id: false
        }],
        default: []
    },

    // ─── Denormalized fields ────────────────────────────────────
    // Prices live inside variants, so filtering/sorting by price used to
    // require pulling the whole catalogue into memory. These mirror the
    // variant range so Mongo can do it instead. Maintained in pre-save.
    minPrice: {
        type: Number,
        default: 0,
        index: true
    },
    maxPrice: {
        type: Number,
        default: 0
    },
    // True when any variant is discounted — lets "on sale" be a real query.
    hasSale: {
        type: Boolean,
        default: false
    },
    // Sum of stock across variants; drives inStockOnly filters.
    totalStock: {
        type: Number,
        default: 0
    },
    // Units sold, incremented when an order completes. Powers "bestselling"
    // sorting without aggregating the Orders collection on every page load.
    salesCount: {
        type: Number,
        default: 0,
        index: true
    }
}, {
    timestamps: true
});

// Keeps the denormalized mirrors in step with the variants they summarize.
export function syncDerivedFields(doc) {
    const variants = Array.isArray(doc.variants) ? doc.variants : [];
    const prices = variants
        .map(v => (v.salePrice != null && v.salePrice < v.regularPrice ? v.salePrice : v.regularPrice))
        .filter(p => typeof p === 'number' && !Number.isNaN(p));

    doc.minPrice = prices.length ? Math.min(...prices) : 0;
    doc.maxPrice = prices.length ? Math.max(...prices) : 0;
    doc.hasSale = variants.some(v => v.salePrice != null && v.salePrice < v.regularPrice);
    doc.totalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
}

// Flattens the `meta` Map into the queryable `metaIndex` array. Arrays (from
// multiselect) become one entry per value so an $elemMatch on any single value
// matches, which is what a facet filter needs.
export function buildMetaIndex(meta) {
    if (!meta) return [];

    const entries = meta instanceof Map ? [...meta.entries()] : Object.entries(meta);
    const rows = [];

    for (const [key, rawValue] of entries) {
        if (rawValue === null || rawValue === undefined || rawValue === '') continue;

        const values = Array.isArray(rawValue) ? rawValue : [rawValue];
        for (const value of values) {
            if (value === null || value === undefined || value === '') continue;
            // Objects (table rows, rich text) are stored but not made
            // queryable — there is no sensible scalar to match against.
            if (typeof value === 'object') continue;

            const numeric = Number(value);
            rows.push({
                k: key,
                v: value,
                n: Number.isFinite(numeric) ? numeric : undefined,
            });
        }
    }

    return rows;
}

// Mongoose 9 removed the `next` callback from middleware — hooks are sync or
// promise-returning, and signal failure by throwing.
ProductSchema.pre('save', function () {
    syncDerivedFields(this);
    this.metaIndex = buildMetaIndex(this.meta);
});

// findOneAndUpdate bypasses pre('save'), so recompute from the pending update
// whenever variants are being written through that path.
ProductSchema.pre('findOneAndUpdate', function () {
    const update = this.getUpdate() || {};
    const variants = update.variants ?? update.$set?.variants;
    if (!variants) return;

    const target = { variants };
    syncDerivedFields(target);

    this.setUpdate({
        ...update,
        $set: {
            ...(update.$set || {}),
            minPrice: target.minPrice,
            maxPrice: target.maxPrice,
            hasSale: target.hasSale,
            totalStock: target.totalStock
        }
    });
});

// Index for faster queries
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1, isActive: 1 });
// POS barcode lookups hit these on every scan.
ProductSchema.index({ 'variants.barcode': 1 });
ProductSchema.index({ barcode: 1 });
// Storefront listing: filter by active + category, sort by price or recency.
ProductSchema.index({ isActive: 1, minPrice: 1 });
ProductSchema.index({ isActive: 1, salesCount: -1 });
ProductSchema.index({ isActive: 1, createdAt: -1 });
// One index covers filtering on every custom metadata field, whatever the
// admin names them — the alternative would be creating an index per field.
ProductSchema.index({ 'metaIndex.k': 1, 'metaIndex.v': 1 });
ProductSchema.index({ 'metaIndex.k': 1, 'metaIndex.n': 1 });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);


