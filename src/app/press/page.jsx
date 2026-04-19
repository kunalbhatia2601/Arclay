"use client";

import { motion } from "framer-motion";
import { Megaphone, ExternalLink, Download, ArrowRight, Share2, Sparkles } from "lucide-react";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Store";

const pressReleases = [
    { date: "Oct 12, 2025", title: `${SITE_NAME} Wins 'Artisanal Brand of the Year' at Global Food Summit`, outlet: "Food & Wine Magazine" },
    { date: "Aug 05, 2025", title: `Preserving Heritage: How ${SITE_NAME} is Reviving Traditional Recipes`, outlet: "The Economic Times" },
    { date: "Jun 20, 2025", title: "Luxury Gifting Elevated: Our New Festive Collection Launch", outlet: "Vogue India" }
];

export default function PressPage() {
    return (
        <div className="min-h-screen bg-[#FEFBF6] pt-24 pb-20 px-4">
            <div className="container mx-auto max-w-5xl">
                {/* Hero */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#869661]/10 text-[#869661] text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
                        <Megaphone className="w-3.5 h-3.5" />
                        In The News
                    </div>
                    <h1 className="font-serif text-5xl md:text-6xl font-bold text-[#2A2F25] mb-6">Media & Press Kit</h1>
                    <p className="text-[#767B71] text-lg max-w-2xl mx-auto leading-relaxed">The {SITE_NAME} story through the eyes of the world&apos;s most prestigious publications.</p>
                </motion.div>

                {/* Press Releases Grid */}
                <div className="grid gap-6 mb-24">
                    {pressReleases.map((news, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-[2rem] p-8 border border-[#ECE8E0] group hover:shadow-xl transition-all cursor-pointer"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 text-xs font-bold text-[#869661] uppercase tracking-widest">
                                        <span>{news.outlet}</span>
                                        <span className="w-1 h-1 bg-[#ECE8E0] rounded-full" />
                                        <span className="text-[#767B71]">{news.date}</span>
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-serif font-bold text-[#2A2F25] group-hover:text-[#869661] transition-colors">{news.title}</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button className="p-3 rounded-full bg-[#F3EFE8]/50 hover:bg-[#869661] hover:text-white transition-all">
                                        <ExternalLink className="w-5 h-5" />
                                    </button>
                                    <button className="p-3 rounded-full bg-[#F3EFE8]/50 hover:bg-[#869661] hover:text-white transition-all">
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Media Kit Section */}
                <div className="bg-[#2A2F25] rounded-[3rem] p-10 md:p-20 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-[#D86B4B]/20 blur-[120px] rounded-full" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#869661]/20 blur-[100px] rounded-full" />
                    
                    <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
                                <Sparkles className="w-3.5 h-3.5" />
                                Brand Assets
                            </div>
                            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">Download Our Media Kit</h2>
                            <p className="text-white/60 text-lg mb-8 leading-relaxed">Access high-resolution brand assets, heritage photography, and our official brand guidelines for editorial use.</p>
                            <button className="bg-[#869661] hover:bg-[#71824F] text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-black/10">
                                <Download className="w-5 h-5" /> Download (45MB)
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="aspect-square rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <span className="font-serif text-3xl font-bold opacity-30">LOGO</span>
                            </div>
                            <div className="aspect-[4/5] rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <span className="font-serif text-3xl font-bold opacity-30">FONT</span>
                            </div>
                            <div className="col-span-2 aspect-[16/9] rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <span className="font-serif text-2xl font-bold opacity-30">HERITAGE PHOTOGRAPHY</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Press Contact */}
                <div className="mt-24 text-center">
                    <h3 className="text-sm font-bold text-[#869661] uppercase tracking-[0.3em] mb-4">Press Inquiries</h3>
                    <p className="text-[16px] text-[#2A2F25] font-bold">Reach out via our <a href="/contact" className="underline hover:text-[#869661]">contact page</a>.</p>
                </div>
            </div>
        </div>
    );
}
