"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

    const getProductInfo = (product) => {
        const firstVariant = product.variants?.[0];
        if (!firstVariant) return { price: 0, originalPrice: null, hasSale: false };

        const hasSale = firstVariant.salePrice && firstVariant.salePrice < firstVariant.regularPrice;

        return {
            price: hasSale ? firstVariant.salePrice : firstVariant.regularPrice,
            originalPrice: hasSale ? firstVariant.regularPrice : null,
            hasSale
        };
    };

    // If no products, don't render the section
    if (!loading && products.length === 0) {
        return null;
    }

    const visibleProducts = getVisibleProducts();
    const showCarousel = products.length > visibleCount;

    return (
        <section className="py-20 lg:py-28 bg-[#0A0A0A] relative border-b border-white/5">
            <div className="container mx-auto px-4 lg:px-8 relative z-10">
                {/* Section Header - Minimal & Centered */}
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase mb-4">
                        Discover Excellence
                    </p>
                    <h2 className="font-heading text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">
                        CURATED <span className="text-white/50">COLLECTION</span>
                    </h2>
                    <p className="text-white/40 font-light text-lg">
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
                                    className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-10 w-14 h-14 rounded-full bg-[#1E1E1E] text-white items-center justify-center transition-all opacity-0 group-hover/slider:opacity-100 hover:bg-primary hover:text-black hover:scale-110 shadow-2xl"
                                    aria-label="Previous"
                                >
                                    <span className="text-xl">←</span>
                                </button>
                                <button
                                    onClick={goNext}
                                    className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-10 w-14 h-14 rounded-full bg-[#1E1E1E] text-white items-center justify-center transition-all opacity-0 group-hover/slider:opacity-100 hover:bg-primary hover:text-black hover:scale-110 shadow-2xl"
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
                            {visibleProducts.map((product, index) => {
                                const { price, originalPrice, hasSale } = getProductInfo(product);
                                return (
                                    <Link
                                        href={`/products/${product._id}`}
                                        key={`${product._id}-${currentIndex}-${index}`}
                                        className="group relative flex flex-col"
                                    >
                                        {/* Product Image Stage */}
                                        <div className="aspect-[3/4] bg-[#121212] rounded-3xl overflow-hidden relative mb-6">
                                            {/* Background Glow */}
                                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

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
                                                    <span className="bg-primary text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                                        -20%
                                                    </span>
                                                )}
                                            </div>

                                            {/* Quick Actions (Slide Up) */}
                                            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                                <button className="w-full h-12 bg-white text-black font-bold uppercase text-xs tracking-widest rounded-full hover:bg-primary transition-colors shadow-xl">
                                                    Quick Add
                                                </button>
                                            </div>
                                        </div>

                                        {/* Product Info - Clean & Minimal */}
                                        <div className="space-y-1">
                                            <h3 className="font-heading text-lg font-bold text-white leading-tight group-hover:text-primary transition-colors">
                                                {product.name}
                                            </h3>
                                            <div className="flex items-center gap-3">
                                                <span className="text-white/60 font-medium">₹{price}</span>
                                                {hasSale && originalPrice && (
                                                    <span className="text-white/20 line-through text-sm">₹{originalPrice}</span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* View All Button */}
                <div className="text-center mt-10">
                    <Link href="/shop" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold border-b border-transparent hover:border-white pb-1">
                        Explore Full Collection
                    </Link>
                </div>
            </div>
        </section>
    );
}
