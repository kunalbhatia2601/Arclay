"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const FALLBACK_BANNERS = [
    {
        _id: "fallback-1",
        title: "Discover Our Collection",
        description: "Premium products, handpicked for you.",
        mediaUrl: "https://images.unsplash.com/photo-1605372551532-61c0e3eb4aae?q=80&w=2855&auto=format&fit=crop",
        linkUrl: "/products",
    },
];

export default function HomeHero() {
    const router = useRouter();
    const [banners, setBanners] = useState([]);
    const [currentBanner, setCurrentBanner] = useState(0);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const res = await fetch("/api/product-ads?position=hero");
                const data = await res.json();
                if (data.success && Array.isArray(data.ads) && data.ads.length > 0) {
                    setBanners(data.ads);
                } else {
                    setBanners(FALLBACK_BANNERS);
                }
            } catch (err) {
                console.error("Failed to fetch hero banners:", err);
                setBanners(FALLBACK_BANNERS);
            } finally {
                setLoaded(true);
            }
        };
        fetchBanners();
    }, []);

    useEffect(() => {
        if (banners.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentBanner(prev => (prev + 1) % banners.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [banners.length]);

    if (!loaded || banners.length === 0) {
        return (
            <section className="relative w-full overflow-hidden bg-[var(--c-bg)] py-3 container mx-auto px-4 max-w-7xl">
                <div className="relative w-full h-[50vh] min-h-[420px] sm:min-h-[500px] lg:h-[75vh] lg:min-h-[640px] rounded-[2.5rem] overflow-hidden bg-[#F0EFED] animate-pulse" />
            </section>
        );
    }

    const active = banners[currentBanner];
    const primaryLink = active?.linkUrl || "/products";

    return (
        <section className="relative w-full overflow-hidden bg-[var(--c-bg)] py-3 container mx-auto px-4 max-w-7xl">
            <div className="relative w-full h-[50vh] min-h-[420px] sm:min-h-[500px] lg:h-[75vh] lg:min-h-[640px] rounded-[2.5rem] overflow-hidden shadow-sm bg-[#F0EFED]">

                <AnimatePresence mode="wait">
                    <motion.div
                        key={active._id || currentBanner}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                        className="absolute inset-0 z-0"
                    >
                        {active.mediaType === "video" ? (
                            <video
                                src={active.mediaUrl}
                                autoPlay
                                muted
                                loop
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <img
                                src={active.mediaUrl}
                                alt={active.title}
                                className="w-full h-full object-cover opacity-80"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-transparent z-10" />
                    </motion.div>
                </AnimatePresence>

                {/* Content Overlay */}
                <div className="relative z-20 h-full w-full flex flex-col justify-center px-6 sm:px-8 lg:px-24 max-w-5xl">
                    <motion.div
                        key={`content-${active._id || currentBanner}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-4 sm:mb-6 bg-[var(--c-accent)] text-white">
                            <Sparkles className="w-3 h-3" strokeWidth={3} />
                            Featured
                        </div>

                        <h1 className="text-[36px] sm:text-[44px] lg:text-[72px] font-serif font-bold mb-3 sm:mb-5 leading-tight text-white drop-shadow">
                            {active.title}
                        </h1>

                        {active.description && (
                            <p className="text-[14px] sm:text-[16px] lg:text-[18px] mb-6 sm:mb-10 max-w-xl leading-relaxed text-white/90 drop-shadow">
                                {active.description}
                            </p>
                        )}

                        <div className="flex flex-row flex-wrap gap-3 sm:gap-4">
                            <button
                                className="bg-[var(--c-primary)] hover:bg-[var(--c-primary-dark)] text-white rounded-xl px-6 sm:px-10 py-3.5 sm:py-4 text-[13px] sm:text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-[var(--c-primary)]/20"
                                onClick={() => router.push(primaryLink)}
                            >
                                Shop Now
                                <ArrowRight className="w-4 h-4" />
                            </button>
                            <button
                                className="rounded-xl px-6 sm:px-10 py-3.5 sm:py-4 text-[13px] sm:text-sm font-bold transition-all border border-white/20 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
                                onClick={() => router.push("/bundles")}
                            >
                                Gift Boxes
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Dots Navigation */}
                {banners.length > 1 && (
                    <div className="absolute bottom-6 sm:bottom-10 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-12 flex items-center gap-2 z-30">
                        {banners.map((b, index) => (
                            <button
                                key={b._id || index}
                                onClick={() => setCurrentBanner(index)}
                                aria-label={`Go to slide ${index + 1}`}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    index === currentBanner
                                        ? "bg-white w-8"
                                        : "bg-white/30 w-1.5"
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
