"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getBrandContent, getSiteName } from "@/config/brandContent";

const siteName = getSiteName();
const content = getBrandContent(siteName);
const socialContent = content.socialProof;

export default function SocialProof() {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ totalReviews: 0, avgRating: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await fetch("/api/reviews/social-proof");
                const data = await res.json();
                if (data.success) {
                    setReviews(data.reviews);
                    setStats(data.stats);
                }
            } catch (error) {
                console.error("Failed to fetch reviews:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, []);

    // Use dynamic reviews if available, otherwise fallback to static content
    const displayReviews = reviews.length > 0 ? reviews.map(r => ({
        id: r._id,
        rating: r.stars,
        text: r.comment,
        author: r.userName || "Customer"
    })) : socialContent.reviews;

    const displayRating = stats.avgRating > 0 ? stats.avgRating.toFixed(1) : socialContent.rating;
    const displayCount = stats.totalReviews > 0 ? `${stats.totalReviews} reviews` : socialContent.reviewCount;

    return (
        <section className="py-20 lg:py-28 bg-muted">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left - Stats */}
                    <div className="space-y-8 animate-fade-in-up">
                        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                            {socialContent.sectionLabel}
                        </p>

                        <div>
                            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                                {socialContent.statsTitle}
                            </h2>
                            <p className="font-serif text-3xl md:text-4xl text-primary font-bold">
                                {socialContent.statsSubtitle}
                            </p>
                        </div>

                        {/* Star Rating */}
                        <div className="flex items-center gap-2">
                            <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <svg
                                        key={star}
                                        className="w-6 h-6 text-secondary fill-current"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                    </svg>
                                ))}
                            </div>
                            <span className="text-lg font-semibold text-foreground">{displayRating}</span>
                            <span className="text-muted-foreground">({displayCount})</span>
                        </div>

                        {/* Review Avatars */}
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div
                                        key={i}
                                        className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-primary/70 border-2 border-background flex items-center justify-center text-primary-foreground text-sm font-medium"
                                    >
                                        {String.fromCharCode(64 + i)}
                                    </div>
                                ))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {socialContent.communityText}
                            </span>
                        </div>

                        <Link href="/products">
                            <Button
                                size="lg"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8"
                            >
                                SHOP NOW
                            </Button>
                        </Link>
                    </div>

                    {/* Right - Reviews */}
                    <div className="space-y-4 animate-slide-in-right">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            displayReviews.map((review, index) => (
                                <div
                                    key={review.id}
                                    className="bg-card p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    {/* Stars */}
                                    <div className="flex mb-3">
                                        {Array.from({ length: review.rating }).map((_, i) => (
                                            <svg
                                                key={i}
                                                className="w-4 h-4 text-secondary fill-current"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                            </svg>
                                        ))}
                                    </div>

                                    {/* Review Text */}
                                    <p className="text-foreground mb-4 leading-relaxed">
                                        &quot;{review.text}&quot;
                                    </p>

                                    {/* Author */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                            {review.author[0]}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground text-sm">
                                                {review.author}
                                            </p>
                                            {review.location && (
                                                <p className="text-xs text-muted-foreground">
                                                    {review.location}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
