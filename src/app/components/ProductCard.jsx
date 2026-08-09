"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Heart, Loader2, Plus, Share2, ShoppingBag, Star } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { DEFAULT_CARD, resolveCardPreset } from "@/lib/cardPreset";
import VariantPickerModal from "./VariantPickerModal";
import { useDefaultCardPreset } from "./CardPresetProvider";

/**
 * Product card.
 *
 * Every visual decision comes from a preset rather than being hardcoded, so the
 * same component renders the standard grid card, an overlay card, a minimal
 * one or a horizontal row depending on what the admin configured.
 */

const ASPECT = {
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
    tall: "aspect-[2/3]",
};

const RADIUS = {
    none: "rounded-none",
    sm: "rounded-lg",
    lg: "rounded-2xl",
    xl: "rounded-[2rem]",
};

const SHADOW = {
    none: "",
    soft: "shadow-[0_4px_20px_-10px_rgba(0,0,0,0.12)]",
    strong: "shadow-xl",
};

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

function ProductCardInner({ product, viewMode = "grid", preset, onRequestVariant }) {
    const { isAuthenticated } = useUser();
    const [adding, setAdding] = useState(false);
    const [hovered, setHovered] = useState(false);

    // Explicit preset wins; otherwise the site-wide default from the provider;
    // schema defaults only if neither exists.
    const sitePreset = useDefaultCardPreset();

    const card = useMemo(() => {
        const source = preset || sitePreset;
        const base = source ? resolveCardPreset(source) : { ...DEFAULT_CARD };
        // The catalogue's list toggle overrides the preset's own layout.
        if (viewMode === "list") base.layout = "horizontal";
        return base;
    }, [preset, sitePreset, viewMode]);

    const info = useMemo(() => {
        const variants = product.variants || [];
        const first = variants[0];

        // Prefer the denormalized fields; fall back to variants for callers
        // that select a leaner projection.
        const price = product.minPrice ?? (first
            ? (first.salePrice != null && first.salePrice < first.regularPrice ? first.salePrice : first.regularPrice)
            : 0);

        const mrp = first && first.salePrice != null && first.salePrice < first.regularPrice
            ? first.regularPrice
            : null;

        const hasSale = product.hasSale ?? !!mrp;
        const stock = product.totalStock ?? variants.reduce((sum, v) => sum + (v.stock || 0), 0);

        const discountPercent = mrp && mrp > price
            ? Math.round((1 - price / mrp) * 100)
            : 0;

        const isNew = product.createdAt
            ? (Date.now() - new Date(product.createdAt).getTime()) / 86400000 <= (Number(card.newWithinDays) || 14)
            : false;

        return { price, mrp, hasSale, inStock: stock > 0, discountPercent, isNew, firstVariant: first };
    }, [product, card.newWithinDays]);

    const images = product.images?.length ? product.images : [""];
    const shownImage = card.hover === "swap" && hovered && images[1] ? images[1] : images[0];

    // True when the customer has a real choice to make. A product with one
    // variant (or no variation types) can go straight into the cart.
    const needsVariantChoice =
        (product.variationTypes?.length || 0) > 0 && (product.variants?.length || 0) > 1;

    const addToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) return toast.info("Please login to add items to your cart");
        if (!info.inStock) return toast.error("Out of stock");

        // Opening the picker beats silently adding whichever variant is first.
        if (needsVariantChoice) return onRequestVariant();

        setAdding(true);
        try {
            const res = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    productId: product._id,
                    // The cart API matches on attributes, not a variant id.
                    variantAttributes: info.firstVariant?.attributes || {},
                    quantity: 1,
                }),
            });
            const data = await res.json();

            if (data.success) toast.success("Added to cart");
            else toast.error(data.message || "Could not add to cart");
        } catch {
            toast.error("Network error");
        } finally {
            setAdding(false);
        }
    };

    const stop = (e) => { e.preventDefault(); e.stopPropagation(); };

    const badges = (
        <>
            {card.showDiscountBadge && info.discountPercent > 0 && (
                <Badge className="bg-[var(--c-accent)] text-white">{info.discountPercent}% OFF</Badge>
            )}
            {card.showFeaturedBadge && product.isFeatured && (
                <Badge className="bg-[var(--c-accent)] text-white">{card.featuredLabel || "HOT"}</Badge>
            )}
            {card.showNewBadge && info.isNew && !product.isFeatured && (
                <Badge className="bg-[var(--c-primary)] text-white">{card.newLabel || "NEW"}</Badge>
            )}
            {card.showSoldOutBadge && !info.inStock && (
                <Badge className="bg-[var(--c-text)] text-white">{card.soldOutLabel || "SOLD OUT"}</Badge>
            )}
        </>
    );

    const actions = (card.showWishlist || card.showShare) && (
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
            {card.showWishlist && (
                <IconButton onClick={stop} label="Add to wishlist">
                    <Heart className="w-4 h-4" />
                </IconButton>
            )}
            {card.showShare && (
                <IconButton onClick={stop} label="Share">
                    <Share2 className="w-4 h-4" />
                </IconButton>
            )}
        </div>
    );

    const quickAdd = card.quickAdd !== "none" && (
        card.quickAdd === "full" ? (
            <button
                onClick={addToCart}
                disabled={adding || !info.inStock}
                className="w-full mt-3 py-2.5 rounded-[var(--radius-btn)] bg-[var(--c-primary)] text-white text-sm font-bold hover:bg-[var(--c-primary-dark)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                {card.quickAddLabel || "Add to Cart"}
            </button>
        ) : (
            <button
                onClick={addToCart}
                disabled={adding || !info.inStock}
                aria-label={card.quickAddLabel || "Add to cart"}
                className={cn(
                    "w-9 h-9 rounded-full bg-[var(--c-primary)] text-white flex items-center justify-center shrink-0 hover:bg-[var(--c-primary-dark)] transition-all disabled:opacity-40",
                    card.quickAdd === "hover" && "opacity-0 group-hover:opacity-100"
                )}
            >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
        )
    );

    const extraField = card.metaKey && resolveExtraField(product, card.metaKey);

    const details = (
        <div className={cn("flex flex-col", card.textAlign === "center" && "items-center text-center")}>
            {card.showCategory && product.category?.name && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--c-accent)] mb-1">
                    {product.category.name}
                </span>
            )}

            {card.showName && (
                <h3
                    className="font-semibold text-[var(--c-text)] text-[14px] leading-snug"
                    style={{
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: Number(card.nameLines) || 2,
                        overflow: "hidden",
                    }}
                >
                    {product.name}
                </h3>
            )}

            {extraField && (
                <p className="text-[12px] text-[var(--c-text-muted)] mt-1">{extraField}</p>
            )}

            {card.showRating && product.salesCount > 0 && (
                <span className="flex items-center gap-1 mt-1.5">
                    <Star className="w-3.5 h-3.5 fill-[var(--c-star)] text-[var(--c-star)]" />
                    <span className="text-[12px] text-[var(--c-text-muted)]">
                        {product.salesCount} sold
                    </span>
                </span>
            )}

            {card.showPrice && (
                <div className={cn(
                    "flex items-center gap-2 mt-2",
                    card.textAlign === "center" && "justify-center"
                )}>
                    <span className="text-[16px] font-extrabold text-[var(--c-primary-dark)]">
                        {money(info.price)}
                    </span>
                    {card.showMrp && info.mrp && (
                        <span className="text-[13px] text-[var(--c-text-faint)] line-through">
                            {money(info.mrp)}
                        </span>
                    )}
                </div>
            )}
        </div>
    );

    // ── Horizontal ───────────────────────────────────────────────
    if (card.layout === "horizontal") {
        return (
            <Link
                href={`/products/${product._id}`}
                className={cn(
                    "group flex gap-4 p-3 bg-[var(--c-surface)] transition-all",
                    RADIUS[card.radius] ?? RADIUS.lg,
                    card.border && "border border-[var(--c-border)]",
                    SHADOW[card.shadow] ?? "",
                    card.hover === "lift" && "hover:-translate-y-0.5"
                )}
            >
                <div className={cn("relative w-28 shrink-0 overflow-hidden", ASPECT[card.imageAspect] ?? ASPECT.square, RADIUS[card.radius] ?? RADIUS.lg)}>
                    <img
                        src={shownImage}
                        alt={product.name}
                        className={cn("w-full h-full", card.imageFit === "contain" ? "object-contain" : "object-cover")}
                    />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex flex-wrap gap-1.5 mb-1.5">{badges}</div>
                    {details}
                </div>

                {card.quickAdd !== "none" && (
                    <div className="self-center">{quickAdd}</div>
                )}
            </Link>
        );
    }

    // ── Overlay ──────────────────────────────────────────────────
    if (card.layout === "overlay") {
        return (
            <Link
                href={`/products/${product._id}`}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className={cn(
                    "group relative block overflow-hidden transition-all",
                    ASPECT[card.imageAspect] ?? ASPECT.square,
                    RADIUS[card.radius] ?? RADIUS.lg,
                    SHADOW[card.shadow] ?? "",
                    card.hover === "lift" && "hover:-translate-y-1"
                )}
            >
                <img
                    src={shownImage}
                    alt={product.name}
                    className={cn(
                        "absolute inset-0 w-full h-full transition-transform duration-500",
                        card.imageFit === "contain" ? "object-contain" : "object-cover",
                        card.hover === "zoom" && "group-hover:scale-105"
                    )}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5">{badges}</div>
                {actions}

                <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                    <div className="[&_h3]:text-white [&_span]:text-white/80">{details}</div>
                    {card.quickAdd === "full" && quickAdd}
                </div>
            </Link>
        );
    }

    // ── Standard / minimal ───────────────────────────────────────
    return (
        <Link
            href={`/products/${product._id}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={cn(
                "group flex flex-col bg-[var(--c-surface)] overflow-hidden transition-all h-full",
                RADIUS[card.radius] ?? RADIUS.lg,
                card.border && "border border-[var(--c-border)]",
                SHADOW[card.shadow] ?? "",
                card.hover === "lift" && "hover:-translate-y-1"
            )}
        >
            <div className={cn("relative overflow-hidden", ASPECT[card.imageAspect] ?? ASPECT.square)}>
                <img
                    src={shownImage}
                    alt={product.name}
                    className={cn(
                        "w-full h-full transition-transform duration-500",
                        card.imageFit === "contain" ? "object-contain" : "object-cover",
                        card.hover === "zoom" && "group-hover:scale-105"
                    )}
                />

                <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-1.5">{badges}</div>
                {actions}

                {card.showVariantDots && (product.images?.length || 0) > 1 && (
                    <div className="absolute bottom-3 left-3 flex gap-1.5 z-20">
                        {product.images.slice(0, 3).map((image, i) => (
                            <span
                                key={i}
                                className="w-6 h-6 rounded-full border-2 border-white overflow-hidden shadow"
                            >
                                <img src={image} alt="" className="w-full h-full object-cover" />
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {card.layout !== "minimal" ? (
                <div className="p-4 flex-1 flex flex-col">
                    {details}
                    <div className={cn(
                        "mt-auto",
                        card.quickAdd === "icon" || card.quickAdd === "hover"
                            ? "flex justify-end pt-3"
                            : ""
                    )}>
                        {quickAdd}
                    </div>
                </div>
            ) : (
                <div className="p-3">
                    {card.showName && (
                        <h3 className={cn("text-[13px] font-semibold text-[var(--c-text)] truncate", card.textAlign === "center" && "text-center")}>
                            {product.name}
                        </h3>
                    )}
                    {card.showPrice && (
                        <p className={cn("text-[14px] font-bold text-[var(--c-primary-dark)] mt-0.5", card.textAlign === "center" && "text-center")}>
                            {money(info.price)}
                        </p>
                    )}
                </div>
            )}
        </Link>
    );
}

/**
 * Wraps the card so the variant picker renders as a sibling rather than inside
 * the card's <Link>, where its clicks would navigate away.
 */
export default function ProductCard(props) {
    const [picking, setPicking] = useState(false);

    return (
        <>
            <ProductCardInner {...props} onRequestVariant={() => setPicking(true)} />
            {picking && (
                <VariantPickerModal
                    product={props.product}
                    onClose={() => setPicking(false)}
                />
            )}
        </>
    );
}

function Badge({ className, children }) {
    return (
        <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full", className)}>
            {children}
        </span>
    );
}

function IconButton({ onClick, label, children }) {
    return (
        <button
            onClick={onClick}
            aria-label={label}
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-[var(--c-text-muted)] hover:text-[var(--c-accent)] shadow transition-colors"
        >
            {children}
        </button>
    );
}

// Resolves the optional extra field configured on the preset.
function resolveExtraField(product, key) {
    switch (key) {
        case "category": return product.category?.name;
        case "sku": return product.variants?.[0]?.sku;
        case "totalStock": return product.totalStock != null ? `${product.totalStock} in stock` : null;
        case "salesCount": return product.salesCount ? `${product.salesCount} sold` : null;
        case "subtitle": return product.subtitle;
        default: {
            const value = product.meta?.[key];
            if (value === null || value === undefined || value === "") return null;
            if (typeof value === "boolean") return value ? "Yes" : "No";
            if (Array.isArray(value)) return value.join(", ");
            return String(value);
        }
    }
}
