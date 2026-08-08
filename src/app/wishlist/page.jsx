"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ArrowRight } from "lucide-react";
import ProductCard from "@/app/components/ProductCard";

export default function WishlistPage() {
    const [wishlistItems] = useState([]);

    return (
        <div className="min-h-screen bg-[var(--c-bg)] pb-24">
            {/* Header */}
            <div className="bg-[var(--c-text)] text-white pt-24 lg:pt-32 pb-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-[var(--c-primary)]/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-1/3 h-full bg-[var(--c-accent)]/10 blur-[80px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />

                <div className="container mx-auto px-6 max-w-7xl relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold uppercase tracking-[0.2em] mb-6">
                            <Heart className="w-3.5 h-3.5 fill-[var(--c-accent)] text-[var(--c-accent)]" /> Your Saved Items
                        </span>
                        <h1 className="font-serif text-[40px] lg:text-[56px] font-bold leading-tight mb-4">
                            Wishlist
                        </h1>
                        <p className="text-white/60 text-sm lg:text-base max-w-lg mx-auto leading-relaxed">
                            Curate your own collection of artisanal delights and premium gourmet selections.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Content Container */}
            <div className="container mx-auto px-4 lg:px-8 max-w-7xl mt-12">
                {wishlistItems.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20 bg-white rounded-3xl border border-[var(--c-border)] shadow-sm"
                    >
                        <div className="w-20 h-20 bg-[var(--c-surface-alt)] rounded-full flex items-center justify-center mx-auto mb-6">
                            <Heart className="w-8 h-8 text-[var(--c-text-muted)]" />
                        </div>
                        <h2 className="font-serif text-2xl font-bold text-[var(--c-text)] mb-3">Your wishlist is currently empty</h2>
                        <p className="text-[var(--c-text-muted)] text-sm mb-8 max-w-xs mx-auto">
                            Save your favorite gourmet creations to easily find them later.
                        </p>
                        <Link 
                            href="/products"
                            className="inline-flex items-center gap-2 bg-[var(--c-text)] text-white px-8 py-3.5 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-[#1A1D16] transition-colors"
                        >
                            Explore Collection <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        {wishlistItems.map((product, index) => (
                            <motion.div
                                key={product._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <ProductCard product={product} />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
