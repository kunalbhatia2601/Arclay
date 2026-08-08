import mongoose from 'mongoose';

// Every field type the admin can put on a product. Adding a type here plus a
// renderer in the admin form and the storefront block is all it takes to
// support a new kind of product attribute.
export const META_FIELD_TYPES = [
    'text',
    'textarea',
    'richtext',
    'number',
    'boolean',
    'select',
    'multiselect',
    'date',
    'image',
    'url',
    'color',
    'table',
];

// Where a field shows up on the product detail page. 'hidden' keeps the value
// available for filtering and internal use without rendering it.
export const META_DISPLAY_TARGETS = ['specs-table', 'accordion', 'badge', 'inline', 'hidden'];

const MetaFieldSchema = new mongoose.Schema({
    // Stable identifier used as the key in Product.meta. Immutable once the
    // template is saved, because renaming it would orphan every stored value.
    key: {
        type: String,
        required: [true, 'Field key is required'],
        trim: true,
        match: [/^[a-z0-9_]+$/, 'Key may only contain lowercase letters, numbers and underscores'],
    },
    label: {
        type: String,
        required: [true, 'Field label is required'],
        trim: true,
    },
    type: {
        type: String,
        enum: META_FIELD_TYPES,
        default: 'text',
    },
    // select / multiselect choices
    options: {
        type: [String],
        default: [],
    },
    // Suffix rendered after a number, e.g. "months", "g", "cm"
    unit: {
        type: String,
        trim: true,
        default: '',
    },
    placeholder: { type: String, trim: true, default: '' },
    helpText: { type: String, trim: true, default: '' },
    defaultValue: { type: mongoose.Schema.Types.Mixed, default: null },
    required: { type: Boolean, default: false },

    // Groups fields into sections/tabs in the admin form and, optionally, on
    // the storefront (one accordion per group).
    group: { type: String, trim: true, default: 'Details' },
    order: { type: Number, default: 0 },

    display: {
        show: { type: Boolean, default: true },
        where: { type: String, enum: META_DISPLAY_TARGETS, default: 'specs-table' },
        icon: { type: String, trim: true, default: '' },
    },

    // Exposes this field as a facet on the products listing and makes it
    // usable inside a block's product query.
    filterable: { type: Boolean, default: false },
    searchable: { type: Boolean, default: false },
}, { _id: true });

const MetaFieldTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Template name is required'],
        trim: true,
        maxlength: 120,
    },
    description: { type: String, trim: true, default: '' },

    // When a product is assigned one of these categories the admin form
    // suggests this template automatically.
    appliesTo: {
        categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    },

    // Applied to every new product regardless of category.
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    fields: { type: [MetaFieldSchema], default: [] },
}, { timestamps: true });

MetaFieldTemplateSchema.index({ isActive: 1, isDefault: 1 });
MetaFieldTemplateSchema.index({ 'appliesTo.categories': 1 });

// Keys must be unique inside a template, otherwise two fields would write to
// the same slot in Product.meta and silently overwrite each other.
// Mongoose 9 removed the `next` callback from middleware — hooks are sync or
// promise-returning, and signal failure by throwing.
MetaFieldTemplateSchema.pre('validate', function () {
    const seen = new Set();
    for (const field of this.fields || []) {
        if (seen.has(field.key)) {
            throw new Error(`Duplicate field key "${field.key}" in template`);
        }
        seen.add(field.key);
    }
});

export default mongoose.models.MetaFieldTemplate ||
    mongoose.model('MetaFieldTemplate', MetaFieldTemplateSchema);
