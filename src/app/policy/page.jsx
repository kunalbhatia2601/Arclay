"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, ArrowRight, Loader2, Scale } from "lucide-react";

export default function PolicyIndexPage() {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPolicies = async () => {
            try {
                const res = await fetch("/api/app-config");
                const data = await res.json();
                if (data.success) setPolicies(data.config?.legalPolicies || []);
            } catch (err) {
                console.error("Failed to fetch policies:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPolicies();
    }, []);

    return (
        <main className="min-h-screen bg-[var(--c-bg)]">
            {/* Hero */}
            <section className="bg-[var(--c-text)] text-white pt-28 lg:pt-32 pb-20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-[var(--c-primary)]/10 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />

                <div className="container mx-auto px-6 max-w-4xl relative z-10 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold uppercase tracking-[0.2em] mb-6">
                            <Scale className="w-3.5 h-3.5 text-[var(--c-accent)]" /> Legal &amp; Policies
                        </span>
                        <h1 className="font-serif text-[42px] lg:text-[60px] font-bold leading-tight mb-5">
                            Our Policies
                        </h1>
                        <p className="text-white/60 text-base lg:text-lg max-w-xl mx-auto leading-relaxed">
                            Transparency matters. Review the documents that govern how we operate.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Policies grid */}
            <section className="container mx-auto px-4 lg:px-8 max-w-5xl py-16 lg:py-20">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="w-8 h-8 text-[var(--c-primary)] animate-spin" />
                    </div>
                ) : policies.length === 0 ? (
                    <div className="text-center py-16 max-w-md mx-auto">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-[var(--c-primary)]/40" strokeWidth={1.5} />
                        <h3 className="font-serif text-xl font-bold text-[var(--c-text)] mb-2">Policies Coming Soon</h3>
                        <p className="text-[var(--c-text-muted)] text-sm">
                            Our legal team is finalising these documents. Please check back shortly.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                        {policies.map((p, idx) => (
                            <motion.div
                                key={p._id || p.slug}
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Link
                                    href={`/policy/${p.slug}`}
                                    className="group flex items-start gap-5 bg-white border border-[var(--c-border)] rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all h-full"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-[var(--c-accent-soft)] flex items-center justify-center shrink-0 group-hover:bg-[var(--c-primary)] transition-colors">
                                        <FileText className="w-5 h-5 text-[var(--c-primary)] group-hover:text-white transition-colors" strokeWidth={1.8} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-serif text-[20px] font-bold text-[var(--c-text)] mb-1 group-hover:text-[#647345] transition-colors">
                                            {p.title}
                                        </h3>
                                        <p className="text-[var(--c-text-muted)] text-sm">
                                            Read the full {p.title.toLowerCase()}.
                                        </p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-[var(--c-text-muted)] group-hover:text-[var(--c-primary)] group-hover:translate-x-1 transition-all mt-1 shrink-0" />
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
