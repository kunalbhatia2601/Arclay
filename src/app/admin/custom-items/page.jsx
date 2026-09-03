"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Check, PackagePlus, X } from "lucide-react";

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

/**
 * Items sold at the counter that were not in the catalog. Each row is one
 * name, however many times it was rung up — the point is to spot what keeps
 * being sold off-catalog and add it properly.
 */
export default function CustomItemsPage() {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(90);
    const [converting, setConverting] = useState(null); // the item being added

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [itemsRes, catRes] = await Promise.all([
                fetch(`/api/admin/custom-items?days=${days}`, { credentials: "include" }),
                fetch("/api/admin/categories?limit=200", { credentials: "include" }),
            ]);
            const itemsData = await itemsRes.json();
            const catData = await catRes.json();
            if (!itemsData.success) throw new Error(itemsData.message);
            setItems(itemsData.items || []);
            setCategories(catData.categories || []);
        } catch (err) {
            toast.error(err.message || "Could not load custom items");
        } finally {
            setLoading(false);
        }
    }, [days]);

    useEffect(() => {
        load();
    }, [load]);

    const topCategories = categories.filter((c) => !c.parent);
    const subFor = (categoryId) =>
        categories.filter((c) => String(c.parent?._id || c.parent || "") === String(categoryId || ""));

    return (
        <div className="p-6 max-w-full">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                <div>
                    <h1 className="text-xl font-bold text-foreground">Custom Items</h1>
                    <p className="text-sm text-muted-foreground">
                        Rung up at the POS without being in the catalog. Add the ones that keep
                        selling so they scan, track stock and report margin properly.
                    </p>
                </div>
                <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                >
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                    <option value={365}>Last year</option>
                </select>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : items.length === 0 ? (
                <p className="text-sm text-muted-foreground p-6 border border-dashed border-border rounded-xl text-center">
                    Nothing sold off-catalog in this period. That is the healthy state.
                </p>
            ) : (
                <div className="border border-border rounded-xl overflow-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-muted">
                            <tr>
                                {["Item", "Times", "Units", "Revenue", "Last price", "Last sold", ""].map((h) => (
                                    <th
                                        key={h}
                                        className="p-3 text-left font-semibold text-muted-foreground whitespace-nowrap"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr
                                    key={item.key}
                                    className={`border-t border-border ${idx % 2 === 1 ? "bg-muted/25" : ""}`}
                                >
                                    <td className="p-3">
                                        <span className="font-medium text-foreground">{item.name}</span>
                                        {item.priceVaried && (
                                            <span
                                                title="This name was sold at more than one price"
                                                className="ml-2 inline-flex items-center gap-1 text-[11px] text-amber-700"
                                            >
                                                <AlertTriangle className="w-3 h-3" /> price varied
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-3">{item.timesSold}</td>
                                    <td className="p-3">{item.unitsSold}</td>
                                    <td className="p-3">{money(item.revenue)}</td>
                                    <td className="p-3">{money(item.lastPrice)}</td>
                                    <td className="p-3 whitespace-nowrap text-muted-foreground">
                                        {new Date(item.lastSoldAt).toLocaleDateString("en-IN")}
                                    </td>
                                    <td className="p-3 text-right">
                                        {item.inCatalog ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
                                                <Check className="w-3.5 h-3.5" /> in catalog
                                            </span>
                                        ) : (
                                            <Button variant="outline" size="sm" onClick={() => setConverting(item)}>
                                                <PackagePlus className="w-4 h-4 mr-1" /> Add product
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {converting && (
                <ConvertModal
                    item={converting}
                    topCategories={topCategories}
                    subFor={subFor}
                    onClose={() => setConverting(null)}
                    onDone={() => {
                        setConverting(null);
                        load();
                    }}
                />
            )}
        </div>
    );
}

function ConvertModal({ item, topCategories, subFor, onClose, onDone }) {
    const [form, setForm] = useState({
        name: item.name,
        category: "",
        subcategory: "",
        price: item.lastPrice ?? "",
        costPrice: item.lastCost ?? "",
        taxRate: item.lastTaxRate ?? 0,
        hsn: item.lastHsn || "",
        stock: 0,
    });
    const [saving, setSaving] = useState(false);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v, ...(k === "category" ? { subcategory: "" } : {}) }));

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/admin/custom-items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            toast.success(data.message);
            onDone();
        } catch (err) {
            toast.error(err.message || "Could not add product");
        } finally {
            setSaving(false);
        }
    };

    const field = "mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary";

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <form onSubmit={submit} className="bg-card rounded-2xl border border-border w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <p className="font-bold text-foreground">Add to catalog</p>
                    <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-3">
                    <label className="block">
                        <span className="text-xs font-medium text-muted-foreground">Product name</span>
                        <input value={form.name} onChange={(e) => set("name", e.target.value)} className={field} />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="text-xs font-medium text-muted-foreground">Category</span>
                            <select value={form.category} onChange={(e) => set("category", e.target.value)} className={field}>
                                <option value="">Select…</option>
                                {topCategories.map((c) => (
                                    <option key={c._id} value={c._id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block">
                            <span className="text-xs font-medium text-muted-foreground">Sub-category</span>
                            <select
                                value={form.subcategory}
                                onChange={(e) => set("subcategory", e.target.value)}
                                disabled={!form.category}
                                className={field}
                            >
                                <option value="">None</option>
                                {subFor(form.category).map((c) => (
                                    <option key={c._id} value={c._id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="text-xs font-medium text-muted-foreground">Price (₹)</span>
                            <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} className={field} />
                        </label>
                        <label className="block">
                            <span className="text-xs font-medium text-muted-foreground">Cost (₹)</span>
                            <input type="number" min="0" step="0.01" value={form.costPrice ?? ""} onChange={(e) => set("costPrice", e.target.value)} className={field} />
                        </label>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <label className="block">
                            <span className="text-xs font-medium text-muted-foreground">GST %</span>
                            <input type="number" min="0" max="100" step="0.01" value={form.taxRate} onChange={(e) => set("taxRate", e.target.value)} className={field} />
                        </label>
                        <label className="block">
                            <span className="text-xs font-medium text-muted-foreground">HSN</span>
                            <input value={form.hsn} onChange={(e) => set("hsn", e.target.value)} className={field} />
                        </label>
                        <label className="block">
                            <span className="text-xs font-medium text-muted-foreground">Opening stock</span>
                            <input type="number" min="0" step="1" value={form.stock} onChange={(e) => set("stock", e.target.value)} className={field} />
                        </label>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Creates a single-variant product with a fresh barcode. Past sales stay as
                        they were — this only affects what happens from now on.
                    </p>
                </div>

                <div className="p-4 border-t border-border flex justify-end">
                    <Button type="submit" disabled={saving || !form.name.trim() || !form.category}>
                        {saving ? "Adding…" : "Add product"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
