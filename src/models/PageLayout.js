import mongoose from 'mongoose';

/**
 * Layout of a storefront page: an ordered list of blocks per slot.
 *
 * Pages used to be hardcoded JSX, so changing the home page meant a deploy.
 * A layout document replaces that: each entry names a block type from the
 * registry plus its settings, and the renderer maps type -> component.
 *
 * Draft/published are kept as two separate slot trees on one document, so
 * editing never affects the live site until Publish is pressed.
 */

export const PAGE_KEYS = ['home', 'products', 'product-detail'];

// Slots each page exposes. `home` is a single free-form body; the other two
// have fixed anchors (the product grid, the buy box) that cannot be deleted,
// with injectable slots around them.
export const PAGE_SLOTS = {
    home: [
        { key: 'body', label: 'Page body', description: 'Everything on the home page, in order' },
    ],
    // Fully free, like home: the catalogue itself is a block ('product-listing'),
    // so its header, facets, columns and paging are all editable rather than
    // being fixed page furniture.
    products: [
        { key: 'body', label: 'Page body', description: 'Everything on the products page, in order' },
    ],
    // Also fully free: gallery, price, variants and buttons are each blocks,
    // positioned into the left/right columns via each block's `style.column`.
    'product-detail': [
        { key: 'body', label: 'Page body', description: 'Everything on the product page, in order' },
    ],
};

const SectionSchema = new mongoose.Schema({
    // Registry key, e.g. 'hero-slider'. Unknown types are skipped at render
    // time rather than throwing, so removing a block type cannot break a page.
    type: { type: String, required: true },
    enabled: { type: Boolean, default: true },

    // Block-specific values, validated against the registry's schema on save.
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Presentation wrapper applied by the renderer, not the block itself.
    style: {
        background: { type: String, default: '' },      // '' | 'surface' | 'alt' | 'warm' | custom colour
        paddingY: { type: String, default: 'normal' },  // none | tight | normal | loose
        fullWidth: { type: Boolean, default: false },
        // Product pages are two-column on desktop. Rather than a nested block
        // model, each block declares which column it belongs to and the
        // renderer groups consecutive left/right blocks into one split row.
        column: { type: String, enum: ['full', 'left', 'right'], default: 'full' },
    },

    // Conditional rendering. Evaluated server-side except for `devices`, which
    // is a CSS concern so both variants stay cacheable.
    visibility: {
        devices: { type: [String], default: ['mobile', 'desktop'] },
        from: { type: Date, default: null },
        to: { type: Date, default: null },
        auth: { type: String, enum: ['any', 'in', 'out'], default: 'any' },
    },
}, { _id: true });

const PageLayoutSchema = new mongoose.Schema({
    page: {
        type: String,
        required: true,
        unique: true,
        enum: PAGE_KEYS,
    },

    // slotKey -> [Section]. Mixed rather than a nested Map of arrays because
    // Mongoose Maps of DocumentArrays are awkward to update partially.
    draft: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    published: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },

    hasUnpublishedChanges: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Last few published trees, newest first, so a bad publish can be undone.
    history: {
        type: [{
            slots: mongoose.Schema.Types.Mixed,
            publishedAt: Date,
            publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            _id: false,
        }],
        default: [],
    },
}, { timestamps: true });

// Atomic get-or-create, so two concurrent editors cannot each insert a layout
// for the same page.
PageLayoutSchema.statics.getPage = async function (page) {
    return this.findOneAndUpdate(
        { page },
        { $setOnInsert: { page, draft: {}, published: {} } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
};

export const SECTION_SCHEMA = SectionSchema;

export default mongoose.models.PageLayout || mongoose.model('PageLayout', PageLayoutSchema);
