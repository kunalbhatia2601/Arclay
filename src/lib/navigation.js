/**
 * Navbar, mobile bottom bar and footer configuration.
 *
 * All three were hardcoded arrays inside their components, so changing a menu
 * item meant a deploy. These schemas drive both the stored defaults and the
 * admin editor (through the same schema-driven form the page builder uses).
 */

const f = {
    text: (key, label, extra = {}) => ({ key, label, type: 'text', ...extra }),
    link: (key, label, extra = {}) => ({ key, label, type: 'link', ...extra }),
    bool: (key, label, extra = {}) => ({ key, label, type: 'boolean', ...extra }),
    icon: (key, label) => ({ key, label, type: 'icon' }),
    image: (key, label) => ({ key, label, type: 'image' }),
    select: (key, label, options, extra = {}) => ({ key, label, type: 'select', options, ...extra }),
    repeater: (key, label, fields, extra = {}) => ({ key, label, type: 'repeater', fields, ...extra }),
};

// A menu entry. `kind` decides whether it is a plain link, a dropdown of
// hand-written children, or a dropdown auto-filled with product categories.
const MENU_ITEM_FIELDS = [
    f.text('label', 'Label'),
    f.link('href', 'Link'),
    f.icon('icon', 'Icon'),
    f.select('kind', 'Type', [
        { value: 'link', label: 'Plain link' },
        { value: 'dropdown', label: 'Dropdown' },
        { value: 'categories', label: 'Dropdown of categories' },
    ], { default: 'link' }),
    f.repeater('children', 'Dropdown items', [
        f.text('label', 'Label'),
        f.link('href', 'Link'),
    ]),
];

export const NAVBAR_SCHEMA = [
    // ── Announcement bar ─────────────────────────────────────────
    { ...f.bool('announcementEnabled', 'Show announcement bar', { default: true }), group: 'Announcement bar' },
    { ...f.text('announcementPhone', 'Phone number', { default: '' }), group: 'Announcement bar' },
    { ...f.text('announcementText', 'Message', { default: 'Free shipping on select orders' }), group: 'Announcement bar' },
    {
        ...f.repeater('announcementLinks', 'Right-hand links', [
            f.text('label', 'Label'),
            f.link('href', 'Link'),
        ]),
        group: 'Announcement bar',
    },

    // ── Branding ─────────────────────────────────────────────────
    { ...f.image('logo', 'Logo image'), group: 'Branding' },
    { ...f.text('brandName', 'Brand name', { hint: 'Leave blank to use the site name' }), group: 'Branding' },
    { ...f.text('tagline', 'Tagline'), group: 'Branding' },

    // ── Menu ─────────────────────────────────────────────────────
    { ...f.repeater('menu', 'Menu items', MENU_ITEM_FIELDS), group: 'Menu' },

    // ── Actions ──────────────────────────────────────────────────
    { ...f.bool('showSearch', 'Search button', { default: true }), group: 'Actions' },
    { ...f.bool('showNotifications', 'Notifications bell', { default: true }), group: 'Actions' },
    { ...f.bool('showCart', 'Cart button', { default: true }), group: 'Actions' },
    { ...f.bool('showAccount', 'Account button', { default: true }), group: 'Actions' },
    { ...f.bool('showWishlist', 'Wishlist button', { default: false }), group: 'Actions' },

    // ── Behaviour ────────────────────────────────────────────────
    { ...f.bool('sticky', 'Stick to the top when scrolling', { default: true }), group: 'Behaviour' },
    {
        ...f.select('menuAlign', 'Menu position', [
            { value: 'center', label: 'Centered' },
            { value: 'left', label: 'Beside the logo' },
        ], { default: 'center' }),
        group: 'Behaviour',
    },
];

export const MOBILE_BAR_SCHEMA = [
    f.bool('enabled', 'Show bottom bar on mobile', { default: true }),
    f.select('style', 'Style', [
        { value: 'floating', label: 'Floating pill' },
        { value: 'full', label: 'Full-width bar' },
    ], { default: 'floating' }),
    f.bool('showLabels', 'Show labels under icons', { default: true }),
    f.repeater('items', 'Buttons', [
        f.text('label', 'Label'),
        f.icon('icon', 'Icon'),
        f.link('href', 'Link'),
        f.select('kind', 'Behaviour', [
            { value: 'link', label: 'Go to a page' },
            { value: 'search', label: 'Open search' },
            { value: 'cart', label: 'Open cart (with count)' },
        ], { default: 'link' }),
    ]),
];

export const FOOTER_SCHEMA = [
    // ── Newsletter ───────────────────────────────────────────────
    { ...f.bool('newsletterEnabled', 'Show newsletter block', { default: true }), group: 'Newsletter' },
    { ...f.text('newsletterHeading', 'Heading', { default: 'Join Our Inner Circle' }), group: 'Newsletter' },
    { ...f.text('newsletterText', 'Supporting text', { default: '' }), group: 'Newsletter' },
    { ...f.text('newsletterPlaceholder', 'Input placeholder', { default: 'Enter your email' }), group: 'Newsletter' },
    { ...f.text('newsletterButton', 'Button label', { default: 'Subscribe' }), group: 'Newsletter' },

    // ── Brand column ─────────────────────────────────────────────
    { ...f.text('about', 'About text'), group: 'Brand' },
    {
        ...f.repeater('socials', 'Social links', [
            f.icon('icon', 'Icon'),
            f.link('href', 'Link'),
            f.text('label', 'Name'),
        ]),
        group: 'Brand',
    },

    // ── Link columns ─────────────────────────────────────────────
    {
        ...f.repeater('columns', 'Link columns', [
            f.text('title', 'Column title'),
            f.repeater('links', 'Links', [
                f.text('label', 'Label'),
                f.link('href', 'Link'),
            ]),
        ]),
        group: 'Link columns',
    },

    // ── Bottom bar ───────────────────────────────────────────────
    {
        ...f.text('copyright', 'Copyright line', {
            default: '© {year} {site}. All rights reserved.',
            hint: '{year} and {site} are filled in automatically',
        }),
        group: 'Bottom bar',
    },
    {
        ...f.repeater('legalLinks', 'Legal links', [
            f.text('label', 'Label'),
            f.link('href', 'Link'),
        ]),
        group: 'Bottom bar',
    },
];

// Defaults mirror what the components hardcoded, so switching to config is a
// no-op until someone edits it.
export const DEFAULT_NAVIGATION = {
    navbar: {
        announcementEnabled: true,
        announcementPhone: '',
        announcementText: 'Free shipping on select orders',
        announcementLinks: [
            { label: 'Blog', href: '/blog' },
            { label: 'Help', href: '/contact' },
            { label: 'Track Order', href: '/orders' },
        ],
        logo: '',
        brandName: '',
        tagline: '',
        menu: [
            { label: 'Home', href: '/', icon: 'Home', kind: 'link', children: [] },
            { label: 'Shop', href: '/products', icon: 'Package', kind: 'categories', children: [] },
            { label: 'Gift Boxes', href: '/bundles', icon: 'Gift', kind: 'link', children: [] },
            { label: 'Offers', href: '/offers', icon: 'Percent', kind: 'link', children: [] },
            {
                label: 'More', href: '', icon: 'BookOpen', kind: 'dropdown',
                children: [
                    { label: 'About Us', href: '/about' },
                    { label: 'Blog', href: '/blog' },
                    { label: 'Contact', href: '/contact' },
                ],
            },
        ],
        showSearch: true,
        showNotifications: true,
        showCart: true,
        showAccount: true,
        showWishlist: false,
        sticky: true,
        menuAlign: 'center',
    },
    mobileBar: {
        enabled: true,
        style: 'floating',
        showLabels: true,
        items: [
            { label: 'Home', icon: 'Home', href: '/', kind: 'link' },
            { label: 'Shop', icon: 'Search', href: '/products', kind: 'link' },
            { label: 'Cart', icon: 'ShoppingBag', href: '/cart', kind: 'cart' },
            { label: 'Profile', icon: 'User', href: '/account', kind: 'link' },
        ],
    },
    footer: {
        newsletterEnabled: true,
        newsletterHeading: 'Join Our Inner Circle',
        newsletterText: '',
        newsletterPlaceholder: 'Enter your email',
        newsletterButton: 'Subscribe',
        about: '',
        socials: [],
        columns: [
            {
                title: 'Company',
                links: [
                    { label: 'About Us', href: '/about' },
                    { label: 'Blog', href: '/blog' },
                    { label: 'Contact', href: '/contact' },
                ],
            },
            {
                title: 'Support',
                links: [
                    { label: 'FAQs', href: '/faqs' },
                    { label: 'Track Order', href: '/orders' },
                    { label: 'My Account', href: '/account' },
                ],
            },
        ],
        copyright: '© {year} {site}. All rights reserved.',
        legalLinks: [
            { label: 'Privacy Policy', href: '/policy' },
            { label: 'Terms', href: '/policy' },
        ],
    },
};

const SCHEMAS = {
    navbar: NAVBAR_SCHEMA,
    mobileBar: MOBILE_BAR_SCHEMA,
    footer: FOOTER_SCHEMA,
};

/** Merges stored values over the defaults for one section. */
function resolveSection(name, stored = {}) {
    const resolved = { ...DEFAULT_NAVIGATION[name] };
    for (const field of SCHEMAS[name]) {
        if (stored[field.key] !== undefined && stored[field.key] !== null) {
            resolved[field.key] = stored[field.key];
        }
    }
    return resolved;
}

export function resolveNavigation(stored) {
    const source = stored || {};
    return {
        navbar: resolveSection('navbar', source.navbar),
        mobileBar: resolveSection('mobileBar', source.mobileBar),
        footer: resolveSection('footer', source.footer),
    };
}

/** Drops keys the schema does not declare before storing. */
export function sanitizeNavigation(input = {}) {
    const clean = {};
    for (const [name, schema] of Object.entries(SCHEMAS)) {
        const section = input[name];
        if (!section) continue;

        clean[name] = {};
        for (const field of schema) {
            if (section[field.key] !== undefined) clean[name][field.key] = section[field.key];
        }
    }
    return clean;
}
