"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Flame, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function ProductRail({ title, subtitle, icon, endpoint, viewAllLink, bgWhite = false }) {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch(endpoint);
                const data = await res.json();
                if (data.success) {
                    setProducts(data.products);
                }
            } catch (error) {
                console.error(`Failed to fetch products for ${title}:`, error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [endpoint]);

    if (!products.length && !loading) return null;

    return (
        <section className={`py-20 ${bgWhite ? 'bg-card' : 'bg-transparent'}`}>
            <div className="container mx-auto px-4 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        {icon}
                        <h2 className="text-2xl lg:text-3xl font-heading font-bold text-foreground">
                            {title}
                        </h2>
                    </div>
                    <Link
                        href={viewAllLink || '/shop'}
                        className="flex items-center gap-2 text-olive-600 font-medium hover:text-olive-700 transition-colors group"
                    >
                        View All
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {loading ? (
                    <div className="flex gap-4 overflow-hidden">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="min-w-[200px] h-[300px] bg-muted rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar snap-x">
                        {products.map((product, index) => (
                            <motion.div
                                key={product._id}
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => router.push(`/products/${product._id}`)}
                                className="flex-shrink-0 w-[200px] md:w-[240px] cursor-pointer group snap-start"
                            >
                                <div className="rounded-2xl overflow-hidden bg-white shadow-sm mb-3 aspect-square relative border border-transparent group-hover:border-border transition-colors">
                                    <img
                                        src={product.images?.[0] || '/placeholder-product.jpg'}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {/* Badges */}
                                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                                        {/* You can add badges logic here if needed based on product properties */}
                                    </div>
                                </div>
                                <h3 className="font-medium text-sm text-foreground truncate">{product.name}</h3>
                                {product.rating && (
                                    <div className="flex items-center gap-1 mb-1">
                                        <Star className="w-3 h-3 fill-gold-400 text-gold-400" />
                                        <span className="text-xs text-muted-foreground">{product.rating}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-olive-700">
                                        ₹{product.variants?.[0]?.salePrice || product.variants?.[0]?.regularPrice}
                                    </span>
                                    {product.variants?.[0]?.salePrice && (
                                        <span className="text-xs text-muted-foreground line-through">
                                            ₹{product.variants?.[0]?.regularPrice}
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
