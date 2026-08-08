"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, Heart, Shield, Star, ArrowRight } from "lucide-react";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Store";

const ValueCard = ({ icon: Icon, title, description, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.6 }}
        className="bg-white p-8 rounded-[2.5rem] border border-[var(--c-border)] shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.06)] transition-all group"
    >
        <div className="w-14 h-14 bg-[var(--c-accent-soft)] rounded-2xl flex items-center justify-center text-[var(--c-primary)] mb-6 group-hover:scale-110 transition-transform">
            <Icon className="w-7 h-7" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-[var(--c-text)] mb-4">{title}</h3>
        <p className="text-[var(--c-text-muted)] leading-relaxed line-clamp-3">{description}</p>
    </motion.div>
);

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-[var(--c-bg)]">
            {/* Hero Section */}
            <section className="relative h-[60vh] lg:h-[70vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=2000" 
                        alt="Artisanal Heritage"
                        className="w-full h-full object-cover scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
                </div>
                
                <div className="container mx-auto px-4 relative z-10 text-center text-white">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-[0.2em] mb-6 border border-white/30">
                            Our Essence
                        </span>
                        <h1 className="font-serif text-5xl lg:text-8xl font-bold mb-6 leading-tight">
                            Crafting Traditions,<br />Defining Luxury.
                        </h1>
                        <p className="text-lg lg:text-xl text-white/80 max-w-2xl mx-auto font-medium">
                            {SITE_NAME} is a celebration of artisanal mastery, bringing the finest Indian flavors to the global connoisseur.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-24 lg:py-32 container mx-auto px-4 max-w-7xl">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="font-serif text-4xl lg:text-5xl font-bold text-[var(--c-text)] mb-8 leading-tight">
                            Our mission is to preserve the soulful art of slow-food.
                        </h2>
                        <div className="space-y-6 text-[var(--c-text-muted)] text-lg leading-relaxed">
                            <p>
                                In a world of mass production, {SITE_NAME} stands as a beacon of authenticity. We believe that true luxury lies in the patience of fermentation, the precision of spice-blending, and the integrity of ingredients.
                            </p>
                            <p>
                                Every jar we produce is a testament to our heritage, handcrafted by master artisans who have inherited these secrets across generations.
                            </p>
                        </div>
                        <div className="mt-10 flex gap-4">
                            <Link href="/about/story" className="inline-flex items-center gap-2 bg-[var(--c-primary)] text-white px-8 py-4 rounded-xl font-bold hover:bg-[var(--c-primary-dark)] transition-all shadow-lg shadow-[var(--c-primary)]/20">
                                Discover Our Story <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </motion.div>
                    
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl">
                            <img 
                                src="https://images.unsplash.com/photo-1549590143-d5855148a9d5?auto=format&fit=crop&q=80&w=1000" 
                                alt="Artisan at work"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-8 -left-8 bg-white p-8 rounded-3xl shadow-xl border border-[var(--c-border)] max-w-[280px]">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-[var(--c-accent-soft)] rounded-lg">
                                    <Sparkles className="w-5 h-5 text-[var(--c-primary)]" />
                                </div>
                                <span className="font-bold text-[var(--c-text)]">100% Artisanal</span>
                            </div>
                            <p className="text-sm text-[var(--c-text-muted)]">Zero preservatives. Just tradition, time, and love.</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Values Grid */}
            <section className="py-24 bg-[var(--c-surface-alt)]/40">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="text-center mb-16">
                        <span className="text-[var(--c-primary)] text-xs font-bold uppercase tracking-[0.2em]">The {SITE_NAME} Way</span>
                        <h2 className="font-serif text-4xl lg:text-5xl font-bold text-[var(--c-text)] mt-4">Our Core Values</h2>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <ValueCard 
                            icon={Shield}
                            title="Uncompromising Quality"
                            description="We source only the premium harvest, ensuring every ingredient meets the gold standard of flavor and safety."
                            delay={0.1}
                        />
                        <ValueCard 
                            icon={Heart}
                            title="Sustainable Heritage"
                            description="Empowering local farming communities while preserving traditional recipes that have stood the test of time."
                            delay={0.2}
                        />
                        <ValueCard 
                            icon={Star}
                            title="Artisanal Excellence"
                            description="No industrial shortcuts. Every batch is slow-crafted by hand to ensure the perfect balance of texture and taste."
                            delay={0.3}
                        />
                    </div>
                </div>
            </section>

            {/* Premium CTA */}
            <section className="py-24 container mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-[var(--c-text)] rounded-[4rem] p-12 lg:p-24 text-white relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--c-primary)]/20 blur-[120px] rounded-full" />
                    <div className="relative z-10 max-w-3xl mx-auto">
                        <h2 className="font-serif text-4xl lg:text-6xl font-bold mb-8 italic">Experience the art of flavor.</h2>
                        <p className="text-lg text-white/60 mb-12">Join thousands of gourmet enthusiasts who have rediscovered the true soul of Indian condiments.</p>
                        <Link href="/products" className="inline-block bg-[var(--c-primary)] text-white px-10 py-5 rounded-2xl font-bold hover:bg-[var(--c-primary-dark)] transition-all transform hover:scale-105">
                            Shop the Collection
                        </Link>
                    </div>
                </motion.div>
            </section>
        </main>
    );
}
