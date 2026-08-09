import PageLayout, { PAGE_SLOTS } from '@/models/PageLayout';
import connectDB from '@/lib/mongodb';
import { BLOCKS, defaultSettings } from '@/lib/blocks/registry';
import { resolveProductQuery } from '@/lib/productQuery';
import ProductAd from '@/models/ProductAd';
import Category from '@/models/Category';
import { randomUUID } from 'crypto';
import { toPlain } from '@/lib/utils';
import CardPreset from '@/models/CardPreset';
import { DEFAULT_CARD, resolveCardPreset } from '@/lib/cardPreset';

// Card presets change rarely and are needed by most product blocks, so they
// are fetched once per render pass rather than per block.
async function loadCardPresets() {
    try {
        const presets = await CardPreset.find().lean();
        const byId = new Map(presets.map(p => [String(p._id), resolveCardPreset(p)]));
        const fallback = presets.find(p => p.isDefault) || presets[0];
        return { byId, fallback: fallback ? resolveCardPreset(fallback) : { ...DEFAULT_CARD } };
    } catch (error) {
        console.error('Failed to load card presets:', error);
        return { byId: new Map(), fallback: { ...DEFAULT_CARD } };
    }
}

// Active banners for the requested position, respecting any schedule window.
async function loadBanners(position) {
    const now = new Date();
    // Serialized: banners are rendered by a client block.
    return toPlain(await ProductAd.find({
        isActive: true,
        position,
        $and: [
            { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
            { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
        ],
    })
        .sort({ order: 1, createdAt: -1 })
        .limit(10)
        .lean());
}

async function loadCategories(limit) {
    return toPlain(
        await Category.find({ isActive: true })
            .select('name image')
            .limit(Math.min(24, Math.max(1, Number(limit) || 6)))
            .lean()
    );
}

// Published layouts are read on every storefront request and change only when
// an admin publishes, so they are cached like Settings and Theme.
const cache = new Map();
const TTL_MS = 60 * 1000;

export function clearLayoutCache(page) {
    if (page) cache.delete(page);
    else cache.clear();
}

/** Published slots for a page, or {} when nothing has been published yet. */
export async function getPublishedLayout(page) {
    const hit = cache.get(page);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.slots;

    try {
        await connectDB();
        const layout = await PageLayout.findOne({ page }).lean();
        // Serialized: sections are handed to client renderers, which cannot
        // receive ObjectId/Date instances.
        const slots = toPlain(layout?.published || {});
        cache.set(page, { slots, at: Date.now() });
        return slots;
    } catch (error) {
        // A page that cannot load its layout falls back to its hardcoded
        // default rather than erroring out.
        console.error(`Failed to load layout for "${page}":`, error);
        return {};
    }
}

/**
 * Strips anything the client should not control and drops unknown blocks.
 * Applied on every save, so the stored tree is always renderable.
 */
export function sanitizeSlots(page, slots) {
    const allowed = new Set((PAGE_SLOTS[page] || []).map(s => s.key));
    const clean = {};

    for (const [slotKey, sections] of Object.entries(slots || {})) {
        if (!allowed.has(slotKey) || !Array.isArray(sections)) continue;

        clean[slotKey] = sections
            .filter(section => section && BLOCKS[section.type])
            .map(section => {
                const definition = BLOCKS[section.type];
                const known = new Set(definition.schema.map(field => field.key));

                // Only keys the block declares survive, so a stale editor or a
                // crafted request cannot stash arbitrary data on the page.
                const settings = { ...defaultSettings(section.type) };
                for (const [key, value] of Object.entries(section.settings || {})) {
                    if (known.has(key)) settings[key] = value;
                }

                return {
                    // Every section needs a stable id: it is the React key for
                    // the rendered list, and blocks added by a script or an
                    // older client may arrive without one.
                    _id: section._id || randomUUID(),
                    type: section.type,
                    enabled: section.enabled !== false,
                    settings,
                    style: {
                        background: String(section.style?.background || '').slice(0, 40),
                        paddingY: ['none', 'tight', 'normal', 'loose'].includes(section.style?.paddingY)
                            ? section.style.paddingY : 'normal',
                        fullWidth: !!section.style?.fullWidth,
                        column: ['full', 'left', 'right'].includes(section.style?.column)
                            ? section.style.column : 'full',
                    },
                    visibility: {
                        devices: Array.isArray(section.visibility?.devices) && section.visibility.devices.length
                            ? section.visibility.devices.filter(d => d === 'mobile' || d === 'desktop')
                            : ['mobile', 'desktop'],
                        from: section.visibility?.from || null,
                        to: section.visibility?.to || null,
                        auth: ['any', 'in', 'out'].includes(section.visibility?.auth)
                            ? section.visibility.auth : 'any',
                    },
                };
            });
    }

    return clean;
}

/** Whether a section should render right now, ignoring device (a CSS concern). */
export function isVisibleNow(section, { isAuthenticated = false } = {}) {
    if (section.enabled === false) return false;

    const { from, to, auth } = section.visibility || {};
    const now = Date.now();

    if (from && now < new Date(from).getTime()) return false;
    if (to && now > new Date(to).getTime()) return false;
    if (auth === 'in' && !isAuthenticated) return false;
    if (auth === 'out' && isAuthenticated) return false;

    return true;
}

/**
 * Pre-fetches server-side data each section needs, so blocks can be rendered
 * as plain server components without each one firing its own request.
 *
 * All queries for a slot run concurrently — a page with four product blocks
 * costs one round of parallel queries, not four sequential ones.
 */
export async function resolveSectionData(sections = []) {
    const cards = await loadCardPresets();

    const jobs = sections.map(async (section) => {
        const definition = BLOCKS[section.type];
        if (!definition) return null;

        const data = {};

        // Any productQuery field on the block becomes a resolved product list.
        for (const field of definition.schema) {
            if (field.type !== 'productQuery') continue;
            const query = section.settings?.[field.key];
            if (query) data[field.key] = await resolveProductQuery(query);
        }

        // Whichever card preset this block points at, or the default.
        if (definition.schema.some(field => field.type === 'cardPreset')) {
            const chosen = section.settings?.cardPreset;
            data.cardPreset = (chosen && cards.byId.get(String(chosen))) || cards.fallback;
        }

        // Blocks backed by their own collection rather than a product query.
        try {
            if (section.type === 'hero-slider') {
                data.slides = await loadBanners(section.settings?.position || 'hero');
            } else if (section.type === 'promo-hero' && section.settings?.useAds) {
                data.slides = await loadBanners('hero');
            } else if (section.type === 'category-grid' || section.type === 'category-circles') {
                // One extra for the trailing "More" tile.
                data.categories = await loadCategories((Number(section.settings?.limit) || 6) + 1);
            }
        } catch (error) {
            console.error(`Failed to resolve data for "${section.type}":`, error);
        }

        return data;
    });

    const results = await Promise.all(jobs);
    return sections.map((section, i) => ({ ...section, data: results[i] || {} }));
}

/** Everything a page needs to render one slot: visible sections plus their data. */
export async function getSlotSections(page, slotKey, context = {}) {
    const slots = await getPublishedLayout(page);
    const sections = (slots?.[slotKey] || []).filter(s => isVisibleNow(s, context));
    if (!sections.length) return [];
    return resolveSectionData(sections);
}
