import Product from '@/models/Product';

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
            variant,
            variantIndex,
            quantity,
            price: variant.salePrice || variant.regularPrice,
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
    return lines.map((line) => ({
        product: line.product,
        quantity: line.quantity,
        priceAtOrder: line.price,
    }));
}
