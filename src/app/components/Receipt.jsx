"use client";

// Counter bill printers here are 3" wide (~76 mm). Hard-size the print page to
// that roll; leave a little horizontal inset so the driver's non-printable
// edge does not crop the right column. Preview matches the same width.
export const RECEIPT_PRINT_CSS = `
    @media print {
        @page {
            size: 3in auto;
            margin: 0;
        }
        html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 3in !important;
            min-width: 0 !important;
            max-width: 3in !important;
            background: #fff !important;
        }
        body * { visibility: hidden; }
        #receipt-sheet, #receipt-sheet * { visibility: visible; }
        #receipt-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 2.85in !important;
            max-width: 2.85in !important;
            margin: 0 !important;
            padding: 0.08in 0.1in !important;
            box-sizing: border-box !important;
            box-shadow: none !important;
            border: none !important;
            overflow: hidden !important;
            font-size: 9.5px !important;
        }
        #receipt-sheet table {
            width: 100% !important;
            table-layout: fixed !important;
        }
        #receipt-sheet th,
        #receipt-sheet td,
        #receipt-sheet span,
        #receipt-sheet p {
            max-width: 100%;
            overflow-wrap: anywhere;
            word-break: break-word;
        }
    }
`;

const PAYMENT_LABELS = {
    cash: "Cash",
    card: "Card",
    upi: "UPI",
    cod: "Cash on Delivery",
    razorpay: "Razorpay",
    stripe: "Stripe",
};

function money(value) {
    return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function variantText(attributes) {
    if (!attributes) return "";
    return Object.values(attributes).join(" / ");
}

const Rule = ({ solid }) => (
    <div style={{ borderTop: `1px ${solid ? "solid" : "dashed"} #000`, margin: "2mm 0" }} />
);

const Row = ({ label, value, bold, size }) => (
    <div
        style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "2mm",
            fontWeight: bold ? 700 : 400,
            fontSize: size,
            minWidth: 0,
        }}
    >
        <span style={{ minWidth: 0, flex: "1 1 auto" }}>{label}</span>
        <span
            style={{
                textAlign: "right",
                flex: "0 1 auto",
                minWidth: 0,
                overflowWrap: "anywhere",
            }}
        >
            {value}
        </span>
    </div>
);

export default function Receipt({ order, store = {}, tendered = null }) {
    if (!order) return null;

    const billNo = order.billNumber || `#${String(order._id || "").slice(-8).toUpperCase()}`;
    const placedAt = order.createdAt ? new Date(order.createdAt) : new Date();
    const change = tendered != null ? Number(tendered) - Number(order.totalAmount || 0) : null;

    const addressLine = [store.city, store.state, store.pincode].filter(Boolean).join(", ");
    const taxBreakup = order.taxBreakup || [];
    const hasTax = Number(order.taxAmount) > 0 && taxBreakup.length > 0;
    const isTaxInvoice = hasTax && !!store.gstin;

    const grossSubtotal =
        Number(order.subtotal || 0) + Number(order.lineDiscountTotal || 0);
    const totalDiscount =
        Number(order.discountAmount || 0) + Number(order.lineDiscountTotal || 0);

    return (
        <div
            id="receipt-sheet"
            className="bg-white text-black mx-auto"
            style={{
                // Match the 3" thermal roll used at the counter.
                width: "3in",
                maxWidth: "100%",
                boxSizing: "border-box",
                padding: "0.12in",
                fontFamily: "ui-monospace, monospace",
                fontSize: "10px",
                lineHeight: 1.35,
            }}
        >
            {/* Header */}
            <div className="text-center" style={{ marginBottom: "2mm" }}>
                <p style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.5px" }}>
                    {store.legalName || store.name || "Store"}
                </p>
                {store.address && <p>{store.address}</p>}
                {addressLine && <p>{addressLine}</p>}
                {store.phone && <p>Ph: {store.phone}</p>}
                {store.gstin && <p>GSTIN: {store.gstin}</p>}
                <p style={{ marginTop: "1.5mm", fontWeight: 700, letterSpacing: "1px" }}>
                    {isTaxInvoice ? "TAX INVOICE" : "RECEIPT"}
                </p>
            </div>

            <Rule />

            {/* Bill meta */}
            <Row label="Bill No" value={billNo} bold />
            <Row
                label="Date"
                value={`${placedAt.toLocaleDateString("en-IN")} ${placedAt.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                })}`}
            />
            {order.shippingAddress?.fullName && (
                <Row label="Customer" value={order.shippingAddress.fullName} />
            )}
            {order.shippingAddress?.phone && order.shippingAddress.phone !== "0000000000" && (
                <Row label="Phone" value={order.shippingAddress.phone} />
            )}

            <Rule />

            {/* Items */}
            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "10px",
                    tableLayout: "fixed",
                }}
            >
                <thead>
                    <tr style={{ borderBottom: "1px solid #000" }}>
                        <th style={{ textAlign: "left", paddingBottom: "1mm", width: "42%" }}>Item</th>
                        <th style={{ textAlign: "center", paddingBottom: "1mm", width: "12%" }}>Qty</th>
                        <th style={{ textAlign: "right", paddingBottom: "1mm", width: "23%" }}>Rate</th>
                        <th style={{ textAlign: "right", paddingBottom: "1mm", width: "23%" }}>Amt</th>
                    </tr>
                </thead>
                <tbody>
                    {(order.items || []).map((item, index) => {
                        const rate = item.priceAtOrder ?? item.variant?.price ?? 0;
                        const name = item.name || item.product?.name || "Item";
                        const vt = variantText(item.variant?.attributes);
                        const returned = item.returnedQuantity || 0;

                        return (
                            <tr key={index} style={{ verticalAlign: "top" }}>
                                <td
                                    style={{
                                        paddingTop: "1mm",
                                        paddingRight: "2mm",
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {name}
                                    {vt && <span style={{ display: "block", fontSize: "9px" }}>{vt}</span>}
                                    {item.hsn && (
                                        <span style={{ display: "block", fontSize: "9px" }}>
                                            HSN {item.hsn}
                                            {item.taxRate ? ` · GST ${item.taxRate}%` : ""}
                                        </span>
                                    )}
                                    {item.lineDiscount > 0 && (
                                        <span style={{ display: "block", fontSize: "9px" }}>
                                            Less {money(item.lineDiscount)}
                                        </span>
                                    )}
                                    {returned > 0 && (
                                        <span style={{ display: "block", fontSize: "9px" }}>
                                            Returned {returned}
                                        </span>
                                    )}
                                </td>
                                <td style={{ textAlign: "center", paddingTop: "1mm", paddingLeft: "1mm" }}>
                                    {item.quantity}
                                </td>
                                <td style={{ textAlign: "right", paddingTop: "1mm", paddingLeft: "1mm" }}>
                                    {Number(rate).toLocaleString("en-IN")}
                                </td>
                                <td style={{ textAlign: "right", paddingTop: "1mm", paddingLeft: "1mm" }}>
                                    {Number(rate * item.quantity - (item.lineDiscount || 0)).toLocaleString(
                                        "en-IN"
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <Rule />

            {/* Totals */}
            <Row label="Subtotal" value={money(grossSubtotal)} />
            {totalDiscount > 0 && (
                <Row
                    label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`}
                    value={`-${money(totalDiscount)}`}
                />
            )}
            {order.shippingFee > 0 && <Row label="Shipping" value={money(order.shippingFee)} />}

            {/* GST breakup — CGST/SGST split for an intra-state counter sale */}
            {hasTax && (
                <>
                    <Rule />
                    {taxBreakup.map((slab) => (
                        <div key={slab.rate}>
                            <Row
                                label={`Taxable @ ${slab.rate}%`}
                                value={money(slab.taxable)}
                            />
                            <Row
                                label={`CGST ${slab.rate / 2}%`}
                                value={money(slab.tax / 2)}
                            />
                            <Row
                                label={`SGST ${slab.rate / 2}%`}
                                value={money(slab.tax / 2)}
                            />
                        </div>
                    ))}
                    <Row label="Total GST" value={money(order.taxAmount)} bold />
                </>
            )}

            <Rule solid />

            <Row label="TOTAL" value={money(order.totalAmount)} bold size="13px" />

            <Rule />

            <Row
                label="Paid by"
                value={PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
            />

            {change != null && change >= 0 && (
                <>
                    <Row label="Cash received" value={money(tendered)} />
                    <Row label="Change" value={money(change)} bold />
                </>
            )}

            {order.refundedAmount > 0 && (
                <>
                    <Rule />
                    <Row label="Refunded" value={`-${money(order.refundedAmount)}`} bold />
                    <Row
                        label="Net paid"
                        value={money(Number(order.totalAmount) - Number(order.refundedAmount))}
                    />
                </>
            )}

            <div
                style={{
                    textAlign: "center",
                    marginTop: "3mm",
                    paddingTop: "2mm",
                    borderTop: "1px dashed #000",
                }}
            >
                <p>Total items: {(order.items || []).reduce((s, i) => s + i.quantity, 0)}</p>
                {hasTax && !store.gstin && (
                    <p style={{ fontSize: "9px" }}>Prices inclusive of applicable taxes</p>
                )}
                <p style={{ marginTop: "1.5mm", fontWeight: 700 }}>
                    {store.billFooter || "Thank you! Visit again."}
                </p>
            </div>
        </div>
    );
}
