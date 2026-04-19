"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Gift, ArrowRight, Loader2, Package } from "lucide-react";

export default function BundlesPage() {
    const [bundles, setBundles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBundles = async () => {
            try {
                const res = await fetch("/api/bundles");
                const data = await res.json();
                if (data.success) setBundles(data.bundles || []);
            } catch (err) {
                console.error("Failed to fetch bundles:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBundles();
    }, []);

    return (
        <main className="min-h-screen bg-[#FEFBF6]">
            {/* Hero */}
            <section className="relative h-[50vh] lg:h-[55vh] w-full overflow-hidden">
                <div className="absolute inset-0 bg-[#2A2F25] z-10" />
                <img
                    src="https://images.unsplash.com/photo-1607344645866-009c320b63e0?q=80&w=2835&auto=format&fit=crop"
                    alt="Gift Boxes"
                    className="absolute inset-0 w-full h-full object-cover opacity-40 scale-105"
                />
                <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <span className="inline-flex items-center gap-2 bg-[#D86B4B] text-white text-xs font-semibold px-5 py-2 rounded-full mb-6">
                            <Gift className="w-3.5 h-3.5" />
                            Curated Bundles
                        </span>
                        <h1 className="font-serif text-[44px] lg:text-6xl text-white font-bold mb-4 leading-tight">
                            Gift Boxes
                        </h1>
                        <p className="text-white/70 text-lg max-w-xl mx-auto">
                            Thoughtfully paired collections — perfect for gifting or treating yourself.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Bundles Grid */}
            <section className="py-16 lg:py-24">
                <div className="container mx-auto px-4 xl:px-8 max-w-7xl">
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="w-8 h-8 text-[#869661] animate-spin" />
                        </div>
                    ) : bundles.length === 0 ? (
                        <div className="text-center py-16 max-w-md mx-auto">
                            <Package className="w-12 h-12 mx-auto mb-4 text-[#869661]/40" strokeWidth={1.5} />
                            <h3 className="font-serif text-xl font-bold text-[#2A2F25] mb-2">No Bundles Yet</h3>
                            <p className="text-[#767B71] text-sm mb-6">
                                New gift boxes are on their way. Browse our products in the meantime.
                            </p>
                            <Link href="/products" className="inline-flex items-center bg-[#869661] hover:bg-[#71824F] text-white px-8 py-3.5 rounded-xl text-sm font-semibold transition-colors">
                                Shop Products
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                            {bundles.map((bundle, idx) => {
                                const products = Array.isArray(bundle.products) ? bundle.products : [];
                                const coverImage = products[0]?.images?.[0];
                                const productCount = products.length;
                                return (
                                    <motion.div
                                        key={bundle._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <Link
                                            href={`/bundles/${bundle.slug}`}
                                            className="group block bg-white border border-[#ECE8E0] rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all"
                                        >
                                            <div className="relative aspect-[4/3] bg-[#F3EFE8] overflow-hidden">
                                                {coverImage ? (
                                                    <img
                                                        src={coverImage}
                                                        alt={bundle.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Gift className="w-16 h-16 text-[#869661]/30" strokeWidth={1.2} />
                                                    </div>
                                                )}
                                                <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-[11px] font-bold text-[#2A2F25] uppercase tracking-wider shadow-sm">
                                                    {productCount} {productCount === 1 ? "item" : "items"}
                                                </span>
                                            </div>
                                            <div className="p-6">
                                                <h3 className="font-serif text-xl font-bold text-[#2A2F25] mb-3 group-hover:text-[#647345] transition-colors">
                                                    {bundle.title}
                                                </h3>
                                                {products.length > 0 && (
                                                    <p className="text-[#767B71] text-sm leading-relaxed mb-5 line-clamp-2">
                                                        Includes {products.slice(0, 3).map(p => p.name).filter(Boolean).join(", ")}
                                                        {products.length > 3 ? `, +${products.length - 3} more` : ""}
                                                    </p>
                                                )}
                                                <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#647345] group-hover:gap-3 transition-all">
                                                    {bundle.btnTxt || "View Bundle"}
                                                    <ArrowRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
