"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    // Filters
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [sort, setSort] = useState("newest");
    const [showFilters, setShowFilters] = useState(false);

    const fetchProducts = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                limit: 12,
                sort,
            });

            if (search) params.set("search", search);
            if (selectedCategory) params.set("category", selectedCategory);
            if (minPrice) params.set("minPrice", minPrice);
            if (maxPrice) params.set("maxPrice", maxPrice);

            const res = await fetch(`/api/products?${params}`);
            const data = await res.json();

            if (data.success) {
                setProducts(data.products);
                setCategories(data.categories);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setLoading(false);
        }
    }, [search, selectedCategory, minPrice, maxPrice, sort]);

    useEffect(() => {
        fetchProducts(1);
    }, [fetchProducts]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchProducts(1);
    };

    const clearFilters = () => {
        setSearch("");
        setSelectedCategory("");
        setMinPrice("");
        setMaxPrice("");
        setSort("newest");
    };

    const getEffectivePrice = (product) => {
        return product.salePrice || product.regularPrice;
    };

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-background pt-20">
                {/* Hero Section */}
                <section className="bg-gradient-to-b from-primary/5 to-background py-12 lg:py-16">
                    <div className="container mx-auto px-4 lg:px-8">
                        <h1 className="font-serif text-4xl lg:text-5xl font-bold text-foreground text-center">
                            Our Products
                        </h1>
                        <p className="text-muted-foreground text-center mt-4 max-w-2xl mx-auto">
                            Discover our handcrafted collection of premium pickles and snacks,
                            made with love using traditional recipes.
                        </p>
                    </div>
                </section>

                <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-12">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Filters Sidebar */}
                        <aside className={`lg:w-64 shrink-0 ${showFilters ? "block" : "hidden lg:block"}`}>
                            <div className="bg-card rounded-2xl p-6 border border-border sticky top-24">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="font-serif text-xl font-bold text-foreground">
                                        Filters
                                    </h2>
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-primary hover:underline"
                                    >
                                        Clear all
                                    </button>
                                </div>

                                {/* Search */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Search
                                    </label>
                                    <form onSubmit={handleSearch}>
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Search products..."
                                            className="w-full px-4 py-2 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </form>
                                </div>

                                {/* Categories */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-foreground mb-3">
                                        Category
                                    </label>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setSelectedCategory("")}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === ""
                                                    ? "bg-primary text-primary-foreground"
                                                    : "text-foreground hover:bg-muted"
                                                }`}
                                        >
                                            All Categories
                                        </button>
                                        {categories.map((cat) => (
                                            <button
                                                key={cat._id}
                                                onClick={() => setSelectedCategory(cat._id)}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === cat._id
                                                        ? "bg-primary text-primary-foreground"
                                                        : "text-foreground hover:bg-muted"
                                                    }`}
                                            >
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Price Range */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-foreground mb-3">
                                        Price Range
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={minPrice}
                                            onChange={(e) => setMinPrice(e.target.value)}
                                            placeholder="Min"
                                            min="0"
                                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                        />
                                        <input
                                            type="number"
                                            value={maxPrice}
                                            onChange={(e) => setMaxPrice(e.target.value)}
                                            placeholder="Max"
                                            min="0"
                                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Sort */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Sort By
                                    </label>
                                    <select
                                        value={sort}
                                        onChange={(e) => setSort(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                    >
                                        <option value="newest">Newest</option>
                                        <option value="oldest">Oldest</option>
                                        <option value="price-low">Price: Low to High</option>
                                        <option value="price-high">Price: High to Low</option>
                                        <option value="name-asc">Name: A to Z</option>
                                        <option value="name-desc">Name: Z to A</option>
                                    </select>
                                </div>
                            </div>
                        </aside>

                        {/* Products Grid */}
                        <div className="flex-1">
                            {/* Mobile Filter Toggle */}
                            <div className="lg:hidden mb-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="w-full"
                                >
                                    {showFilters ? "Hide Filters" : "Show Filters"}
                                </Button>
                            </div>

                            {/* Results Header */}
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-muted-foreground">
                                    {pagination.total} product{pagination.total !== 1 ? "s" : ""} found
                                </p>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : products.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="text-6xl mb-4">🔍</div>
                                    <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
                                        No products found
                                    </h3>
                                    <p className="text-muted-foreground mb-6">
                                        Try adjusting your filters or search term
                                    </p>
                                    <Button onClick={clearFilters} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                                        Clear Filters
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {products.map((product) => (
                                            <Link
                                                key={product._id}
                                                href={`/products/${product._id}`}
                                                className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                                            >
                                                {/* Product Image */}
                                                <div className="aspect-square bg-muted relative overflow-hidden">
                                                    {product.images?.[0] ? (
                                                        <img
                                                            src={product.images[0]}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-6xl">
                                                            📦
                                                        </div>
                                                    )}
                                                    {product.salePrice && (
                                                        <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                                                            SALE
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Product Info */}
                                                <div className="p-5">
                                                    {product.category && (
                                                        <p className="text-xs text-primary font-medium uppercase tracking-wide mb-1">
                                                            {product.category.name}
                                                        </p>
                                                    )}
                                                    <h3 className="font-serif text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                                        {product.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-xl text-foreground">
                                                            ₹{getEffectivePrice(product)}
                                                        </span>
                                                        {product.salePrice && (
                                                            <span className="text-muted-foreground line-through text-sm">
                                                                ₹{product.regularPrice}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {pagination.pages > 1 && (
                                        <div className="flex items-center justify-center gap-2 mt-12">
                                            <button
                                                onClick={() => fetchProducts(pagination.page - 1)}
                                                disabled={pagination.page === 1}
                                                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Previous
                                            </button>
                                            <div className="flex gap-1">
                                                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                                    let pageNum;
                                                    if (pagination.pages <= 5) {
                                                        pageNum = i + 1;
                                                    } else if (pagination.page <= 3) {
                                                        pageNum = i + 1;
                                                    } else if (pagination.page >= pagination.pages - 2) {
                                                        pageNum = pagination.pages - 4 + i;
                                                    } else {
                                                        pageNum = pagination.page - 2 + i;
                                                    }
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => fetchProducts(pageNum)}
                                                            className={`w-10 h-10 rounded-lg transition-colors ${pagination.page === pageNum
                                                                    ? "bg-primary text-primary-foreground"
                                                                    : "border border-border text-foreground hover:bg-muted"
                                                                }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <button
                                                onClick={() => fetchProducts(pagination.page + 1)}
                                                disabled={pagination.page === pagination.pages}
                                                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            </main>
            <Footer />
        </>
    );
}
