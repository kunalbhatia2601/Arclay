"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Gift } from "lucide-react";
import { motion } from "framer-motion";

export default function PromoBanner() {
    const router = useRouter();

    return (
        <section className="py-6 bg-[var(--c-bg)]">
            <div className="container mx-auto px-4 xl:px-8 max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    onClick={() => router.push('/offers')}
                    className="relative rounded-2xl overflow-hidden cursor-pointer group h-[220px] md:h-[280px] lg:h-[340px]"
                >
                    <img
                        src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=2640&auto=format&fit=crop"
                        alt="Festive Offer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--c-text)]/80 via-[var(--c-text)]/40 to-transparent" />
                    
                    <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-14 lg:px-20">
                        <div className="flex items-center gap-2 mb-4">
                            <Gift className="w-4 h-4 text-[var(--c-accent)]" />
                            <span className="text-[var(--c-accent)] text-[12px] font-semibold uppercase tracking-wider">
                                Festive Special
                            </span>
                        </div>
                        
                        <h2 className="text-white font-serif font-bold text-2xl md:text-4xl lg:text-[44px] mb-3 leading-tight max-w-lg">
                            The Grand Festive Sale
                        </h2>
                        
                        <p className="text-white/80 text-sm md:text-base mb-6 max-w-md">
                            Up to 40% off on curated gift hampers and premium collections.
                        </p>
                        
                        <button className="inline-flex items-center justify-center w-fit bg-[var(--c-primary)] hover:bg-[var(--c-primary-dark)] text-white px-7 py-3 rounded-xl text-sm font-semibold transition-colors gap-2">
                            Explore Offers
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
