import connectDB from '@/lib/mongodb';
import Navigation from '@/models/Navigation';
import { DEFAULT_NAVIGATION, resolveNavigation } from '@/lib/navigation';

/**
 * Server-side navigation lookup, cached like the theme.
 *
 * Separate from lib/navigation.js because that module is imported by the
 * client Navbar and Footer, and pulling Mongoose in would drag the driver
 * into the browser bundle.
 */
let cache = null;
let cachedAt = 0;
const TTL_MS = 60 * 1000;

export function clearNavigationCache() {
    cache = null;
    cachedAt = 0;
}

export async function getNavigation() {
    if (cache && Date.now() - cachedAt < TTL_MS) return cache;

    try {
        await connectDB();
        const doc = await Navigation.getNavigation();
        cache = resolveNavigation({
            navbar: doc.navbar,
            mobileBar: doc.mobileBar,
            footer: doc.footer,
        });
        cachedAt = Date.now();
        return cache;
    } catch (error) {
        // The site must still have a usable header if this lookup fails.
        console.error('Failed to load navigation, using defaults:', error);
        return JSON.parse(JSON.stringify(DEFAULT_NAVIGATION));
    }
}
