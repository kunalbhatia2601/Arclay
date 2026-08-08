/**
 * Backfills the denormalized fields added to Product:
 *   minPrice, maxPrice, hasSale, totalStock  — computed from variants
 *   salesCount                               — computed from historical Orders
 *
 * Existing documents predate the pre-save hook, so they carry the schema
 * defaults (0/false) until this runs. Storefront price filtering and
 * bestseller sorting read these fields, so run it once after deploying.
 *
 * Usage:  node scripts/backfillProductDerived.js
 *         node scripts/backfillProductDerived.js --dry
 */

const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const DRY_RUN = process.argv.includes('--dry');

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI is not set. Add it to .env.local first.');
        process.exit(1);
    }

    await mongoose.connect(uri);
    console.log(`Connected${DRY_RUN ? ' (dry run — nothing will be written)' : ''}`);

    const products = mongoose.connection.collection('products');
    const orders = mongoose.connection.collection('orders');

    // ── Pass 1: price/stock mirrors from variants ────────────────────
    const cursor = products.find({}, { projection: { variants: 1 } });
    const priceOps = [];
    let scanned = 0;

    while (await cursor.hasNext()) {
        const doc = await cursor.next();
        scanned++;

        const variants = Array.isArray(doc.variants) ? doc.variants : [];
        const prices = variants
            .map(v => (v.salePrice != null && v.salePrice < v.regularPrice ? v.salePrice : v.regularPrice))
            .filter(p => typeof p === 'number' && !Number.isNaN(p));

        priceOps.push({
            updateOne: {
                filter: { _id: doc._id },
                update: {
                    $set: {
                        minPrice: prices.length ? Math.min(...prices) : 0,
                        maxPrice: prices.length ? Math.max(...prices) : 0,
                        hasSale: variants.some(v => v.salePrice != null && v.salePrice < v.regularPrice),
                        totalStock: variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0),
                    },
                },
            },
        });
    }

    if (priceOps.length && !DRY_RUN) {
        await products.bulkWrite(priceOps, { ordered: false });
    }
    console.log(`Price/stock mirrors: ${priceOps.length} product(s) of ${scanned} scanned`);

    // ── Pass 2: salesCount from completed orders ─────────────────────
    // Counts units on orders that actually took stock: any completed payment,
    // plus COD orders that reached at least "confirmed". Returned units are
    // subtracted so the count matches what customers kept.
    const sold = await orders.aggregate([
        {
            $match: {
                $or: [
                    { paymentStatus: 'completed' },
                    { paymentMethod: 'cod', orderStatus: { $nin: ['pending', 'cancelled'] } },
                ],
            },
        },
        { $unwind: '$items' },
        {
            $group: {
                _id: '$items.product',
                units: {
                    $sum: {
                        $subtract: [
                            { $ifNull: ['$items.quantity', 0] },
                            { $ifNull: ['$items.returnedQuantity', 0] },
                        ],
                    },
                },
            },
        },
    ]).toArray();

    const salesOps = sold
        .filter(row => row._id && row.units > 0)
        .map(row => ({
            updateOne: {
                filter: { _id: row._id },
                update: { $set: { salesCount: row.units } },
            },
        }));

    if (salesOps.length && !DRY_RUN) {
        await products.bulkWrite(salesOps, { ordered: false });
    }
    console.log(`Sales counts: ${salesOps.length} product(s) with recorded sales`);

    if (DRY_RUN) {
        console.log('\nDry run complete — re-run without --dry to write.');
        const sample = priceOps.slice(0, 3).map(op => op.updateOne.update.$set);
        console.log('Sample of computed values:', JSON.stringify(sample, null, 2));
    }

    await mongoose.disconnect();
    console.log('Done.');
}

main().catch(err => {
    console.error('Backfill failed:', err);
    process.exit(1);
});
