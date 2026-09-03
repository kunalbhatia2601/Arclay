/**
 * Row-shape parsing/grouping for the "Catalog Sheet" admin page
 * (src/app/admin/products/spreadsheet). Same rules as
 * scripts/importProductCatalog.js: every Variations row is one SKU, every
 * Opt N Name is its own variation type (Flavour × Weight …), a product with a
 * single row is one product with one type and one variant. Pure functions
 * only: no DB here.
 */

export function trim(value) {
    return String(value ?? "").trim();
}

export function parseMoney(value, fallback = 0) {
    const raw = trim(value).replace(/[₹,\s]/g, "");
    if (!raw) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
}

export function parseNumber(value, fallback = null) {
    const raw = trim(value).replace(/[₹,%]/g, "");
    if (!raw) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
}

export function titleCaseOption(name, enabled = true) {
    const s = trim(name);
    if (!s || !enabled) return s;
    return s
        .toLowerCase()
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

/** Pull Opt 1–3 names and values off a row, skip blanks, pair from the start. */
export function compactVariationOptions(row, { untitledOptionName = "Option", normalizeOptionNames = true } = {}) {
    const names = [];
    const values = [];
    for (const n of [1, 2, 3]) {
        const name = titleCaseOption(row[`Opt ${n} Name`], normalizeOptionNames);
        const value = trim(row[`Opt ${n} Value`]);
        if (name) names.push(name);
        if (value) values.push(value);
    }
    const count = Math.max(names.length, values.length);
    const pairs = [];
    for (let i = 0; i < count; i++) {
        const value = values[i];
        if (!value) continue;
        pairs.push({ name: names[i] || untitledOptionName, value });
    }
    return pairs;
}

/**
 * Builds a product's `variationTypes` + `variants` (schema-ready, minus
 * barcode assignment — that's DB-aware and stays in the API route) from its
 * Variations-tab rows. Rows lacking a dimension their siblings have get
 * `missingOptionValue`. Two rows with the same option combo is an error here
 * (the importer splits them into extra products; in the editor you fix the row).
 */
export function buildVariantsFromRows(varRows, optCfg = {}) {
    const cfg = { missingOptionValue: "Regular", ...optCfg };
    const parsed = varRows.map((vr) => ({ vr, pairs: compactVariationOptions(vr, cfg) }));

    const typeOrder = [];
    for (const { pairs } of parsed) {
        for (const { name } of pairs) if (!typeOrder.includes(name)) typeOrder.push(name);
    }

    const typeOptions = new Map(typeOrder.map((t) => [t, []]));
    const seen = new Set();
    const variants = [];

    for (const { vr, pairs } of parsed) {
        const attributes = {};
        for (const typeName of typeOrder) {
            const pair = pairs.find((p) => p.name === typeName);
            const value = pair ? pair.value : cfg.missingOptionValue;
            attributes[typeName] = value;
            const opts = typeOptions.get(typeName);
            if (!opts.includes(value)) opts.push(value);
        }

        const comboKey = typeOrder.map((t) => `${t}=${attributes[t].toLowerCase()}`).join("|");
        if (seen.has(comboKey)) {
            throw new Error(`two variant rows have the same options (${comboKey || "no options"}) — change one`);
        }
        seen.add(comboKey);

        const mrp = parseMoney(vr.MRP, 0);
        let sale = parseMoney(vr.SP, null);
        if (sale == null && cfg.salePriceFallsBackToMrp !== false) sale = mrp;

        variants.push({
            attributes,
            regularPrice: mrp,
            salePrice: sale,
            costPrice: parseNumber(vr.CP, null),
            stock: parseNumber(vr.Stock, 0) ?? 0,
            sku: "",
            barcode: trim(vr.Barcode),
        });
    }

    return {
        variationTypes: typeOrder.map((t) => ({ name: t, options: typeOptions.get(t) })),
        variants,
    };
}

/** Variant attributes → Opt 1..3 Name/Value cells for the Variations tab. */
export function attributesToOpts(attributes) {
    const entries = Object.entries(attributes || {});
    const out = {};
    for (let i = 0; i < 3; i++) {
        const [name, value] = entries[i] || ["", ""];
        out[`Opt ${i + 1} Name`] = name;
        out[`Opt ${i + 1} Value`] = value;
    }
    return out;
}
