"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BundlePage({ params }) {
    const { slug } = use(params);
    const [bundle, setBundle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBundle = async () => {
            try {
                const res = await fetch(`/api/bundles/${slug}`);
                const data = await res.json();
                if (data.success) {
                    setBundle(data.bundle);
                } else {
                    setError(data.message || "Bundle not found");
                }
            } catch (err) {
                console.error("Failed to fetch bundle:", err);
                setError("Failed to load bundle");
            } finally {
                setLoading(false);
            }
        };
        fetchBundle();
    }, [slug]);

    const getProductInfo = (product) => {
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
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-background pt-28 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </main>
        );
    }

    if (error || !bundle) {
        return (
            <main className="min-h-screen bg-background pt-28">
                <div className="container mx-auto px-4 lg:px-8 text-center py-20">
                    <div className="text-6xl mb-4">🎁</div>
                    <h1 className="font-serif text-3xl font-bold text-foreground mb-4">
                        Bundle Not Found
                    </h1>
                    <p className="text-muted-foreground mb-6">{error || "The bundle you're looking for doesn't exist."}</p>
                    <Link href="/">
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background pt-20">
            {/* Hero Section */}
            <section className="bg-linear-to-b from-primary/5 to-background py-12 lg:py-16">
                <div className="container mx-auto px-4 lg:px-8">
                    <Link href="/" className="text-sm text-primary hover:underline mb-4 inline-block">
                        ← Back to Home
                    </Link>
                    <h1 className="font-serif text-4xl lg:text-5xl font-bold text-foreground text-center">
                        {bundle.title}
                    </h1>
                    <p className="text-muted-foreground text-center mt-4 max-w-2xl mx-auto">
                        {bundle.products?.length || 0} products in this collection
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-12">
                {bundle.products?.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📦</div>
                        <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
                            No products in this bundle yet
                        </h3>
                        <p className="text-muted-foreground">
                            Check back soon for updates!
                        </p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {bundle.products.map((product) => {
                            const { price, originalPrice, hasSale, inStock } = getProductInfo(product);
                            return (
                                <Link
                                    key={product._id}
                                    href={`/products/${product._id}`}
                                    className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                                >
                                    {/* Product Image */}
                                    <div className="aspect-square bg-muted relative overflow-hidden">
                                        {product.images?.[0] ? (
                                            <img
                                                src={product.images[0]}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-6xl">
                                                📦
                                            </div>
                                        )}
                                        {hasSale && (
                                            <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                                                SALE
                                            </div>
                                        )}
                                        {!inStock && (
                                            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                                <span className="bg-destructive text-destructive-foreground px-4 py-2 rounded-full font-medium">
                                                    Out of Stock
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="p-5">
                                        {product.category && (
                                            <p className="text-xs text-primary font-medium uppercase tracking-wide mb-1">
                                                {product.category.name}
                                            </p>
                                        )}
                                        <h3 className="font-serif text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-xl text-foreground">
                                                ₹{price}
                                            </span>
                                            {hasSale && originalPrice && (
                                                <span className="text-muted-foreground line-through text-sm">
                                                    ₹{originalPrice}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
