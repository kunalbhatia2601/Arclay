"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getBrandContent, getSiteName } from "@/config/brandContent";

const siteName = getSiteName();
const content = getBrandContent(siteName);

export default function ProductHighlight() {
    const [bundles, setBundles] = useState([]);
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

    const visibleCount = isMobile ? 1 : 3;

    useEffect(() => {
        const fetchBundles = async () => {
            try {
                const res = await fetch("/api/bundles");
                const data = await res.json();
                if (data.success) {
                    setBundles(data.bundles);
                }
            } catch (error) {
                console.error("Failed to fetch bundles:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBundles();
    }, []);

    // Auto-slide carousel
    useEffect(() => {
        if (bundles.length <= visibleCount || isPaused) return;

        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % bundles.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [bundles.length, isPaused, visibleCount]);

    // Get visible bundles
    const getVisibleBundles = useCallback(() => {
        if (bundles.length <= visibleCount) return bundles;

        const visible = [];
        for (let i = 0; i < visibleCount; i++) {
            const idx = (currentIndex + i) % bundles.length;
            visible.push({ ...bundles[idx], displayIndex: i });
        }
        return visible;
    }, [bundles, currentIndex, visibleCount]);

    const goToSlide = (index) => {
        setCurrentIndex(index);
    };

    const goNext = () => {
        setCurrentIndex(prev => (prev + 1) % bundles.length);
    };

    const goPrev = () => {
        setCurrentIndex(prev => (prev - 1 + bundles.length) % bundles.length);
    };

    // If no bundles, don't render the section
    if (!loading && bundles.length === 0) {
        return null;
    }

    const visibleBundles = getVisibleBundles();
    const showCarousel = bundles.length > visibleCount;

    return (
        <section id="products" className="py-20 lg:py-28 bg-background">
            <div className="container mx-auto px-4 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-4">
                        {content.productHighlight.sectionTitle}
                    </p>
                    <div className="decorative-line mx-auto"></div>
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
                                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-8 z-10 w-10 h-10 bg-card border border-border rounded-full flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors shadow-lg"
                                    aria-label="Previous"
                                >
                                    ←
                                </button>
                                <button
                                    onClick={goNext}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-8 z-10 w-10 h-10 bg-card border border-border rounded-full flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors shadow-lg"
                                    aria-label="Next"
                                >
                                    →
                                </button>
                            </>
                        )}

                        {/* Bundles Grid */}
                        <div
                            className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 pt-6 overflow-hidden"
                            onMouseEnter={() => setIsPaused(true)}
                            onMouseLeave={() => setIsPaused(false)}
                        >
                            {visibleBundles.map((bundle, index) => (
                                <Link
                                    href={`/bundles/${bundle.slug}`}
                                    key={`${bundle._id}-${currentIndex}-${index}`}
                                    className="group cursor-pointer"
                                >
                                    {/* Product Images Circle */}
                                    <div className="relative w-48 h-48 mx-auto mb-6 bg-primary/5 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-105 group-hover:shadow-xl">
                                        {/* Product Cards - adaptive layout */}
                                        {bundle.products?.length === 1 ? (
                                            // Single product - centered, larger
                                            <div className="w-24 h-28 bg-white rounded-lg shadow-md flex flex-col items-center justify-center p-2 border border-border/50 transition-all duration-300 group-hover:shadow-lg group-hover:scale-105">
                                                {bundle.products[0].images?.[0] ? (
                                                    <img
                                                        src={bundle.products[0].images[0]}
                                                        alt={bundle.products[0].name}
                                                        className="w-16 h-18 object-cover rounded mb-1"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-18 bg-linear-to-b from-primary/30 to-primary/60 rounded mb-1"></div>
                                                )}
                                                <span className="text-[8px] font-medium text-foreground/70 text-center leading-tight">
                                                    {bundle.products[0].name?.substring(0, 12) || 'Product'}
                                                </span>
                                            </div>
                                        ) : bundle.products?.length === 2 ? (
                                            // Two products - side by side
                                            <div className="flex items-center justify-center gap-2">
                                                {bundle.products.slice(0, 2).map((product, i) => (
                                                    <div
                                                        key={product._id || i}
                                                        className={`w-18 h-22 bg-white rounded-lg shadow-md flex flex-col items-center justify-center p-1 border border-border/50 transition-all duration-300 group-hover:shadow-lg ${i === 0
                                                                ? "-rotate-6 group-hover:-rotate-12"
                                                                : "rotate-6 group-hover:rotate-12"
                                                            }`}
                                                    >
                                                        {product.images?.[0] ? (
                                                            <img
                                                                src={product.images[0]}
                                                                alt={product.name}
                                                                className="w-12 h-14 object-cover rounded mb-1"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-14 bg-linear-to-b from-primary/30 to-primary/60 rounded mb-1"></div>
                                                        )}
                                                        <span className="text-[6px] font-medium text-foreground/70 text-center leading-tight">
                                                            {product.name?.substring(0, 12) || 'Product'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            // Three or more products - floating cards
                                            <div className="relative w-full h-full">
                                                {bundle.products?.slice(0, 3).map((product, i) => (
                                                    <div
                                                        key={product._id || i}
                                                        className={`absolute w-16 h-20 bg-white rounded-lg shadow-md flex flex-col items-center justify-center p-1 border border-border/50 transition-all duration-300 group-hover:shadow-lg ${i === 0
                                                            ? "top-2 left-1/2 -translate-x-1/2 -rotate-6 group-hover:-rotate-12 group-hover:-translate-y-2"
                                                            : i === 1
                                                                ? "bottom-4 left-4 rotate-6 group-hover:rotate-12 group-hover:-translate-x-2"
                                                                : "bottom-4 right-4 -rotate-3 group-hover:-rotate-6 group-hover:translate-x-2"
                                                            }`}
                                                    >
                                                        {product.images?.[0] ? (
                                                            <img
                                                                src={product.images[0]}
                                                                alt={product.name}
                                                                className="w-10 h-12 object-cover rounded mb-1"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-12 bg-linear-to-b from-primary/30 to-primary/60 rounded mb-1"></div>
                                                        )}
                                                        <span className="text-[6px] font-medium text-foreground/70 text-center leading-tight">
                                                            {product.name?.substring(0, 12) || 'Product'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Bundle Info */}
                                    <div className="text-center">
                                        <h3 className="font-serif text-lg font-semibold text-foreground mb-2 tracking-wide">
                                            {bundle.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                                            {bundle.btnTxt} →
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Carousel Dots */}
                        {bundles.length > 0 && (
                            <div className="flex justify-center gap-2 mt-12">
                                {bundles.map((_, i) => (
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
            </div>
        </section>
    );
}
