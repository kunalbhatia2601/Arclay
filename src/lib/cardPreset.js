/**
 * Product card presets.
 *
 * The card appears in every product block, the catalogue and the related rail,
 * so its styling is defined once as a named preset rather than per block. A
 * block either uses the default preset or points at a named one.
 *
 * CARD_SCHEMA drives both the admin editor (via the same schema-driven form the
 * page builder uses) and the defaults, so adding an option means editing this
 * list only.
 */

export const CARD_SCHEMA = [
    // ── Shape ────────────────────────────────────────────────────
    {
        key: 'layout', label: 'Card layout', type: 'select', group: 'Shape', default: 'standard',
        options: [
            { value: 'standard', label: 'Image above details' },
            { value: 'overlay', label: 'Details over the image' },
            { value: 'minimal', label: 'Image and name only' },
            { value: 'horizontal', label: 'Image beside details' },
        ],
    },
    {
        key: 'imageAspect', label: 'Image shape', type: 'select', group: 'Shape', default: 'square',
        options: [
            { value: 'square', label: 'Square' },
            { value: 'portrait', label: 'Portrait (3:4)' },
            { value: 'landscape', label: 'Landscape (4:3)' },
            { value: 'tall', label: 'Tall (2:3)' },
        ],
    },
    {
        key: 'imageFit', label: 'Image fit', type: 'select', group: 'Shape', default: 'cover',
        options: [
            { value: 'cover', label: 'Fill the frame (crop)' },
            { value: 'contain', label: 'Fit inside (no crop)' },
        ],
    },
    {
        key: 'radius', label: 'Corner radius', type: 'select', group: 'Shape', default: 'lg',
        options: [
            { value: 'none', label: 'Square corners' },
            { value: 'sm', label: 'Small' },
            { value: 'lg', label: 'Large' },
            { value: 'xl', label: 'Extra large' },
        ],
    },
    { key: 'border', label: 'Show border', type: 'boolean', group: 'Shape', default: true },
    {
        key: 'shadow', label: 'Shadow', type: 'select', group: 'Shape', default: 'soft',
        options: [
            { value: 'none', label: 'None' },
            { value: 'soft', label: 'Soft' },
            { value: 'strong', label: 'Strong' },
        ],
    },
    {
        key: 'hover', label: 'Hover effect', type: 'select', group: 'Shape', default: 'lift',
        options: [
            { value: 'none', label: 'None' },
            { value: 'lift', label: 'Lift the card' },
            { value: 'zoom', label: 'Zoom the image' },
            { value: 'swap', label: 'Show the second image' },
        ],
    },
    {
        key: 'textAlign', label: 'Text alignment', type: 'select', group: 'Shape', default: 'left',
        options: [
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center' },
        ],
    },

    // ── Content ──────────────────────────────────────────────────
    { key: 'showCategory', label: 'Show category', type: 'boolean', group: 'Content', default: true },
    { key: 'showName', label: 'Show product name', type: 'boolean', group: 'Content', default: true },
    {
        key: 'nameLines', label: 'Name lines before truncating', type: 'number',
        group: 'Content', default: 2, min: 1, max: 4,
    },
    { key: 'showPrice', label: 'Show price', type: 'boolean', group: 'Content', default: true },
    { key: 'showMrp', label: 'Show MRP struck through', type: 'boolean', group: 'Content', default: true },
    { key: 'showRating', label: 'Show rating', type: 'boolean', group: 'Content', default: false },
    {
        key: 'showVariantDots', label: 'Show variant thumbnails', type: 'boolean',
        group: 'Content', default: true,
    },
    {
        key: 'metaKey', label: 'Extra field to show', type: 'productField', group: 'Content',
        hint: 'Any product or custom field, shown under the name',
    },

    // ── Badges ───────────────────────────────────────────────────
    { key: 'showDiscountBadge', label: 'Discount badge', type: 'boolean', group: 'Badges', default: true },
    { key: 'showNewBadge', label: '“New” badge', type: 'boolean', group: 'Badges', default: true },
    {
        key: 'newWithinDays', label: 'Counts as new for (days)', type: 'number',
        group: 'Badges', default: 14, min: 1, max: 365,
    },
    { key: 'showFeaturedBadge', label: '“Hot” badge on featured', type: 'boolean', group: 'Badges', default: true },
    { key: 'showSoldOutBadge', label: '“Sold out” badge', type: 'boolean', group: 'Badges', default: true },
    { key: 'featuredLabel', label: 'Featured label', type: 'text', group: 'Badges', default: 'HOT' },
    { key: 'newLabel', label: 'New label', type: 'text', group: 'Badges', default: 'NEW' },
    { key: 'soldOutLabel', label: 'Sold out label', type: 'text', group: 'Badges', default: 'SOLD OUT' },

    // ── Actions ──────────────────────────────────────────────────
    {
        key: 'quickAdd', label: 'Quick add button', type: 'select', group: 'Actions', default: 'icon',
        options: [
            { value: 'none', label: 'Hidden' },
            { value: 'icon', label: 'Round icon button' },
            { value: 'full', label: 'Full-width button' },
            { value: 'hover', label: 'Appears on hover' },
        ],
    },
    { key: 'quickAddLabel', label: 'Quick add label', type: 'text', group: 'Actions', default: 'Add to Cart' },
    { key: 'showWishlist', label: 'Show wishlist heart', type: 'boolean', group: 'Actions', default: true },
    { key: 'showShare', label: 'Show share button', type: 'boolean', group: 'Actions', default: false },
];

export const DEFAULT_CARD = Object.fromEntries(
    CARD_SCHEMA.map(field => [
        field.key,
        field.default !== undefined ? field.default : (field.type === 'boolean' ? false : ''),
    ])
);

// Groups for the admin editor, in schema order.
export const CARD_GROUPS = [...new Set(CARD_SCHEMA.map(f => f.group))];

/** Fills in any option the stored preset does not define. */
export function resolveCardPreset(stored) {
    if (!stored) return { ...DEFAULT_CARD };

    const settings = stored.settings || stored;
    const resolved = { ...DEFAULT_CARD };

    for (const field of CARD_SCHEMA) {
        if (settings[field.key] !== undefined && settings[field.key] !== null) {
            resolved[field.key] = settings[field.key];
        }
    }
    return resolved;
}
