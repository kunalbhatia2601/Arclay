"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Store";

export default function OurStory() {
    return (
        <motion.section 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="py-16 lg:py-28 bg-[#FDF8EF] overflow-hidden"
        >
            <div className="container mx-auto px-4 xl:px-8 max-w-7xl">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    
                    {/* Left - Overlapping Images */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="relative h-[450px] lg:h-[600px]"
                    >
                        {/* Main Image */}
                        <div className="absolute top-0 right-0 w-[85%] h-[85%] rounded-3xl overflow-hidden bg-[#F3EFE8] shadow-2xl">
                            <img
                                src="https://images.unsplash.com/photo-1607877742574-a7d9a7449af1?q=80&w=2574&auto=format&fit=crop"
                                alt={`${SITE_NAME} Heritage`}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        
                        {/* Inset Image */}
                        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] rounded-3xl overflow-hidden border-8 border-white bg-white shadow-xl z-20">
                            <img
                                src="https://images.unsplash.com/photo-1590439471364-192aa70c0b53?q=80&w=2787&auto=format&fit=crop"
                                alt="Artisanal Process"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Floating stat badge */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="absolute top-1/2 -translate-y-1/2 -right-6 bg-[#D86B4B] shadow-xl shadow-[#D86B4B]/20 rounded-2xl px-6 py-4 text-center z-30 border border-white/20"
                        >
                            <p className="text-3xl font-serif font-bold text-white leading-none mb-1">14+</p>
                            <p className="text-white/80 text-[10px] uppercase font-bold tracking-widest">Years</p>
                        </motion.div>
                    </motion.div>

                    {/* Right - Content */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="pt-8 lg:pt-0"
                    >
                        <span className="inline-block bg-[#F0F4EC] text-[#647345] text-[13px] font-semibold px-4 py-1.5 rounded-full mb-6">
                            Our Story
                        </span>

                        <h2 className="font-serif text-[32px] lg:text-[40px] font-bold text-[#2A2F25] leading-tight mb-6">
                            Crafting Authentic Flavors Since 2010
                        </h2>

                        <div className="space-y-4 text-[#767B71] text-[15px] leading-relaxed mb-8">
                            <p>
                                {SITE_NAME} began in a small kitchen, where our founder&apos;s grandmother would prepare recipes passed down through generations. What started as a family tradition soon became a passion to share these authentic flavors with the world.
                            </p>
                            <p>
                                Today, we continue to honor those traditional methods while embracing modern food safety standards. Every batch is handcrafted with the same love and care that started it all.
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-6 mb-8">
                            <div>
                                <p className="text-2xl lg:text-3xl font-serif font-bold text-[#2A2F25] mb-1">50K+</p>
                                <p className="text-sm text-[#767B71]">Happy Customers</p>
                            </div>
                            <div>
                                <p className="text-2xl lg:text-3xl font-serif font-bold text-[#2A2F25] mb-1">25+</p>
                                <p className="text-sm text-[#767B71]">Products</p>
                            </div>
                            <div>
                                <p className="text-2xl lg:text-3xl font-serif font-bold text-[#2A2F25] mb-1">4.8</p>
                                <p className="text-sm text-[#767B71]">Average Rating</p>
                            </div>
                        </div>

                        <Link
                            href="/about"
                            className="inline-flex items-center justify-center px-8 py-3.5 bg-[#869661] hover:bg-[#71824F] text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                            Read Our Story
                        </Link>
                    </motion.div>
                </div>
            </div>
        </motion.section>
    );
}
