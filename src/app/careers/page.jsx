"use client";

import { motion } from "framer-motion";
import { Sparkles, Users, Heart, Coffee, ArrowRight, Briefcase } from "lucide-react";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Store";

const values = [
    { icon: Users, title: "Artisanal Community", desc: "We are a family of creators, preservationists, and food lovers dedicated to heritage." },
    { icon: Heart, title: "Passion for Purity", desc: "We believe in 'Vedic' standards—no compromises on natural ingredients and traditional methods." },
    { icon: Coffee, title: "Culture of Care", desc: "A workplace that values balance, tradition, and the growth of every individual in our tribe." }
];

const jobs = [
    { title: "Master Curation Specialist", type: "Full-Time", location: "Artisanal Kitchens", dept: "Quality" },
    { title: "Luxury Brand Manager", type: "Full-Time", location: "Corporate (Remote/Hybrid)", dept: "Marketing" },
    { title: "Logistics & Gifting Concierge", type: "Full-Time", location: "Fulfilment Center", dept: "Operations" }
];

export default function CareersPage() {
    return (
        <div className="min-h-screen bg-[var(--c-bg)] pt-24 pb-20 px-4">
            <div className="container mx-auto max-w-5xl">
                {/* Hero */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--c-primary)]/10 text-[var(--c-primary)] text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
                        <Sparkles className="w-3.5 h-3.5" />
                        Join Our Tribe
                    </div>
                    <h1 className="font-serif text-5xl md:text-6xl font-bold text-[var(--c-text)] mb-6">Crafting the Future of Tradition</h1>
                    <p className="text-[var(--c-text-muted)] text-lg max-w-2xl mx-auto leading-relaxed">At {SITE_NAME}, we don&apos;t just make pickles; we preserve legacies. Join us in bringing artisanal excellence to the global stage.</p>
                </motion.div>

                {/* Values */}
                <div className="grid md:grid-cols-3 gap-8 mb-24">
                    {values.map((v, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-[2rem] p-8 border border-[var(--c-border)] text-center"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-[var(--c-accent-soft)] flex items-center justify-center text-[var(--c-primary)] mx-auto mb-6">
                                <v.icon className="w-6 h-6" />
                            </div>
                            <h3 className="font-serif text-xl font-bold text-[var(--c-text)] mb-3">{v.title}</h3>
                            <p className="text-sm text-[var(--c-text-muted)] leading-relaxed">{v.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Open Positions */}
                <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-[var(--c-border)] shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="font-serif text-3xl font-bold text-[var(--c-text)]">Open Positions</h2>
                        <div className="hidden md:flex items-center gap-2 text-xs font-bold text-[var(--c-primary)] uppercase tracking-widest">
                            <Briefcase className="w-4 h-4" /> 3 Current Openings
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {jobs.map((job, i) => (
                            <div key={i} className="group p-6 rounded-2xl border border-[var(--c-border)] hover:border-[var(--c-primary)] hover:bg-[var(--c-accent-soft)]/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer">
                                <div>
                                    <h3 className="text-lg font-bold text-[var(--c-text)] group-hover:text-[var(--c-primary)] transition-colors">{job.title}</h3>
                                    <div className="flex flex-wrap gap-4 mt-1">
                                        <span className="text-xs text-[var(--c-text-muted)]">{job.dept}</span>
                                        <span className="text-xs text-[var(--c-text-muted)]">•</span>
                                        <span className="text-xs text-[var(--c-text-muted)]">{job.location}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-bold text-[var(--c-primary)] uppercase tracking-widest bg-[var(--c-accent-soft)] px-3 py-1 rounded-full">{job.type}</span>
                                    <ArrowRight className="w-5 h-5 text-[var(--c-primary)] transform transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Call to Action */}
                <div className="mt-20 text-center">
                    <p className="text-[var(--c-text-muted)] text-sm mb-4">Don't see a perfect fit? We're always looking for brilliant minds.</p>
                    <button className="text-[var(--c-primary)] font-bold underline underline-offset-8 hover:text-[var(--c-text)] transition-colors">Apply Spontaneously</button>
                </div>
            </div>
        </div>
    );
}
