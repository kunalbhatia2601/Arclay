"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, TrendingUp, Clock, ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SearchOverlay({ isOpen, onClose }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [bestSellers, setBestSellers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef(null);
    const router = useRouter();
    const debounceRef = useRef(null);

    useEffect(() => {
        if (!isOpen || bestSellers.length > 0) return;
        const fetchBestSellers = async () => {
            try {
                const res = await fetch("/api/products?isFeatured=true&limit=3");
                const data = await res.json();
                if (data.success && Array.isArray(data.products)) {
                    setBestSellers(data.products);
                }
            } catch (err) {
                console.error("Failed to fetch best sellers:", err);
            }
        };
        fetchBestSellers();
    }, [isOpen, bestSellers.length]);

    const popularSearches = [
        "Mango Pickle",
        "Masala Cashew",
        "Sweet Lime",
        "Garlic Pickle",
        "Festive Gift Box"
    ];

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
        if (!isOpen) {
            setQuery("");
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    // Live search with debounce
    const performSearch = useCallback(async (searchQuery) => {
        if (!searchQuery || searchQuery.trim().length < 2) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=8`);
            const data = await res.json();
            if (data.success && Array.isArray(data.products)) {
                setResults(data.products);
            } else {
                setResults([]);
            }
        } catch (err) {
            console.error("Search failed:", err);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            performSearch(query);
        }, 300);
        return () => clearTimeout(debounceRef.current);
    }, [query, performSearch]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/products?search=${encodeURIComponent(query)}`);
            onClose();
        }
    };

    const getPrice = (product) => {
        if (product.variations?.length > 0) {
            const v = product.variations[0];
            return v.salePrice || v.price;
        }
        return product.price || 0;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 35 }}
                    className="fixed inset-0 z-[100] bg-white/40 backdrop-blur-[40px] overflow-y-auto overscroll-contain"
                >
                    <div className="container mx-auto max-w-4xl px-6 py-10 sm:py-20 min-h-full relative">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-[28px] sm:text-[44px] font-serif font-bold text-[#2A2F25] leading-tight">Search</h2>
                                <p className="text-[#869661] text-xs font-bold tracking-[0.2em] uppercase mt-1">Artisanal Discovery</p>
                            </div>
                            <motion.button 
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-md text-[#2A2F25] shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-white/50 transition-colors"
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </motion.button>
                        </div>

                        {/* Search Input */}
                        <form onSubmit={handleSearch} className="relative mb-10">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#869661]/10 flex items-center justify-center">
                                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#869661]" strokeWidth={2.5} />
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search for products..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full bg-white/40 backdrop-blur-md border border-white/60 rounded-[2rem] py-5 sm:py-8 pl-16 sm:pl-20 pr-20 text-lg sm:text-2xl font-medium focus:outline-none focus:ring-4 focus:ring-[#869661]/10 focus:border-[#869661]/30 transition-all placeholder:text-[#767B71]/40 shadow-[0_15px_40px_rgba(0,0,0,0.05)]"
                            />
                            {query && (
                                <button 
                                    type="button"
                                    onClick={() => { setQuery(""); setResults([]); }}
                                    className="absolute right-5 sm:right-8 top-1/2 -translate-y-1/2 text-[#767B71] hover:text-[#D86B4B] font-bold text-xs sm:text-sm uppercase tracking-widest"
                                >
                                    Clear
                                </button>
                            )}
                        </form>

                        {/* Live Search Results */}
                        {query.trim().length >= 2 && (
                            <div className="mb-10">
                                <div className="flex items-center gap-2 mb-4">
                                    <Search className="w-4 h-4 text-[#869661]" />
                                    <h3 className="text-xs uppercase tracking-widest font-bold text-[#767B71]">
                                        {isLoading ? "Searching..." : `${results.length} Result${results.length !== 1 ? 's' : ''}`}
                                    </h3>
                                </div>

                                {isLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="w-8 h-8 border-3 border-[#869661] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : results.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {results.map((product) => (
                                            <Link
                                                key={product._id}
                                                href={`/products/${product._id}`}
                                                onClick={onClose}
                                                className="flex items-center gap-4 p-3 rounded-2xl border border-[#ECE8E0] bg-white/60 hover:bg-[#F0F4EC] hover:border-[#869661]/30 transition-all group"
                                            >
                                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[#F3EFE8] shrink-0">
                                                    {product.images?.[0] ? (
                                                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ShoppingBag className="w-5 h-5 text-[#767B71]" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-[14px] text-[#2A2F25] truncate">{product.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[#4A5D23] font-extrabold text-[14px]">₹{getPrice(product)}</span>
                                                        {product.category?.name && (
                                                            <span className="text-[10px] uppercase text-[#D86B4B] font-bold tracking-wider">{product.category.name}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-[#767B71] group-hover:translate-x-1 transition-transform shrink-0" />
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-[#767B71] text-sm">No products found for "<strong className="text-[#2A2F25]">{query}</strong>"</p>
                                        <p className="text-[#767B71] text-xs mt-2">Try a different search term</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Popular / Best Sellers (show only when no query) */}
                        {query.trim().length < 2 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div>
                                    <div className="flex items-center gap-2 mb-5">
                                        <TrendingUp className="w-4 h-4 text-[#D86B4B]" />
                                        <h3 className="text-xs uppercase tracking-widest font-bold text-[#767B71]">Popular Searches</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {popularSearches.map((term) => (
                                            <button
                                                key={term}
                                                onClick={() => {
                                                    setQuery(term);
                                                }}
                                                className="px-5 py-2.5 rounded-full bg-white border border-[#ECE8E0] text-sm font-medium text-[#2A2F25] hover:bg-[#F0F4EC] hover:border-[#869661]/30 transition-all"
                                            >
                                                {term}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {bestSellers.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-5">
                                        <Clock className="w-4 h-4 text-[#D86B4B]" />
                                        <h3 className="text-xs uppercase tracking-widest font-bold text-[#767B71]">Best Sellers</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {bestSellers.slice(0, 3).map((item) => (
                                            <Link 
                                                key={item._id}
                                                href={`/products/${item._id}`}
                                                onClick={onClose}
                                                className="flex items-center justify-between p-3 rounded-2xl border border-[#ECE8E0] hover:bg-[#F0F4EC] transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-[#F3EFE8] rounded-xl overflow-hidden shrink-0">
                                                        {item.images?.[0] ? (
                                                            <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-[#2A2F25]">{item.name}</p>
                                                        <p className="text-xs text-[#4A5D23] font-bold">₹{getPrice(item)}</p>
                                                    </div>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-[#767B71] group-hover:translate-x-1 transition-transform" />
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
