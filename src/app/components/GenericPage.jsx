"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Store";

export default function GenericPage({ title, description }) {
    return (
        <div className="min-h-screen bg-[#FEFBF6]">
            <div className="bg-[#2A2F25] text-white pt-32 pb-20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-[#869661]/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
                
                <div className="container mx-auto px-6 max-w-4xl relative z-10 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold uppercase tracking-[0.2em] mb-6">
                            <Sparkles className="w-3.5 h-3.5 text-[#D86B4B]" /> {SITE_NAME}
                        </div>
                        <h1 className="font-serif text-[48px] lg:text-[64px] font-bold leading-tight mb-6">
                            {title || "Coming Soon"}
                        </h1>
                        <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
                            {description || "We are currently curating the content for this page. It will be available shortly with our latest updates and information."}
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto px-6 max-w-4xl py-24 text-center">
                <div className="w-24 h-24 bg-[#F3EFE8] rounded-full mx-auto flex items-center justify-center mb-8">
                    <span className="text-4xl">⏳</span>
                </div>
                <h2 className="font-serif text-3xl font-bold text-[#2A2F25] mb-4">Masterpiece in Progress</h2>
                <p className="text-[#767B71] leading-relaxed mb-10 max-w-md mx-auto">
                    Our team is meticulously crafting this section to ensure it reflects the artisanal quality you expect from {SITE_NAME}.
                </p>
                <Link 
                    href="/"
                    className="inline-flex items-center gap-2 bg-[#2A2F25] text-white px-8 py-4 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-[#1A1D16] transition-all"
                >
                    <ArrowLeft className="w-4 h-4" /> Return Home
                </Link>
            </div>
        </div>
    );
}
