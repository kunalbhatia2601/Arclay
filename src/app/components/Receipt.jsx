"use client";

// Printed on 80 mm thermal roll, the common counter-printer width. Only the
// receipt is made visible so the surrounding admin UI never reaches the paper.
export const RECEIPT_PRINT_CSS = `
    @media print {
        @page { size: 80mm auto; margin: 0; }
        body * { visibility: hidden; }
        #receipt-sheet, #receipt-sheet * { visibility: visible; }
        #receipt-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            margin: 0;
            padding: 4mm;
            box-shadow: none;
            border: none;
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

export default function Receipt({ order, store = {}, tendered = null }) {
    if (!order) return null;

    const billNo = String(order._id || "").slice(-8).toUpperCase();
    const placedAt = order.createdAt ? new Date(order.createdAt) : new Date();
    const change = tendered != null ? Number(tendered) - Number(order.totalAmount || 0) : null;

    const addressLine = [store.city, store.state, store.pincode].filter(Boolean).join(", ");

    return (
        <div
            id="receipt-sheet"
            className="bg-white text-black mx-auto"
            style={{ width: "80mm", padding: "4mm", fontFamily: "ui-monospace, monospace", fontSize: "10px" }}
        >
            {/* Header */}
            <div className="text-center" style={{ marginBottom: "3mm" }}>
                <p style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "0.5px" }}>
                    {store.name || "Store"}
                </p>
                {store.address && <p>{store.address}</p>}
                {addressLine && <p>{addressLine}</p>}
                {store.phone && <p>Ph: {store.phone}</p>}
            </div>

            <div style={{ borderTop: "1px dashed #000", margin: "2mm 0" }} />

            {/* Bill meta */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Bill No</span>
                <span style={{ fontWeight: 700 }}>#{billNo}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Date</span>
                <span>
                    {placedAt.toLocaleDateString("en-IN")}{" "}
                    {placedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
            </div>
            {order.shippingAddress?.fullName && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Customer</span>
                    <span>{order.shippingAddress.fullName}</span>
                </div>
            )}
            {order.shippingAddress?.phone && order.shippingAddress.phone !== "0000000000" && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Phone</span>
                    <span>{order.shippingAddress.phone}</span>
                </div>
            )}

            <div style={{ borderTop: "1px dashed #000", margin: "2mm 0" }} />

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
                        <th style={{ textAlign: "left", paddingBottom: "1mm", width: "46%" }}>Item</th>
                        <th style={{ textAlign: "center", paddingBottom: "1mm", width: "12%" }}>Qty</th>
                        <th style={{ textAlign: "right", paddingBottom: "1mm", width: "21%" }}>Rate</th>
                        <th style={{ textAlign: "right", paddingBottom: "1mm", width: "21%" }}>Amt</th>
                    </tr>
                </thead>
                <tbody>
                    {(order.items || []).map((item, index) => {
                        const rate = item.priceAtOrder ?? item.variant?.price ?? 0;
                        const name = item.product?.name || item.name || "Item";
                        const vt = variantText(item.variant?.attributes);

                        return (
                            <tr key={index} style={{ verticalAlign: "top" }}>
                                <td style={{ paddingTop: "1mm", paddingRight: "2mm", wordBreak: "break-word" }}>
                                    {name}
                                    {vt && (
                                        <span style={{ display: "block", fontSize: "9px" }}>{vt}</span>
                                    )}
                                </td>
                                <td style={{ textAlign: "center", paddingTop: "1mm", paddingLeft: "1mm" }}>
                                    {item.quantity}
                                </td>
                                <td style={{ textAlign: "right", paddingTop: "1mm", paddingLeft: "1mm" }}>
                                    {Number(rate).toLocaleString("en-IN")}
                                </td>
                                <td style={{ textAlign: "right", paddingTop: "1mm", paddingLeft: "1mm" }}>
                                    {Number(rate * item.quantity).toLocaleString("en-IN")}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div style={{ borderTop: "1px dashed #000", margin: "2mm 0" }} />

            {/* Totals */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Subtotal</span>
                <span>{money(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                    <span>-{money(order.discountAmount)}</span>
                </div>
            )}
            {order.shippingFee > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Shipping</span>
                    <span>{money(order.shippingFee)}</span>
                </div>
            )}

            <div style={{ borderTop: "1px solid #000", margin: "1.5mm 0" }} />

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                    fontWeight: 700,
                }}
            >
                <span>TOTAL</span>
                <span>{money(order.totalAmount)}</span>
            </div>

            <div style={{ borderTop: "1px dashed #000", margin: "2mm 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Paid by</span>
                <span>{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</span>
            </div>

            {change != null && change >= 0 && (
                <>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Cash received</span>
                        <span>{money(tendered)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                        <span>Change</span>
                        <span>{money(change)}</span>
                    </div>
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
                <p style={{ marginTop: "1.5mm", fontWeight: 700 }}>Thank you! Visit again.</p>
            </div>
        </div>
    );
}
