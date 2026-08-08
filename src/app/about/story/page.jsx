"use client";

import { motion } from "framer-motion";
import { Sparkles, Calendar, Users, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Store";

const TimelineItem = ({ year, title, description, delay }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.6 }}
        className="relative pl-12 pb-12 last:pb-0 border-l-2 border-[var(--c-border)] group"
    >
        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-[var(--c-primary)] border-4 border-white shadow-sm ring-4 ring-[var(--c-primary)]/10 group-hover:scale-125 transition-transform" />
        <span className="inline-block text-[var(--c-primary)] font-bold text-sm mb-2">{year}</span>
        <h3 className="font-serif text-2xl font-bold text-[var(--c-text)] mb-3">{title}</h3>
        <p className="text-[var(--c-text-muted)] max-w-lg leading-relaxed">{description}</p>
    </motion.div>
);

export default function StoryPage() {
    return (
        <main className="min-h-screen bg-[var(--c-bg)]">
            {/* Split Hero Section */}
            <section className="grid lg:grid-cols-2 min-h-[80vh]">
                <div className="relative order-2 lg:order-1 flex items-center justify-center p-8 lg:p-24 bg-[#FCF9F2]">
                    <div className="max-w-xl">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="text-[var(--c-primary)] text-xs font-bold uppercase tracking-[0.2em] mb-4 block">The Heritage</span>
                            <h1 className="font-serif text-5xl lg:text-7xl font-bold text-[var(--c-text)] mb-8 leading-tight">
                                A Legacy of <br /> Artisanal <span className="italic text-[var(--c-primary)]">Soul.</span>
                            </h1>
                            <p className="text-lg text-[var(--c-text-muted)] leading-relaxed mb-8">
                                {SITE_NAME} began in a small family kitchen. Our founder, driven by a passion for the slow-food movement, set out to rediscover the depth and complexity of Indian condiments that were being lost to industrialization.
                            </p>
                            <div className="flex flex-wrap gap-8">
                                <div className="flex flex-col">
                                    <span className="text-3xl font-bold text-[var(--c-text)]">14+</span>
                                    <span className="text-xs text-[var(--c-text-muted)] font-bold uppercase tracking-widest mt-1">Years of Tradition</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-3xl font-bold text-[var(--c-text)]">50k+</span>
                                    <span className="text-xs text-[var(--c-text-muted)] font-bold uppercase tracking-widest mt-1">Families Served</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
                
                <div className="relative h-[50vh] lg:h-auto order-1 lg:order-2 overflow-hidden">
                    <img 
                        src="https://images.unsplash.com/photo-1596567130624-9442ef73815b?auto=format&fit=crop&q=80&w=1500" 
                        alt="Vintage spice market"
                        className="w-full h-full object-cover grayscale-[0.2] hover:scale-110 transition-transform duration-[2s]"
                    />
                    <div className="absolute inset-0 bg-[var(--c-text)]/10 mix-blend-multiply" />
                </div>
            </section>

            {/* Quality Philosophy */}
            <section className="py-24 lg:py-32 container mx-auto px-4 max-w-7xl">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="font-serif text-4xl lg:text-5xl font-bold text-[var(--c-text)] mb-8">The Philosophy of Patience</h2>
                    <p className="text-[var(--c-text-muted)] text-lg leading-relaxed">
                        We don&apos;t count hours, we count sunsets. Our pickles are sun-matured, allowing the oils and spices to infuse naturally without the need for artificial accelerators.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { icon: Users, title: "Artisan Unions", desc: "Supporting over 200 women artisans in rural India." },
                        { icon: MapPin, title: "Local Sourcing", desc: "Spices sourced directly from organic farms in Kerala." },
                        { icon: Calendar, title: "Slow Matured", desc: "Batch-rested for 6 months minimum." },
                        { icon: Sparkles, title: "Pure Gold", desc: "Using only cold-pressed mustard oil." }
                    ].map((item, i) => (
                        <div key={i} className="bg-white p-8 rounded-3xl border border-[var(--c-border)] hover:border-[var(--c-primary)] transition-all group">
                            <div className="w-12 h-12 bg-[var(--c-surface-alt)] rounded-xl flex items-center justify-center text-[var(--c-primary)] mb-6 group-hover:bg-[var(--c-primary)] group-hover:text-white transition-all">
                                <item.icon className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-[var(--c-text)] mb-3">{item.title}</h4>
                            <p className="text-sm text-[var(--c-text-muted)] leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Timeline */}
            <section className="py-24 bg-[var(--c-text)] text-white">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="mb-20">
                        <span className="text-[var(--c-primary)] text-xs font-bold uppercase tracking-[0.2em] mb-4 block">Our Journey</span>
                        <h2 className="font-serif text-4xl lg:text-5xl font-bold mb-8">How we grew.</h2>
                    </div>

                    <div className="space-y-4">
                        <TimelineItem 
                            year="2010"
                            title="The First Batch"
                            description="Crafted our signature Mango Pickle in a shared family kitchen. Sold out in three days."
                            delay={0.1}
                        />
                        <TimelineItem 
                            year="2014"
                            title="Empowering Artisans"
                            description="Established our first dedicated workshop, employing 12 local master picklers from the community."
                            delay={0.2}
                        />
                        <TimelineItem 
                            year="2018"
                            title="Global Connoisseurs"
                            description="Began shipping our artisanal preserves to gourmet boutiques in London, Paris, and Singapore."
                            delay={0.3}
                        />
                        <TimelineItem 
                            year="2024"
                            title="A New Chapter"
                            description={`Launching our digital flagship, bringing the ${SITE_NAME} experience directly to your doorstep.`}
                            delay={0.4}
                        />
                    </div>
                </div>
            </section>

            {/* Founders Note */}
            <section className="py-24 lg:py-32 container mx-auto px-4 max-w-4xl">
                <div className="text-center">
                    <div className="w-24 h-24 rounded-full mx-auto mb-8 grayscale overflow-hidden shadow-xl border-4 border-white">
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200" alt="Founder" />
                    </div>
                    <p className="font-serif text-2xl lg:text-3xl font-bold text-[var(--c-text)] italic leading-relaxed mb-8">
                        &quot;Flavor is an emotion. When you open a jar of {SITE_NAME}, you&apos;re not just tasting a pickle; you&apos;re tasting a decade of dedication and a thousand years of history.&quot;
                    </p>
                    <div className="flex flex-col items-center">
                        <span className="font-bold text-[var(--c-text)] text-lg">Vikram Singh</span>
                        <span className="text-[var(--c-primary)] text-sm uppercase tracking-widest font-bold">Founder & Master Artisan</span>
                    </div>
                    <div className="mt-16">
                        <Link href="/products" className="inline-flex items-center gap-2 underline underline-offset-8 text-[var(--c-text)] font-bold hover:text-[var(--c-primary)] transition-all">
                            Taste our legacy <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
