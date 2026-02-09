"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Gift, Pause, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const localBanners = [
    {
        _id: '1',
        image: '/images/banners/hero-1.jpg',
        title: 'Authentic Indian Flavors',
        subtitle: 'Handcrafted pickles and preserves made with love and tradition',
        link: '/shop'
    },
    {
        _id: '2',
        image: '/images/banners/hero-2.jpg',
        title: 'Taste of Tradition',
        subtitle: 'Experience the rich heritage of culinary excellence',
        link: '/shop?category=pickles'
    },
    {
        _id: '3',
        image: '/images/banners/festival-special.jpg',
        title: 'Premium Selection',
        subtitle: 'Discover our exclusive range of gourmet delights',
        link: '/products'
    }
];

export default function HomeHero() {
    const router = useRouter();
    const [banners, setBanners] = useState(localBanners);
    const [currentBanner, setCurrentBanner] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    // Auto-rotate banners
    useEffect(() => {
        if (!isAutoPlaying || banners.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentBanner(prev => (prev + 1) % banners.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [isAutoPlaying, banners.length]);

    return (
        <section className="relative h-[600px] lg:h-[700px] overflow-hidden bg-muted">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentBanner}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0"
                >
                    <img
                        src={banners[currentBanner]?.image}
                        alt={banners[currentBanner]?.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                </motion.div>
            </AnimatePresence>

            {/* Hero Content */}
            <div className="relative h-full container mx-auto px-4 lg:px-8 flex items-center">
                <motion.div
                    key={`content-${currentBanner}`}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="max-w-xl"
                >
                    <div className="mb-4 inline-flex items-center gap-2 bg-terracotta-500 text-white px-4 py-1.5 text-sm font-medium rounded-full">
                        <Sparkles className="w-4 h-4" />
                        <span>Premium Artisanal Collection</span>
                    </div>
                    <h1 className="text-5xl lg:text-6xl font-heading font-black text-white mb-6 leading-tight">
                        {banners[currentBanner]?.title}
                    </h1>
                    <p className="text-xl text-white/80 mb-8 font-light">
                        {banners[currentBanner]?.subtitle}
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Button
                            size="lg"
                            className="bg-olive-600 hover:bg-olive-700 text-white rounded-full px-8 h-12 text-base"
                            onClick={() => router.push(banners[currentBanner]?.link || '/shop')}
                        >
                            Shop Now
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 rounded-full px-8 h-12 text-base"
                            onClick={() => router.push('/gift-hampers')}
                        >
                            <Gift className="mr-2 w-5 h-5" />
                            Gift Hampers
                        </Button>
                    </div>
                </motion.div>
            </div>

            {/* Banner Controls */}
            {banners.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
                    <div className="flex gap-2">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentBanner(index)}
                                className={`h-2 rounded-full transition-all ${index === currentBanner ? 'bg-white w-8' : 'bg-white/50 w-2 hover:bg-white/70'
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                        className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                        aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
                    >
                        {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                </div>
            )}
        </section>
    );
}
