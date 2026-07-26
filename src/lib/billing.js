/**
 * Bill arithmetic for the POS, shared by the client preview and the server.
 *
 * Pure functions with no imports: whatever the counter sees on screen is
 * computed by exactly the same code that writes the order, so the printed bill
 * can never disagree with the total the customer was quoted.
 *
 * Money is rounded to 2 decimals at every step to avoid float drift showing up
 * as a 1-paisa mismatch between subtotal and the sum of the lines.
 */

export function round2(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
}

/**
 * Resolve a discount entry to a rupee amount.
 * @param {'flat'|'percent'} type
 * @param {number|string} value
 * @param {number} base amount the percentage applies to
 */
export function resolveDiscount(type, value, base) {
    const amount = Math.max(0, parseFloat(value) || 0);
    if (!amount) return 0;

    const raw = type === 'percent' ? (base * Math.min(amount, 100)) / 100 : amount;
    return round2(Math.min(raw, base));
}

/**
 * Split a bill-wide discount across lines in proportion to their value, so each
 * line carries its share when tax is worked out per slab.
 */
function allocateProportionally(total, weights) {
    const sum = weights.reduce((s, w) => s + w, 0);
    if (sum <= 0 || total <= 0) return weights.map(() => 0);

    const shares = weights.map((w) => round2((total * w) / sum));

    // Push any rounding remainder onto the largest line so the parts always add
    // back up to the whole.
    const drift = round2(total - shares.reduce((s, v) => s + v, 0));
    if (drift !== 0) {
        let biggest = 0;
        weights.forEach((w, i) => {
            if (w > weights[biggest]) biggest = i;
        });
        shares[biggest] = round2(shares[biggest] + drift);
    }

    return shares;
}

/**
 * Compute a complete bill.
 *
 * @param {Array} lines  [{ price, quantity, lineDiscountType, lineDiscountValue, taxRate, ... }]
 * @param {object} options
 * @param {'flat'|'percent'} options.discountType  bill-wide discount
 * @param {number|string} options.discountValue
 * @param {number} [options.couponDiscount]  already-resolved coupon amount
 * @param {boolean} [options.taxEnabled]
 * @param {boolean} [options.priceIncludesTax]
 *
 * @returns {{
 *   lines: Array, grossSubtotal: number, lineDiscountTotal: number,
 *   subtotal: number, billDiscount: number, couponDiscount: number,
 *   totalDiscount: number, taxableValue: number, taxAmount: number,
 *   taxBreakup: Array, total: number, totalItems: number
 * }}
 */
export function computeBill(lines, options = {}) {
    const {
        discountType = 'flat',
        discountValue = 0,
        couponDiscount = 0,
        taxEnabled = false,
        priceIncludesTax = true,
    } = options;

    // 1. Line values, after their own discounts
    const priced = (lines || []).map((line) => {
        const price = Number(line.price) || 0;
        const quantity = Math.max(0, parseInt(line.quantity, 10) || 0);
        const gross = round2(price * quantity);

        const lineDiscount = resolveDiscount(
            line.lineDiscountType || 'flat',
            line.lineDiscountValue || 0,
            gross
        );

        return { ...line, price, quantity, gross, lineDiscount, net: round2(gross - lineDiscount) };
    });

    const grossSubtotal = round2(priced.reduce((s, l) => s + l.gross, 0));
    const lineDiscountTotal = round2(priced.reduce((s, l) => s + l.lineDiscount, 0));
    const subtotal = round2(grossSubtotal - lineDiscountTotal);

    // 2. Bill-wide discount, then the coupon on what remains
    const billDiscount = resolveDiscount(discountType, discountValue, subtotal);
    const afterBill = round2(subtotal - billDiscount);
    const appliedCoupon = round2(Math.min(Math.max(0, Number(couponDiscount) || 0), afterBill));
    const totalDiscount = round2(lineDiscountTotal + billDiscount + appliedCoupon);

    // 3. Spread the bill-level reductions back over the lines
    const spread = round2(billDiscount + appliedCoupon);
    const shares = allocateProportionally(spread, priced.map((l) => l.net));

    const withShare = priced.map((line, i) => ({
        ...line,
        // What this line actually contributes to the amount payable
        payable: round2(line.net - shares[i]),
    }));

    // 4. Tax per line, grouped into slabs
    const slabs = new Map();
    let taxAmount = 0;
    let taxableValue = 0;

    const finalLines = withShare.map((line) => {
        const rate = taxEnabled ? Number(line.taxRate) || 0 : 0;

        let taxable;
        let tax;

        if (!rate) {
            taxable = line.payable;
            tax = 0;
        } else if (priceIncludesTax) {
            // Listed price already contains the tax, so back it out
            taxable = round2((line.payable * 100) / (100 + rate));
            tax = round2(line.payable - taxable);
        } else {
            taxable = line.payable;
            tax = round2((line.payable * rate) / 100);
        }

        taxableValue = round2(taxableValue + taxable);
        taxAmount = round2(taxAmount + tax);

        if (rate > 0) {
            const slab = slabs.get(rate) || { rate, taxable: 0, tax: 0 };
            slab.taxable = round2(slab.taxable + taxable);
            slab.tax = round2(slab.tax + tax);
            slabs.set(rate, slab);
        }

        return { ...line, taxRate: rate, taxableValue: taxable, taxAmount: tax };
    });

    // 5. Grand total
    const payableSum = round2(finalLines.reduce((s, l) => s + l.payable, 0));
    const total = priceIncludesTax ? payableSum : round2(payableSum + taxAmount);

    return {
        lines: finalLines,
        grossSubtotal,
        lineDiscountTotal,
        subtotal,
        billDiscount,
        couponDiscount: appliedCoupon,
        totalDiscount,
        taxableValue,
        taxAmount,
        taxBreakup: [...slabs.values()].sort((a, b) => a.rate - b.rate),
        total: Math.max(0, total),
        totalItems: finalLines.reduce((s, l) => s + l.quantity, 0),
    };
}
