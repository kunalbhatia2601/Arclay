import mongoose from 'mongoose';

/**
 * Storefront design tokens.
 *
 * The site's colours, fonts and shape values were hardcoded as literal hex
 * across ~30 components, which made "customisable" impossible no matter what
 * the page builder could do. These are rendered as CSS custom properties on
 * :root, so every component reads them at runtime and a single save restyles
 * the whole storefront.
 *
 * Singleton, like Settings.
 */

// Every token, with the default matching the current hardcoded palette so
// switching to tokens is a no-op until someone edits them.
export const TOKEN_GROUPS = [
    {
        name: 'Brand',
        tokens: [
            { key: 'primary', label: 'Primary', type: 'color', default: '#869661', cssVar: '--c-primary' },
            { key: 'primaryDark', label: 'Primary (hover)', type: 'color', default: '#71824F', cssVar: '--c-primary-dark' },
            { key: 'accent', label: 'Accent', type: 'color', default: '#D86B4B', cssVar: '--c-accent' },
            { key: 'accentSoft', label: 'Accent (soft)', type: 'color', default: '#F0F4EC', cssVar: '--c-accent-soft' },
        ],
    },
    {
        name: 'Surfaces',
        tokens: [
            { key: 'background', label: 'Page background', type: 'color', default: '#FEFBF6', cssVar: '--c-bg' },
            { key: 'surface', label: 'Card / surface', type: 'color', default: '#FFFFFF', cssVar: '--c-surface' },
            { key: 'surfaceAlt', label: 'Alternate surface', type: 'color', default: '#F3EFE8', cssVar: '--c-surface-alt' },
            { key: 'surfaceWarm', label: 'Warm surface', type: 'color', default: '#FDF8EF', cssVar: '--c-surface-warm' },
            { key: 'border', label: 'Border', type: 'color', default: '#ECE8E0', cssVar: '--c-border' },
        ],
    },
    {
        name: 'Text',
        tokens: [
            { key: 'text', label: 'Primary text', type: 'color', default: '#2A2F25', cssVar: '--c-text' },
            { key: 'textMuted', label: 'Muted text', type: 'color', default: '#767B71', cssVar: '--c-text-muted' },
            { key: 'textFaint', label: 'Faint text', type: 'color', default: '#A0A49B', cssVar: '--c-text-faint' },
            { key: 'textOnPrimary', label: 'Text on primary', type: 'color', default: '#FFFFFF', cssVar: '--c-text-on-primary' },
        ],
    },
    {
        name: 'Status',
        tokens: [
            { key: 'success', label: 'Success', type: 'color', default: '#006D44', cssVar: '--c-success' },
            { key: 'successSoft', label: 'Success (soft)', type: 'color', default: '#E5FAEF', cssVar: '--c-success-soft' },
            { key: 'danger', label: 'Danger / sale', type: 'color', default: '#D64545', cssVar: '--c-danger' },
            { key: 'star', label: 'Rating star', type: 'color', default: '#F9BC16', cssVar: '--c-star' },
        ],
    },
    {
        name: 'Typography',
        tokens: [
            { key: 'fontDisplay', label: 'Heading font', type: 'font', default: 'var(--font-playfair), Georgia, serif', cssVar: '--font-display' },
            { key: 'fontBody', label: 'Body font', type: 'font', default: 'var(--font-inter), system-ui, sans-serif', cssVar: '--font-body' },
            { key: 'headingWeight', label: 'Heading weight', type: 'select', options: ['500', '600', '700', '800'], default: '700', cssVar: '--font-display-weight' },
        ],
    },
    {
        name: 'Shape & spacing',
        tokens: [
            { key: 'radiusCard', label: 'Card radius', type: 'size', default: '1rem', cssVar: '--radius-card' },
            { key: 'radiusButton', label: 'Button radius', type: 'size', default: '0.75rem', cssVar: '--radius-btn' },
            { key: 'radiusHero', label: 'Hero radius', type: 'size', default: '2.5rem', cssVar: '--radius-hero' },
            { key: 'sectionPadding', label: 'Section padding', type: 'size', default: '4rem', cssVar: '--section-py' },
            { key: 'containerWidth', label: 'Max content width', type: 'size', default: '80rem', cssVar: '--container-w' },
        ],
    },
];

// Flat lookup: key -> token definition.
export const TOKEN_MAP = Object.fromEntries(
    TOKEN_GROUPS.flatMap(group => group.tokens.map(token => [token.key, token]))
);

export const DEFAULT_TOKENS = Object.fromEntries(
    Object.entries(TOKEN_MAP).map(([key, token]) => [key, token.default])
);

const ThemeSchema = new mongoose.Schema({
    // key -> value. Missing keys fall back to the definition's default, so a
    // token added in a later release needs no migration.
    tokens: {
        type: Map,
        of: String,
        default: () => new Map(),
    },
    // Raw CSS appended after the generated custom properties. Admin-only
    // escape hatch for one-off tweaks the token set does not cover.
    customCss: {
        type: String,
        default: '',
        maxlength: 20000,
    },
}, { timestamps: true });

ThemeSchema.statics.getTheme = async function () {
    let theme = await this.findOne();
    if (!theme) theme = await this.create({});
    return theme;
};

export default mongoose.models.Theme || mongoose.model('Theme', ThemeSchema);
