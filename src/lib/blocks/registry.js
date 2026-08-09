/**
 * Block registry — the single source of truth for what can go on a page.
 *
 * Each entry declares its editable fields as a `schema`. The admin builder
 * generates its settings form from that schema, so adding a new block type
 * means adding one entry here plus one component — no admin UI work.
 *
 * This module is import-safe on the client: it holds only metadata, never the
 * block components themselves (those are resolved separately by the renderer,
 * which is server-side).
 */

// Field types the builder knows how to render.
export const FIELD_TYPES = [
    'text', 'textarea', 'richtext', 'number', 'boolean', 'select',
    'color', 'image', 'link', 'productQuery', 'repeater', 'icon', 'html', 'datetime',
];

const f = {
    text: (key, label, extra = {}) => ({ key, label, type: 'text', ...extra }),
    textarea: (key, label, extra = {}) => ({ key, label, type: 'textarea', ...extra }),
    number: (key, label, extra = {}) => ({ key, label, type: 'number', ...extra }),
    boolean: (key, label, extra = {}) => ({ key, label, type: 'boolean', ...extra }),
    select: (key, label, options, extra = {}) => ({ key, label, type: 'select', options, ...extra }),
    image: (key, label, extra = {}) => ({ key, label, type: 'image', ...extra }),
    link: (key, label, extra = {}) => ({ key, label, type: 'link', ...extra }),
    color: (key, label, extra = {}) => ({ key, label, type: 'color', ...extra }),
    query: (key, label, extra = {}) => ({ key, label, type: 'productQuery', ...extra }),
    cardPreset: (key = 'cardPreset', label = 'Card style') => ({ key, label, type: 'cardPreset' }),
    repeater: (key, label, fields, extra = {}) => ({ key, label, type: 'repeater', fields, ...extra }),
    html: (key, label, extra = {}) => ({ key, label, type: 'html', ...extra }),
};

export const BLOCK_GROUPS = ['Hero', 'Products', 'Product page', 'Content', 'Merchandising', 'Social proof', 'Advanced'];

// Blocks that read the product being viewed, so they are only offered on the
// product detail page.
export const PDP_ONLY_PREFIX = 'pdp-';

export const BLOCKS = {
    // ── Hero ─────────────────────────────────────────────────────
    'hero-slider': {
        label: 'Hero slider',
        group: 'Hero',
        icon: 'Images',
        description: 'Full-width rotating banners, pulled from Product Ads',
        schema: [
            f.select('position', 'Banner source', [
                { value: 'hero', label: 'Hero banners' },
                { value: 'banner', label: 'Secondary banners' },
            ], { default: 'hero' }),
            f.number('interval', 'Seconds per slide', { default: 6, min: 2, max: 30 }),
            f.text('badgeText', 'Badge text', { default: 'Featured' }),
            f.text('primaryLabel', 'Primary button', { default: 'Shop Now' }),
            f.link('primaryHref', 'Primary link', { default: '/products' }),
            f.text('secondaryLabel', 'Secondary button', { default: '' }),
            f.link('secondaryHref', 'Secondary link', { default: '' }),
            f.select('height', 'Height', [
                { value: 'compact', label: 'Compact' },
                { value: 'normal', label: 'Normal' },
                { value: 'tall', label: 'Tall' },
            ], { default: 'normal' }),
        ],
    },

    'banner': {
        label: 'Static banner',
        group: 'Hero',
        icon: 'Image',
        description: 'One image with a heading and button',
        schema: [
            f.image('image', 'Background image'),
            f.text('eyebrow', 'Eyebrow text'),
            f.text('heading', 'Heading', { default: 'Your heading here' }),
            f.textarea('body', 'Body text'),
            f.text('buttonLabel', 'Button label'),
            f.link('buttonHref', 'Button link'),
            f.select('align', 'Text alignment', [
                { value: 'left', label: 'Left' },
                { value: 'center', label: 'Center' },
                { value: 'right', label: 'Right' },
            ], { default: 'left' }),
            f.boolean('overlay', 'Darken image', { default: true }),
        ],
    },

    // ── Products ─────────────────────────────────────────────────
    'product-grid': {
        label: 'Product grid',
        group: 'Products',
        icon: 'LayoutGrid',
        description: 'A grid of products from any filter or hand-picked list',
        schema: [
            f.text('title', 'Section title', { default: 'Products' }),
            f.text('subtitle', 'Eyebrow / subtitle'),
            f.query('query', 'Which products'),
            f.cardPreset(),
            f.select('columns', 'Columns (desktop)', [
                { value: '2', label: '2' }, { value: '3', label: '3' },
                { value: '4', label: '4' }, { value: '5', label: '5' },
            ], { default: '4' }),
            f.boolean('showViewAll', 'Show “View all” link', { default: true }),
            f.link('viewAllHref', 'View all link', { default: '/products' }),
        ],
    },

    'product-rail': {
        label: 'Product carousel',
        group: 'Products',
        icon: 'GalleryHorizontal',
        description: 'Horizontally scrolling row of products',
        schema: [
            f.text('title', 'Section title', { default: 'Featured' }),
            f.text('subtitle', 'Eyebrow / subtitle'),
            f.query('query', 'Which products'),
            f.cardPreset(),
            f.boolean('showViewAll', 'Show “View all” link', { default: true }),
            f.link('viewAllHref', 'View all link', { default: '/products' }),
        ],
    },

    'product-listing': {
        label: 'Product catalogue',
        group: 'Products',
        icon: 'LayoutList',
        description: 'Full browsable catalogue with filters, sorting and paging',
        schema: [
            f.text('title', 'Page title', { default: 'All Products' }),
            f.text('subtitle', 'Subtitle', {
                default: '{count} products found',
                hint: 'Use {count} to insert the number of matches',
            }),
            f.select('layout', 'Filter placement', [
                { value: 'sidebar-left', label: 'Sidebar on the left' },
                { value: 'sidebar-right', label: 'Sidebar on the right' },
                { value: 'top', label: 'Across the top' },
                { value: 'none', label: 'No filters' },
            ], { default: 'sidebar-left' }),
            f.select('columns', 'Columns (desktop)', [
                { value: '2', label: '2' }, { value: '3', label: '3' },
                { value: '4', label: '4' }, { value: '5', label: '5' },
            ], { default: '4' }),
            f.number('pageSize', 'Products per page', { default: 12, min: 1, max: 48 }),
            f.cardPreset(),

            f.boolean('showSearch', 'Show search box', { default: true }),
            f.boolean('showSort', 'Show sort dropdown', { default: true }),
            f.boolean('showViewToggle', 'Show grid/list toggle', { default: true }),
            f.boolean('showCategories', 'Show category filter', { default: true }),
            f.boolean('showPrice', 'Show price filter', { default: true }),
            f.number('priceCeiling', 'Price slider maximum', { default: 5000, min: 100 }),
            f.boolean('showMetaFacets', 'Show custom field filters', {
                default: true,
                hint: 'Any product field marked "filterable" becomes a facet',
            }),

            // Restricting the catalogue turns this block into a collection page.
            f.query('restrictTo', 'Limit to these products'),

            f.select('defaultSort', 'Default sort', [
                { value: "popular", label: "Most popular" },
                { value: "newest", label: "Newest first" },
                { value: "price-low", label: "Price: low to high" },
                { value: "price-high", label: "Price: high to low" },
                { value: "name-asc", label: "Name: A–Z" },
            ], { default: 'popular' }),

            f.text('emptyTitle', 'Empty state title', { default: 'No Products Found' }),
            f.text('emptyText', 'Empty state message', {
                default: "We couldn't find any items matching your criteria.",
            }),
        ],
    },

    'category-grid': {
        label: 'Category grid',
        group: 'Products',
        icon: 'Grid3x3',
        description: 'Browsable category tiles',
        schema: [
            f.text('title', 'Section title', { default: 'Shop by category' }),
            f.text('subtitle', 'Eyebrow / subtitle'),
            f.number('limit', 'How many', { default: 6, min: 1, max: 24 }),
            f.select('shape', 'Tile shape', [
                { value: 'circle', label: 'Circle' },
                { value: 'square', label: 'Square' },
                { value: 'wide', label: 'Wide card' },
            ], { default: 'square' }),
        ],
    },

    // ── Content ──────────────────────────────────────────────────
    'rich-text': {
        label: 'Text block',
        group: 'Content',
        icon: 'Type',
        description: 'Heading and formatted text',
        schema: [
            f.text('eyebrow', 'Eyebrow text'),
            f.text('heading', 'Heading'),
            { key: 'body', label: 'Body', type: 'richtext' },
            f.select('align', 'Alignment', [
                { value: 'left', label: 'Left' },
                { value: 'center', label: 'Center' },
            ], { default: 'center' }),
            f.text('buttonLabel', 'Button label'),
            f.link('buttonHref', 'Button link'),
        ],
    },

    'image-text': {
        label: 'Image + text',
        group: 'Content',
        icon: 'Columns2',
        description: 'Side-by-side image and copy',
        schema: [
            f.image('image', 'Image'),
            f.image('insetImage', 'Inset image (optional)'),
            f.select('imageSide', 'Image side', [
                { value: 'left', label: 'Left' },
                { value: 'right', label: 'Right' },
            ], { default: 'left' }),
            f.text('eyebrow', 'Eyebrow text'),
            f.text('heading', 'Heading'),
            { key: 'body', label: 'Body', type: 'richtext' },
            f.repeater('stats', 'Stats', [
                f.text('value', 'Value'),
                f.text('label', 'Label'),
            ]),
            f.text('buttonLabel', 'Button label'),
            f.link('buttonHref', 'Button link'),
        ],
    },

    'usp-row': {
        label: 'Trust badges',
        group: 'Content',
        icon: 'BadgeCheck',
        description: 'Row of icons with short claims',
        schema: [
            f.repeater('items', 'Badges', [
                { key: 'icon', label: 'Icon', type: 'icon' },
                f.text('title', 'Title'),
                f.text('subtitle', 'Subtitle'),
            ]),
        ],
    },

    // ── Merchandising ────────────────────────────────────────────
    'marquee': {
        label: 'Scrolling marquee',
        group: 'Merchandising',
        icon: 'Megaphone',
        description: 'Continuously scrolling text strip',
        schema: [
            f.repeater('items', 'Messages', [f.text('text', 'Text')]),
            f.select('speed', 'Speed', [
                { value: 'slow', label: 'Slow' },
                { value: 'normal', label: 'Normal' },
                { value: 'fast', label: 'Fast' },
            ], { default: 'normal' }),
            f.select('direction', 'Direction', [
                { value: 'left', label: 'Right to left' },
                { value: 'right', label: 'Left to right' },
            ], { default: 'left' }),
            f.color('bg', 'Background', { default: '' }),
            f.color('fg', 'Text colour', { default: '' }),
        ],
    },

    'promo-strip': {
        label: 'Promo strip',
        group: 'Merchandising',
        icon: 'Ticket',
        description: 'Compact offer bar with a coupon code',
        schema: [
            f.text('heading', 'Heading', { default: 'Flat 15% off your first order' }),
            f.text('code', 'Coupon code'),
            f.text('buttonLabel', 'Button label', { default: 'Shop now' }),
            f.link('buttonHref', 'Button link', { default: '/products' }),
            f.image('image', 'Side image (optional)'),
        ],
    },

    'countdown': {
        label: 'Countdown timer',
        group: 'Merchandising',
        icon: 'Timer',
        description: 'Urgency timer counting to a date',
        schema: [
            f.text('heading', 'Heading', { default: 'Sale ends in' }),
            { key: 'endsAt', label: 'Ends at', type: 'datetime' },
            f.text('buttonLabel', 'Button label'),
            f.link('buttonHref', 'Button link'),
            f.boolean('hideWhenExpired', 'Hide block once expired', { default: true }),
        ],
    },

    // ── Social proof ─────────────────────────────────────────────
    'testimonials': {
        label: 'Testimonials',
        group: 'Social proof',
        icon: 'Quote',
        description: 'Customer quotes',
        schema: [
            f.text('title', 'Section title', { default: 'What our customers say' }),
            f.repeater('items', 'Quotes', [
                f.textarea('quote', 'Quote'),
                f.text('author', 'Author'),
                f.text('meta', 'Location / detail'),
                f.number('stars', 'Stars', { default: 5, min: 1, max: 5 }),
                f.image('avatar', 'Avatar'),
            ]),
        ],
    },

    'blog-rail': {
        label: 'Blog posts',
        group: 'Social proof',
        icon: 'Newspaper',
        description: 'Latest posts from the blog',
        schema: [
            f.text('title', 'Section title', { default: 'From the journal' }),
            f.number('limit', 'How many', { default: 3, min: 1, max: 12 }),
        ],
    },

    // ── Product page ─────────────────────────────────────────────
    // These read the product being viewed, so they only make sense on the
    // product detail page.
    'pdp-gallery': {
        label: 'Product images',
        group: 'Product page',
        icon: 'Images',
        description: 'Main image with thumbnails',
        schema: [
            f.select('thumbnails', 'Thumbnails', [
                { value: 'left', label: 'Beside the image' },
                { value: 'bottom', label: 'Under the image' },
                { value: 'none', label: 'Hidden' },
            ], { default: 'left' }),
            f.select('aspect', 'Image shape', [
                { value: 'square', label: 'Square' },
                { value: 'landscape', label: 'Landscape' },
                { value: 'portrait', label: 'Portrait' },
            ], { default: 'square' }),
            f.boolean('showDiscountBadge', 'Show discount badge', { default: true }),
        ],
    },

    'pdp-title': {
        label: 'Product title',
        group: 'Product page',
        icon: 'Heading1',
        description: 'Name, category chip and rating',
        schema: [
            f.boolean('showCategory', 'Show category chip', { default: true }),
            f.boolean('showRating', 'Show rating', { default: true }),
            f.boolean('showSubtitle', 'Show subtitle', { default: true }),
        ],
    },

    'pdp-price': {
        label: 'Price',
        group: 'Product page',
        icon: 'IndianRupee',
        description: 'Live price for the selected variant',
        schema: [
            f.select('size', 'Size', [
                { value: 'small', label: 'Small' },
                { value: 'normal', label: 'Normal' },
                { value: 'large', label: 'Large' },
            ], { default: 'large' }),
            f.boolean('showOriginal', 'Show MRP struck through', { default: true }),
            f.boolean('showSaving', 'Show savings badge', { default: true }),
            f.select('savingStyle', 'Savings shown as', [
                { value: 'amount', label: 'Amount saved' },
                { value: 'percent', label: 'Percentage off' },
            ], { default: 'amount' }),
            f.text('taxNote', 'Small print', { placeholder: 'Inclusive of all taxes' }),
        ],
    },

    'pdp-variants': {
        label: 'Variant picker',
        group: 'Product page',
        icon: 'Blocks',
        description: 'Size/colour options in several styles',
        schema: [
            f.select('style', 'Style', [
                { value: 'pills', label: 'Pills' },
                { value: 'boxes', label: 'Boxes' },
                { value: 'swatches', label: 'Colour swatches' },
                { value: 'dropdown', label: 'Dropdown' },
            ], { default: 'pills' }),
            f.boolean('showLabels', 'Show option name', { default: true }),
            f.boolean('showSelectedValue', 'Show selected value beside name', { default: true }),
        ],
    },

    'pdp-stock': {
        label: 'Stock status',
        group: 'Product page',
        icon: 'PackageCheck',
        description: 'In stock / low stock / sold out label',
        schema: [
            f.select('style', 'Style', [
                { value: 'badge', label: 'Badge' },
                { value: 'text', label: 'Plain text' },
                { value: 'bar', label: 'Progress bar' },
            ], { default: 'badge' }),
            f.boolean('showCount', 'Show units left', { default: true }),
            f.number('lowStockThreshold', 'Low stock below', { default: 10, min: 1 }),
            f.text('inStockLabel', 'In stock label', { default: 'In stock' }),
            f.text('lowStockLabel', 'Low stock label', { default: 'Only {n} left', hint: '{n} = units remaining' }),
            f.text('outOfStockLabel', 'Sold out label', { default: 'Out of stock' }),
        ],
    },

    'pdp-quantity': {
        label: 'Quantity picker',
        group: 'Product page',
        icon: 'Hash',
        description: 'Plus/minus quantity selector',
        schema: [
            f.boolean('showLabel', 'Show label', { default: true }),
            f.text('label', 'Label', { default: 'Quantity' }),
        ],
    },

    'pdp-actions': {
        label: 'Buy buttons',
        group: 'Product page',
        icon: 'ShoppingCart',
        description: 'Add to cart and buy now',
        schema: [
            f.boolean('showAddToCart', 'Show “Add to cart”', { default: true }),
            f.text('addToCartLabel', 'Add to cart label', { default: 'Add to Cart' }),
            f.select('cartVariant', 'Add to cart style', [
                { value: 'solid', label: 'Solid' },
                { value: 'outline', label: 'Outline' },
            ], { default: 'solid' }),
            f.boolean('showBuyNow', 'Show “Buy now”', { default: true }),
            f.text('buyNowLabel', 'Buy now label', { default: 'Buy Now' }),
            f.select('buyVariant', 'Buy now style', [
                { value: 'solid', label: 'Solid' },
                { value: 'outline', label: 'Outline' },
            ], { default: 'solid' }),
            f.select('size', 'Button size', [
                { value: 'normal', label: 'Normal' },
                { value: 'large', label: 'Large' },
            ], { default: 'large' }),
            f.select('shape', 'Button shape', [
                { value: 'rounded', label: 'Rounded' },
                { value: 'pill', label: 'Pill' },
            ], { default: 'rounded' }),
            f.boolean('stack', 'Stack vertically', { default: false }),
            f.boolean('fullWidth', 'Stretch to full width', { default: true }),
            f.text('outOfStockNote', 'Sold-out message', { default: 'This option is currently unavailable.' }),
        ],
    },

    'pdp-delivery': {
        label: 'Delivery check',
        group: 'Product page',
        icon: 'Truck',
        description: 'Pincode serviceability lookup',
        schema: [
            f.text('title', 'Title', { default: 'Check Delivery' }),
            f.text('placeholder', 'Input placeholder', { default: 'Enter 6-digit pincode' }),
            f.text('buttonLabel', 'Button label', { default: 'Check' }),
            f.text('successMessage', 'Success message', { default: 'Delivery available to {pincode}' }),
            f.text('failMessage', 'Failure message', { default: 'We do not deliver here yet' }),
        ],
    },

    'pdp-fields': {
        label: 'Product info cards',
        group: 'Product page',
        icon: 'LayoutPanelTop',
        description: 'Show any product value — stock, SKU, GST, custom fields — as cards or rows',
        schema: [
            f.select('style', 'Style', [
                { value: 'cards', label: 'Cards' },
                { value: 'list', label: 'Label/value rows' },
                { value: 'inline', label: 'Inline text' },
            ], { default: 'cards' }),
            f.select('columns', 'Columns', [
                { value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' },
            ], { default: '3' }),
            f.repeater('items', 'Values to show', [
                { key: 'source', label: 'Product value', type: 'productField' },
                f.text('label', 'Custom label', { hint: 'Leave blank to use the field name' }),
                f.text('value', 'Static override', { hint: 'Leave blank to use the product value' }),
                { key: 'icon', label: 'Icon', type: 'icon' },
            ]),
        ],
    },

    'pdp-description': {
        label: 'Description',
        group: 'Product page',
        icon: 'FileText',
        description: "The product's own description text",
        schema: [
            f.text('title', 'Heading', { default: 'Description' }),
            f.select('source', 'Which text', [
                { value: 'long', label: 'Full description' },
                { value: 'short', label: 'Short description' },
            ], { default: 'long' }),
        ],
    },

    'pdp-specs': {
        label: 'Specifications',
        group: 'Product page',
        icon: 'Table2',
        description: 'Table built from the custom fields on this product',
        schema: [
            f.text('title', 'Heading', { default: 'Specifications' }),
            f.text('keys', 'Only these fields', {
                hint: 'Comma-separated field keys. Leave blank to show everything marked for the specs table.',
            }),
        ],
    },

    'pdp-reviews': {
        label: 'Reviews',
        group: 'Product page',
        icon: 'MessageSquare',
        description: 'Customer reviews for this product',
        schema: [
            f.text('title', 'Heading', { default: 'Customer Reviews' }),
            f.number('limit', 'How many to show', { default: 5, min: 1, max: 50 }),
            f.text('emptyText', 'Empty message', { default: 'Be the first to share your experience.' }),
        ],
    },

    'pdp-related': {
        label: 'Related products',
        group: 'Product page',
        icon: 'Boxes',
        description: 'Other products in the same category',
        schema: [
            f.text('title', 'Heading', { default: 'You may also like' }),
            f.number('limit', 'How many', { default: 4, min: 1, max: 12 }),
        ],
    },


    // ── Storefront (quick-commerce style) ────────────────────────
    'search-bar': {
        label: 'Search bar',
        group: 'Merchandising',
        icon: 'Search',
        description: 'Prominent search field with an optional scan button',
        schema: [
            f.text('placeholder', 'Placeholder', { default: 'Search for products, brands and more...' }),
            f.boolean('showScanner', 'Show scan button', { default: true }),
            f.link('scannerHref', 'Scan button link', { default: '/products' }),
        ],
    },

    'promo-hero': {
        label: 'Gradient promo hero',
        group: 'Hero',
        icon: 'Sparkles',
        description: 'Full-bleed promo slides with headline, feature pills and a button',
        schema: [
            f.repeater('slides', 'Slides', [
                f.text('headingTop', 'First line'),
                f.text('headingMain', 'Second line'),
                f.text('headingAccent', 'Highlighted line'),
                f.color('accentColor', 'Highlight colour', { default: '#FFE071' }),
                f.image('image', 'Background image'),
                f.color('gradientFrom', 'Gradient start', { default: '' }),
                f.color('gradientTo', 'Gradient end', { default: '' }),
                f.repeater('features', 'Feature pills', [
                    { key: 'icon', label: 'Icon', type: 'icon' },
                    f.text('label', 'Label'),
                ]),
                f.text('buttonLabel', 'Button label', { default: 'Shop Now' }),
                f.link('buttonHref', 'Button link', { default: '/products' }),
            ]),
            f.number('interval', 'Seconds per slide', { default: 5, min: 2, max: 30 }),
            f.select('height', 'Height', [
                { value: 'compact', label: 'Compact' },
                { value: 'normal', label: 'Normal' },
                { value: 'tall', label: 'Tall' },
            ], { default: 'normal' }),
            f.number('overlay', 'Image darkening (%)', {
                default: 45, min: 0, max: 90,
                hint: 'Keeps the headline readable over a photo',
            }),
            f.boolean('showDots', 'Show slide dots', { default: true }),
            f.boolean('useAds', 'Also rotate through hero banners', { default: false }),
        ],
    },

    'usp-strip': {
        label: 'USP strip',
        group: 'Content',
        icon: 'BadgeCheck',
        description: 'Compact row of four selling points with dividers',
        schema: [
            f.repeater('items', 'Points', [
                { key: 'icon', label: 'Icon', type: 'icon' },
                f.text('title', 'Title'),
                f.text('subtitle', 'Subtitle'),
            ]),
        ],
    },

    'category-circles': {
        label: 'Category circles',
        group: 'Products',
        icon: 'CircleDot',
        description: 'Round category tiles with a “See all” link',
        schema: [
            f.text('title', 'Section title', { default: 'Shop by Category' }),
            f.number('limit', 'How many categories', { default: 5, min: 1, max: 12 }),
            f.boolean('showMoreTile', 'Add a “More” tile', { default: true }),
            f.text('moreLabel', 'More tile label', { default: 'More Categories' }),
            f.boolean('showViewAll', 'Show “See all”', { default: true }),
            f.link('viewAllHref', 'See all link', { default: '/products' }),
        ],
    },

    'flash-deals': {
        label: 'Flash deals',
        group: 'Merchandising',
        icon: 'Zap',
        description: 'Deal rail with a live countdown timer',
        schema: [
            f.text('title', 'Section title', { default: 'Flash Deals' }),
            { key: 'endsAt', label: 'Countdown ends at', type: 'datetime' },
            f.query('query', 'Which products'),
            f.cardPreset(),
            f.boolean('showViewAll', 'Show “See all”', { default: true }),
            f.link('viewAllHref', 'See all link', { default: '/products' }),
        ],
    },

    'coupon-strip': {
        label: 'Coupon strip',
        group: 'Merchandising',
        icon: 'TicketPercent',
        description: 'Offer banner with a coupon code and button',
        schema: [
            f.text('heading', 'Heading', { default: 'Flat 15% OFF on Your First Order!' }),
            f.text('codeLabel', 'Code label', { default: 'Use Code:' }),
            f.text('code', 'Coupon code'),
            f.image('image', 'Side image'),
            f.color('background', 'Background colour', { default: '' }),
            f.text('buttonLabel', 'Button label', { default: 'Order Now' }),
            f.link('buttonHref', 'Button link', { default: '/products' }),
        ],
    },

    'product-section': {
        label: 'Product section',
        group: 'Products',
        icon: 'LayoutGrid',
        description: 'Product grid with a bold heading and “See all”',
        schema: [
            f.text('title', 'Section title', { default: 'Best Selling Products' }),
            f.query('query', 'Which products'),
            f.cardPreset(),
            f.select('columns', 'Columns (desktop)', [
                { value: '2', label: '2' }, { value: '3', label: '3' },
                { value: '4', label: '4' }, { value: '5', label: '5' },
            ], { default: '4' }),
            f.boolean('showViewAll', 'Show “See all”', { default: true }),
            f.link('viewAllHref', 'See all link', { default: '/products' }),
        ],
    },

    // ── Advanced ─────────────────────────────────────────────────
    'spacer': {
        label: 'Spacer / divider',
        group: 'Advanced',
        icon: 'SeparatorHorizontal',
        description: 'Blank space, optionally with a rule',
        schema: [
            f.number('height', 'Height (px)', { default: 48, min: 0, max: 400 }),
            f.boolean('rule', 'Show divider line', { default: false }),
        ],
    },

    'raw-html': {
        label: 'Custom HTML',
        group: 'Advanced',
        icon: 'Code',
        description: 'Your own markup. Scripts are stripped.',
        schema: [
            f.html('html', 'HTML'),
        ],
    },
};

export const BLOCK_KEYS = Object.keys(BLOCKS);

export function getBlockDefinition(type) {
    return BLOCKS[type] || null;
}

/** Settings object for a freshly added block, from its schema defaults. */
export function defaultSettings(type) {
    const definition = BLOCKS[type];
    if (!definition) return {};

    const settings = {};
    for (const field of definition.schema) {
        if (field.type === 'repeater') settings[field.key] = [];
        else if (field.type === 'productQuery') settings[field.key] = null; // filled by the editor
        else if (field.default !== undefined) settings[field.key] = field.default;
        else if (field.type === 'boolean') settings[field.key] = false;
        else settings[field.key] = '';
    }
    return settings;
}

/** A new section ready to be appended to a slot. */
export function createSection(type) {
    return {
        type,
        enabled: true,
        settings: defaultSettings(type),
        style: { background: '', paddingY: 'normal', fullWidth: false },
        visibility: { devices: ['mobile', 'desktop'], from: null, to: null, auth: 'any' },
    };
}
