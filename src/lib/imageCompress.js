import sharp from "sharp";

/**
 * Downscale + recompress to WebP, resize first so quality only has to give up
 * a little (near-lossless) instead of doing all the shrinking itself. Same
 * technique as scripts/importProductCatalog.js's Cloudinary re-host step,
 * tuned larger here since these are the actual on-site product photos
 * (zoomable), not catalog-import thumbnails.
 */
const DEFAULTS = {
    maxDimension: 1600,
    maxBytes: 250 * 1024,
    qualitySteps: [85, 78, 70, 60, 50],
};

export async function compressImage(buffer, opts = {}) {
    const { maxDimension, maxBytes, qualitySteps } = { ...DEFAULTS, ...opts };

    const resized = sharp(buffer).rotate().resize({
        width: maxDimension,
        height: maxDimension,
        fit: "inside",
        withoutEnlargement: true,
    });

    for (const quality of qualitySteps) {
        const out = await resized.clone().webp({ quality }).toBuffer();
        if (out.byteLength <= maxBytes) return out;
    }
    // Smallest quality step still over budget — ship it anyway, closest we can get.
    return resized.clone().webp({ quality: qualitySteps[qualitySteps.length - 1] }).toBuffer();
}
