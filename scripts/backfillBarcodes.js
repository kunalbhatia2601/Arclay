/**
 * Backfill variant barcodes.
 *
 * Products created before per-variant barcodes existed have no code to print or
 * scan. This assigns a unique 12-digit value to every variant that is missing
 * one and leaves existing values untouched.
 *
 * Usage: node scripts/backfillBarcodes.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const rawURI = process.env.MONGODB_URI || '';
const siteName = (process.env.NEXT_PUBLIC_SITE_NAME || 'arclay').toLowerCase();

let MONGODB_URI = rawURI;
if (rawURI && !rawURI.includes('.net/')) {
    MONGODB_URI = rawURI.replace('.net', `.net/${siteName}`);
}

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
}

// Minimal schema — we only touch variants, so strict mode is off to avoid
// dropping fields this script does not know about.
const ProductSchema = new mongoose.Schema({}, { strict: false, collection: 'products' });
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

function generateBarcodeValue() {
    let digits = '';
    for (let i = 0; i < 12; i++) {
        digits += Math.floor(Math.random() * 10);
    }
    if (digits[0] === '0') digits = '1' + digits.slice(1);
    return digits;
}

async function run() {
    await mongoose.connect(MONGODB_URI);
    console.log(`Connected to ${mongoose.connection.name}`);

    const products = await Product.find({}).lean();

    // Collect every code already in use so generated values stay unique.
    const used = new Set();
    for (const product of products) {
        for (const variant of product.variants || []) {
            if (variant.barcode) used.add(String(variant.barcode));
        }
        if (product.barcode) used.add(String(product.barcode));
    }

    let productsUpdated = 0;
    let variantsAssigned = 0;

    for (const product of products) {
        const variants = product.variants || [];
        const missing = variants.filter((v) => !v.barcode);
        if (missing.length === 0) continue;

        const updates = {};
        variants.forEach((variant, index) => {
            if (variant.barcode) return;

            let code = generateBarcodeValue();
            while (used.has(code)) code = generateBarcodeValue();
            used.add(code);

            updates[`variants.${index}.barcode`] = code;
            variantsAssigned++;
        });

        await Product.updateOne({ _id: product._id }, { $set: updates });
        productsUpdated++;
        console.log(`  ${product.name}: assigned ${Object.keys(updates).length} barcode(s)`);
    }

    console.log(`\nDone. ${variantsAssigned} barcode(s) across ${productsUpdated} product(s).`);
    await mongoose.disconnect();
}

run().catch(async (error) => {
    console.error('Backfill failed:', error);
    await mongoose.disconnect();
    process.exit(1);
});
