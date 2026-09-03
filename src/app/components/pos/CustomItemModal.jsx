"use client";

import { useEffect, useRef, useState } from "react";
import { PackagePlus, X } from "lucide-react";

/**
 * Rings up something that is not in the catalog yet.
 *
 * Name/quantity/price are typed by the cashier, so unlike every other POS line
 * the price does not come from the database. The sale still needs a GST rate to
 * be a valid tax invoice, and a cost to show up honestly in P/L — both default
 * to the store's usual values rather than zero. Every line created here is
 * flagged and listed under Custom Items in admin for review.
 */
export default function CustomItemModal({ onClose, onAdd, defaultTaxRate = 0 }) {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState("1");
    const [taxRate, setTaxRate] = useState(String(defaultTaxRate || 0));
    const [costPrice, setCostPrice] = useState("");
    const [hsn, setHsn] = useState("");
    const nameRef = useRef(null);

    useEffect(() => {
        nameRef.current?.focus();
        const onKey = (e) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    const priceNum = parseFloat(price);
    const qtyNum = parseInt(quantity, 10);
    const valid = name.trim() && Number.isFinite(priceNum) && priceNum >= 0 && qtyNum > 0;
    const total = valid ? priceNum * qtyNum : 0;

    const submit = (e) => {
        e.preventDefault();
        if (!valid) return;
        onAdd({
            name: name.trim(),
            price: priceNum,
            quantity: qtyNum,
            taxRate: Math.min(100, Math.max(0, parseFloat(taxRate) || 0)),
            costPrice: costPrice === "" ? null : Math.max(0, parseFloat(costPrice) || 0),
            hsn: hsn.trim(),
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <form
                onSubmit={submit}
                className="bg-card rounded-2xl border border-border w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <p className="font-bold text-foreground flex items-center gap-2">
                        <PackagePlus className="w-5 h-5" /> Quick item
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-3">
                    <label className="block">
                        <span className="text-xs font-medium text-muted-foreground">Item name</span>
                        <input
                            ref={nameRef}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Loose sugar 1kg"
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="text-xs font-medium text-muted-foreground">Price / unit (₹)</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </label>
                        <label className="block">
                            <span className="text-xs font-medium text-muted-foreground">Quantity</span>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <label className="block">
                            <span className="text-xs font-medium text-muted-foreground">GST %</span>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={taxRate}
                                onChange={(e) => setTaxRate(e.target.value)}
                                className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </label>
                        <label className="block">
                            <span className="text-xs font-medium text-muted-foreground">Cost (₹)</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={costPrice}
                                onChange={(e) => setCostPrice(e.target.value)}
                                placeholder="optional"
                                className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </label>
                        <label className="block">
                            <span className="text-xs font-medium text-muted-foreground">HSN</span>
                            <input
                                value={hsn}
                                onChange={(e) => setHsn(e.target.value)}
                                placeholder="optional"
                                className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </label>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        No stock is tracked for a quick item, and a return will refund the money
                        without restocking. It shows up under Custom Items in admin so it can be
                        added to the catalog properly.
                    </p>
                </div>

                <div className="p-4 border-t border-border flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-foreground">
                        {total > 0 ? `₹${total.toLocaleString("en-IN")}` : ""}
                    </span>
                    <button
                        type="submit"
                        disabled={!valid}
                        className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-40"
                    >
                        Add to bill
                    </button>
                </div>
            </form>
        </div>
    );
}
