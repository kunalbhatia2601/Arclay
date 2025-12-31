"use client";

import { getBrandContent, getSiteName } from "@/config/brandContent";

const siteName = getSiteName();
const content = getBrandContent(siteName);
const categories = content.productHighlight.categories;

export default function ProductHighlight() {
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

                {/* Categories Grid */}
                <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                    {categories.map((category, index) => (
                        <div
                            key={category.id}
                            className="group cursor-pointer animate-fade-in-up"
                            style={{ animationDelay: `${index * 150}ms` }}
                        >
                            {/* Product Images Circle */}
                            <div className={`relative w-48 h-48 mx-auto mb-6 ${category.bgColor} rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-105 group-hover:shadow-xl`}>
                                {/* Floating Product Cards */}
                                <div className="relative w-full h-full">
                                    {category.products.map((product, i) => (
                                        <div
                                            key={product}
                                            className={`absolute w-16 h-20 bg-white rounded-lg shadow-md flex flex-col items-center justify-center p-1 border border-border/50 transition-all duration-300 group-hover:shadow-lg ${i === 0
                                                ? "top-2 left-1/2 -translate-x-1/2 -rotate-6 group-hover:-rotate-12 group-hover:-translate-y-2"
                                                : i === 1
                                                    ? "bottom-4 left-4 rotate-6 group-hover:rotate-12 group-hover:-translate-x-2"
                                                    : "bottom-4 right-4 -rotate-3 group-hover:-rotate-6 group-hover:translate-x-2"
                                                }`}
                                        >
                                            <div className="w-10 h-12 bg-gradient-to-b from-primary/30 to-primary/60 rounded mb-1"></div>
                                            <span className="text-[6px] font-medium text-foreground/70 text-center leading-tight">
                                                {product}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Category Info */}
                            <div className="text-center">
                                <h3 className="font-serif text-lg font-semibold text-foreground mb-2 tracking-wide">
                                    {category.title}
                                </h3>
                                <p className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                                    {category.subtitle} →
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Carousel Dots */}
                <div className="flex justify-center gap-2 mt-12">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <div className="w-2 h-2 rounded-full bg-border"></div>
                    <div className="w-2 h-2 rounded-full bg-border"></div>
                </div>
            </div>
        </section>
    );
}
