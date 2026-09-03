/**
 * Option-picker helpers shared by the product page and the card picker.
 *
 * Variants are one row per SKU, not a full matrix — Tata Tea has {250g, Regular}
 * and {500g, GOLD} only. Instead of greying "500g — unavailable" while Regular
 * is selected, choosing 500g snaps the other dimensions to the nearest real
 * variant (Flavour → GOLD). Every option listed on a type exists on at least
 * one variant, so nothing needs to be greyed out.
 */

const attrsOf = (variant) => variant?.attributes || {};

function restrictToTypes(attributes, types) {
    const out = {};
    for (const type of types) {
        if (attributes[type.name] != null) out[type.name] = attributes[type.name];
    }
    return out;
}

/** Selection to start with: the first variant's own attributes (always a real combo). */
export function initialSelection(product) {
    const types = product?.variationTypes || [];
    const first = product?.variants?.[0];
    if (first && Object.keys(attrsOf(first)).length) {
        const picked = restrictToTypes(attrsOf(first), types);
        if (Object.keys(picked).length === types.length) return picked;
    }
    const fallback = {};
    for (const type of types) {
        if (type.options?.length) fallback[type.name] = type.options[0];
    }
    return fallback;
}

export function findVariant(product, selected) {
    const variants = product?.variants || [];
    if (!variants.length) return null;
    if (!product?.variationTypes?.length) return variants[0];
    return (
        variants.find((v) => Object.entries(selected).every(([k, val]) => attrsOf(v)[k] === val)) || null
    );
}

/** Does any variant at all carry this option value? (Not "given the current selection".) */
export function optionExists(product, typeName, option) {
    return (product?.variants || []).some((v) => attrsOf(v)[typeName] === option);
}

/**
 * New selection after picking `option` for `typeName`. Keeps the rest of the
 * current selection when that combo exists; otherwise jumps to the variant
 * carrying `option` that agrees with the most of the current selection.
 */
export function snapSelection(product, selected, typeName, option) {
    const candidate = { ...selected, [typeName]: option };
    if (findVariant(product, candidate)) return candidate;

    const types = product?.variationTypes || [];
    let best = null;
    let bestScore = -1;
    for (const v of product?.variants || []) {
        const a = attrsOf(v);
        if (a[typeName] !== option) continue;
        const score = Object.entries(selected).filter(([k, val]) => k !== typeName && a[k] === val).length;
        if (score > bestScore) {
            best = v;
            bestScore = score;
        }
    }
    return best ? restrictToTypes(attrsOf(best), types) : candidate;
}
