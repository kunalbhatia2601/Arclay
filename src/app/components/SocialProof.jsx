"use client";

import { Button } from "@/components/ui/button";
import { getBrandContent, getSiteName } from "@/config/brandContent";

const siteName = getSiteName();
const content = getBrandContent(siteName);
const socialContent = content.socialProof;

export default function SocialProof() {
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
                            <span className="text-lg font-semibold text-foreground">{socialContent.rating}</span>
                            <span className="text-muted-foreground">({socialContent.reviewCount})</span>
                        </div>

                        {/* Review Avatars */}
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div
                                        key={i}
                                        className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 border-2 border-background flex items-center justify-center text-primary-foreground text-sm font-medium"
                                    >
                                        {String.fromCharCode(64 + i)}
                                    </div>
                                ))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {socialContent.communityText}
                            </span>
                        </div>

                        <Button
                            size="lg"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8"
                        >
                            SHOP NOW
                        </Button>
                    </div>

                    {/* Right - Reviews */}
                    <div className="space-y-4 animate-slide-in-right">
                        {socialContent.reviews.map((review, index) => (
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
                                        <p className="text-xs text-muted-foreground">
                                            {review.location}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
