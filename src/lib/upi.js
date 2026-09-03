/**
 * UPI collection links for counter payments.
 *
 * The QR shown at checkout encodes an NPCI deep link, which every UPI app
 * understands: the payee VPA, the payee name, and the exact amount, so the
 * customer cannot mistype it and the cashier does not have to check the figure.
 */

/** A VPA looks like name@bank. Anything else would fail silently inside the app. */
export function isValidUpiId(upiId) {
    return /^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/.test(String(upiId || "").trim());
}

/**
 * @param {{ upiId: string, payeeName?: string, amount: number, note?: string }} options
 * @returns {string|null} deep link, or null when the inputs cannot make a valid one
 */
export function buildUpiLink({ upiId, payeeName = "", amount, note = "" }) {
    const vpa = String(upiId || "").trim();
    const value = Number(amount);
    if (!isValidUpiId(vpa) || !Number.isFinite(value) || value <= 0) return null;

    const params = new URLSearchParams({
        pa: vpa,
        // Amount must carry exactly two decimals or some apps drop the paise.
        am: value.toFixed(2),
        cu: "INR",
    });
    if (payeeName.trim()) params.set("pn", payeeName.trim());
    if (note.trim()) params.set("tn", note.trim().slice(0, 50));

    // URLSearchParams writes spaces as "+", which some UPI apps show literally
    // in the payee name. RFC3986 %20 is understood everywhere.
    return `upi://pay?${params.toString().replace(/\+/g, "%20")}`;
}
