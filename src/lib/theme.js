import Theme, { DEFAULT_TOKENS, TOKEN_MAP } from '@/models/Theme';
import connectDB from '@/lib/mongodb';

// Cached for the same reason Settings is: every storefront request needs it,
// and it changes only when an admin saves.
let cache = null;
let cachedAt = 0;
const TTL_MS = 60 * 1000;

export function clearThemeCache() {
    cache = null;
    cachedAt = 0;
}

/**
 * Resolved token values — stored overrides merged over the defaults.
 * Always returns a complete set, so callers never handle missing keys.
 */
export async function getThemeTokens() {
    if (cache && Date.now() - cachedAt < TTL_MS) return cache;

    try {
        await connectDB();
        const theme = await Theme.getTheme();
        const stored = theme.tokens instanceof Map
            ? Object.fromEntries(theme.tokens)
            : (theme.tokens || {});

        // Only keys that are still defined survive, so removing a token from
        // the definitions retires it without a data migration.
        const merged = { ...DEFAULT_TOKENS };
        for (const [key, value] of Object.entries(stored)) {
            if (key in TOKEN_MAP && value) merged[key] = value;
        }

        cache = { tokens: merged, customCss: theme.customCss || '' };
        cachedAt = Date.now();
        return cache;
    } catch (error) {
        // A themed page is not worth a 500 — fall back to the defaults, which
        // are the palette the site shipped with.
        console.error('Failed to load theme, using defaults:', error);
        return { tokens: { ...DEFAULT_TOKENS }, customCss: '' };
    }
}

// Blocks CSS injection through token values. Values reach a <style> tag, so a
// stray brace or comment terminator could otherwise escape the declaration.
function sanitizeTokenValue(value) {
    return String(value ?? '')
        .replace(/[{}<>;]/g, '')
        .replace(/\/\*|\*\//g, '')
        .trim()
        .slice(0, 200);
}

/**
 * Renders the token set as a :root block of CSS custom properties.
 * Every component reads these, so one save restyles the storefront.
 */
export function tokensToCss(tokens, customCss = '') {
    const declarations = Object.entries(tokens)
        .map(([key, value]) => {
            const definition = TOKEN_MAP[key];
            if (!definition) return null;
            return `  ${definition.cssVar}: ${sanitizeTokenValue(value)};`;
        })
        .filter(Boolean)
        .join('\n');

    // customCss is admin-authored and intentionally unrestricted apart from
    // closing tags, which would break out of the <style> element.
    const safeCustom = String(customCss || '').replace(/<\/style/gi, '');

    return `:root {\n${declarations}\n}\n${safeCustom}`;
}
