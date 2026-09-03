import Product from '@/models/Product';

// Sanity ceiling on a hand-typed line, so a slipped decimal cannot ring up a
// six-figure sale unnoticed.
const MAX_CUSTOM_LINE_TOTAL = 100000;

/**
 * Turn the identifiers the POS sends into fully-priced lines.
 *
 * Prices, tax rates and stock all come from the database — the client only ever
 * says *what* and *how many*, never *for how much*.
 *
 * Returns { ok: true, lines, reservations } or { ok: false, message }.
 */
export async function resolveCartLines(items) {
    const lines = [];
    const reservations = [];

    for (const item of items || []) {
        const quantity = parseInt(item.quantity, 10);

        // Off-catalog line typed at the counter. This is the one case where the
        // client supplies the price, because there is no catalog row to read it
        // from — the POS is admin-only, and every such line is flagged so it can
        // be reviewed (and turned into a real product) afterwards.
        if (item.isCustom) {
            const name = String(item.name || '').trim();
            const price = parseFloat(item.price);
            const taxRate = Math.min(100, Math.max(0, parseFloat(item.taxRate) || 0));
            const costPrice = item.costPrice === '' || item.costPrice == null
                ? null
                : Math.max(0, parseFloat(item.costPrice) || 0);

            if (!name) return { ok: false, message: 'A custom item needs a name' };
            if (!(quantity > 0)) return { ok: false, message: `Quantity for "${name}" must be positive` };
            if (!Number.isFinite(price) || price < 0) {
                return { ok: false, message: `Price for "${name}" is not valid` };
            }
            if (price * quantity > MAX_CUSTOM_LINE_TOTAL) {
                return {
                    ok: false,
                    message: `A custom item cannot exceed ₹${MAX_CUSTOM_LINE_TOTAL} per line`,
                };
            }

            lines.push({
                product: null,
                isCustom: true,
                variant: null,
                variantIndex: -1,
                quantity,
                price,
                costPrice,
                taxRate,
                hsn: String(item.hsn || '').trim(),
                name,
                lineDiscountType: item.lineDiscountType === 'percent' ? 'percent' : 'flat',
                lineDiscountValue: Math.max(0, parseFloat(item.lineDiscountValue) || 0),
            });

            // No reservation: nothing in stock to take, nothing to give back.
            continue;
        }

        if (!item.product || !(quantity > 0)) {
            return { ok: false, message: 'Every item needs a product and a positive quantity' };
        }

        const product = await Product.findById(item.product).populate('category', 'name');
        if (!product) {
            return { ok: false, message: 'One of the products no longer exists' };
        }

        // Resolve the variant by barcode when given, otherwise by index.
        let variantIndex = -1;
        if (item.barcode) {
            variantIndex = product.variants.findIndex((v) => v.barcode === item.barcode);
        }
        if (variantIndex < 0 && Number.isInteger(item.variantIndex)) {
            variantIndex = item.variantIndex;
        }
        if (variantIndex < 0) variantIndex = 0;

        const variant = product.variants[variantIndex];
        if (!variant) {
            return { ok: false, message: `No matching variant for ${product.name}` };
        }

        if (variant.stock < quantity) {
            return {
                ok: false,
                message: `Insufficient stock for ${product.name} (${variant.stock} left)`,
            };
        }

        lines.push({
            product,
            isCustom: false,
            variant,
            variantIndex,
            quantity,
            price: variant.salePrice || variant.regularPrice,
            costPrice: variant.costPrice ?? null,
            taxRate: product.taxRate || 0,
            hsn: product.hsn || '',
            name: product.name,
            lineDiscountType: item.lineDiscountType === 'percent' ? 'percent' : 'flat',
            lineDiscountValue: Math.max(0, parseFloat(item.lineDiscountValue) || 0),
        });

        reservations.push({ productId: product._id, variantIndex, quantity });
    }

    return { ok: true, lines, reservations };
}

/**
 * Shape POS lines the way the coupon engine expects: a populated `product`
 * (for category/product restrictions) plus quantity and unit price.
 */
export function toCouponItems(lines) {
    // Custom lines have no product, so a category/product restriction could
    // never match them — they stay out of coupon scope entirely.
    return lines
        .filter((line) => !line.isCustom && line.product)
        .map((line) => ({
            product: line.product,
            quantity: line.quantity,
            priceAtOrder: line.price,
        }));
}
