"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const MOCK_BLOGS = [
    {
        id: 1,
        title: "The Art of Traditional Pickle Making: A Secret Revealed",
        category: "Trending",
        mainImage: "https://images.unsplash.com/photo-1589135303405-86687a4087e6?q=80&w=800&auto=format&fit=crop",
        insetImage: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=200&auto=format&fit=crop"
    },
    {
        id: 2,
        title: "5 Health Benefits of Fermented Foods You Didn't Know About",
        category: "Expertise",
        mainImage: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=800&auto=format&fit=crop",
        insetImage: "https://images.unsplash.com/photo-1582294440150-f80eeb742cd4?q=80&w=200&auto=format&fit=crop"
    },
    {
        id: 3,
        title: "Sustainable Sourcing: From Farm to Your Gourmet Jar",
        category: "Lifestyle",
        mainImage: "https://images.unsplash.com/photo-1464226184884-fa280b87339e?q=80&w=800&auto=format&fit=crop",
        insetImage: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=200&auto=format&fit=crop"
    }
];

export default function HomeBlog() {
    return (
        <section className="py-8 lg:py-16 bg-white overflow-hidden">
            <div className="container mx-auto px-6 max-w-7xl">
                
                {/* Header (Matching App UI Mockup 1) */}
                <div className="flex flex-row items-center justify-between mb-6 lg:mb-8 px-1 lg:px-0">
                    <motion.h2 
                        initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once:true }}
                        className="font-sans text-[22px] lg:text-[28px] font-extrabold text-[#1A1D23] tracking-tight"
                    >
                        Blog
                    </motion.h2>
                    <motion.div 
                        initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once:true }} transition={{ delay: 0.1 }}
                    >
                        <Link href="/blog" className="text-[13px] font-semibold text-[#9CA3AF] hover:text-[var(--c-text)] transition-colors">
                            See all
                        </Link>
                    </motion.div>
                </div>

                {/* Horizontal Scroll Grid */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex overflow-x-auto overflow-y-hidden hide-scrollbar snap-x snap-mandatory gap-4 lg:gap-6 pb-8 -mx-6 px-6 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-3 lg:overflow-visible"
                >
                    {MOCK_BLOGS.map((blog, index) => (
                        <motion.div 
                            key={blog.id} 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className="w-[280px] sm:w-[320px] snap-start shrink-0 lg:w-auto lg:col-span-1 group cursor-pointer"
                        >
                            <Link href="/blog" className="block w-full">
                                {/* Image Box */}
                                <div className="relative aspect-[4/3] w-full rounded-[2rem] overflow-hidden bg-[var(--c-surface-alt)] mb-4">
                                    <img 
                                        src={blog.mainImage} 
                                        alt={blog.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    
                                    {/* Inset Overlapping Thumbnail (As shown in Image 1 Mockup) */}
                                    <div className="absolute bottom-3 left-3 w-14 h-16 bg-white rounded-xl shadow-[0_8px_16px_rgb(0,0,0,0.15)] overflow-hidden border-2 border-white transform transition-transform duration-500 group-hover:-translate-y-1">
                                        <img 
                                            src={blog.insetImage} 
                                            alt="Featured product" 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>

                                {/* Text Content */}
                                <div className="px-1">
                                    <span className="text-[13px] font-medium text-[#9CA3AF] mb-1.5 block">
                                        {blog.category}
                                    </span>
                                    <h3 className="font-sans text-[16px] lg:text-[18px] font-bold text-[#1A1D23] leading-snug line-clamp-2 transition-colors group-hover:text-[var(--c-accent)]">
                                        {blog.title}
                                    </h3>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
