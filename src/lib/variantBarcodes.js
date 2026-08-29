import Product from '@/models/Product';
import { generateBarcodeValue } from './barcode';

const MAX_ATTEMPTS = 12;

/** Name of the product already holding this barcode, or null if it's free. */
async function ownerName(code, excludeProductId) {
    const query = { 'variants.barcode': code };
    if (excludeProductId) {
        query._id = { $ne: excludeProductId };
    }
    const owner = await Product.findOne(query, { name: 1 }).lean();
    return owner?.name || null;
}

async function nextFreeBarcode(reservedInBatch, excludeProductId) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const candidate = generateBarcodeValue();
        if (reservedInBatch.has(candidate)) continue;
        if (await ownerName(candidate, excludeProductId)) continue;
        return candidate;
    }
    throw new Error('Could not allocate a unique barcode, please try again');
}

/**
 * Returns a copy of `variants` where every entry has a barcode. Existing values
 * are preserved so relabelled stock keeps scanning; blank ones are filled with a
 * freshly generated, globally unique code.
 *
 * Throws if the request supplies a barcode already used by another product.
 */
export async function assignVariantBarcodes(variants, { excludeProductId } = {}) {
    const provided = [];
    const reserved = new Set();

    for (const variant of variants || []) {
        const code = String(variant?.barcode || '').trim();
        if (!code) continue;

        if (reserved.has(code)) {
            throw new Error(`Barcode ${code} is used twice in this product`);
        }
        const owner = await ownerName(code, excludeProductId);
        if (owner) {
            throw new Error(`Barcode ${code} is already assigned to "${owner}"`);
        }

        reserved.add(code);
        provided.push(code);
    }

    const result = [];
    for (const variant of variants || []) {
        const existing = String(variant?.barcode || '').trim();
        if (existing) {
            result.push({ ...variant, barcode: existing });
            continue;
        }

        const code = await nextFreeBarcode(reserved, excludeProductId);
        reserved.add(code);
        result.push({ ...variant, barcode: code });
    }

    return result;
}
