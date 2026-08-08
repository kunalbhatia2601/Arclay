"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Calendar, User, ArrowRight } from "lucide-react";

const BLOG_POSTS = [
    {
        id: 1,
        title: "The Art of Traditional Pickle Making: A Multi-Generational Secret",
        excerpt: "Discover the ancient techniques and sun-drying methods that give our pickles their legendary depth of flavor and artisanal texture.",
        category: "Recipes",
        date: "Oct 24, 2023",
        author: "Amrita Nair",
        image: "https://images.unsplash.com/photo-1589135303405-86687a4087e6?q=80&w=800&auto=format&fit=crop",
        featured: true
    },
    {
        id: 2,
        title: "5 Health Benefits of Fermented Foods You Didn't Know About",
        excerpt: "Probiotics, improved digestion, and immune support—why traditional pickles are more than just a condiment for your plate.",
        category: "Health",
        date: "Oct 20, 2023",
        author: "Dr. Sameer Rao",
        image: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: 3,
        title: "Sustainable Sourcing: From Farm to Your Gourmet Lux Jar",
        excerpt: "How we partner with local farmers to ensure every mango and lime is picked at the peak of its natural perfection.",
        category: "Life Style",
        date: "Oct 15, 2023",
        author: "Karan Singh",
        image: "https://images.unsplash.com/photo-1464226184884-fa280b87339e?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: 4,
        title: "Perfect Pairings: Spice Up Your Brunch with Artisanal Snacks",
        excerpt: "From Makhana to Savory Sev, learn how to pair our snacks with your favorite beverages for an elevated gourmet experience.",
        category: "Recipes",
        date: "Oct 10, 2023",
        author: "Chef Mira",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop"
    }
];

const CATEGORIES = ["All", "Recipes", "Health", "Life Style"];

export default function BlogPage() {
    const [activeCategory, setActiveCategory] = useState("All");

    const filteredPosts = activeCategory === "All" 
        ? BLOG_POSTS 
        : BLOG_POSTS.filter(post => post.category === activeCategory);

    return (
        <div className="min-h-screen bg-[var(--c-bg)]">
            {/* Header Section */}
            <div className="bg-[var(--c-text)] text-white pt-32 pb-20 overflow-hidden relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
                    <svg viewBox="0 0 400 400" className="w-full h-full">
                        <path d="M0,400 C150,300 250,400 400,300 L400,0 L0,0 Z" fill="currentColor" />
                    </svg>
                </div>

                <div className="container mx-auto px-4 xl:px-8 max-w-7xl relative z-10">
                    <nav className="flex items-center gap-2 text-[13px] font-medium text-white/60 mb-8 uppercase tracking-widest">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-white">Our Blog</span>
                    </nav>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--c-accent)] text-white text-[12px] font-bold uppercase tracking-widest mb-6">
                            The Gourmet Journal
                        </span>
                        <h1 className="font-serif text-[48px] lg:text-[64px] font-bold leading-[1.1] mb-6 max-w-3xl">
                            Stories, Recipes & Tips
                        </h1>
                        <p className="text-white/70 text-lg lg:text-xl max-w-2xl font-medium leading-relaxed">
                            Dive into the heart of artisanal craft, exploring the rich heritage of Indian flavors and the contemporary lifestyle of gourmet food.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-4 xl:px-8 max-w-7xl -mt-10 mb-24 relative z-20">
                {/* Category Filter */}
                <div className="flex flex-wrap items-center gap-3 mb-16 p-2 bg-white rounded-[2.5rem] border border-[var(--c-border)] shadow-xl shadow-black/5 inline-flex w-auto mx-auto lg:mx-0">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-8 py-3.5 rounded-full text-sm font-bold transition-all duration-300 ${activeCategory === cat ? "bg-[var(--c-primary)] text-white shadow-lg shadow-[var(--c-primary)]/20" : "text-[var(--c-text-muted)] hover:bg-[var(--c-surface-alt)] hover:text-[var(--c-text)]"}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Blog Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {filteredPosts.map((post, index) => (
                        <motion.article
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`group cursor-pointer ${post.featured ? 'lg:col-span-2 lg:grid lg:grid-cols-2 bg-white rounded-[2.5rem] overflow-hidden border border-[var(--c-border)] shadow-sm hover:shadow-xl transition-all duration-500' : ''}`}
                        >
                            <div className={`relative overflow-hidden ${post.featured ? 'h-full' : 'aspect-[4/3] rounded-[2.5rem] mb-6 shadow-sm shadow-black/5'}`}>
                                <img 
                                    src={post.image} 
                                    alt={post.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute top-6 left-6">
                                    <span className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[11px] font-bold text-[var(--c-text)] uppercase tracking-wider shadow-sm">
                                        {post.category}
                                    </span>
                                </div>
                            </div>

                            <div className={`${post.featured ? 'p-10 flex flex-col justify-center' : ''}`}>
                                <div className="flex items-center gap-4 text-[var(--c-text-muted)] text-[13px] font-semibold mb-4">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" /> {post.date}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-[var(--c-accent)]" />
                                    <span className="flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5" /> by {post.author}
                                    </span>
                                </div>
                                <h2 className={`font-serif font-bold text-[var(--c-text)] leading-tight group-hover:text-[var(--c-primary)] transition-colors ${post.featured ? 'text-[32px] mb-4' : 'text-[22px] mb-3'}`}>
                                    {post.title}
                                </h2>
                                <p className="text-[var(--c-text-muted)] text-[15px] leading-relaxed mb-6 line-clamp-3">
                                    {post.excerpt}
                                </p>
                                <div className="flex items-center gap-2 text-[var(--c-accent)] font-bold text-sm group/link">
                                    <span className="tracking-wide">READ FULL STORY</span>
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </div>
            </div>
        </div>
    );
}
