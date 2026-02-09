"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import ProductCard from "./ProductCard";

export default function FeaturedProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/products?limit=4"); // Fetch 4 products for the featured section
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error("Failed to fetch products:", error);
            // Optionally, set an error state here
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    return (
        <section className="py-20 lg:py-28 bg-background relative border-b border-border">
            <div className="container mx-auto px-4 lg:px-8 relative z-10">
                {/* Section Header - Minimal & Centered */}
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase mb-4">
                        Discover Excellence
                    </p>
                    <h2 className="font-heading text-4xl lg:text-5xl font-black text-foreground tracking-tight mb-4">
                        CURATED <span className="text-muted-foreground">COLLECTION</span>
                    </h2>
                    <p className="text-muted-foreground font-light text-lg">
                        Thoughtfully selected products representing the pinnacle of quality and craftsmanship.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                        {products.map((product) => (
                            <ProductCard
                                key={product._id}
                                product={product}
                            />
                        ))}
                    </div>
                )}

                {/* View All Button */}
                <div className="text-center mt-10">
                    <Link href="/products" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest text-xs font-bold border-b border-transparent hover:border-foreground pb-1">
                        Explore Full Collection
                    </Link>
                </div>
            </div>
        </section>
    );
}
