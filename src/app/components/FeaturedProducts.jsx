"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

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
        <section className="py-16 lg:py-24 bg-muted/30">
            <div className="container mx-auto px-4 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase mb-2">
                        Handpicked For You
                    </p>
                    <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground">
                        Featured Products
                    </h2>
                    <div className="decorative-line mx-auto mt-4"></div>
                </div>

                {loading ? (
                    <div className="flex justify-center">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Navigation Arrows */}
                        {showCarousel && (
                            <>
                                <button
                                    onClick={goPrev}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 lg:-translate-x-6 z-10 w-10 h-10 bg-card border border-border rounded-full flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors shadow-lg"
                                    aria-label="Previous"
                                >
                                    ←
                                </button>
                                <button
                                    onClick={goNext}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 lg:translate-x-6 z-10 w-10 h-10 bg-card border border-border rounded-full flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors shadow-lg"
                                    aria-label="Next"
                                >
                                    →
                                </button>
                            </>
                        )}

                        {/* Products Grid */}
                        <div
                            className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6"
                            onMouseEnter={() => setIsPaused(true)}
                            onMouseLeave={() => setIsPaused(false)}
                        >
                            {visibleProducts.map((product, index) => {
                                const { price, originalPrice, hasSale } = getProductInfo(product);
                                return (
                                    <Link
                                        href={`/products/${product._id}`}
                                        key={`${product._id}-${currentIndex}-${index}`}
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
                                                <div className="w-full h-full flex items-center justify-center text-4xl">
                                                    📦
                                                </div>
                                            )}
                                            {hasSale && (
                                                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                                                    SALE
                                                </div>
                                            )}
                                            {/* Featured Badge */}
                                            <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                                ⭐ <span className="hidden sm:inline">Featured</span>
                                            </div>
                                        </div>

                                        {/* Product Info */}
                                        <div className="p-3 md:p-4">
                                            {product.category && (
                                                <p className="text-xs text-primary font-medium uppercase tracking-wide mb-1 hidden sm:block">
                                                    {product.category.name}
                                                </p>
                                            )}
                                            <h3 className="font-serif text-sm lg:text-base font-bold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                                                {product.name}
                                            </h3>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-base lg:text-lg text-foreground">
                                                    ₹{price}
                                                </span>
                                                {hasSale && originalPrice && (
                                                    <span className="text-muted-foreground line-through text-xs sm:text-sm">
                                                        ₹{originalPrice}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Carousel Dots */}
                        {showCarousel && (
                            <div className="flex justify-center gap-2 mt-8">
                                {products.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => goToSlide(i)}
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentIndex
                                            ? 'bg-primary w-6'
                                            : 'bg-border hover:bg-primary/50'
                                            }`}
                                        aria-label={`Go to slide ${i + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* View All Link */}
                <div className="text-center mt-10">
                    <Link
                        href="/products"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
                    >
                        View All Products →
                    </Link>
                </div>
            </div>
        </section>
    );
}
