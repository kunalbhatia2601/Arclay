import MetaFieldTemplate, { META_FIELD_TYPES } from '@/models/MetaFieldTemplate';

/**
 * Custom product metadata resolution.
 *
 * Field *definitions* live on MetaFieldTemplate documents; only the *values*
 * live on the product. That split means editing a template never migrates
 * product data — new fields simply appear empty, and removed fields leave
 * their values behind as orphans rather than being destroyed.
 *
 * Everything that needs to render or edit metadata (admin product form,
 * product detail blocks, facet builder) goes through resolveProductMeta so
 * there is exactly one merge implementation.
 */

// Values that mean "nothing entered" for the purposes of required checks
// and display filtering.
function isBlank(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    return false;
}

// Normalizes a raw form value into the shape the field type expects, so what
// lands in Mongo is consistent regardless of how the client serialized it.
export function coerceValue(field, value) {
    if (isBlank(value)) return null;

    switch (field.type) {
        case 'number': {
            const n = Number(value);
            return Number.isFinite(n) ? n : null;
        }
        case 'boolean':
            return value === true || value === 'true' || value === 1 || value === '1';
        case 'multiselect':
            return (Array.isArray(value) ? value : [value])
                .map(v => String(v))
                .filter(v => v !== '');
        case 'date': {
            const d = new Date(value);
            return Number.isNaN(d.getTime()) ? null : d.toISOString();
        }
        case 'table':
            // Array of row objects; pass through if it already looks right.
            return Array.isArray(value) ? value : null;
        default:
            return typeof value === 'string' ? value.trim() : value;
    }
}

/**
 * Merges template fields + per-product custom fields into one ordered list.
 * Later templates do not overwrite earlier ones — first definition of a key
 * wins, so a product's own custom field always beats a template's.
 *
 * @returns {Array} field definitions, deduped by key, sorted by group + order
 */
export function mergeFieldDefinitions(templates = [], customFields = []) {
    const byKey = new Map();

    // Product-level custom fields take precedence, so they go in first.
    for (const field of customFields) {
        if (!field?.key) continue;
        byKey.set(field.key, { ...field, source: 'custom' });
    }

    for (const template of templates) {
        for (const field of template?.fields || []) {
            if (!field?.key || byKey.has(field.key)) continue;
            byKey.set(field.key, {
                ...(typeof field.toObject === 'function' ? field.toObject() : field),
                source: 'template',
                templateId: String(template._id),
                templateName: template.name,
            });
        }
    }

    return [...byKey.values()].sort((a, b) => {
        const group = String(a.group || '').localeCompare(String(b.group || ''));
        if (group !== 0) return group;
        return (a.order || 0) - (b.order || 0);
    });
}

/**
 * Resolves a product's metadata into render-ready entries.
 *
 * @param {object} product  lean product doc (meta may be a Map or plain object)
 * @param {Array}  templates  the MetaFieldTemplate docs referenced by the product
 * @returns {{ fields: Array, groups: Array, orphans: Array }}
 *   fields  — definition + current value, in display order
 *   groups  — same entries bucketed by `group`, for tabbed/accordion rendering
 *   orphans — values with no matching definition (template edited after the
 *             value was saved). Surfaced rather than hidden so the admin can
 *             decide to delete them.
 */
export function resolveProductMeta(product, templates = []) {
    const rawMeta = product?.meta instanceof Map
        ? Object.fromEntries(product.meta)
        : (product?.meta || {});

    const definitions = mergeFieldDefinitions(templates, product?.customMetaFields || []);
    const definedKeys = new Set(definitions.map(d => d.key));

    const fields = definitions.map(definition => ({
        ...definition,
        value: rawMeta[definition.key] ?? definition.defaultValue ?? null,
        hasValue: !isBlank(rawMeta[definition.key]),
    }));

    const groups = [];
    for (const field of fields) {
        const name = field.group || 'Details';
        let bucket = groups.find(g => g.name === name);
        if (!bucket) {
            bucket = { name, fields: [] };
            groups.push(bucket);
        }
        bucket.fields.push(field);
    }

    const orphans = Object.entries(rawMeta)
        .filter(([key, value]) => !definedKeys.has(key) && !isBlank(value))
        .map(([key, value]) => ({ key, value }));

    return { fields, groups, orphans };
}

/**
 * Loads the templates a product references, plus (optionally) the ones that
 * would be suggested for its category.
 */
export async function loadTemplatesForProduct(product, { includeSuggested = false } = {}) {
    const ids = (product?.metaTemplates || []).map(String);

    const or = [];
    if (ids.length) or.push({ _id: { $in: ids } });
    if (includeSuggested) {
        or.push({ isDefault: true, isActive: true });
        const categoryId = product?.category?._id || product?.category;
        if (categoryId) {
            or.push({ 'appliesTo.categories': categoryId, isActive: true });
        }
    }

    if (!or.length) return [];
    return MetaFieldTemplate.find({ $or: or }).lean();
}

/**
 * Validates and normalizes submitted metadata against the resolved field
 * definitions. Unknown keys are dropped rather than stored, so a malformed or
 * stale client cannot write arbitrary fields onto a product.
 *
 * @returns {{ meta: object, errors: string[] }}
 */
export function sanitizeMetaValues(rawValues = {}, definitions = []) {
    const meta = {};
    const errors = [];

    for (const definition of definitions) {
        if (!META_FIELD_TYPES.includes(definition.type)) continue;

        const coerced = coerceValue(definition, rawValues[definition.key]);

        if (definition.required && isBlank(coerced)) {
            errors.push(`"${definition.label}" is required`);
            continue;
        }

        if (isBlank(coerced)) continue;

        // Guard select/multiselect against values outside the allowed list.
        if (definition.type === 'select' && definition.options?.length) {
            if (!definition.options.includes(coerced)) {
                errors.push(`"${definition.label}" has an invalid option`);
                continue;
            }
        }
        if (definition.type === 'multiselect' && definition.options?.length) {
            const invalid = coerced.filter(v => !definition.options.includes(v));
            if (invalid.length) {
                errors.push(`"${definition.label}" has invalid options: ${invalid.join(', ')}`);
                continue;
            }
        }

        meta[definition.key] = coerced;
    }

    return { meta, errors };
}

/**
 * Normalizes template field definitions coming from the admin form: forces
 * keys into the allowed character set, fills in ordering, and drops anything
 * the client should not be able to set.
 */
export function normalizeFields(fields) {
    if (!Array.isArray(fields)) return [];

    return fields.map((field, index) => ({
        key: String(field.key || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        label: String(field.label || '').trim(),
        type: META_FIELD_TYPES.includes(field.type) ? field.type : 'text',
        options: Array.isArray(field.options) ? field.options.filter(Boolean) : [],
        unit: field.unit || '',
        placeholder: field.placeholder || '',
        helpText: field.helpText || '',
        defaultValue: field.defaultValue ?? null,
        required: !!field.required,
        group: field.group?.trim() || 'Details',
        order: Number.isFinite(field.order) ? field.order : index,
        display: {
            show: field.display?.show !== false,
            where: field.display?.where || 'specs-table',
            icon: field.display?.icon || '',
        },
        filterable: !!field.filterable,
        searchable: !!field.searchable,
    })).filter(field => field.key && field.label);
}

/**
 * Builds the Mongo query fragment for metadata filters used by product
 * queries and storefront facets.
 *
 * Each condition becomes an $elemMatch against metaIndex so a single compound
 * index serves every field. Numeric comparisons use the pre-cast `n`.
 *
 * @param {Array<{key:string, op:string, value:any}>} conditions
 */
export function buildMetaFilter(conditions = []) {
    const clauses = [];

    for (const condition of conditions) {
        const key = condition?.key;
        if (!key) continue;

        const op = condition.op || 'eq';
        const value = condition.value;

        if (op === 'exists') {
            clauses.push({ metaIndex: { $elemMatch: { k: key } } });
            continue;
        }

        if (op === 'in') {
            const list = Array.isArray(value) ? value : [value];
            if (!list.length) continue;
            clauses.push({ metaIndex: { $elemMatch: { k: key, v: { $in: list } } } });
            continue;
        }

        if (op === 'gt' || op === 'gte' || op === 'lt' || op === 'lte') {
            const n = Number(value);
            if (!Number.isFinite(n)) continue;
            clauses.push({ metaIndex: { $elemMatch: { k: key, n: { [`$${op}`]: n } } } });
            continue;
        }

        if (op === 'ne') {
            // "not equal" must also match products missing the field entirely,
            // which $elemMatch alone cannot express.
            clauses.push({ metaIndex: { $not: { $elemMatch: { k: key, v: value } } } });
            continue;
        }

        clauses.push({ metaIndex: { $elemMatch: { k: key, v: value } } });
    }

    if (!clauses.length) return null;
    return clauses.length === 1 ? clauses[0] : { $and: clauses };
}
