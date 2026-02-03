"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getBrandContent, getSiteName } from "@/config/brandContent";
import { Button } from "@/components/ui/button";

const siteName = getSiteName();
const content = getBrandContent(siteName);

export default function ProductHighlight() {
    const [bundles, setBundles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("All");

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

    return (
        <section className="py-20 bg-background relative overflow-hidden">
            <div className="absolute inset-0 bg-pattern opacity-5 pointer-events-none"></div>

            <div className="container mx-auto px-4 lg:px-8 relative z-10">

                {/* Section Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <span className="text-primary font-bold tracking-widest uppercase text-xs mb-2 block">
                            Limited Edition
                        </span>
                        <h2 className="font-heading text-4xl lg:text-5xl font-black text-foreground leading-tight">
                            CURATED <span className="text-primary">COMBOS</span>
                        </h2>
                    </div>

                    {/* Navigation Buttons for future implementation */}
                    <div className="hidden md:flex gap-2">
                        <button className="p-3 rounded-full border border-border text-foreground hover:bg-muted transition-colors">
                            ←
                        </button>
                        <button className="p-3 rounded-full border border-border text-foreground hover:bg-muted transition-colors">
                            →
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                        {bundles.slice(0, 6).map((bundle, index) => (
                            <BundleCard key={bundle._id || index} bundle={bundle} />
                        ))}
                    </div>
                )}

                {/* View All Button */}
                <div className="mt-16 text-center">
                    <Link href="/shop">
                        <Button variant="outline" className="border-border text-foreground hover:bg-foreground hover:text-background rounded-full px-10 py-6 text-sm font-bold tracking-widest uppercase transition-all">
                            View All Combos
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}

function BundleCard({ bundle }) {
    const [currentImgIndex, setCurrentImgIndex] = useState(0);

    // Rotate through the first image of each product in the bundle
    const allImages = bundle.products?.map(p => p.images?.[0]).filter(Boolean) || [];

    useEffect(() => {
        if (allImages.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentImgIndex((prev) => (prev + 1) % allImages.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [allImages.length]);

    const currentImage = allImages.length > 0 ? allImages[currentImgIndex] : null;

    return (
        <Link
            href={`/bundles/${bundle.slug}`}
            className="group relative bg-card hover:bg-accent/50 rounded-3xl p-4 transition-all duration-300 border border-border hover:border-primary/30 flex items-center gap-6"
        >
            {/* Circular Image Mask */}
            <div className="shrink-0 w-24 h-24 lg:w-32 lg:h-32 rounded-full overflow-hidden border-2 border-border shadow-lg relative bg-background">
                {currentImage ? (
                    <img
                        key={currentImage} // Key helps React identify change, simple crossfade can occur if supported but simple switch is robust
                        src={currentImage}
                        alt={bundle.title || bundle.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 animate-fade-in"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl grayscale opacity-20">📦</div>
                )}
                {/* Quick Add Button Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">+</span>
                </div>
            </div>

            {/* Content Info */}
            <div className="flex-1 py-2 pr-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-heading text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {bundle.title || bundle.name}
                    </h3>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 font-medium leading-relaxed">
                    <span className="text-primary/80 uppercase text-[10px] font-bold tracking-wider block mb-1">Includes</span>
                    {bundle.products?.map(p => p.name).join(" + ") || "Curated Items"}
                </p>

                <div className="flex items-center gap-4 justify-between mt-auto">
                    {/* Item Count Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-full border border-border">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            {bundle.products?.length || 0} Products
                        </span>
                    </div>

                    {/* Dynamic CTA */}
                    <div className="text-xs font-bold text-foreground border-b border-primary pb-0.5 group-hover:text-primary transition-colors">
                        {bundle.btnTxt || "View Bundle"}
                    </div>
                </div>
            </div>

            {/* Decorative Arrow */}
            <div className="hidden sm:block absolute right-6 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-primary text-2xl">
                →
            </div>
        </Link>
    );
}
