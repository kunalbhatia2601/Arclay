import Product from "@/models/Product";

/**
 * Adjusts the denormalized salesCount on products.
 *
 * salesCount exists so "bestselling" sorting is an indexed read instead of an
 * aggregation over the Orders collection on every storefront request. It is
 * incremented at the same moment stock is committed (COD placement, verified
 * online payment, POS sale) and decremented when a return is processed.
 *
 * Failures here must never fail the surrounding sale — the count is a display
 * optimization, not a source of truth.
 *
 * @param {Array<{productId: any, quantity: number}>} lines
 * @param {{ reverse?: boolean }} options  reverse: true subtracts instead of adds
 */
export async function recordSales(lines, { reverse = false } = {}) {
    if (!Array.isArray(lines) || lines.length === 0) return;

    // Collapse duplicate product ids so one product gets a single $inc even
    // when several variants of it appear on the same order.
    const totals = new Map();
    for (const line of lines) {
        const id = String(line?.productId || "");
        const qty = Number(line?.quantity) || 0;
        if (!id || qty <= 0) continue;
        totals.set(id, (totals.get(id) || 0) + qty);
    }

    if (totals.size === 0) return;

    const sign = reverse ? -1 : 1;
    const operations = [...totals.entries()].map(([id, qty]) => ({
        updateOne: {
            filter: { _id: id },
            update: { $inc: { salesCount: sign * qty } },
        },
    }));

    try {
        await Product.bulkWrite(operations, { ordered: false });
    } catch (error) {
        console.error("Failed to record sales counts:", error);
    }
}
