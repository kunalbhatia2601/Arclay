/**
 * Defaults for `node scripts/importProductCatalog.js`
 *
 * Edit this file, then run the import. Empty Excel cells use these values.
 * Command-line flags still override a few of them:
 *   --dry-run
 *   --wipe
 *   --file=./Product_Catalog_Template-4.xlsx
 */
export default {
    // Workbook next to package.json unless you pass --file=
    excelPath: "./Product_Catalog_Template-4.xlsx",

    // Preview only — no Mongo writes
    dryRun: false,

    // Delete ALL products and categories first. Leave false to upsert by name.
    wipeExistingCatalog: false,

    // skip | update  (match existing product by exact name)
    onExistingProduct: "update",

    isActive: true,
    isFeatured: false,

    defaults: {
        // Used when the sheet has no stock column
        stock: 100,

        // Used when CP is blank. null = leave cost empty (P/L will miss those lines)
        costPrice: null,

        // Used when GST % is blank
        taxRate: 0,

        // Used when HSN is blank
        hsn: "",

        // If SP is blank, copy MRP
        salePriceFallsBackToMrp: true,

        // Fill blank barcodes with a unique 12-digit code
        generateMissingBarcodes: true,

        // Variated=Yes but no Variations rows → still create as a simple product
        treatMissingVariationsAsSimple: true,

        // Blank option name (e.g. FEVI KWIK) uses this
        untitledOptionName: "Option",

        // Each Variations row is one SKU, not a Color×Size matrix.
        // Join Opt 1–3 into a single picker so leftover 2nd/3rd columns
        // do not grey out other sizes as "unavailable".
        flattenOptionsToSingleType: true,
        optionValueSeparator: " / ",
    },

    // Title-case option names so Flavour / flavour become one variation type
    normalizeOptionNames: true,

    // Auto-fill missing images from Open Food Facts (free, no API key, keyed by barcode)
    imageLookup: {
        enabled: false,

        // Only fetch when the sheet's Image URL / category image is blank —
        // never overwrites what's already filled in.
        onlyIfMissing: true,

        // Per product: front photo of every variant's barcode (visual gallery
        // across flavours/sizes) + ingredients/nutrition/packaging shots from
        // the first matched variant only, capped at this many total.
        maxImagesPerProduct: 6,

        // Also look up one representative image per Category / Sub-Category
        // by name (free-text search, no barcode available at that level).
        fetchCategoryImages: true,
        fetchSubCategoryImages: true,

        // Politeness delay between Open Food Facts requests (ms)
        requestDelayMs: 200,

        // Required by Open Food Facts API usage policy — identify your app
        userAgent: "Arclay-CatalogImport/1.0 (+https://arclay.example; contact: kunalbhatia.in)",
    },

    // Re-host every fetched image on our own Cloudinary instead of hotlinking
    // Open Food Facts. Downscales + recompresses to WebP under maxBytes first
    // (resize before quality drop = near-lossless), uploads, stores our URL.
    cloudinaryUpload: {
        enabled: true,

        // Hard cap per image. Resize handles most of the shrink; quality only
        // steps down if still over budget after resizing.
        maxBytes: 100 * 1024,

        // Product photos rarely need to be wider than this — shrinking to it
        // before touching quality is what keeps images near-lossless.
        maxDimension: 1200,

        // WebP quality ladder tried in order until under maxBytes
        qualitySteps: [85, 78, 70, 60, 50],

        folder: "catalog-import",
    },
};
