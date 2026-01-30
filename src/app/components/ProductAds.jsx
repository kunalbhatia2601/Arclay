"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const ADS_PER_PAGE = 5;

export default function ProductAds({ position = "banner" }) {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);

    useEffect(() => {
        fetchAds();
    }, [position]);

    const fetchAds = async () => {
        try {
            const res = await fetch(`/api/product-ads?position=${position}`);
            const data = await res.json();
            if (data.success) {
                setAds(data.ads);
            }
        } catch (error) {
            console.error("Failed to fetch ads:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <section className="py-8 lg:py-12">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="aspect-[3/4] bg-muted rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (ads.length === 0) {
        return null;
    }

    const totalPages = Math.ceil(ads.length / ADS_PER_PAGE);
    const showPagination = ads.length > ADS_PER_PAGE;

    // Get current page's ads
    const startIndex = currentPage * ADS_PER_PAGE;
    const visibleAds = ads.slice(startIndex, startIndex + ADS_PER_PAGE);

    const goToPrevPage = () => {
        setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
    };

    const goToNextPage = () => {
        setCurrentPage((prev) => (prev + 1) % totalPages);
    };

    return (
        <section className="py-8 lg:py-12 bg-background">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="relative">
                    {/* Ads Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
                        {visibleAds.map((ad) => (
                            <AdCard key={ad._id} ad={ad} />
                        ))}
                    </div>

                    {/* Pagination Arrows - Only if more than 5 ads */}
                    {showPagination && (
                        <>
                            <button
                                onClick={goToPrevPage}
                                className="absolute -left-4 lg:-left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card shadow-lg hover:shadow-xl text-foreground flex items-center justify-center transition-all hover:scale-110 z-10"
                                aria-label="Previous page"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={goToNextPage}
                                className="absolute -right-4 lg:-right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card shadow-lg hover:shadow-xl text-foreground flex items-center justify-center transition-all hover:scale-110 z-10"
                                aria-label="Next page"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </>
                    )}
                </div>

                {/* Page Indicators - Only if more than 5 ads */}
                {showPagination && (
                    <div className="flex justify-center gap-2 mt-6">
                        {[...Array(totalPages)].map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentPage(idx)}
                                className={`h-2 rounded-full transition-all ${idx === currentPage
                                    ? "bg-primary w-6"
                                    : "bg-muted w-2 hover:bg-muted-foreground/30"
                                    }`}
                                aria-label={`Go to page ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

// Individual Ad Card Component
function AdCard({ ad }) {
    return (
        <div className="relative aspect-[3/4] rounded-2xl lg:rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group hover:scale-[1.02]">
            {/* Background Media */}
            {ad.mediaType === "video" ? (
                <video
                    src={ad.mediaUrl}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                />
            ) : (
                <img
                    src={ad.mediaUrl}
                    alt={ad.title}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Content at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-4 text-white">
                <h3 className="font-serif text-sm lg:text-lg font-bold mb-1 line-clamp-1">
                    {ad.title}
                </h3>
                {ad.description && (
                    <p className="text-white/80 text-xs lg:text-sm mb-2 lg:mb-3 line-clamp-2 hidden sm:block">
                        {ad.description}
                    </p>
                )}
                {ad.linkUrl && (
                    <Link
                        href={ad.linkUrl}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 lg:px-4 lg:py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white text-xs lg:text-sm font-medium transition-all"
                    >
                        <span>→</span>
                        <span className="hidden sm:inline">Tap to view product</span>
                        <span className="sm:hidden">View</span>
                    </Link>
                )}
            </div>
        </div>
    );
}
