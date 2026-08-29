/**
 * Row-shape parsing/grouping for the "Catalog Sheet" admin page
 * (src/app/admin/products/spreadsheet). Same 4 tabs, same column names, same
 * Opt 1-3 flattening and TYPE-column split as Product_Catalog_Template*.xlsx
 * and scripts/importProductCatalog.js — so a row typed here and a row typed
 * in Excel produce the exact same product. Pure functions only: no DB here.
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
    const raw = trim(value).replace(/%/g, "");
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

export function singleOptionTypeName(allPairs, untitledOptionName = "Option") {
    const names = [];
    for (const pairs of allPairs) {
        if (pairs[0]?.name && !names.includes(pairs[0].name)) names.push(pairs[0].name);
    }
    return names.length === 1 ? names[0] : untitledOptionName;
}

export function flattenPairs(pairs, typeName, separator, variantLabel) {
    const label = trim(variantLabel) || pairs.map((p) => p.value).filter(Boolean).join(separator);
    if (!label) return { attributes: {}, label: "" };
    return { attributes: { [typeName]: label }, label };
}

export function isTypeOption(name) {
    return trim(name).toLowerCase() === "type";
}

export function dropTypePairs(pairs) {
    return pairs.filter((p) => !isTypeOption(p.name));
}

/**
 * TYPE column → own product named "{Product} {Type value}", unless the Type
 * value equals the product name. Same behavior as the import script.
 */
export function groupVariationJobs(productName, varRows, optCfg) {
    if (!varRows.length) {
        return [{ name: productName, items: [], splitByType: false }];
    }

    const leftover = [];
    const byType = new Map();
    for (const vr of varRows) {
        const pairs = compactVariationOptions(vr, optCfg);
        const typePair = pairs.find((p) => isTypeOption(p.name));
        if (!typePair) {
            leftover.push({ vr, pairs });
            continue;
        }
        const key = typePair.value;
        if (!byType.has(key)) byType.set(key, []);
        byType.get(key).push({ vr, pairs: dropTypePairs(pairs) });
    }

    const jobs = [];
    if (leftover.length) {
        jobs.push({ name: productName, items: leftover, splitByType: false });
    }
    for (const [typeValue, items] of byType) {
        const same = typeValue.toLowerCase() === productName.toLowerCase();
        jobs.push({
            name: same ? productName : `${productName} ${typeValue}`.replace(/\s+/g, " ").trim(),
            items,
            splitByType: true,
        });
    }

    const merged = new Map();
    for (const job of jobs) {
        if (!merged.has(job.name)) {
            merged.set(job.name, { name: job.name, items: [], splitByType: false });
        }
        const target = merged.get(job.name);
        target.items.push(...job.items);
        target.splitByType = target.splitByType || job.splitByType;
    }
    return [...merged.values()];
}

/**
 * Builds one product's `variationTypes` + `variants` (schema-ready, minus
 * barcode assignment — that's DB-aware and stays in the API route) from a
 * job's Variations-tab rows. Mirrors the per-job loop in
 * scripts/importProductCatalog.js.
 */
export function buildVariantsForJob(job, optCfg) {
    const flatten = optCfg.flattenOptionsToSingleType !== false;
    const separator = optCfg.optionValueSeparator || " / ";
    const hasVariationRows = job.items.length > 0;

    if (!hasVariationRows) {
        return { variationTypes: [], variants: [], hasVariationRows: false };
    }

    const typeMap = new Map();
    const allPairs = job.items.map((item) => item.pairs);
    const flatTypeName = flatten ? singleOptionTypeName(allPairs, optCfg.untitledOptionName) : null;
    const variants = [];

    for (const { vr, pairs: optionPairs } of job.items) {
        let attrs = {};
        if (flatten) {
            const flat = flattenPairs(optionPairs, flatTypeName, separator, job.splitByType ? "" : vr["Variant Label"]);
            attrs = flat.attributes;
            if (flat.label) {
                if (!typeMap.has(flatTypeName)) typeMap.set(flatTypeName, []);
                if (!typeMap.get(flatTypeName).includes(flat.label)) typeMap.get(flatTypeName).push(flat.label);
            }
        } else {
            for (const { name: optName, value: optValue } of optionPairs) {
                attrs[optName] = optValue;
                if (!typeMap.has(optName)) typeMap.set(optName, []);
                if (!typeMap.get(optName).includes(optValue)) typeMap.get(optName).push(optValue);
            }
        }

        const mrp = parseMoney(vr.MRP, 0);
        let sale = parseMoney(vr.SP, null);
        if (sale == null && optCfg.salePriceFallsBackToMrp) sale = mrp;
        const cost = parseNumber(vr.CP, null);

        variants.push({
            attributes: attrs,
            regularPrice: mrp,
            salePrice: sale,
            costPrice: cost,
            stock: parseNumber(vr.Stock, 0) ?? 0,
            sku: "",
            barcode: trim(vr.Barcode),
        });
    }

    const variationTypes = [...typeMap.entries()].map(([n, options]) => ({ name: n, options }));
    return { variationTypes, variants, hasVariationRows: true };
}

/** Splits a flattened variant's single-key attributes map back into Opt 1
 * Name/Value for display in the Variations tab. */
export function attributesToOpt1(attributes) {
    const entries = Object.entries(attributes || {});
    const [name, value] = entries[0] || ["", ""];
    return { "Opt 1 Name": name, "Opt 1 Value": value };
}
