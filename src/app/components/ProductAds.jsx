"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";

const ADS_PER_PAGE = 5;

export default function ProductAds({ position = "banner" }) {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [selectedAd, setSelectedAd] = useState(null);

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
        return null; // Don't render anything if no ads
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
        <section className="py-16 lg:py-24 bg-muted border-t border-border">
            <div className="container mx-auto px-4 lg:px-8">

                {/* Section Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase mb-3">
                            Discover More
                        </p>
                        <h2 className="font-heading text-3xl lg:text-4xl font-black text-foreground tracking-tight">
                            TRENDING <span className="text-transparent bg-clip-text bg-linear-to-r from-foreground to-muted-foreground">STORIES</span>
                        </h2>
                    </div>

                    {/* Optional: Add custom navigation or description here */}
                    <div className="hidden md:block h-px flex-1 bg-border mx-8 mb-4"></div>
                </div>

                <div className="relative">
                    {/* Ads Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
                        {visibleAds.map((ad) => (
                            <AdCard key={ad._id} ad={ad} onClick={() => setSelectedAd(ad)} />
                        ))}
                    </div>

                    {/* Pagination Arrows */}
                    {showPagination && (
                        <>
                            <button
                                onClick={goToPrevPage}
                                className="absolute -left-4 lg:-left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-card border border-border shadow-lg text-foreground flex items-center justify-center transition-all hover:scale-110 hover:bg-primary hover:text-black z-10 hover:border-primary"
                                aria-label="Previous page"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={goToNextPage}
                                className="absolute -right-4 lg:-right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-card border border-border shadow-lg text-foreground flex items-center justify-center transition-all hover:scale-110 hover:bg-primary hover:text-black z-10 hover:border-primary"
                                aria-label="Next page"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </>
                    )}
                </div>

                {/* Page Indicators */}
                {showPagination && (
                    <div className="flex justify-center gap-2 mt-8">
                        {[...Array(totalPages)].map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentPage(idx)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentPage
                                    ? "bg-primary w-8"
                                    : "bg-foreground/10 w-4 hover:bg-foreground/30"
                                    }`}
                                aria-label={`Go to page ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Ad Modal */}
            {selectedAd && (
                <AdModal ad={selectedAd} onClose={() => setSelectedAd(null)} />
            )}
        </section>
    );
}

// Individual Ad Card Component
function AdCard({ ad, onClick }) {
    return (
        <div
            onClick={onClick}
            className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(204,255,0,0.15)] transition-all duration-500 group hover:-translate-y-2 cursor-pointer border border-border bg-muted"
        >
            {/* Background Media */}
            {ad.mediaType === "video" ? (
                <video
                    src={ad.mediaUrl}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    autoPlay
                    muted
                    loop
                    playsInline
                />
            ) : (
                <img
                    src={ad.mediaUrl}
                    alt={ad.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-80" />

            {/* Content at Bottom - Keeping white because it's over dark media/gradient */}
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white transform transition-transform duration-300">
                <h3 className="font-heading text-lg font-bold mb-1 line-clamp-1 text-white group-hover:text-primary transition-colors">
                    {ad.title}
                </h3>
                {ad.description && (
                    <p className="text-white/70 text-xs mb-3 line-clamp-2 hidden sm:block font-medium">
                        {ad.description}
                    </p>
                )}
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/50 group-hover:text-white transition-colors">
                    <div className="w-8 h-[1px] bg-primary"></div>
                    View Story
                </div>
            </div>
        </div>
    );
}

// Full Screen/Modal Ad View
function AdModal({ ad, onClose }) {
    // Lock body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const ModalContent = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-fade-in"
                onClick={onClose}
            />

            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 text-white/50 hover:text-white bg-black/20 hover:bg-white/10 rounded-full transition-colors border border-white/5"
                aria-label="Close modal"
            >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Modal Card */}
            <div className="relative w-full max-w-lg aspect-[3/4] sm:aspect-[9/16] max-h-[90vh] bg-background rounded-3xl overflow-hidden shadow-2xl animate-scale-in border border-border">
                {/* Media */}
                <div className="absolute inset-0">
                    {ad.mediaType === "video" ? (
                        <video
                            src={ad.mediaUrl}
                            className="w-full h-full object-cover"
                            autoPlay
                            loop
                            playsInline
                            controls={false}
                        />
                    ) : (
                        <img
                            src={ad.mediaUrl}
                            alt={ad.title}
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>

                {/* Overlay & Content - Keeping white text for readability over media */}
                <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent pointer-events-none" />

                <div className="absolute bottom-0 left-0 right-0 p-8 text-white text-center">
                    <h2 className="font-heading text-3xl font-black mb-3 animate-slide-up text-primary">
                        {ad.title}
                    </h2>
                    {ad.description && (
                        <p className="text-white/80 text-base mb-8 leading-relaxed animate-slide-up delay-100 font-medium">
                            {ad.description}
                        </p>
                    )}

                    {ad.linkUrl && (
                        <Link
                            href={ad.linkUrl}
                            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-4 bg-primary text-black rounded-full font-bold transition-all hover:scale-105 shadow-[0_0_30px_rgba(204,255,0,0.3)] animate-slide-up delay-200 pointer-events-auto"
                        >
                            <span>Shop Now</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
    // Use portal to render outside the section hierarchy
    if (typeof window === 'undefined') return null;
    return createPortal(ModalContent, document.body);
}
