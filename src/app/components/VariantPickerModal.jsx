"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";

/**
 * Variant chooser shown when "Add to cart" is pressed on a product that has
 * options.
 *
 * Without this the card silently added whichever variant happened to be first,
 * so a customer asking for 1kg could receive 250g. Products with a single
 * variant never see this — they go straight to the cart.
 */
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function VariantPickerModal({ product, onClose, onAdded }) {
    const [selected, setSelected] = useState(() => {
        const initial = {};
        for (const type of product?.variationTypes || []) {
            if (type.options?.length) initial[type.name] = type.options[0];
        }
        return initial;
    });
    const [quantity, setQuantity] = useState(1);
    const [adding, setAdding] = useState(false);

    // Escape closes, and the page behind must not scroll while this is open.
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = previous;
        };
    }, [onClose]);

    const variant = useMemo(() => {
        const variants = product?.variants || [];
        if (!product?.variationTypes?.length) return variants[0] || null;

        return variants.find(v =>
            Object.entries(selected).every(([key, value]) => (v.attributes || {})[key] === value)
        ) || null;
    }, [product, selected]);

    const price = variant
        ? (variant.salePrice != null && variant.salePrice < variant.regularPrice
            ? variant.salePrice : variant.regularPrice)
        : 0;
    const mrp = variant && variant.salePrice != null && variant.salePrice < variant.regularPrice
        ? variant.regularPrice : null;
    const stock = variant?.stock || 0;

    // Greys out combinations that do not exist rather than letting the customer
    // pick one and hit an error.
    const isAvailable = (typeName, option) => {
        const candidate = { ...selected, [typeName]: option };
        return (product.variants || []).some(v =>
            Object.entries(candidate).every(([key, value]) => (v.attributes || {})[key] === value)
        );
    };

    const add = async () => {
        if (!variant) return toast.error("Please choose an option");
        if (stock < quantity) return toast.error(stock ? `Only ${stock} left` : "Out of stock");

        setAdding(true);
        try {
            const res = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    productId: product._id,
                    // Sent exactly as stored on the variant: the API matches on
                    // a stringified comparison, which is key-order sensitive.
                    variantAttributes: variant.attributes || {},
                    quantity,
                }),
            });
            const data = await res.json();

            if (!data.success) return toast.error(data.message || "Could not add to cart");
            toast.success("Added to cart");
            onAdded?.();
            onClose();
        } catch {
            toast.error("Network error");
        } finally {
            setAdding(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
            // Portalled or not, React bubbles events up the component tree, so
            // clicks here would otherwise trigger the card's link.
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full sm:max-w-md bg-[var(--c-surface)] rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[88vh] flex flex-col">
                <div className="flex items-start gap-3 p-5 border-b border-[var(--c-border)]">
                    {product.images?.[0] && (
                        <img
                            src={product.images[0]}
                            alt=""
                            className="w-16 h-16 rounded-xl object-cover shrink-0"
                        />
                    )}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[var(--c-text)] leading-snug line-clamp-2">
                            {product.name}
                        </h3>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-[18px] font-extrabold text-[var(--c-primary-dark)]">
                                {money(price)}
                            </span>
                            {mrp && (
                                <span className="text-[13px] text-[var(--c-text-faint)] line-through">
                                    {money(mrp)}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="p-1.5 text-[var(--c-text-muted)] hover:text-[var(--c-text)] shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {(product.variationTypes || []).map((type) => (
                        <div key={type.name}>
                            <p className="text-[12px] font-bold uppercase tracking-wider text-[var(--c-text-muted)] mb-2.5">
                                {type.name}
                                <span className="ml-2 text-[var(--c-text)] normal-case tracking-normal">
                                    {selected[type.name]}
                                </span>
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {(type.options || []).map((option) => {
                                    const active = selected[type.name] === option;
                                    const available = isAvailable(type.name, option);
                                    return (
                                        <button
                                            key={option}
                                            onClick={() => available && setSelected(s => ({ ...s, [type.name]: option }))}
                                            disabled={!available}
                                            className={cn(
                                                "px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all",
                                                active
                                                    ? "border-[var(--c-primary)] bg-[var(--c-accent-soft)] text-[var(--c-primary-dark)]"
                                                    : "border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text)] hover:border-[var(--c-primary)]",
                                                !available && "opacity-40 cursor-not-allowed line-through"
                                            )}
                                        >
                                            {option}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-[var(--c-text)]">Quantity</span>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                className="w-9 h-9 rounded-full border border-[var(--c-border)] flex items-center justify-center"
                                aria-label="Decrease"
                            >
                                <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-bold w-6 text-center">{quantity}</span>
                            <button
                                onClick={() => setQuantity(q => Math.min(Math.max(1, stock), q + 1))}
                                disabled={quantity >= stock}
                                className="w-9 h-9 rounded-full border border-[var(--c-border)] flex items-center justify-center disabled:opacity-40"
                                aria-label="Increase"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <p className={cn(
                        "text-[13px] font-semibold",
                        stock > 0 ? "text-[var(--c-success)]" : "text-[var(--c-danger)]"
                    )}>
                        {!variant ? "This combination is unavailable"
                            : stock > 0 ? `In stock · ${stock} available`
                            : "Out of stock"}
                    </p>
                </div>

                <div className="p-5 border-t border-[var(--c-border)]">
                    <button
                        onClick={add}
                        disabled={adding || !variant || stock < 1}
                        className="w-full py-3.5 rounded-[var(--radius-btn)] bg-[var(--c-primary)] text-white font-bold flex items-center justify-center gap-2 hover:bg-[var(--c-primary-dark)] transition-colors disabled:opacity-50"
                    >
                        {adding
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</>
                            : <><ShoppingBag className="w-4 h-4" /> Add to Cart · {money(price * quantity)}</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
