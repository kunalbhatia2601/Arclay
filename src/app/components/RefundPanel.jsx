"use client";

import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { RotateCcw } from "lucide-react";

const money = (v) =>
    `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

// Returns and refunds against a paid order. Quantities are capped at what is
// still returnable, and the refund amount is worked out server-side.
export default function RefundPanel({ order, onRefunded }) {
    const [quantities, setQuantities] = useState({});
    const [reason, setReason] = useState("");
    const [restock, setRestock] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [open, setOpen] = useState(false);

    const refundable = useMemo(
        () =>
            (order.items || []).map((item, index) => ({
                index,
                item,
                remaining: item.quantity - (item.returnedQuantity || 0),
            })),
        [order.items]
    );

    const anythingLeft = refundable.some((r) => r.remaining > 0);

    const estimate = refundable.reduce((sum, { item, index }) => {
        const qty = parseInt(quantities[index], 10) || 0;
        if (!qty) return sum;

        const lineNet = item.priceAtOrder * item.quantity - (item.lineDiscount || 0);
        const perUnit = item.quantity > 0 ? lineNet / item.quantity : 0;
        return sum + perUnit * qty;
    }, 0);

    const alreadyRefunded = Number(order.refundedAmount || 0);

    const submit = async () => {
        const items = refundable
            .map(({ index }) => ({ itemIndex: index, quantity: parseInt(quantities[index], 10) || 0 }))
            .filter((entry) => entry.quantity > 0);

        if (items.length === 0) {
            toast.error("Enter a quantity to return");
            return;
        }

        if (!confirm(`Refund about ${money(estimate)}? This cannot be undone.`)) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/admin/orders/${order._id}/refund`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ items, reason, restock }),
            });
            const data = await res.json();

            if (data.success) {
                toast.success(data.message);
                setQuantities({});
                setReason("");
                setOpen(false);
                onRefunded?.(data.order);
            } else {
                toast.error(data.message || "Refund failed");
            }
        } catch (err) {
            console.error("Refund error:", err);
            toast.error("Refund failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (order.paymentStatus !== "completed" && order.paymentStatus !== "partially_refunded") {
        return null;
    }

    return (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border print:hidden">
            <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                    <h2 className="font-serif text-xl font-bold">Returns &amp; Refunds</h2>
                    {alreadyRefunded > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                            {money(alreadyRefunded)} already refunded of {money(order.totalAmount)}
                        </p>
                    )}
                </div>
                {anythingLeft && (
                    <button
                        onClick={() => setOpen((v) => !v)}
                        className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-sm font-medium flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        {open ? "Cancel" : "Return items"}
                    </button>
                )}
            </div>

            {/* History */}
            {(order.refunds || []).length > 0 && (
                <div className="mb-4 space-y-2">
                    {order.refunds.map((refund, i) => (
                        <div
                            key={refund._id || i}
                            className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-muted/50 border border-border"
                        >
                            <span>
                                {new Date(refund.createdAt).toLocaleString("en-IN")}
                                {refund.reason ? ` · ${refund.reason}` : ""}
                                {refund.restocked ? " · restocked" : " · not restocked"}
                            </span>
                            <span className="font-medium text-destructive">
                                -{money(refund.amount)}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {!anythingLeft ? (
                <p className="text-sm text-muted-foreground">
                    Every item on this order has been returned.
                </p>
            ) : (
                open && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            {refundable.map(({ item, index, remaining }) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-4 px-4 py-2.5 rounded-xl border border-border bg-background text-sm"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">
                                            {item.name || item.product?.name || "Item"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {money(item.priceAtOrder)} · {remaining} of {item.quantity}{" "}
                                            returnable
                                        </p>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        max={remaining}
                                        disabled={remaining === 0}
                                        value={quantities[index] ?? ""}
                                        onChange={(e) =>
                                            setQuantities((prev) => ({
                                                ...prev,
                                                // Never let the box exceed what is left
                                                [index]: Math.min(
                                                    remaining,
                                                    Math.max(0, parseInt(e.target.value, 10) || 0)
                                                ),
                                            }))
                                        }
                                        placeholder="0"
                                        className="w-24 px-3 py-1.5 rounded-lg border border-input bg-background text-right disabled:opacity-40"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-3 items-center">
                            <input
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Reason (optional)"
                                className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-input bg-background text-sm"
                            />
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={restock}
                                    onChange={(e) => setRestock(e.target.checked)}
                                />
                                Put stock back
                            </label>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-border">
                            <div>
                                <p className="text-sm text-muted-foreground">Refund amount</p>
                                <p className="text-2xl font-bold text-destructive">{money(estimate)}</p>
                            </div>
                            <button
                                onClick={submit}
                                disabled={submitting || estimate <= 0}
                                className="px-6 py-3 bg-destructive text-white rounded-xl font-bold disabled:opacity-50"
                            >
                                {submitting ? "Processing..." : "Process Refund"}
                            </button>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}
