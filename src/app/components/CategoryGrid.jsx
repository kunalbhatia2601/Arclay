"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function CategoryGrid() {
    const router = useRouter();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch("/api/categories");
                const data = await res.json();
                if (data.success) {
                    setCategories(data.categories);
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
            <section className="py-20">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="aspect-square bg-muted rounded-3xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (!categories.length) return null;

    return (
        <section className="py-20">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl lg:text-4xl font-heading font-bold text-foreground mb-4">
                        Explore Categories
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Discover our wide range of handcrafted pickles, preserves, and gourmet delights
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {categories.map((category, index) => (
                        <motion.button
                            key={category._id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => router.push(`/shop?category=${category._id}`)}
                            className="group relative aspect-square rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
                        >
                            <img
                                src={category.image || '/placeholder-category.jpg'}
                                alt={category.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            <div className="absolute bottom-4 left-4 right-4 text-left">
                                <p className="text-white font-semibold text-lg">{category.name}</p>
                                <p className="text-white/70 text-sm">{category.productCount || 0} products</p>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>
        </section>
    );
}
