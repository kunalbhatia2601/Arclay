"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { pageWindow } from "@/lib/pagination";
import { useSearchParams } from "next/navigation";
import { ProductCardSkeleton } from "@/app/components/ProductSkeleton";
import ProductCard from "@/app/components/ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, Grid3X3, LayoutList, ChevronDown, X } from "lucide-react";

export default function ProductsPageContent({ aboveGrid = null, belowGrid = null }) {
    const searchParams = useSearchParams();
    const initialCategory = searchParams.get("category") || "";
    const initialSubcategory = searchParams.get("subcategory") || "";
    const initialSearch = searchParams.get("search") || "";

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    const [search, setSearch] = useState(initialSearch);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [selectedSubcategory, setSelectedSubcategory] = useState(initialSubcategory);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [priceRange, setPriceRange] = useState(5000);
    const [sort, setSort] = useState("popular");
    const [viewMode, setViewMode] = useState("grid");
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Sync state with URL changes (e.g., when clicking category in navbar while already on products page)
    useEffect(() => {
        const cat = searchParams.get("category") || "";
        const sub = searchParams.get("subcategory") || "";
        const s = searchParams.get("search") || "";
        setSelectedCategory(cat);
        setSelectedSubcategory(sub);
        setSearch(s);
    }, [searchParams]);

    const fetchProducts = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 12, sort });
            if (search) params.set("search", search);
            if (selectedCategory) params.set("category", selectedCategory);
            if (selectedSubcategory) params.set("subcategory", selectedSubcategory);
            if (minPrice) params.set("minPrice", minPrice);
            if (maxPrice) params.set("maxPrice", maxPrice);

            const res = await fetch(`/api/products?${params}`);
            const data = await res.json();
            if (data.success) {
                setProducts(data.products || []);
                setCategories(data.categories || []);
                setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
            } else {
                setProducts([]);
                setPagination({ page: 1, pages: 1, total: 0 });
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [search, selectedCategory, selectedSubcategory, minPrice, maxPrice, sort]);

    useEffect(() => { fetchProducts(1); }, [fetchProducts]);

    const handleSearch = (e) => { e.preventDefault(); fetchProducts(1); };

    const clearFilters = () => {
        setSearch(""); setSelectedCategory(""); setSelectedSubcategory(""); setMinPrice(""); setMaxPrice(""); setSort("popular"); setPriceRange(5000);
    };

    const sortOptions = [
        { value: "popular", label: "Most Popular" },
        { value: "newest", label: "Newest First" },
        { value: "price-low", label: "Price: Low to High" },
        { value: "price-high", label: "Price: High to Low" },
        { value: "name-asc", label: "Name: A - Z" },
    ];

    const parentCategories = (Array.isArray(categories) ? categories : []).filter((c) => !c.parent);
    const childCategories = (Array.isArray(categories) ? categories : []).filter(
        (c) => selectedCategory && String(c.parent?._id || c.parent || "") === String(selectedCategory)
    );
    const selectedCategoryName =
        categories.find((c) => c._id === selectedSubcategory)?.name
        || categories.find((c) => c._id === selectedCategory)?.name
        || "All Products";

    return (
        <main className="min-h-screen bg-[var(--c-bg)]">

            {/* Page Header */}
            <div className="bg-white border-b border-[var(--c-border)]">
                <div className="container mx-auto px-4 xl:px-8 max-w-7xl py-8 lg:py-10">
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                        <div>
                            <h1 className="font-serif text-[36px] lg:text-[42px] font-bold text-[var(--c-text)] leading-tight">{selectedCategoryName}</h1>
                            <p className="text-[var(--c-text-muted)] text-[15px] mt-1 font-medium">{pagination.total} artisanal products found</p>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Search */}
                            <form onSubmit={handleSearch} className="relative hidden lg:block">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--c-text-muted)]" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search products..."
                                    className="pl-11 pr-4 py-2.5 w-56 rounded-full border border-[var(--c-border)] bg-[var(--c-bg)] text-sm focus:outline-none focus:border-[var(--c-primary)] transition-colors"
                                />
                            </form>

                            {/* Filters Button */}
                            <button
                                onClick={() => setShowMobileFilters(true)}
                                className="lg:hidden flex items-center gap-2 px-5 py-2.5 bg-[var(--c-primary)] text-white text-sm font-semibold rounded-full hover:bg-[var(--c-primary-dark)] transition-colors"
                            >
                                <SlidersHorizontal className="w-4 h-4" /> Filters
                            </button>

                            {/* Sort */}
                            <div className="relative">
                                <select
                                    value={sort}
                                    onChange={(e) => setSort(e.target.value)}
                                    className="appearance-none pl-4 pr-10 py-2.5 rounded-full border border-[var(--c-border)] bg-white text-sm font-medium cursor-pointer focus:outline-none focus:border-[var(--c-primary)] transition-colors"
                                >
                                    {sortOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--c-text-muted)] pointer-events-none" />
                            </div>

                            {/* View Mode Toggle */}
                            <div className="flex items-center bg-[var(--c-surface-alt)] rounded-full p-1 shrink-0 ml-auto md:ml-0">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2 rounded-full transition-colors ${viewMode === "grid" ? "bg-white text-[var(--c-text)] shadow-sm" : "text-[var(--c-text-muted)]"}`}
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`p-2 rounded-full transition-all duration-300 ${viewMode === "list" ? "bg-white text-[var(--c-primary)] shadow-md" : "text-[var(--c-text-muted)] hover:text-[var(--c-text)]"}`}
                                >
                                    <LayoutList className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Category Scroll */}
            <div className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-[var(--c-border)] px-4 py-3 overflow-x-auto hide-scrollbar">
                <div className="flex gap-2 relative min-w-max pb-1 isolate">
                    {[
                        { _id: "", name: "All" },
                        ...parentCategories
                    ].map((cat) => {
                        const isSelected = selectedCategory === cat._id;
                        return (
                            <button
                                key={cat._id || 'all'}
                                onClick={() => { setSelectedCategory(cat._id); setSelectedSubcategory(""); }}
                                className={`relative px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 z-10 shrink-0 ${
                                    isSelected ? "text-white" : "text-[var(--c-text)] bg-[var(--c-surface-alt)]/50"
                                }`}
                            >
                                <span className="relative z-20">{cat.name}</span>
                                {isSelected && (
                                    <motion.div
                                        layoutId="category-pill-active"
                                        className="absolute inset-0 bg-[var(--c-primary)] rounded-full -z-10"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                    {childCategories.map((cat) => {
                        const isSelected = selectedSubcategory === cat._id;
                        return (
                            <button
                                key={cat._id}
                                onClick={() => setSelectedSubcategory(cat._id)}
                                className={`relative px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 z-10 shrink-0 ${
                                    isSelected ? "text-white" : "text-[var(--c-text)] bg-[var(--c-surface-alt)]/50"
                                }`}
                            >
                                <span className="relative z-20">{cat.name}</span>
                                {isSelected && (
                                    <motion.div
                                        layoutId="subcategory-pill-active"
                                        className="absolute inset-0 bg-[var(--c-primary)] rounded-full -z-10"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {aboveGrid}

            {/* Main Content */}
            <div className="container mx-auto px-4 xl:px-8 max-w-7xl py-8 lg:py-12">
                <div className="flex gap-8 lg:gap-12">

                    {/* ─── LEFT SIDEBAR (Desktop) ─── */}
                    <aside className="hidden lg:block w-64 shrink-0">
                        <div className="sticky top-8 space-y-8">

                            {/* Categories */}
                            <div className="bg-white rounded-2xl border border-[var(--c-border)] p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
                                <h3 className="font-semibold text-[17px] text-[var(--c-text)] mb-5 pb-3 border-b border-[var(--c-border)]/60">Categories</h3>
                                <div className="space-y-1 relative overflow-visible">
                                    {[
                                        { _id: "", name: "All Products", productCount: pagination.total },
                                        ...parentCategories
                                    ].map((cat) => (
                                        <button
                                            key={cat._id}
                                            onClick={() => { setSelectedCategory(cat._id); setSelectedSubcategory(""); }}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[14px] transition-all group relative z-10 ${
                                                (selectedCategory === cat._id && !selectedSubcategory) || (selectedCategory === "" && cat._id === "")
                                                    ? "text-[#3A4B29] font-bold"
                                                    : "text-[var(--c-text-muted)] hover:text-[var(--c-text)]"
                                            }`}
                                        >
                                            <span className="relative z-10">{cat.name}</span>
                                            {/* <span className={`text-[10px] px-2 py-0.5 rounded-full transition-colors relative z-10 ${
                                                (selectedCategory === cat._id && !selectedSubcategory) || (selectedCategory === "" && cat._id === "")
                                                    ? "bg-[var(--c-primary)] text-white"
                                                    : "bg-[var(--c-surface-alt)] text-[var(--c-text-muted)] group-hover:bg-[var(--c-border)]"
                                            }`}>
                                                {cat.productCount || 0}
                                            </span> */}
                                            {/* Liquid Active Background */}
                                            {((selectedCategory === cat._id) || (selectedCategory === "" && cat._id === "")) && (
                                                <motion.div
                                                    layoutId="liquid-pill-products-sidebar"
                                                    className="absolute inset-0 bg-[var(--c-accent-soft)] rounded-xl z-[-1]"
                                                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                                />
                                            )}
                                        </button>
                                    ))}
                                    {childCategories.map((cat) => (
                                        <button
                                            key={cat._id}
                                            onClick={() => setSelectedSubcategory(cat._id)}
                                            className={`w-full flex items-center justify-between pl-8 pr-4 py-2.5 rounded-xl text-[13px] transition-all group relative z-10 ${
                                                selectedSubcategory === cat._id
                                                    ? "text-[#3A4B29] font-bold"
                                                    : "text-[var(--c-text-muted)] hover:text-[var(--c-text)]"
                                            }`}
                                        >
                                            <span className="relative z-10">{cat.name}</span>
                                            {selectedSubcategory === cat._id && (
                                                <motion.div
                                                    layoutId="liquid-pill-products-sub"
                                                    className="absolute inset-0 bg-[var(--c-accent-soft)] rounded-xl z-[-1]"
                                                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price Range */}
                            <div className="bg-white rounded-2xl border border-[var(--c-border)] p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
                                <h3 className="font-semibold text-[17px] text-[var(--c-text)] mb-5 pb-3 border-b border-[var(--c-border)]/60">Price Range</h3>
                                <div className="px-1">
                                    <input
                                        type="range"
                                        min="0"
                                        max="5000"
                                        step="50"
                                        value={priceRange}
                                        onChange={(e) => {
                                            setPriceRange(e.target.value);
                                            setMaxPrice(e.target.value);
                                        }}
                                        className="w-full h-1.5 bg-[var(--c-surface-alt)] rounded-full appearance-none cursor-pointer accent-[var(--c-primary)]"
                                    />
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase tracking-wider text-[var(--c-text-muted)] font-bold">Min</span>
                                            <span className="text-sm font-bold text-[var(--c-text)]">₹0</span>
                                        </div>
                                        <div className="w-8 h-px bg-[var(--c-border)]" />
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] uppercase tracking-wider text-[var(--c-text-muted)] font-bold">Max</span>
                                            <span className="text-sm font-bold text-[var(--c-text)]">₹{priceRange}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Clear Filters */}
                            {(selectedCategory || selectedSubcategory || minPrice || maxPrice || search || sort !== "popular") && (
                                <button
                                    onClick={clearFilters}
                                    className="w-full py-3 bg-[var(--c-surface-alt)] text-[var(--c-text)] hover:bg-[var(--c-border)] transition-colors text-sm font-semibold rounded-xl"
                                >
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    </aside>

                    {/* ─── PRODUCT GRID ─── */}
                    <div className="flex-1 min-w-0">
                        {loading ? (
                            <div className={`grid ${viewMode === "grid" ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6" : "grid-cols-1 gap-4"}`}>
                                {[...Array(8)].map((_, i) => (
                                    <ProductCardSkeleton key={i} />
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-32 bg-white rounded-2xl border border-[var(--c-border)]">
                                <p className="text-5xl mb-4">🏷️</p>
                                <h3 className="font-serif text-2xl text-[var(--c-text)] mb-2">No Products Found</h3>
                                <p className="text-[var(--c-text-muted)] mb-6 max-w-md mx-auto text-sm">We couldn&apos;t find any items matching your criteria.</p>
                                <button onClick={clearFilters} className="bg-[var(--c-primary)] text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-[var(--c-primary-dark)] transition-colors">
                                    Reset Filters
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className={`grid ${viewMode === "grid" ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6" : "grid-cols-1 gap-4"}`}>
                                    {products.map((product) => (
                                        <ProductCard key={product._id} product={product} viewMode={viewMode} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {pagination.pages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-12 pt-8 border-t border-[var(--c-border)]">
                                        <button
                                            onClick={() => fetchProducts(pagination.page - 1)}
                                            disabled={pagination.page === 1}
                                            className="px-5 py-2.5 border border-[var(--c-border)] text-sm font-semibold rounded-full hover:bg-[var(--c-surface-alt)] disabled:opacity-30 transition-colors"
                                        >
                                            Previous
                                        </button>
                                        {pageWindow(pagination.page, pagination.pages).map((item, i) =>
                                            item === "…" ? (
                                                <span key={`gap-${i}`} className="w-6 text-center text-[var(--c-text-muted)]">
                                                    …
                                                </span>
                                            ) : (
                                                <button
                                                    key={item}
                                                    onClick={() => fetchProducts(item)}
                                                    className={`w-10 h-10 rounded-full text-sm font-semibold transition-colors flex items-center justify-center ${
                                                        pagination.page === item ? "bg-[var(--c-primary)] text-white" : "text-[var(--c-text-muted)] hover:bg-[var(--c-surface-alt)]"
                                                    }`}
                                                >
                                                    {item}
                                                </button>
                                            )
                                        )}
                                        <button
                                            onClick={() => fetchProducts(pagination.page + 1)}
                                            disabled={pagination.page === pagination.pages}
                                            className="px-5 py-2.5 border border-[var(--c-border)] text-sm font-semibold rounded-full hover:bg-[var(--c-surface-alt)] disabled:opacity-30 transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {belowGrid}

            {/* ─── MOBILE FILTERS SHEET ─── */}
            {showMobileFilters && (
                <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
                    <div className="w-[85vw] max-w-sm bg-white h-full relative z-50 flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-[var(--c-border)]">
                            <h2 className="font-serif text-2xl font-bold text-[var(--c-text)]">Filters</h2>
                            <button onClick={() => setShowMobileFilters(false)} className="p-2 text-[var(--c-text-muted)] hover:text-[var(--c-text)]">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Sort */}
                            <div>
                                <h3 className="font-semibold text-sm text-[var(--c-text)] mb-3 uppercase tracking-wider">Sort By</h3>
                                <div className="space-y-2">
                                    {sortOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setSort(opt.value)}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${
                                                sort === opt.value ? "bg-[var(--c-accent-soft)] text-[#3A4B29] font-semibold" : "text-[var(--c-text-muted)] hover:bg-[var(--c-surface-alt)]"
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Categories */}
                            <div>
                                <h3 className="font-semibold text-sm text-[var(--c-text)] mb-3 uppercase tracking-wider">Categories</h3>
                                <div className="space-y-2">
                                    <button onClick={() => { setSelectedCategory(""); setSelectedSubcategory(""); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${selectedCategory === "" ? "bg-[var(--c-accent-soft)] text-[#3A4B29] font-semibold" : "text-[var(--c-text-muted)] hover:bg-[var(--c-surface-alt)]"}`}>
                                        All Products
                                    </button>
                                    {parentCategories.map((cat) => (
                                        <button key={cat._id} onClick={() => { setSelectedCategory(cat._id); setSelectedSubcategory(""); setShowMobileFilters(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${selectedCategory === cat._id && !selectedSubcategory ? "bg-[var(--c-accent-soft)] text-[#3A4B29] font-semibold" : "text-[var(--c-text-muted)] hover:bg-[var(--c-surface-alt)]"}`}>
                                            {cat.name}
                                        </button>
                                    ))}
                                    {childCategories.length > 0 && childCategories.map((cat) => (
                                        <button key={cat._id} onClick={() => { setSelectedSubcategory(cat._id); setShowMobileFilters(false); }} className={`w-full text-left px-4 py-3 pl-8 rounded-xl text-sm transition-colors ${selectedSubcategory === cat._id ? "bg-[var(--c-accent-soft)] text-[#3A4B29] font-semibold" : "text-[var(--c-text-muted)] hover:bg-[var(--c-surface-alt)]"}`}>
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Price */}
                            <div>
                                <h3 className="font-semibold text-sm text-[var(--c-text)] mb-3 uppercase tracking-wider">Price Range</h3>
                                <input type="range" min="0" max="10000" value={priceRange}
                                    onChange={(e) => { setPriceRange(e.target.value); setMaxPrice(e.target.value); }}
                                    className="w-full h-2 bg-[var(--c-border)] rounded-full appearance-none cursor-pointer accent-[var(--c-primary)]"
                                />
                                <div className="flex justify-between mt-2 text-sm text-[var(--c-text-muted)]">
                                    <span>₹0</span><span className="font-semibold text-[var(--c-text)]">₹{priceRange}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-[var(--c-border)] grid grid-cols-2 gap-4 pb-safe">
                            <button onClick={() => { clearFilters(); setShowMobileFilters(false); }} className="py-3.5 border border-[var(--c-border)] text-sm font-semibold text-[var(--c-text)] rounded-xl hover:bg-[var(--c-surface-alt)] transition-colors">
                                Clear
                            </button>
                            <button onClick={() => setShowMobileFilters(false)} className="py-3.5 bg-[var(--c-primary)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--c-primary-dark)] transition-colors">
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
