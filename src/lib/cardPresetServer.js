import connectDB from '@/lib/mongodb';
import CardPreset from '@/models/CardPreset';
import { DEFAULT_CARD, resolveCardPreset } from '@/lib/cardPreset';

/**
 * Server-side lookup of the site-wide default card preset.
 *
 * Kept out of lib/cardPreset.js because that module is imported by the client
 * ProductCard, and pulling Mongoose into it would drag the driver into the
 * browser bundle.
 */
let cache = null;
let cachedAt = 0;
const TTL_MS = 60 * 1000;

export function clearCardPresetCache() {
    cache = null;
    cachedAt = 0;
}

export async function getDefaultCardPreset() {
    if (cache && Date.now() - cachedAt < TTL_MS) return cache;

    try {
        await connectDB();
        const preset =
            (await CardPreset.findOne({ isDefault: true }).lean()) ||
            (await CardPreset.findOne().lean());

        cache = preset ? resolveCardPreset(preset) : { ...DEFAULT_CARD };
        cachedAt = Date.now();
        return cache;
    } catch (error) {
        // Cards must still render if the preset lookup fails.
        console.error('Failed to load default card preset:', error);
        return { ...DEFAULT_CARD };
    }
}
