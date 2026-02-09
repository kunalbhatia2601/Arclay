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
            className="product-card group relative flex flex-col h-full"
        >
            {/* Product Image Stage */}
            <div className="product-card-image aspect-square relative">
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
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {hasSale && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                            Sale
                        </span>
                    )}
                    {!inStock && (
                        <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                            No Stock
                        </span>
                    )}
                    {product.isNew && (
                        <span className="bg-olive-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                            New
                        </span>
                    )}
                </div>

                {/* Discount Badge */}
                {hasSale && originalPrice && (
                    <span className="absolute top-2 right-2 bg-yellow-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        {Math.round((1 - price / originalPrice) * 100)}% OFF
                    </span>
                )}
            </div>

            {/* Product Info */}
            <div className="p-3 flex flex-col flex-1">
                {product.category && (
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">
                        {product.category.name}
                    </p>
                )}
                <h3 className="font-medium text-sm text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2 mb-1">
                    {product.name}
                </h3>

                <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-olive-700">₹{price}</span>
                        {hasSale && originalPrice && (
                            <span className="text-xs text-muted-foreground line-through">₹{originalPrice}</span>
                        )}
                    </div>
                    <button className="w-8 h-8 rounded-full bg-olive-100 text-olive-600 flex items-center justify-center hover:bg-olive-500 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-bag"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                    </button>
                </div>
            </div>
        </Link>
    );
}
