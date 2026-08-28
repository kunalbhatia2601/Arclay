/**
 * Import Product_Catalog_Template-2.xlsx (multi-sheet) into MongoDB.
 *
 * Edit defaults in scripts/catalog-import.config.js, then:
 *   node scripts/importProductCatalog.js
 *   node scripts/importProductCatalog.js --dry-run
 *   node scripts/importProductCatalog.js --wipe
 *   node scripts/importProductCatalog.js --file=./Product_Catalog_Template-2.xlsx
 *   node scripts/importProductCatalog.js --no-images   (skip Open Food Facts image lookup)
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import XLSX from "xlsx";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const args = process.argv.slice(2);
const argFile = args.find((a) => a.startsWith("--file="))?.slice("--file=".length);
const argDry = args.includes("--dry-run");
const argWipe = args.includes("--wipe");
const argNoImages = args.includes("--no-images");

const rawURI = process.env.MONGODB_URI || "";
const siteName = (process.env.NEXT_PUBLIC_SITE_NAME || "arclay").toLowerCase();
let MONGODB_URI = rawURI;
if (rawURI && !rawURI.includes(".net/")) {
    MONGODB_URI = rawURI.replace(".net", `.net/${siteName}`);
}

const CategorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 100 },
        parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
        image: { type: String, default: "" },
        description: { type: String, trim: true, maxlength: 500, default: "" },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true, collection: "categories" }
);

const ProductSchema = new mongoose.Schema({}, { strict: false, collection: "products" });

const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);
const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

function loadConfig() {
    return import(pathToFileURL(path.join(__dirname, "catalog-import.config.js")).href);
}

/**
 * `raw: false` gives formatted display text, which is what we want for money/
 * dates — but Excel renders long numbers (barcodes) as "8.90172E+12", and two
 * different 13-digit barcodes can format down to the identical string. For
 * `columns` that must stay exact, overwrite with the true integer from a raw
 * numeric pass whenever the cell was actually stored as a number.
 */
function sheetRows(wb, name, columns = []) {
    const ws = wb.Sheets[name];
    if (!ws) throw new Error(`Sheet "${name}" is missing`);
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
    if (!columns.length) return rows;

    const rawRows = XLSX.utils.sheet_to_json(ws, { defval: "", raw: true });
    rows.forEach((row, i) => {
        for (const col of columns) {
            const rawValue = rawRows[i]?.[col];
            if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
                row[col] = String(Math.round(rawValue));
            }
        }
    });
    return rows;
}

function trim(value) {
    return String(value ?? "").trim();
}

function parseMoney(value, fallback = 0) {
    const raw = trim(value).replace(/[₹,\s]/g, "");
    if (!raw) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
}

function parseNumber(value, fallback = null) {
    const raw = trim(value).replace(/%/g, "");
    if (!raw) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
}

function parseDate(value) {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    const s = trim(value);
    if (!s) return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
}

function titleCaseOption(name, enabled) {
    const s = trim(name);
    if (!s) return s;
    if (!enabled) return s;
    return s
        .toLowerCase()
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

/** Pull Opt 1–3 names and values, skip blanks, pair from the start (1st filled = option 1). */
function compactVariationOptions(row, { untitledOptionName, normalizeOptionNames }) {
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
        pairs.push({
            name: names[i] || untitledOptionName,
            value,
        });
    }
    return pairs;
}

function singleOptionTypeName(allPairs, untitledOptionName) {
    const names = [];
    for (const pairs of allPairs) {
        if (pairs[0]?.name && !names.includes(pairs[0].name)) names.push(pairs[0].name);
    }
    return names.length === 1 ? names[0] : untitledOptionName;
}

function flattenPairs(pairs, typeName, separator, variantLabel) {
    const label =
        trim(variantLabel) || pairs.map((p) => p.value).filter(Boolean).join(separator);
    if (!label) return { attributes: {}, label: "" };
    return { attributes: { [typeName]: label }, label };
}

function isTypeOption(name) {
    return trim(name).toLowerCase() === "type";
}

function dropTypePairs(pairs) {
    return pairs.filter((p) => !isTypeOption(p.name));
}

/** TYPE column → own product named "{Product} {Type value}", unless Type value equals the product name. */
function groupVariationJobs(productName, varRows, optCfg) {
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
            name: same
                ? productName
                : `${productName} ${typeValue}`.replace(/\s+/g, " ").trim(),
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

/** Sleep helper for polite pacing against the Open Food Facts API. */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Open Food Facts lookups: free, no API key, keyed by barcode or free-text search. */
function makeImageLookup(cfg) {
    const enabled = !!cfg?.enabled;
    const userAgent = cfg?.userAgent || "Arclay-CatalogImport/1.0";
    const delayMs = Number(cfg?.requestDelayMs) || 0;
    const byBarcode = new Map(); // barcode -> { front, extras[] } | null
    const byTerm = new Map(); // search term -> image url | null
    let lastCallAt = 0;

    async function throttle() {
        if (!delayMs) return;
        const wait = lastCallAt + delayMs - Date.now();
        if (wait > 0) await sleep(wait);
        lastCallAt = Date.now();
    }

    async function fetchJson(url) {
        await throttle();
        const res = await fetch(url, { headers: { "User-Agent": userAgent } });
        if (!res.ok) return null;
        return res.json();
    }

    /** Front photo + any ingredients/nutrition/packaging shots for one barcode. */
    function productImages(barcode) {
        if (!enabled || !barcode) return Promise.resolve({ front: null, extras: [] });
        const code = trim(barcode);
        if (!code) return Promise.resolve({ front: null, extras: [] });
        // Store the in-flight promise itself (not the resolved value) so concurrent
        // calls for the same barcode share one request instead of racing.
        if (byBarcode.has(code)) return byBarcode.get(code);

        const promise = (async () => {
            let result = { front: null, extras: [] };
            try {
                const fields =
                    "image_front_url,image_url,image_ingredients_url,image_nutrition_url,image_packaging_url";
                const json = await fetchJson(
                    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${fields}`
                );
                const p = json?.status === 1 ? json.product : null;
                if (p) {
                    result = {
                        front: p.image_front_url || p.image_url || null,
                        extras: [p.image_ingredients_url, p.image_nutrition_url, p.image_packaging_url].filter(
                            Boolean
                        ),
                    };
                }
            } catch {
                // Network hiccup or bad response — treat as "no image found"
            }
            return result;
        })();
        byBarcode.set(code, promise);
        return promise;
    }

    /** One representative image for a free-text term (category / sub-category name). */
    async function searchImage(term) {
        const urls = await searchImages(term, 1);
        return urls[0] || null;
    }

    /**
     * Fallback for products whose exact barcode isn't in Open Food Facts: free-text
     * search by name/brand. Catches items registered under a different barcode or
     * not barcode-indexed at all — usually front shots of different pack sizes,
     * which still make a decent gallery when nothing else matched.
     */
    function searchImages(term, limit = 5) {
        if (!enabled || !term) return Promise.resolve([]);
        const key = `${trim(term).toLowerCase()}::${limit}`;
        if (byTerm.has(key)) return byTerm.get(key);

        const promise = (async () => {
            let urls = [];
            try {
                const json = await fetchJson(
                    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
                        term
                    )}&json=1&page_size=${limit}&fields=image_front_url`
                );
                urls = [...new Set((json?.products || []).map((p) => p.image_front_url).filter(Boolean))];
            } catch {
                // No image found for this term — leave blank, not fatal
            }
            return urls;
        })();
        byTerm.set(key, promise);
        return promise;
    }

    return { enabled, productImages, searchImage, searchImages };
}

/**
 * Downloads a source image, downscales + recompresses to WebP under maxBytes
 * (resize first, quality ladder only if still over budget — keeps it visually
 * near-lossless instead of just crushing quality), then re-hosts it on our own
 * Cloudinary. Falls back to the original URL if anything in the pipeline fails.
 */
function makeCloudinaryRehost(cfg, { dryRun } = {}) {
    const enabled = !!cfg?.enabled && !dryRun;
    if (cfg?.enabled) {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
    }
    const maxBytes = cfg?.maxBytes || 100 * 1024;
    const maxDimension = cfg?.maxDimension || 1200;
    const qualitySteps = cfg?.qualitySteps?.length ? cfg.qualitySteps : [85, 78, 70, 60, 50];
    const folder = cfg?.folder || "catalog-import";
    const cache = new Map(); // source url -> hosted url | null

    async function compress(buffer) {
        const resized = sharp(buffer).resize({
            width: maxDimension,
            height: maxDimension,
            fit: "inside",
            withoutEnlargement: true,
        });
        for (const quality of qualitySteps) {
            const out = await resized.clone().webp({ quality }).toBuffer();
            if (out.byteLength <= maxBytes) return out;
        }
        // Smallest quality step still over budget — ship it anyway, closest we can get
        return resized.clone().webp({ quality: qualitySteps[qualitySteps.length - 1] }).toBuffer();
    }

    function rehost(sourceUrl) {
        if (!enabled || !sourceUrl) return Promise.resolve(sourceUrl);
        // In-flight promise, not resolved value — concurrent requests for the same
        // source image (shared across variants) share one download+upload.
        if (cache.has(sourceUrl)) return cache.get(sourceUrl);

        const promise = (async () => {
            let result = null;
            try {
                const res = await fetch(sourceUrl);
                if (!res.ok) throw new Error(`fetch ${res.status}`);
                const buffer = Buffer.from(await res.arrayBuffer());
                const webp = await compress(buffer);
                const uploaded = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder, resource_type: "image", format: "webp" },
                        (err, r) => (err ? reject(err) : resolve(r))
                    );
                    stream.end(webp);
                });
                result = uploaded.secure_url;
            } catch {
                result = null; // fall back to the source URL below
            }
            return result || sourceUrl;
        })();
        cache.set(sourceUrl, promise);
        return promise;
    }

    return { enabled, rehost };
}

function generateBarcodeValue() {
    let digits = "";
    for (let i = 0; i < 12; i++) digits += Math.floor(Math.random() * 10);
    return digits;
}

function syncDerived(variants) {
    const prices = variants
        .map((v) =>
            v.salePrice != null && v.salePrice < v.regularPrice ? v.salePrice : v.regularPrice
        )
        .filter((p) => typeof p === "number" && !Number.isNaN(p));
    return {
        minPrice: prices.length ? Math.min(...prices) : 0,
        maxPrice: prices.length ? Math.max(...prices) : 0,
        hasSale: variants.some((v) => v.salePrice != null && v.salePrice < v.regularPrice),
        totalStock: variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0),
    };
}

function parentColumn(row) {
    if (row["Parent Category"] != null && trim(row["Parent Category"])) return trim(row["Parent Category"]);
    if (row.Parent != null && trim(row.Parent)) return trim(row.Parent);
    const keys = Object.keys(row);
    const first = keys[0];
    if (first && first !== "Sub-Category Name") return trim(row[first]);
    return "";
}

async function uniqueBarcode(taken, { dryRun } = {}) {
    for (let i = 0; i < 24; i++) {
        const code = generateBarcodeValue();
        if (taken.has(code)) continue;
        if (!dryRun) {
            const exists = await Product.exists({ "variants.barcode": code });
            if (exists) continue;
        }
        taken.add(code);
        return code;
    }
    throw new Error("Could not allocate a unique barcode");
}

async function upsertCategory({ name, description, parentId, dryRun, cache, imageLookup, wantImage, rehost }) {

    const key = `${parentId || "root"}::${name.toLowerCase()}`;
    if (cache.has(key)) return cache.get(key);

    if (dryRun) {
        const fake = new mongoose.Types.ObjectId();
        cache.set(key, fake);
        return fake;
    }

    let doc = await Category.findOne({
        name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        parent: parentId || null,
    });

    if (!doc) {
        doc = await Category.create({
            name,
            description: description || "",
            parent: parentId || null,
            isActive: true,
        });
    } else if (description && !doc.description) {
        doc.description = description;
        await doc.save();
    }

    if (wantImage && imageLookup?.enabled && !doc.image) {
        const image = await imageLookup.searchImage(name);
        if (image) {
            doc.image = rehost ? await rehost(image) : image;
            await doc.save();
        }
    }

    cache.set(key, doc._id);
    return doc._id;
}

async function main() {
    const { default: fileConfig } = await loadConfig();
    const config = {
        ...fileConfig,
        dryRun: argDry || fileConfig.dryRun,
        wipeExistingCatalog: argWipe || fileConfig.wipeExistingCatalog,
        excelPath: argFile || fileConfig.excelPath,
        defaults: { ...fileConfig.defaults },
        imageLookup: {
            ...fileConfig.imageLookup,
            enabled: argNoImages ? false : fileConfig.imageLookup?.enabled,
        },
    };

    const excelAbs = path.isAbsolute(config.excelPath)
        ? config.excelPath
        : path.join(__dirname, "..", config.excelPath);

    if (!fs.existsSync(excelAbs)) {
        console.error(`Excel file not found: ${excelAbs}`);
        process.exit(1);
    }

    if (!config.dryRun && !MONGODB_URI) {
        console.error("MONGODB_URI is not set in .env");
        process.exit(1);
    }

    console.log("File:", excelAbs);
    console.log("Dry run:", config.dryRun);
    console.log("Wipe catalog:", config.wipeExistingCatalog);
    console.log("Defaults:", config.defaults);

    const wb = XLSX.readFile(excelAbs, { cellDates: true });
    const categories = sheetRows(wb, "Categories").filter((r) => trim(r["Category Name"]));
    const subCategories = sheetRows(wb, "Sub-Categories").filter((r) => trim(r["Sub-Category Name"]));
    const products = sheetRows(wb, "Products", ["Barcode"]).filter((r) => trim(r["Product Name"]));
    const variations = sheetRows(wb, "Variations", ["Barcode"]).filter((r) => trim(r["Product Name"]));

    const varsByProduct = new Map();
    for (const row of variations) {
        const name = trim(row["Product Name"]);
        if (!varsByProduct.has(name)) varsByProduct.set(name, []);
        varsByProduct.get(name).push(row);
    }

    if (!config.dryRun) {
        await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
        if (config.wipeExistingCatalog) {
            const p = await Product.deleteMany({});
            const c = await Category.deleteMany({});
            console.log(`Wiped ${p.deletedCount} products, ${c.deletedCount} categories`);
        }
    }

    const catCache = new Map();
    const imageLookup = makeImageLookup(config.imageLookup);
    const cloudinaryRehost = makeCloudinaryRehost(config.cloudinaryUpload, { dryRun: config.dryRun });
    if (config.cloudinaryUpload?.enabled && !config.dryRun) {
        for (const key of ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]) {
            if (!process.env[key]) {
                console.error(`${key} is not set in .env — required for cloudinaryUpload`);
                process.exit(1);
            }
        }
    }
    const stats = {
        categories: 0,
        subcategories: 0,
        productsCreated: 0,
        productsUpdated: 0,
        productsSkipped: 0,
        variants: 0,
        imagesFetched: 0,
        imagesMissing: 0,
        imagesRehosted: 0,
        errors: [],
    };

    for (const row of categories) {
        const name = trim(row["Category Name"]);
        await upsertCategory({
            name,
            description: trim(row["Description (optional)"]),
            parentId: null,
            dryRun: config.dryRun,
            cache: catCache,
            imageLookup,
            wantImage: config.imageLookup?.fetchCategoryImages,
            rehost: cloudinaryRehost.rehost,
        });
        stats.categories++;
    }

    for (const row of subCategories) {
        const parentName = parentColumn(row);
        const name = trim(row["Sub-Category Name"]);
        if (!parentName) {
            stats.errors.push(`Sub-category "${name}" has no parent category`);
            continue;
        }
        const parentId = await upsertCategory({
            name: parentName,
            description: "",
            parentId: null,
            dryRun: config.dryRun,
            cache: catCache,
            imageLookup,
            wantImage: config.imageLookup?.fetchCategoryImages,
            rehost: cloudinaryRehost.rehost,
        });
        await upsertCategory({
            name,
            description: trim(row["Description (optional)"]),
            parentId,
            dryRun: config.dryRun,
            cache: catCache,
            imageLookup,
            wantImage: config.imageLookup?.fetchSubCategoryImages,
            rehost: cloudinaryRehost.rehost,
        });
        stats.subcategories++;
    }

    const takenBarcodes = new Set();
    const barcodeOwner = new Map();
    if (!config.dryRun) {
        const existing = await Product.find({}, { name: 1, "variants.barcode": 1 }).lean();
        for (const p of existing) {
            for (const v of p.variants || []) {
                if (!v.barcode) continue;
                const code = String(v.barcode);
                takenBarcodes.add(code);
                barcodeOwner.set(code, p.name);
            }
        }
    }

    for (const row of products) {
        const name = trim(row["Product Name"]);
        try {
            const categoryName = trim(row.Category);
            if (!categoryName) {
                stats.errors.push(`${name}: missing category`);
                stats.productsSkipped++;
                continue;
            }

            const categoryId = await upsertCategory({
                name: categoryName,
                description: "",
                parentId: null,
                dryRun: config.dryRun,
                cache: catCache,
                imageLookup,
                wantImage: config.imageLookup?.fetchCategoryImages,
                rehost: cloudinaryRehost.rehost,
            });

            let subcategoryId = null;
            const subName = trim(row["Sub-Category"]);
            if (subName) {
                subcategoryId = await upsertCategory({
                    name: subName,
                    description: "",
                    parentId: categoryId,
                    dryRun: config.dryRun,
                    cache: catCache,
                    imageLookup,
                    wantImage: config.imageLookup?.fetchSubCategoryImages,
                    rehost: cloudinaryRehost.rehost,
                });
            }

            const isVariated = trim(row["Is Variated"]).toLowerCase() === "yes";
            const varRows = varsByProduct.get(name) || [];
            const optCfg = {
                untitledOptionName: config.defaults.untitledOptionName,
                normalizeOptionNames: config.normalizeOptionNames,
            };

            if (isVariated && varRows.length === 0 && !config.defaults.treatMissingVariationsAsSimple) {
                stats.errors.push(`${name}: marked variated but has no Variations rows`);
                stats.productsSkipped++;
                continue;
            }

            const images = trim(row["Image URL"])
                .split(",")
                .map((u) => u.trim())
                .filter(Boolean);

            const taxRate =
                parseNumber(row["GST %"], null) ?? config.defaults.taxRate ?? 0;
            const hsn = trim(row.HSN) || config.defaults.hsn || "";
            const flatten = config.defaults.flattenOptionsToSingleType !== false;
            const separator = config.defaults.optionValueSeparator || " / ";
            const jobs = groupVariationJobs(name, varRows, optCfg);

            for (const job of jobs) {
                let variationTypes = [];
                let variants = [];
                const hasVariationRows = job.items.length > 0;

                // Real sheet barcodes only (not the random ones generateMissingBarcodes
                // fills in below) — those are the only ones Open Food Facts can match.
                const jobRawBarcodes = hasVariationRows
                    ? [...new Set(job.items.map((it) => trim(it.vr.Barcode)).filter(Boolean))]
                    : trim(row.Barcode)
                    ? [trim(row.Barcode)]
                    : [];

                if (hasVariationRows) {
                    const typeMap = new Map();
                    const allPairs = job.items.map((item) => item.pairs);
                    const flatTypeName = flatten
                        ? singleOptionTypeName(allPairs, config.defaults.untitledOptionName)
                        : null;

                    for (const { vr, pairs: optionPairs } of job.items) {
                        let attrs = {};
                        if (flatten) {
                            const flat = flattenPairs(
                                optionPairs,
                                flatTypeName,
                                separator,
                                job.splitByType ? "" : vr["Variant Label"]
                            );
                            attrs = flat.attributes;
                            if (flat.label) {
                                if (!typeMap.has(flatTypeName)) typeMap.set(flatTypeName, []);
                                if (!typeMap.get(flatTypeName).includes(flat.label)) {
                                    typeMap.get(flatTypeName).push(flat.label);
                                }
                            }
                        } else {
                            for (const { name: optName, value: optValue } of optionPairs) {
                                attrs[optName] = optValue;
                                if (!typeMap.has(optName)) typeMap.set(optName, []);
                                if (!typeMap.get(optName).includes(optValue)) {
                                    typeMap.get(optName).push(optValue);
                                }
                            }
                        }

                        const mrp = parseMoney(vr.MRP, 0);
                        let sale = parseMoney(vr.SP, null);
                        if (sale == null && config.defaults.salePriceFallsBackToMrp) sale = mrp;
                        const cost = parseNumber(vr.CP, null) ?? config.defaults.costPrice;

                        let barcode = trim(vr.Barcode);
                        if (!barcode && config.defaults.generateMissingBarcodes) {
                            barcode = await uniqueBarcode(takenBarcodes, { dryRun: config.dryRun });
                        } else if (barcode) {
                            const owner = barcodeOwner.get(barcode);
                            if (owner && owner !== job.name) {
                                stats.errors.push(
                                    `${job.name}: duplicate barcode ${barcode} (also on ${owner})`
                                );
                            }
                            takenBarcodes.add(barcode);
                            barcodeOwner.set(barcode, job.name);
                        }

                        variants.push({
                            attributes: attrs,
                            regularPrice: mrp,
                            salePrice: sale,
                            costPrice: cost,
                            stock: config.defaults.stock,
                            sku: "",
                            barcode: barcode || "",
                            expiresAt: parseDate(vr["Expire Date"]),
                        });
                    }

                    variationTypes = [...typeMap.entries()].map(([n, options]) => ({
                        name: n,
                        options,
                    }));
                } else {
                    const mrp = parseMoney(row.MRP, 0);
                    let sale = parseMoney(row.SP, null);
                    if (sale == null && config.defaults.salePriceFallsBackToMrp) sale = mrp;
                    const cost = parseNumber(row.CP, null) ?? config.defaults.costPrice;
                    let barcode = trim(row.Barcode);
                    if (!barcode && config.defaults.generateMissingBarcodes) {
                        barcode = await uniqueBarcode(takenBarcodes, { dryRun: config.dryRun });
                    } else if (barcode) {
                        takenBarcodes.add(barcode);
                        barcodeOwner.set(barcode, job.name);
                    }

                    variants = [
                        {
                            attributes: {},
                            regularPrice: mrp,
                            salePrice: sale,
                            costPrice: cost,
                            stock: config.defaults.stock,
                            sku: "",
                            barcode: barcode || "",
                            expiresAt: null,
                        },
                    ];
                }

                if (!variants.length) {
                    stats.errors.push(`${job.name}: no variants to save`);
                    stats.productsSkipped++;
                    continue;
                }

                let jobImages = images;
                const wantJobImages = config.imageLookup?.onlyIfMissing !== false ? images.length === 0 : true;
                if (imageLookup.enabled && wantJobImages) {
                    const cap = config.imageLookup?.maxImagesPerProduct || 6;
                    const gathered = [];

                    // Tier 1: exact barcode match, fetched concurrently — one variant's
                    // barcode doesn't have to wait on another's. Front shot from every
                    // barcode (gallery across flavours/sizes); ingredients/nutrition/
                    // packaging only from the first variant that has them.
                    const perBarcode = await Promise.all(
                        jobRawBarcodes.map((code) => imageLookup.productImages(code))
                    );
                    perBarcode.forEach(({ front, extras }, i) => {
                        const candidates = i === 0 ? [front, ...extras] : [front];
                        for (const url of candidates) {
                            if (url && !gathered.includes(url) && gathered.length < cap) gathered.push(url);
                        }
                    });

                    // Tier 2: barcode not in Open Food Facts (or none on the sheet) —
                    // fall back to a name search. Usually front-only shots of
                    // whatever pack sizes OFF has under that brand/product name.
                    if (gathered.length === 0) {
                        const nameHits = await imageLookup.searchImages(job.name, cap);
                        for (const url of nameHits) {
                            if (url && !gathered.includes(url) && gathered.length < cap) gathered.push(url);
                        }
                    }

                    if (gathered.length) {
                        // Kept under cap before this point, so all of it is worth rehosting.
                        jobImages = await Promise.all(gathered.map((url) => cloudinaryRehost.rehost(url)));
                        if (cloudinaryRehost.enabled) stats.imagesRehosted += jobImages.length;
                        stats.imagesFetched += gathered.length;
                    } else {
                        stats.imagesMissing++;
                    }
                }

                const derived = syncDerived(variants);
                const payload = {
                    name: job.name,
                    images: jobImages,
                    description: trim(row["Short Description"]),
                    long_description: trim(row["Long Description"]),
                    variationTypes,
                    variants,
                    category: categoryId,
                    subcategory: subcategoryId,
                    isActive: config.isActive,
                    isFeatured: config.isFeatured,
                    barcode: hasVariationRows ? "" : trim(row.Barcode),
                    taxRate,
                    hsn,
                    ...derived,
                };

                stats.variants += variants.length;

                if (config.dryRun) {
                    stats.productsCreated++;
                    continue;
                }

                const existing = await Product.findOne({ name: job.name });
                if (existing) {
                    if (config.onExistingProduct === "skip") {
                        stats.productsSkipped++;
                        continue;
                    }
                    await Product.updateOne({ _id: existing._id }, { $set: payload });
                    stats.productsUpdated++;
                } else {
                    await Product.create(payload);
                    stats.productsCreated++;
                }
            }
        } catch (err) {
            stats.errors.push(`${name}: ${err.message}`);
            stats.productsSkipped++;
        }
    }

    console.log("\nDone");
    console.log(`  Categories:     ${stats.categories}`);
    console.log(`  Sub-categories: ${stats.subcategories}`);
    console.log(`  Created:        ${stats.productsCreated}`);
    console.log(`  Updated:        ${stats.productsUpdated}`);
    console.log(`  Skipped:        ${stats.productsSkipped}`);
    console.log(`  Variant rows:   ${stats.variants}`);
    console.log(`  Images fetched: ${stats.imagesFetched} (Open Food Facts)`);
    console.log(`  Images rehosted: ${stats.imagesRehosted} (Cloudinary, <${(config.cloudinaryUpload?.maxBytes || 0) / 1024}KB WebP)`);
    console.log(`  Images missing: ${stats.imagesMissing} products (needs manual sourcing)`);
    if (stats.errors.length) {
        console.log(`  Issues (${stats.errors.length}):`);
        for (const e of stats.errors.slice(0, 40)) console.log("   -", e);
        if (stats.errors.length > 40) console.log(`   … ${stats.errors.length - 40} more`);
    }

    if (!config.dryRun) await mongoose.disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
