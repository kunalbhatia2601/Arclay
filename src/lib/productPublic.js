/**
 * Fields that must never leave admin surfaces (storefront, app, cart JSON).
 */
export const ADMIN_VARIANT_FIELDS = ['costPrice', 'expiresAt'];

function stripVariant(variant) {
    if (!variant || typeof variant !== 'object') return variant;
    const cleaned = { ...variant };
    for (const key of ADMIN_VARIANT_FIELDS) {
        delete cleaned[key];
    }
    return cleaned;
}

export function stripAdminProductFields(doc) {
    if (!doc) return doc;
    if (Array.isArray(doc)) return doc.map(stripAdminProductFields);

    const product = { ...doc };
    if (Array.isArray(product.variants)) {
        product.variants = product.variants.map(stripVariant);
    }
    return product;
}

export function stripAdminProducts(docs) {
    if (!Array.isArray(docs)) return [];
    return docs.map(stripAdminProductFields);
}

function optionalNumber(value) {
    if (value === '' || value === undefined || value === null) return null;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return null;
    return n;
}

function optionalDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

/** Normalizes cost/expiry on variants coming from the admin form or API. */
export function withAdminVariantFields(variants) {
    return (variants || []).map((variant) => ({
        ...variant,
        costPrice: optionalNumber(variant.costPrice),
        expiresAt: optionalDate(variant.expiresAt),
    }));
}
