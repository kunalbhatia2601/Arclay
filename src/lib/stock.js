import Product from '@/models/Product';

// Variant attributes are stored as a Mongoose Map, whose key order is not
// guaranteed. Serialising with sorted keys makes matching order-independent.
export function variantKey(attrs) {
    if (!attrs) return '';
    const obj = attrs instanceof Map ? Object.fromEntries(attrs) : JSON.parse(JSON.stringify(attrs));
    return Object.keys(obj)
        .sort()
        .map((k) => `${k}=${obj[k]}`)
        .join('|');
}

export function findVariantIndex(product, attrs) {
    const target = variantKey(attrs);
    return (product.variants || []).findIndex((v) => variantKey(v.attributes) === target);
}

// Atomically decrement stock. The `$gte` guard lives inside the query filter, so
// two concurrent orders can never both succeed on the same last unit.
// Returns true only when the decrement actually happened.
export async function reserveStock(productId, variantIndex, quantity) {
    if (variantIndex < 0 || !(quantity > 0)) return false;

    const path = `variants.${variantIndex}.stock`;
    const result = await Product.updateOne(
        { _id: productId, [path]: { $gte: quantity } },
        { $inc: { [path]: -quantity } }
    );

    return result.modifiedCount === 1;
}

// Compensating update, used to undo reservations when a later item in the same
// order fails to reserve.
export async function releaseStock(productId, variantIndex, quantity) {
    if (variantIndex < 0 || !(quantity > 0)) return;

    const path = `variants.${variantIndex}.stock`;
    await Product.updateOne({ _id: productId }, { $inc: { [path]: quantity } });
}

// Reserve every line of an order, rolling back on the first failure so an order
// never ends up partially reserved.
export async function reserveAll(reservations) {
    const done = [];

    for (const r of reservations) {
        const ok = await reserveStock(r.productId, r.variantIndex, r.quantity);
        if (!ok) {
            for (const undo of done) {
                await releaseStock(undo.productId, undo.variantIndex, undo.quantity);
            }
            return { ok: false, failed: r };
        }
        done.push(r);
    }

    return { ok: true };
}
