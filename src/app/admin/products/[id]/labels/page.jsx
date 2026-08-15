"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";
import ProductLabel, {
    LABEL_SIZES,
    LabelPrintSheet,
    variantLabel,
} from "@/app/components/ProductLabel";

export default function ProductLabelsPage() {
    const { id } = useParams();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [sizeKey, setSizeKey] = useState("thermal");
    const [copies, setCopies] = useState({});
    const [showSalePrice, setShowSalePrice] = useState(true);

    const size = LABEL_SIZES[sizeKey];

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const res = await fetch(`/api/admin/products/${id}`, { credentials: "include" });
                const data = await res.json();

                if (cancelled) return;

                if (data.success) {
                    setProduct(data.product);
                    const initial = {};
                    (data.product.variants || []).forEach((_, i) => {
                        initial[i] = 1;
                    });
                    setCopies(initial);
                } else {
                    setError(data.message || "Failed to load product");
                }
            } catch (err) {
                console.error("Load product error:", err);
                if (!cancelled) setError("Failed to load product");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [id]);

    // One entry per physical label to print.
    const labels = useMemo(() => {
        if (!product) return [];

        const out = [];
        (product.variants || []).forEach((variant, index) => {
            const count = Math.max(0, parseInt(copies[index], 10) || 0);
            for (let i = 0; i < count; i++) {
                out.push({ variant, key: `${index}-${i}` });
            }
        });
        return out;
    }, [product, copies]);

    const setCopyCount = (index, value) => {
        setCopies((prev) => ({ ...prev, [index]: value }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="p-6">
                <p className="text-destructive">{error || "Product not found"}</p>
                <Link href="/admin/products" className="text-primary text-sm mt-4 inline-block">
                    ← Back to Products
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Controls — hidden when printing */}
            <div className="print:hidden">
                <div className="mb-6">
                    <Link
                        href={`/admin/products/${id}/edit`}
                        className="text-muted-foreground hover:text-primary transition-colors text-sm mb-4 inline-flex items-center gap-1"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Product
                    </Link>
                    <h1 className="font-serif text-3xl font-bold text-foreground">Print Labels</h1>
                    <p className="text-muted-foreground mt-1">{product.name}</p>
                </div>

                <div className="bg-card rounded-2xl p-6 border border-border mb-6 space-y-5">
                    <div className="flex flex-wrap gap-6 items-end">
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

                        <button
                            onClick={() => window.print()}
                            disabled={labels.length === 0}
                            className="ml-auto px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            <Printer className="w-4 h-4" />
                            Print {labels.length} label{labels.length === 1 ? "" : "s"}
                        </button>
                    </div>

                    <div className="border-t border-border pt-4">
                        <p className="text-sm font-medium text-foreground mb-3">Copies per variant</p>
                        <div className="space-y-2">
                            {product.variants.map((variant, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-4 text-sm bg-background border border-border rounded-xl px-4 py-2.5"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">
                                            {variantLabel(variant.attributes) || "Default"}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-mono">
                                            {variant.barcode || "no barcode — re-save the product"}
                                        </p>
                                    </div>
                                    <span className="text-muted-foreground">
                                        ₹{Number(variant.regularPrice).toLocaleString("en-IN")}
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={copies[index] ?? 1}
                                        onChange={(e) => setCopyCount(index, e.target.value)}
                                        className="w-20 px-3 py-1.5 rounded-lg border border-input bg-background"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {labels.length > 0 ? (
                <LabelPrintSheet size={size}>
                    {labels.map(({ variant, key }) => (
                        <ProductLabel
                            key={key}
                            productName={product.name}
                            variant={variant}
                            size={size}
                            showSalePrice={showSalePrice}
                        />
                    ))}
                </LabelPrintSheet>
            ) : (
                <p className="text-muted-foreground text-sm print:hidden">
                    Set at least one copy to preview labels.
                </p>
            )}
        </div>
    );
}
