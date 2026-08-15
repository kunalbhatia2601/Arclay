"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Printer, Search, AlertTriangle } from "lucide-react";
import ProductLabel, {
    LABEL_SIZES,
    LabelPrintSheet,
    printLabelRoll,
    variantLabel,
} from "@/app/components/ProductLabel";

export default function ProductLabelsIndexPage() {
    const [labels, setLabels] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [missingBarcodes, setMissingBarcodes] = useState(0);

    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [sizeKey, setSizeKey] = useState("thermal");
    const [showSalePrice, setShowSalePrice] = useState(true);
    const [copies, setCopies] = useState({});

    const size = LABEL_SIZES[sizeKey];

    const fetchLabels = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (categoryFilter) params.set("category", categoryFilter);

            const res = await fetch(`/api/admin/products/labels?${params}`, {
                credentials: "include",
            });
            const data = await res.json();

            if (data.success) {
                setLabels(data.labels || []);
                setMissingBarcodes(data.missingBarcodes || 0);
            }
        } catch (err) {
            console.error("Failed to fetch labels:", err);
        } finally {
            setLoading(false);
        }
    }, [search, categoryFilter]);

    useEffect(() => {
        // Debounced so typing in the search box does not fire a request per key.
        const timer = setTimeout(fetchLabels, 300);
        return () => clearTimeout(timer);
    }, [fetchLabels]);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const res = await fetch("/api/admin/categories?limit=100", {
                    credentials: "include",
                });
                const data = await res.json();
                if (data.success) setCategories(data.categories || []);
            } catch (err) {
                console.error("Failed to fetch categories:", err);
            }
        };
        loadCategories();
    }, []);

    const setCopyCount = (id, value) => {
        setCopies((prev) => ({ ...prev, [id]: value }));
    };

    const copiesFor = (id) => {
        const raw = copies[id];
        return raw === undefined ? 0 : Math.max(0, parseInt(raw, 10) || 0);
    };

    const setAll = (value) => {
        const next = {};
        labels.forEach((label) => {
            next[label.id] = value;
        });
        setCopies((prev) => ({ ...prev, ...next }));
    };

    // Expand the selection into one entry per physical label.
    const sheet = useMemo(() => {
        const out = [];
        labels.forEach((label) => {
            const count = copiesFor(label.id);
            for (let i = 0; i < count; i++) {
                out.push({ label, key: `${label.id}-${i}` });
            }
        });
        return out;
    }, [labels, copies]);

    const selectedRows = labels.filter((label) => copiesFor(label.id) > 0).length;

    const handlePrint = () => {
        if (sheet.length === 0) return;
        if (size.layout === "stack") {
            printLabelRoll(
                sheet.map(({ label }) => ({
                    productName: label.productName,
                    variant: label.variant,
                })),
                size,
                { showSalePrice }
            );
            return;
        }
        window.print();
    };

    return (
        <div className="w-full">
            <div className="print:hidden">
                <div className="mb-8">
                    <h1 className="font-serif text-3xl font-bold text-foreground">
                        Product Labels
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Every product variant and its barcode. Set copies, then print.
                    </p>
                </div>

                {missingBarcodes > 0 && (
                    <div className="mb-6 p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-sm flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p>
                            {missingBarcodes} variant{missingBarcodes === 1 ? "" : "s"} still
                            {missingBarcodes === 1 ? " has" : " have"} no barcode. Run{" "}
                            <code className="font-mono">node scripts/backfillBarcodes.js</code>, or
                            open and re-save the product to generate one.
                        </p>
                    </div>
                )}

                {/* Toolbar */}
                <div className="bg-card rounded-2xl p-6 border border-border mb-6 space-y-5">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[240px]">
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Search
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Product name, SKU or barcode"
                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Category
                            </label>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="px-4 py-2.5 rounded-xl border border-input bg-background text-foreground"
                            >
                                <option value="">All categories</option>
                                {categories.map((cat) => (
                                    <option key={cat._id} value={cat._id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Label size
                            </label>
                            <select
                                value={sizeKey}
                                onChange={(e) => setSizeKey(e.target.value)}
                                className="px-4 py-2.5 rounded-xl border border-input bg-background text-foreground"
                            >
                                {Object.entries(LABEL_SIZES).map(([key, value]) => (
                                    <option key={key} value={key}>
                                        {value.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <label className="flex items-center gap-2 text-sm text-foreground pb-3">
                            <input
                                type="checkbox"
                                checked={showSalePrice}
                                onChange={(e) => setShowSalePrice(e.target.checked)}
                            />
                            Show sale price
                        </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
                        <button
                            onClick={() => setAll(1)}
                            className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted"
                        >
                            Select all (1 each)
                        </button>
                        <button
                            onClick={() => setAll(0)}
                            className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted"
                        >
                            Clear selection
                        </button>

                        <span className="text-sm text-muted-foreground">
                            {selectedRows} of {labels.length} variant
                            {labels.length === 1 ? "" : "s"} selected
                        </span>

                        <button
                            onClick={handlePrint}
                            disabled={sheet.length === 0}
                            className="ml-auto px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            <Printer className="w-4 h-4" />
                            Print {sheet.length} label{sheet.length === 1 ? "" : "s"}
                        </button>
                    </div>
                </div>

                {/* Variant list */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden mb-8">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : labels.length === 0 ? (
                        <p className="text-center text-muted-foreground py-16">
                            No products found
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="text-left font-medium px-5 py-3">Product</th>
                                        <th className="text-left font-medium px-5 py-3">Variant</th>
                                        <th className="text-left font-medium px-5 py-3">Barcode</th>
                                        <th className="text-right font-medium px-5 py-3">Price</th>
                                        <th className="text-right font-medium px-5 py-3">Stock</th>
                                        <th className="text-right font-medium px-5 py-3">Copies</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {labels.map((label) => (
                                        <tr
                                            key={label.id}
                                            className="border-t border-border hover:bg-muted/30"
                                        >
                                            <td className="px-5 py-3">
                                                <Link
                                                    href={`/admin/products/${label.productId}/edit`}
                                                    className="font-medium text-foreground hover:text-primary"
                                                >
                                                    {label.productName}
                                                </Link>
                                                {label.categoryName && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {label.categoryName}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-muted-foreground">
                                                {variantLabel(label.variant.attributes) || "Default"}
                                            </td>
                                            <td className="px-5 py-3 font-mono text-xs">
                                                {label.variant.barcode || (
                                                    <span className="text-amber-600">missing</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                {label.variant.salePrice ? (
                                                    <>
                                                        <span className="line-through text-muted-foreground mr-1">
                                                            ₹{Number(label.variant.regularPrice).toLocaleString("en-IN")}
                                                        </span>
                                                        ₹{Number(label.variant.salePrice).toLocaleString("en-IN")}
                                                    </>
                                                ) : (
                                                    <>₹{Number(label.variant.regularPrice).toLocaleString("en-IN")}</>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-right text-muted-foreground">
                                                {label.variant.stock}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={copies[label.id] ?? 0}
                                                    onChange={(e) => setCopyCount(label.id, e.target.value)}
                                                    className="w-20 px-3 py-1.5 rounded-lg border border-input bg-background text-right"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {sheet.length > 0 && (
                    <h2 className="font-serif text-xl font-bold text-foreground mb-3">
                        Preview
                    </h2>
                )}
            </div>

            {sheet.length > 0 && (
                <LabelPrintSheet size={size}>
                    {sheet.map(({ label, key }) => (
                        <ProductLabel
                            key={key}
                            productName={label.productName}
                            variant={label.variant}
                            size={size}
                            showSalePrice={showSalePrice}
                        />
                    ))}
                </LabelPrintSheet>
            )}
        </div>
    );
}
