import Product from '@/models/Product';
import Category from '@/models/Category'; // Required for populate to work
import { buildMetaFilter } from '@/lib/meta';
import { toPlain } from '@/lib/utils';
import { stripAdminProducts } from '@/lib/productPublic';

/**
 * Resolves a structured product query into actual products.
 *
 * Blocks store a query *object*, never an endpoint string, so the admin picks
 * from dropdowns instead of typing a URL, and one implementation serves the
 * page renderer, the builder preview and the mobile app.
 *
 * Shape:
 * {
 *   source: 'auto' | 'manual',
 *   filter: {
 *     categories: [id], isFeatured, onSale, inStock,
 *     priceMin, priceMax, createdWithinDays,
 *     meta: [{ key, op, value }]
 *   },
 *   sort: 'newest'|'oldest'|'price-asc'|'price-desc'|'name'|'bestselling'|'manual',
 *   limit: Number,
 *   productIds: [id]        // source: 'manual'
 * }
 */

export const QUERY_SORTS = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'bestselling', label: 'Best selling' },
    { value: 'price-asc', label: 'Price: low to high' },
    { value: 'price-desc', label: 'Price: high to low' },
    { value: 'name', label: 'Name: A–Z' },
];

const SORT_MAP = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    bestselling: { salesCount: -1, createdAt: -1 },
    'price-asc': { minPrice: 1 },
    'price-desc': { minPrice: -1 },
    name: { name: 1 },
};

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 48;

// Fields a product card needs. Keeping this tight matters because a page can
// hold several product blocks, each running its own query.
const CARD_FIELDS = 'name images variants variationTypes category minPrice maxPrice hasSale totalStock salesCount createdAt';

/**
 * Translates the filter object into a Mongo query.
 * Exported separately so the builder can count matches without fetching.
 */
export function buildProductFilter(filter = {}) {
    const query = { isActive: true };

    if (Array.isArray(filter.categories) && filter.categories.length) {
        query.category = { $in: filter.categories };
    }

    if (filter.isFeatured) query.isFeatured = true;
    if (filter.onSale) query.hasSale = true;
    if (filter.inStock) query.totalStock = { $gt: 0 };

    const price = {};
    if (Number.isFinite(Number(filter.priceMin)) && filter.priceMin !== '' && filter.priceMin !== null) {
        price.$gte = Number(filter.priceMin);
    }
    if (Number.isFinite(Number(filter.priceMax)) && filter.priceMax !== '' && filter.priceMax !== null) {
        price.$lte = Number(filter.priceMax);
    }
    if (Object.keys(price).length) query.minPrice = price;

    const days = Number(filter.createdWithinDays);
    if (Number.isFinite(days) && days > 0) {
        query.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
    }

    // Custom metadata conditions, e.g. spice_level > 3.
    const metaFilter = buildMetaFilter(filter.meta || []);
    if (metaFilter) Object.assign(query, metaFilter);

    return query;
}

/**
 * Runs the query and returns products ready for a card grid.
 * Never throws — a broken block should render empty, not break the page.
 */
export async function resolveProductQuery(query = {}) {
    try {
        const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || DEFAULT_LIMIT));

        // Hand-picked list: fetch by id, then restore the admin's ordering,
        // which Mongo does not preserve for an $in.
        if (query.source === 'manual') {
            const ids = (query.productIds || []).filter(Boolean);
            if (!ids.length) return [];

            const products = await Product.find({ _id: { $in: ids }, isActive: true })
                .select(CARD_FIELDS)
                .populate('category', 'name image')
                .lean();

            const byId = new Map(products.map(p => [String(p._id), p]));
            // Serialized because these are handed to client blocks.
            return stripAdminProducts(toPlain(ids.map(id => byId.get(String(id))).filter(Boolean).slice(0, limit)));
        }

        const results = await Product.find(buildProductFilter(query.filter))
            .sort(SORT_MAP[query.sort] || SORT_MAP.newest)
            .limit(limit)
            .select(CARD_FIELDS)
            .populate('category', 'name image')
            .lean();

        return stripAdminProducts(toPlain(results));
    } catch (error) {
        console.error('resolveProductQuery failed:', error);
        return [];
    }
}

/** Match count without fetching documents — powers the builder's live counter. */
export async function countProductQuery(query = {}) {
    try {
        if (query.source === 'manual') {
            const ids = (query.productIds || []).filter(Boolean);
            if (!ids.length) return 0;
            return await Product.countDocuments({ _id: { $in: ids }, isActive: true });
        }
        return await Product.countDocuments(buildProductFilter(query.filter));
    } catch (error) {
        console.error('countProductQuery failed:', error);
        return 0;
    }
}

/** Defaults for a newly added product block. */
export function emptyProductQuery() {
    return {
        source: 'auto',
        filter: {
            categories: [],
            isFeatured: false,
            onSale: false,
            inStock: false,
            priceMin: null,
            priceMax: null,
            createdWithinDays: null,
            meta: [],
        },
        sort: 'newest',
        limit: 8,
        productIds: [],
    };
}
