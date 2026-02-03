"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import ProductCard from "./ProductCard";

export default function FeaturedProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const visibleCount = isMobile ? 2 : 4;

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch("/api/products/featured");
                const data = await res.json();
                if (data.success) {
                    setProducts(data.products);
                }
            } catch (error) {
                console.error("Failed to fetch featured products:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Auto-slide carousel
    useEffect(() => {
        if (products.length <= visibleCount || isPaused) return;

        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % products.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [products.length, isPaused, visibleCount]);

    // Get visible products
    const getVisibleProducts = useCallback(() => {
        if (products.length <= visibleCount) return products;

        const visible = [];
        for (let i = 0; i < visibleCount; i++) {
            const idx = (currentIndex + i) % products.length;
            visible.push(products[idx]);
        }
        return visible;
    }, [products, currentIndex, visibleCount]);

    const goToSlide = (index) => {
        setCurrentIndex(index);
    };

    const goNext = () => {
        setCurrentIndex(prev => (prev + 1) % products.length);
    };

    const goPrev = () => {
        setCurrentIndex(prev => (prev - 1 + products.length) % products.length);
    };






    const visibleProducts = getVisibleProducts();
    const showCarousel = products.length > visibleCount;

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
                    <div className="relative group/slider">
                        {/* Navigation Arrows - Visible on Hover for Desktop */}
                        {showCarousel && (
                            <>
                                <button
                                    onClick={goPrev}
                                    className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-10 w-14 h-14 rounded-full bg-card border border-border text-foreground items-center justify-center transition-all opacity-0 group-hover/slider:opacity-100 hover:bg-primary hover:text-primary-foreground hover:scale-110 shadow-2xl"
                                    aria-label="Previous"
                                >
                                    <span className="text-xl">←</span>
                                </button>
                                <button
                                    onClick={goNext}
                                    className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-10 w-14 h-14 rounded-full bg-card border border-border text-foreground items-center justify-center transition-all opacity-0 group-hover/slider:opacity-100 hover:bg-primary hover:text-primary-foreground hover:scale-110 shadow-2xl"
                                    aria-label="Next"
                                >
                                    <span className="text-xl">→</span>
                                </button>
                            </>
                        )}

                        {/* Products Grid */}
                        <div
                            className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
                            onMouseEnter={() => setIsPaused(true)}
                            onMouseLeave={() => setIsPaused(false)}
                        >
                            {visibleProducts.map((product, index) => (
                                <ProductCard
                                    key={`${product._id}-${currentIndex}-${index}`}
                                    product={product}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* View All Button */}
                <div className="text-center mt-10">
                    <Link href="/shop" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest text-xs font-bold border-b border-transparent hover:border-foreground pb-1">
                        Explore Full Collection
                    </Link>
                </div>
            </div>
        </section>
    );
}
