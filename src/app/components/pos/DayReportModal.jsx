"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Printer, RefreshCw } from "lucide-react";

const PAYMENT_LABELS = { cash: "Cash", card: "Card", upi: "UPI" };

const money = (v) =>
    `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

// Day-end summary (the X/Z report) used to reconcile the till at closing.
export default function DayReportModal({ onClose }) {
    const [date, setDate] = useState(() => {
        const now = new Date();
        const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    });
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/pos/report?date=${date}`, {
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) setReport(data);
        } catch (err) {
            console.error("Failed to load report:", err);
        } finally {
            setLoading(false);
        }
    }, [date]);

    useEffect(() => {
        load();
    }, [load]);

    const summary = report?.summary;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-5 border-b border-border flex items-center justify-between gap-4 sticky top-0 bg-card">
                    <div>
                        <h2 className="font-serif text-2xl font-bold">Day Report</h2>
                        <p className="text-sm text-muted-foreground">Counter sales summary</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-input bg-background text-sm"
                        />
                        <button
                            onClick={load}
                            title="Refresh"
                            className="p-2 rounded-lg border border-border hover:bg-muted"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => window.print()}
                            title="Print"
                            className="p-2 rounded-lg border border-border hover:bg-muted"
                        >
                            <Printer className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg border border-border hover:bg-muted"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : !summary ? (
                    <p className="text-center text-muted-foreground py-20">
                        Could not load the report
                    </p>
                ) : (
                    <div className="p-5 space-y-6">
                        {/* Headline numbers */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { label: "Net Sales", value: money(summary.netSales), accent: true },
                                { label: "Bills", value: summary.orderCount },
                                { label: "Items Sold", value: summary.itemsSold },
                                { label: "Avg Bill", value: money(summary.averageBill) },
                            ].map((tile) => (
                                <div
                                    key={tile.label}
                                    className={`p-4 rounded-xl border ${
                                        tile.accent
                                            ? "border-primary/30 bg-primary/5"
                                            : "border-border bg-background"
                                    }`}
                                >
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                        {tile.label}
                                    </p>
                                    <p
                                        className={`text-xl font-bold mt-1 ${
                                            tile.accent ? "text-primary" : ""
                                        }`}
                                    >
                                        {tile.value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Reconciliation */}
                        <div className="rounded-xl border border-border overflow-hidden">
                            <div className="px-4 py-2.5 bg-muted/50 text-sm font-medium">
                                Collection by payment method
                            </div>
                            {report.byPayment.length === 0 ? (
                                <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                                    No sales on this day
                                </p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="text-muted-foreground">
                                        <tr>
                                            <th className="text-left font-medium px-4 py-2">Method</th>
                                            <th className="text-right font-medium px-4 py-2">Bills</th>
                                            <th className="text-right font-medium px-4 py-2">Collected</th>
                                            <th className="text-right font-medium px-4 py-2">Refunded</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.byPayment.map((row) => (
                                            <tr key={row.method} className="border-t border-border">
                                                <td className="px-4 py-2">
                                                    {PAYMENT_LABELS[row.method] || row.method}
                                                </td>
                                                <td className="px-4 py-2 text-right">{row.orders}</td>
                                                <td className="px-4 py-2 text-right font-medium">
                                                    {money(row.amount)}
                                                </td>
                                                <td className="px-4 py-2 text-right text-destructive">
                                                    {row.refunded > 0 ? `-${money(row.refunded)}` : "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Adjustments */}
                        <div className="grid grid-cols-3 gap-3 text-sm">
                            <div className="p-3 rounded-xl border border-border">
                                <p className="text-xs text-muted-foreground">Gross Sales</p>
                                <p className="font-bold mt-1">{money(summary.grossSales)}</p>
                            </div>
                            <div className="p-3 rounded-xl border border-border">
                                <p className="text-xs text-muted-foreground">Discounts Given</p>
                                <p className="font-bold mt-1">{money(summary.discounts)}</p>
                            </div>
                            <div className="p-3 rounded-xl border border-border">
                                <p className="text-xs text-muted-foreground">Tax Collected</p>
                                <p className="font-bold mt-1">{money(summary.tax)}</p>
                            </div>
                        </div>

                        {/* Best sellers */}
                        {report.topProducts.length > 0 && (
                            <div className="rounded-xl border border-border overflow-hidden">
                                <div className="px-4 py-2.5 bg-muted/50 text-sm font-medium">
                                    Top products
                                </div>
                                <table className="w-full text-sm">
                                    <tbody>
                                        {report.topProducts.map((p) => (
                                            <tr key={p.name} className="border-t border-border">
                                                <td className="px-4 py-2">{p.name}</td>
                                                <td className="px-4 py-2 text-right text-muted-foreground">
                                                    {p.quantity} sold
                                                </td>
                                                <td className="px-4 py-2 text-right font-medium">
                                                    {money(p.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
