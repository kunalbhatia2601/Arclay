"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import ProductCard from "./ProductCard";

export default function ProductRail({ title, subtitle, icon, endpoint, viewAllLink, bgWhite = false }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const res = await fetch(endpoint);
                const data = await res.json();
                if (data.success && Array.isArray(data.products)) {
                    setProducts(data.products);
                } else {
                    setProducts([]);
                }
            } catch (error) {
                console.error(`Failed to fetch products for ${title}:`, error);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [endpoint, title]);

    if (!products.length && !loading) return null;

    return (
        <motion.section 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className={`py-16 lg:py-20 ${bgWhite ? 'bg-white' : 'bg-[#FEFBF6]'}`}
        >
            <div className="container mx-auto px-4 xl:px-8 max-w-7xl">
                {/* Header */}
                <div className="flex items-end justify-between mb-12">
                    <div>
                        {subtitle && (
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-[#D86B4B] font-bold text-[10px] uppercase tracking-[0.2em]">{subtitle}</span>
                                <div className="h-px w-8 bg-[#D86B4B]/20" />
                            </div>
                        )}
                        <h2 className="font-serif text-[32px] lg:text-[42px] font-bold text-[#2A2F25] leading-none">
                            {title}
                        </h2>
                    </div>

                    <Link
                        href={viewAllLink || '/products'}
                        className="hidden lg:flex items-center gap-2 text-[#2A2F25] font-bold hover:text-[#869661] transition-all text-xs uppercase tracking-widest border-b border-[#2A2F25]/10 pb-1"
                    >
                        View All
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {/* Product Grid — NOT a horizontal scroll, matching screenshot */}
                {loading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="aspect-[3/4] bg-[#F3EFE8] rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        {products.slice(0, 4).map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}

                {/* Mobile View All */}
                <div className="mt-8 lg:hidden flex justify-center">
                    <Link
                        href={viewAllLink || '/products'}
                        className="flex items-center justify-center w-full py-3.5 rounded-xl border border-[#ECE8E0] text-[#2A2F25] font-semibold text-sm hover:bg-[#F3EFE8] transition-colors"
                    >
                        View All
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                </div>
            </div>
        </motion.section>
    );
}
