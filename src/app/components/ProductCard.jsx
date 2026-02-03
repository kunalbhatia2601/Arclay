"use client";

import Link from "next/link";
import { useMemo } from "react";

export default function ProductCard({ product }) {
    const priceInfo = useMemo(() => {
        const firstVariant = product.variants?.[0];
        if (!firstVariant) return { price: 0, originalPrice: null, hasSale: false, inStock: false };

        const hasSale = firstVariant.salePrice && firstVariant.salePrice < firstVariant.regularPrice;
        const totalStock = product.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;

        return {
            price: hasSale ? firstVariant.salePrice : firstVariant.regularPrice,
            originalPrice: hasSale ? firstVariant.regularPrice : null,
            hasSale,
            inStock: totalStock > 0
        };
    }, [product]);

    const { price, originalPrice, hasSale, inStock } = priceInfo;

    return (
        <Link
            href={`/products/${product._id}`}
            className="group relative flex flex-col"
        >
            {/* Product Image Stage */}
            <div className="aspect-[3/4] bg-muted rounded-3xl overflow-hidden relative mb-4 border border-transparent group-hover:border-border transition-colors">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {product.images?.[0] ? (
                    <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl grayscale opacity-20">📦</div>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {hasSale && (
                        <span className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                            Sale
                        </span>
                    )}
                    {!inStock && (
                        <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                            Out of Stock
                        </span>
                    )}
                </div>

                {/* Quick Actions (Slide Up) */}
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <button className="w-full h-12 bg-foreground text-background font-bold uppercase text-xs tracking-widest rounded-full hover:bg-primary hover:text-primary-foreground transition-colors shadow-xl">
                        Quick Add
                    </button>
                </div>
            </div>

            {/* Product Info - Clean & Minimal */}
            <div className="space-y-1">
                {product.category && (
                    <p className="text-[10px] text-foreground font-bold uppercase tracking-widest mb-1 group-hover:opacity-100 group-hover:text-primary transition-opacity transform -translate-y-2 group-hover:translate-y-0 duration-300">
                        {product.category.name}
                    </p>
                )}
                <h3 className="font-heading text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-1">
                    {product.name}
                </h3>
                <div className="flex items-center gap-3">
                    <span className="text-muted-foreground font-medium">₹{price}</span>
                    {hasSale && originalPrice && (
                        <span className="text-muted-foreground/50 line-through text-sm">₹{originalPrice}</span>
                    )}
                </div>
            </div>
        </Link>
    );
}
