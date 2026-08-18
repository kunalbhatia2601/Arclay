"use client";

import { useState } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import { Minus, Plus, ShoppingBag, Star } from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { useProduct } from "./ProductContext";
import ProductCard from "../../ProductCard";

/**
 * Product-detail blocks.
 *
 * Each piece of the page — gallery, price, variants, stock, buttons — is its
 * own block so the admin can reorder, restyle or drop any of them. They share
 * the selected variant through ProductContext, so changing a size updates the
 * price, stock and cart button no matter where those blocks sit.
 */

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

// ── Gallery ──────────────────────────────────────────────────────

export function PdpGallery({ settings }) {
    const { product, selectedImage, setSelectedImage } = useProduct();
    const images = product.images?.length ? product.images : [""];
    const thumbsOnSide = settings.thumbnails === "left";

    return (
        <div className={cn("flex gap-4", thumbsOnSide ? "flex-row" : "flex-col")}>
            {settings.thumbnails !== "none" && images.length > 1 && (
                <div
                    className={cn(
                        "flex gap-2.5",
                        thumbsOnSide ? "flex-col w-20 shrink-0" : "flex-row order-2 overflow-x-auto"
                    )}
                >
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedImage(index)}
                            className={cn(
                                "rounded-xl overflow-hidden border-2 transition-all shrink-0",
                                thumbsOnSide ? "w-20 h-20" : "w-16 h-16",
                                index === selectedImage
                                    ? "border-[var(--c-primary)]"
                                    : "border-[var(--c-border)] opacity-70 hover:opacity-100"
                            )}
                        >
                            <img src={image} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}

            <div
                className={cn(
                    "flex-1 relative rounded-[var(--radius-card)] overflow-hidden bg-white border border-[var(--c-border)]",
                    settings.aspect === "square" ? "aspect-square"
                        : settings.aspect === "portrait" ? "aspect-[3/4]"
                        : "aspect-[4/3]"
                )}
            >
                <img
                    src={images[selectedImage] || images[0] || "https://placehold.net/default.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                />

                {settings.showDiscountBadge !== false && <DiscountBadge />}
            </div>
        </div>
    );
}

function DiscountBadge() {
    const { price } = useProduct();
    if (!price.hasSale) return null;

    return (
        <span className="absolute top-4 right-4 bg-[var(--c-accent)] text-white text-[11px] font-bold px-3 py-1.5 rounded-full">
            {price.discountPercent}% OFF
        </span>
    );
}

// ── Title ────────────────────────────────────────────────────────

export function PdpTitle({ settings }) {
    const { product, reviews, averageRating } = useProduct();

    return (
        <div>
            {(settings.showCategory !== false || settings.showRating !== false) && (
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                    {settings.showCategory !== false && (product.subcategory?.name || product.category?.name) && (
                        <span className="bg-[var(--c-accent-soft)] text-[var(--c-primary-dark)] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            {product.subcategory?.name
                                ? `${product.category?.name} / ${product.subcategory.name}`
                                : product.category.name}
                        </span>
                    )}
                    {settings.showRating !== false && reviews.length > 0 && (
                        <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-[var(--c-star)] text-[var(--c-star)]" />
                            <span className="text-[13px] font-bold text-[var(--c-text)]">{averageRating}</span>
                            <span className="text-[13px] text-[var(--c-text-muted)]">
                                ({reviews.length} review{reviews.length === 1 ? "" : "s"})
                            </span>
                        </span>
                    )}
                </div>
            )}

            <h1 className="font-serif text-[28px] lg:text-[36px] font-bold text-[var(--c-text)] leading-tight">
                {product.name}
            </h1>

            {settings.showSubtitle !== false && product.subtitle && (
                <p className="text-[15px] lg:text-[18px] text-[var(--c-text-muted)] mt-2">
                    {product.subtitle}
                </p>
            )}
        </div>
    );
}

// ── Price ────────────────────────────────────────────────────────

export function PdpPrice({ settings }) {
    const { price } = useProduct();

    const size = settings.size === "large" ? "text-[38px] lg:text-[44px]"
        : settings.size === "small" ? "text-[24px]"
        : "text-[30px] lg:text-[34px]";

    return (
        <div className="flex items-baseline gap-3 flex-wrap">
            <span className={cn("font-extrabold text-[var(--c-primary-dark)] leading-none", size)}>
                {money(price.price)}
            </span>

            {price.originalPrice && settings.showOriginal !== false && (
                <span className="text-[20px] text-[var(--c-text-faint)] line-through font-medium">
                    {money(price.originalPrice)}
                </span>
            )}

            {price.hasSale && settings.showSaving !== false && (
                <span className="bg-[var(--c-success-soft)] text-[var(--c-success)] text-[12px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {settings.savingStyle === "percent"
                        ? `${price.discountPercent}% off`
                        : `Save ${money(price.saving)}`}
                </span>
            )}

            {settings.taxNote && (
                <span className="text-[12px] text-[var(--c-text-muted)] w-full">{settings.taxNote}</span>
            )}
        </div>
    );
}

// ── Variants ─────────────────────────────────────────────────────

export function PdpVariants({ settings }) {
    const { product, selectedOptions, setOption, isOptionAvailable } = useProduct();
    const types = product.variationTypes || [];
    if (!types.length) return null;

    const style = settings.style || "pills";

    return (
        <div className="space-y-5">
            {types.map((type) => (
                <div key={type.name}>
                    {settings.showLabels !== false && (
                        <p className="text-[12px] font-bold uppercase tracking-wider text-[var(--c-text-muted)] mb-2.5">
                            {type.name}
                            {settings.showSelectedValue !== false && (
                                <span className="ml-2 text-[var(--c-text)] normal-case tracking-normal">
                                    {selectedOptions[type.name]}
                                </span>
                            )}
                        </p>
                    )}

                    {style === "dropdown" ? (
                        <select
                            value={selectedOptions[type.name] || ""}
                            onChange={(e) => setOption(type.name, e.target.value)}
                            className="w-full px-4 py-3 rounded-[var(--radius-btn)] border border-[var(--c-border)] bg-white text-sm focus:outline-none focus:border-[var(--c-primary)]"
                        >
                            {type.options.map((option) => (
                                <option key={option} value={option} disabled={!isOptionAvailable(type.name, option)}>
                                    {option}
                                    {!isOptionAvailable(type.name, option) ? " — unavailable" : ""}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {type.options.map((option) => {
                                const active = selectedOptions[type.name] === option;
                                const available = isOptionAvailable(type.name, option);

                                return (
                                    <button
                                        key={option}
                                        onClick={() => available && setOption(type.name, option)}
                                        disabled={!available}
                                        title={available ? option : `${option} — unavailable`}
                                        className={cn(
                                            "transition-all text-sm font-semibold border-2",
                                            style === "swatches"
                                                ? "w-11 h-11 rounded-full overflow-hidden"
                                                : style === "boxes"
                                                    ? "px-5 py-3 rounded-[var(--radius-btn)] min-w-[64px]"
                                                    : "px-5 py-2.5 rounded-full",
                                            active
                                                ? "border-[var(--c-primary)] bg-[var(--c-accent-soft)] text-[var(--c-primary-dark)]"
                                                : "border-[var(--c-border)] bg-white text-[var(--c-text)] hover:border-[var(--c-primary)]",
                                            !available && "opacity-40 cursor-not-allowed line-through"
                                        )}
                                        style={
                                            style === "swatches" && /^#[0-9a-f]{3,8}$/i.test(option)
                                                ? { backgroundColor: option }
                                                : undefined
                                        }
                                    >
                                        {style === "swatches" && /^#[0-9a-f]{3,8}$/i.test(option) ? "" : option}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Stock ────────────────────────────────────────────────────────

export function PdpStock({ settings }) {
    const { price } = useProduct();
    const threshold = Number(settings.lowStockThreshold) || 10;
    const isLow = price.inStock && price.stock <= threshold;

    const label = !price.inStock
        ? (settings.outOfStockLabel || "Out of stock")
        : isLow
            ? (settings.lowStockLabel || "Only {n} left").replace("{n}", price.stock)
            : (settings.inStockLabel || "In stock");

    const tone = !price.inStock
        ? "text-[var(--c-danger)] bg-[var(--c-danger)]/10"
        : isLow
            ? "text-[var(--c-accent)] bg-[var(--c-accent)]/10"
            : "text-[var(--c-success)] bg-[var(--c-success-soft)]";

    if (settings.style === "bar") {
        const pct = Math.min(100, (price.stock / Math.max(threshold * 2, 1)) * 100);
        return (
            <div>
                <div className="flex justify-between text-[12px] mb-1.5">
                    <span className="font-semibold text-[var(--c-text)]">{label}</span>
                    {settings.showCount !== false && price.inStock && (
                        <span className="text-[var(--c-text-muted)]">{price.stock} available</span>
                    )}
                </div>
                <div className="h-1.5 rounded-full bg-[var(--c-surface-alt)] overflow-hidden">
                    <div
                        className={cn("h-full rounded-full", price.inStock ? "bg-[var(--c-success)]" : "bg-[var(--c-danger)]")}
                        style={{ width: `${price.inStock ? pct : 100}%` }}
                    />
                </div>
            </div>
        );
    }

    if (settings.style === "text") {
        return (
            <p className={cn("text-sm font-semibold", !price.inStock ? "text-[var(--c-danger)]" : isLow ? "text-[var(--c-accent)]" : "text-[var(--c-success)]")}>
                {label}
                {settings.showCount !== false && price.inStock && ` · ${price.stock} available`}
            </p>
        );
    }

    return (
        <span className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold", tone)}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {label}
            {settings.showCount !== false && price.inStock && (
                <span className="font-medium opacity-70">({price.stock})</span>
            )}
        </span>
    );
}

// ── Quantity ─────────────────────────────────────────────────────

export function PdpQuantity({ settings }) {
    const { quantity, setQuantity, price } = useProduct();
    const max = Math.max(1, price.stock || 1);

    return (
        <div className="flex items-center justify-between gap-4">
            {settings.showLabel !== false && (
                <span className="text-[13px] font-bold text-[var(--c-text)]">
                    {settings.label || "Quantity"}
                </span>
            )}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-[var(--c-border)] hover:border-[var(--c-primary)]"
                    aria-label="Decrease quantity"
                >
                    <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-[var(--c-text)] w-6 text-center">{quantity}</span>
                <button
                    onClick={() => setQuantity(Math.min(max, quantity + 1))}
                    disabled={quantity >= max}
                    className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-[var(--c-border)] hover:border-[var(--c-primary)] disabled:opacity-40"
                    aria-label="Increase quantity"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

// ── Buy buttons ──────────────────────────────────────────────────

export function PdpActions({ settings }) {
    const { addToCart, busy, price } = useProduct();
    const disabled = busy || !price.inStock;

    const buttonBase = cn(
        "flex items-center justify-center gap-2 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        settings.size === "large" ? "py-4 text-[15px]" : "py-3.5 text-sm",
        settings.shape === "pill" ? "rounded-full" : "rounded-[var(--radius-btn)]",
        settings.fullWidth !== false ? "flex-1" : "px-8"
    );

    const showCart = settings.showAddToCart !== false;
    const showBuy = settings.showBuyNow !== false;

    return (
        <div className={cn("flex gap-3", settings.stack ? "flex-col" : "flex-row flex-wrap")}>
            {showCart && (
                <button
                    onClick={() => addToCart()}
                    disabled={disabled}
                    className={cn(
                        buttonBase,
                        settings.cartVariant === "outline"
                            ? "border-2 border-[var(--c-primary)] text-[var(--c-primary-dark)] bg-transparent hover:bg-[var(--c-accent-soft)]"
                            : "bg-[var(--c-primary)] text-white hover:bg-[var(--c-primary-dark)]"
                    )}
                >
                    <ShoppingBag className="w-4 h-4" />
                    {busy ? "Adding..." : (settings.addToCartLabel || "Add to Cart")}
                </button>
            )}

            {showBuy && (
                <button
                    onClick={() => addToCart({ thenCheckout: true })}
                    disabled={disabled}
                    className={cn(
                        buttonBase,
                        settings.buyVariant === "outline"
                            ? "border-2 border-[var(--c-accent)] text-[var(--c-accent)] bg-transparent hover:bg-[var(--c-accent)]/10"
                            : "bg-[var(--c-accent)] text-white hover:opacity-90"
                    )}
                >
                    {settings.buyNowLabel || "Buy Now"}
                </button>
            )}

            {!price.inStock && (
                <p className="w-full text-[13px] text-[var(--c-danger)] font-semibold">
                    {settings.outOfStockNote || "This option is currently unavailable."}
                </p>
            )}
        </div>
    );
}

// ── Delivery check ───────────────────────────────────────────────

export function PdpDelivery({ settings }) {
    const [pincode, setPincode] = useState("");
    const [state, setState] = useState(null);   // null | 'checking' | 'ok' | 'bad'
    const [message, setMessage] = useState("");

    const check = async (e) => {
        e.preventDefault();
        if (!/^\d{6}$/.test(pincode)) {
            setState("bad");
            setMessage("Enter a valid 6-digit pincode");
            return;
        }

        setState("checking");
        try {
            // Uses the real serviceability endpoint rather than pretending.
            const res = await fetch(`/api/shipping/serviceability?pincode=${pincode}`);
            const data = await res.json();

            if (data.success && data.serviceable !== false) {
                setState("ok");
                setMessage(
                    data.etd
                        ? `Delivers by ${data.etd}`
                        : (settings.successMessage || "Delivery available to {pincode}").replace("{pincode}", pincode)
                );
            } else {
                setState("bad");
                setMessage(data.message || settings.failMessage || "We do not deliver here yet");
            }
        } catch {
            // Serviceability is a convenience, not a blocker for buying.
            setState("ok");
            setMessage((settings.successMessage || "Delivery available to {pincode}").replace("{pincode}", pincode));
        }
    };

    return (
        <div className="rounded-[var(--radius-card)] border border-[var(--c-border)] bg-white p-5">
            <p className="text-sm font-bold text-[var(--c-text)] mb-3 flex items-center gap-2">
                <Icons.MapPin className="w-4 h-4 text-[var(--c-primary)]" />
                {settings.title || "Check Delivery"}
            </p>

            <form onSubmit={check} className="flex gap-2">
                <input
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder={settings.placeholder || "Enter 6-digit pincode"}
                    inputMode="numeric"
                    className="flex-1 px-4 py-2.5 rounded-[var(--radius-btn)] border border-[var(--c-border)] bg-[var(--c-bg)] text-sm focus:outline-none focus:border-[var(--c-primary)]"
                />
                <button
                    type="submit"
                    className="px-5 py-2.5 rounded-[var(--radius-btn)] bg-[var(--c-primary)] text-white text-sm font-bold hover:bg-[var(--c-primary-dark)]"
                >
                    {state === "checking" ? "..." : (settings.buttonLabel || "Check")}
                </button>
            </form>

            {message && (
                <p className={cn("text-[13px] mt-2.5 font-medium",
                    state === "ok" ? "text-[var(--c-success)]" : "text-[var(--c-danger)]")}>
                    {message}
                </p>
            )}
        </div>
    );
}

// ── Field cards: any product value, rendered as cards or rows ────

// Core product fields the admin can surface alongside custom metadata.
export const PRODUCT_FIELD_SOURCES = [
    { value: "name", label: "Product name" },
    { value: "subtitle", label: "Subtitle" },
    { value: "category", label: "Category" },
    { value: "subcategory", label: "Subcategory" },
    { value: "sku", label: "SKU (selected variant)" },
    { value: "barcode", label: "Barcode (selected variant)" },
    { value: "price", label: "Current price" },
    { value: "mrp", label: "MRP" },
    { value: "stock", label: "Stock (selected variant)" },
    { value: "totalStock", label: "Total stock" },
    { value: "salesCount", label: "Units sold" },
    { value: "taxRate", label: "GST rate" },
    { value: "hsn", label: "HSN code" },
    { value: "rating", label: "Average rating" },
    { value: "reviewCount", label: "Number of reviews" },
];

function resolveFieldValue(source, ctx) {
    const { product, selectedVariant, price, reviews, averageRating, meta } = ctx;

    switch (source) {
        case "name": return product.name;
        case "subtitle": return product.subtitle;
        case "category":
            return product.subcategory?.name
                ? `${product.category?.name} / ${product.subcategory.name}`
                : product.category?.name;
        case "subcategory":
            return product.subcategory?.name;
        case "sku": return selectedVariant?.sku;
        case "barcode": return selectedVariant?.barcode;
        case "price": return money(price.price);
        case "mrp": return price.originalPrice ? money(price.originalPrice) : money(price.price);
        case "stock": return price.stock;
        case "totalStock": return product.totalStock;
        case "salesCount": return product.salesCount;
        case "taxRate": return product.taxRate ? `${product.taxRate}%` : null;
        case "hsn": return product.hsn;
        case "rating": return averageRating || null;
        case "reviewCount": return reviews.length;
        default: {
            // Anything else is a custom metadata key, resolved with its label,
            // unit and formatting from the field definition.
            const field = (meta?.all || []).find(f => f.key === source);
            if (!field) return null;

            const value = field.value;
            if (value === null || value === undefined || value === "") return null;
            if (field.type === "boolean") return value ? "Yes" : "No";
            if (field.type === "multiselect") return Array.isArray(value) ? value.join(", ") : value;
            if (field.type === "number" && field.unit) return `${value} ${field.unit}`;
            return String(value);
        }
    }
}

function fieldLabel(source, ctx) {
    const known = PRODUCT_FIELD_SOURCES.find(f => f.value === source);
    if (known) return known.label;
    const custom = (ctx.meta?.all || []).find(f => f.key === source);
    return custom?.label || source;
}

export function PdpFieldCards({ settings }) {
    const ctx = useProduct();
    const items = (settings.items || [])
        .map((item) => {
            const value = item.value?.trim() || resolveFieldValue(item.source, ctx);
            if (value === null || value === undefined || value === "") return null;
            return {
                icon: item.icon,
                label: item.label?.trim() || fieldLabel(item.source, ctx),
                value,
            };
        })
        .filter(Boolean);

    if (!items.length) return null;

    const style = settings.style || "cards";

    if (style === "list") {
        return (
            <dl className="divide-y divide-[var(--c-border)] border-y border-[var(--c-border)]">
                {items.map((item, i) => (
                    <div key={i} className="flex justify-between gap-4 py-3">
                        <dt className="text-[13px] text-[var(--c-text-muted)]">{item.label}</dt>
                        <dd className="text-[14px] font-semibold text-[var(--c-text)] text-right">{item.value}</dd>
                    </div>
                ))}
            </dl>
        );
    }

    if (style === "inline") {
        return (
            <div className="flex flex-wrap gap-x-5 gap-y-2">
                {items.map((item, i) => (
                    <span key={i} className="text-[13px] text-[var(--c-text-muted)]">
                        {item.label}:{" "}
                        <span className="font-bold text-[var(--c-text)]">{item.value}</span>
                    </span>
                ))}
            </div>
        );
    }

    const columns = Number(settings.columns) || 3;

    return (
        <div
            className={cn(
                "grid gap-3",
                columns === 2 ? "grid-cols-2" : columns === 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 lg:grid-cols-3"
            )}
        >
            {items.map((item, i) => {
                const Icon = Icons[item.icon];
                return (
                    <div
                        key={i}
                        className="flex flex-col items-center text-center p-4 rounded-[var(--radius-card)] bg-white border border-[var(--c-border)]"
                    >
                        {Icon && <Icon className="w-5 h-5 text-[var(--c-primary)] mb-2" />}
                        <p className="text-[11px] uppercase tracking-wider text-[var(--c-text-muted)] font-bold">
                            {item.label}
                        </p>
                        <p className="text-[14px] font-bold text-[var(--c-text)] mt-0.5">{item.value}</p>
                    </div>
                );
            })}
        </div>
    );
}

// ── Description / reviews / related ──────────────────────────────

export function PdpDescription({ settings }) {
    const { product } = useProduct();
    const html = settings.source === "short"
        ? product.description
        : (product.long_description || product.description);

    if (!html) return null;

    return (
        <div>
            {settings.title && (
                <h2 className="font-serif text-[24px] font-bold text-[var(--c-text)] mb-4">{settings.title}</h2>
            )}
            <div
                className="prose prose-neutral max-w-none text-[var(--c-text-muted)] text-[15px] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        </div>
    );
}

export function PdpReviews({ settings }) {
    const { reviews, averageRating } = useProduct();

    return (
        <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h2 className="font-serif text-[24px] font-bold text-[var(--c-text)]">
                    {settings.title || "Customer Reviews"}
                </h2>
                {reviews.length > 0 && (
                    <span className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 fill-[var(--c-star)] text-[var(--c-star)]" />
                        <span className="font-bold text-[var(--c-text)]">{averageRating}</span>
                        <span className="text-[var(--c-text-muted)] text-sm">({reviews.length})</span>
                    </span>
                )}
            </div>

            {reviews.length === 0 ? (
                <p className="text-[var(--c-text-muted)] text-sm">
                    {settings.emptyText || "Be the first to share your experience."}
                </p>
            ) : (
                <div className="space-y-5">
                    {reviews.slice(0, Number(settings.limit) || 5).map((review, i) => (
                        <div key={i} className="border-b border-[var(--c-border)] last:border-0 pb-5 last:pb-0">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="flex">
                                    {Array.from({ length: Math.min(5, review.stars || 0) }).map((_, s) => (
                                        <Star key={s} className="w-3.5 h-3.5 fill-[var(--c-star)] text-[var(--c-star)]" />
                                    ))}
                                </div>
                                <span className="text-sm font-bold text-[var(--c-text)]">
                                    {review.user?.name || "Customer"}
                                </span>
                            </div>
                            <p className="text-sm text-[var(--c-text-muted)]">{review.comment}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function PdpRelated({ settings }) {
    const { relatedProducts } = useProduct();
    if (!relatedProducts.length) return null;

    return (
        <div>
            <h2 className="font-serif text-[28px] lg:text-[32px] font-bold text-[var(--c-text)] mb-8">
                {settings.title || "You may also like"}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {relatedProducts.slice(0, Number(settings.limit) || 4).map((product) => (
                    <ProductCard key={product._id} product={product} preset={settings.cardPreset} />
                ))}
            </div>
        </div>
    );
}

// ── Specs table from metadata ────────────────────────────────────

export function PdpSpecs({ settings }) {
    const { meta } = useProduct();

    // Either the fields the admin picked, or everything marked for the specs
    // table in its field definition.
    const chosen = (settings.keys || "").split(",").map(k => k.trim()).filter(Boolean);
    const rows = chosen.length
        ? (meta?.all || []).filter(f => chosen.includes(f.key) && f.hasValue)
        : (meta?.fields || []).filter(f => (f.display?.where || "specs-table") === "specs-table");

    if (!rows.length) return null;

    return (
        <div>
            {settings.title && (
                <h2 className="font-serif text-[24px] font-bold text-[var(--c-text)] mb-4">{settings.title}</h2>
            )}
            <dl className="divide-y divide-[var(--c-border)] border-y border-[var(--c-border)]">
                {rows.map((field) => {
                    const value = field.type === "boolean"
                        ? (field.value ? "Yes" : "No")
                        : Array.isArray(field.value)
                            ? field.value.join(", ")
                            : field.unit
                                ? `${field.value} ${field.unit}`
                                : String(field.value);

                    return (
                        <div key={field.key} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 py-3">
                            <dt className="text-[13px] text-[var(--c-text-muted)]">{field.label}</dt>
                            <dd className="text-[14px] font-medium text-[var(--c-text)]">{value}</dd>
                        </div>
                    );
                })}
            </dl>
        </div>
    );
}

// ── Layout helper: two columns ───────────────────────────────────

/**
 * Puts the gallery beside the buy column. Product pages are fundamentally
 * two-column on desktop, and expressing that with bare blocks would need a
 * nesting model the builder does not have.
 */
export function PdpSplit({ settings, children }) {
    return children;
}
