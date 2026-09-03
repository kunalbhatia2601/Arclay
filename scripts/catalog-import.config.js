/**
 * Defaults for `node scripts/importProductCatalog.js`
 *
 * Edit this file, then run the import. Empty Excel cells use these values.
 * Command-line flags still override a few of them:
 *   --dry-run
 *   --wipe
 *   --file="./Copy of Product_Catalog_Template.xlsx"
 */
export default {
    // Workbook next to package.json unless you pass --file=
    excelPath: "./Copy of Product_Catalog_Template.xlsx",

    // Sheet names inside the workbook. Prices/options/barcodes come from
    // `variations` only; `products` carries name, category, descriptions, GST, HSN.
    sheets: {
        categories: "CATEGORY PAGE MASTER",
        subCategories: "SUB-CATEGORY PAGE MASTER",
        products: "NEW PRODUCT PAGE",
        variations: "Variations",
    },

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

        // Product has no Variations rows at all → fall back to the product
        // sheet's own MRP/CP/SP as a single variant instead of skipping it
        treatMissingVariationsAsSimple: true,

        // Product row with a blank Category: "first" = first row of the
        // categories sheet, or give a category name. null = skip the product.
        fallbackCategory: "first",

        // Blank option name uses this
        untitledOptionName: "Option",

        // Each Opt N Name is its own variation type (Flavour × Weight …).
        // When one row of a product lacks a type its sibling rows have
        // (e.g. Tata Tea: Weight-only rows next to Flavour+Weight rows),
        // that row gets this value so it stays selectable in the picker.
        missingOptionValue: "Regular",
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
