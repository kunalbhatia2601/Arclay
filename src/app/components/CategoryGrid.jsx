"use client";

import { useState, useEffect } from "react";
import CategoryCard from "./CategoryCard";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CategoryGrid() {
    const [categories, setCategories] = useState([
        {
            _id: 'all-products',
            name: 'All Products',
            productCount: 45,
            image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=2670&auto=format&fit=crop'
        },
    ]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch("/api/products?limit=1");
                const data = await res.json();
                if (data.success && data.categories?.length > 0) {
                    const allCat = {
                        _id: 'all-products',
                        name: 'All Products',
                        productCount: data.pagination?.total || 45,
                        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=2670&auto=format&fit=crop'
                    };
                    setCategories([allCat, ...data.categories]);
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    if (loading) {
        return (
            <section className="py-8 lg:py-16">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="text-center mb-12">
                        <div className="h-10 w-64 bg-black/5 animate-pulse mx-auto rounded mb-4" />
                        <div className="h-4 w-96 bg-black/5 animate-pulse mx-auto rounded" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="aspect-[4/5] bg-black/5 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (!categories.length) return null;

    return (
        <section className="py-8 lg:py-16">
            <div className="container mx-auto px-6 max-w-7xl">
                
                <div className="flex flex-row items-center justify-between mb-6 lg:mb-8 px-1 lg:px-0">
                    <motion.h2 
                        initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once:true }}
                        className="font-sans text-[22px] lg:text-[28px] font-extrabold text-[#1A1D23] tracking-tight"
                    >
                        Popular
                    </motion.h2>
                    <motion.div 
                        initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once:true }} transition={{ delay: 0.1 }}
                    >
                        <Link href="/products" className="text-[13px] font-bold text-[#8B5CF6] hover:text-[#7C3AED] transition-colors">
                            Show all
                        </Link>
                    </motion.div>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex overflow-x-auto overflow-y-hidden hide-scrollbar snap-x snap-mandatory gap-2 lg:gap-6 pb-8 -mx-6 px-6 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-6 lg:overflow-visible"
                >
                    {categories.slice(0, 6).map((category, index) => (
                        <motion.div 
                            key={category._id} 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className="w-[110px] sm:w-auto sm:min-w-[180px] snap-start shrink-0 lg:col-span-1"
                        >
                            <CategoryCard category={category} index={index} />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
