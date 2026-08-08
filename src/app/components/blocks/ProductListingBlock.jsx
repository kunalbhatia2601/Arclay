"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronDown, Grid3X3, LayoutList, Search, SlidersHorizontal, X } from "lucide-react";
import ProductCard from "../ProductCard";
import { ProductCardSkeleton } from "../ProductSkeleton";
import { cn } from "@/lib/utils";

/**
 * The catalogue, as an editable block.
 *
 * Everything the old hardcoded products page decided — header text, whether
 * there is a search box, where the filters sit, how many columns, which facets
 * appear — is now a setting, so the whole page can be rearranged from the
 * builder instead of in code.
 */

const SORT_OPTIONS = [
    { value: "popular", label: "Most Popular" },
    { value: "newest", label: "Newest First" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name-asc", label: "Name: A - Z" },
];

const COLUMN_CLASS = {
    2: "grid-cols-2",
    3: "grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    5: "grid-cols-2 lg:grid-cols-4 xl:grid-cols-5",
};

export default function ProductListingBlock({ settings = {}, data = {} }) {
    const {
        title = "All Products",
        subtitle = "{count} products found",
        layout = "sidebar-left",
        columns = "4",
        pageSize = 12,
        showSearch = true,
        showSort = true,
        showViewToggle = true,
        showCategories = true,
        showPrice = true,
        priceCeiling = 5000,
        showMetaFacets = true,
        restrictTo = null,
        defaultSort = "popular",
        emptyTitle = "No Products Found",
        emptyText = "We couldn't find any items matching your criteria.",
    } = settings;

    const searchParams = useSearchParams();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [facets, setFacets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
    const [maxPrice, setMaxPrice] = useState(priceCeiling);
    const [metaFilters, setMetaFilters] = useState({});
    const [sort, setSort] = useState(defaultSort);
    const [viewMode, setViewMode] = useState("grid");
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Deep links from the navbar and category tiles still drive the listing.
    useEffect(() => {
        setSelectedCategory(searchParams.get("category") || "");
        setSearch(searchParams.get("search") || "");
    }, [searchParams]);

    useEffect(() => {
        if (!showMetaFacets) return;
        fetch("/api/products/facets")
            .then(r => r.json())
            .then(d => d.success && setFacets(d.facets || []))
            .catch(() => {});
    }, [showMetaFacets]);

    const fetchProducts = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: pageSize, sort });
            if (search) params.set("search", search);
            if (selectedCategory) params.set("category", selectedCategory);
            if (showPrice && Number(maxPrice) < Number(priceCeiling)) {
                params.set("maxPrice", maxPrice);
            }

            const conditions = Object.entries(metaFilters)
                .filter(([, values]) => values?.length)
                .map(([key, values]) => ({ key, op: "in", value: values }));
            if (conditions.length) params.set("meta", JSON.stringify(conditions));

            // A restricted block behaves as a curated collection.
            if (restrictTo?.source === "manual" && restrictTo.productIds?.length) {
                params.set("only", restrictTo.productIds.join(","));
            } else if (restrictTo?.filter?.categories?.length && !selectedCategory) {
                params.set("category", restrictTo.filter.categories[0]);
            }

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
        } catch {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [search, selectedCategory, maxPrice, sort, metaFilters, pageSize, priceCeiling, showPrice, restrictTo]);

    useEffect(() => { fetchProducts(1); }, [fetchProducts]);

    const toggleMeta = (key, value) => {
        setMetaFilters((current) => {
            const values = current[key] || [];
            const next = values.includes(value)
                ? values.filter(v => v !== value)
                : [...values, value];
            return { ...current, [key]: next };
        });
    };

    const clearFilters = () => {
        setSearch("");
        setSelectedCategory("");
        setMaxPrice(priceCeiling);
        setMetaFilters({});
        setSort(defaultSort);
    };

    const hasFilters = showCategories || showPrice || (showMetaFacets && facets.length > 0);
    const showSidebar = hasFilters && (layout === "sidebar-left" || layout === "sidebar-right");
    const categoryName = categories.find(c => c._id === selectedCategory)?.name;
    const heading = categoryName || title;
    const subheading = String(subtitle || "").replace("{count}", pagination.total);

    const filterPanel = (
        <FilterPanel
            categories={categories}
            selectedCategory={selectedCategory}
            onCategory={setSelectedCategory}
            showCategories={showCategories}
            showPrice={showPrice}
            priceCeiling={priceCeiling}
            maxPrice={maxPrice}
            onMaxPrice={setMaxPrice}
            facets={showMetaFacets ? facets : []}
            metaFilters={metaFilters}
            onToggleMeta={toggleMeta}
            onClear={clearFilters}
        />
    );

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
                <div>
                    {heading && (
                        <h1 className="font-serif text-[36px] lg:text-[42px] font-bold text-[var(--c-text)] leading-tight">
                            {heading}
                        </h1>
                    )}
                    {subheading && (
                        <p className="text-[var(--c-text-muted)] text-[15px] mt-1 font-medium">
                            {subheading}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {showSearch && (
                        <form
                            onSubmit={(e) => { e.preventDefault(); fetchProducts(1); }}
                            className="relative hidden lg:block"
                        >
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--c-text-muted)]" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search products..."
                                className="pl-11 pr-4 py-2.5 w-56 rounded-full border border-[var(--c-border)] bg-[var(--c-bg)] text-sm focus:outline-none focus:border-[var(--c-primary)] transition-colors"
                            />
                        </form>
                    )}

                    {hasFilters && (
                        <button
                            onClick={() => setShowMobileFilters(true)}
                            className="lg:hidden flex items-center gap-2 px-5 py-2.5 bg-[var(--c-primary)] text-white text-sm font-semibold rounded-full"
                        >
                            <SlidersHorizontal className="w-4 h-4" /> Filters
                        </button>
                    )}

                    {showSort && (
                        <div className="relative">
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
                                className="appearance-none pl-4 pr-10 py-2.5 rounded-full border border-[var(--c-border)] bg-white text-sm font-medium cursor-pointer focus:outline-none focus:border-[var(--c-primary)]"
                            >
                                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--c-text-muted)] pointer-events-none" />
                        </div>
                    )}

                    {showViewToggle && (
                        <div className="flex items-center bg-[var(--c-surface-alt)] rounded-full p-1 shrink-0">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={cn("p-2 rounded-full transition-colors",
                                    viewMode === "grid" ? "bg-white text-[var(--c-text)] shadow-sm" : "text-[var(--c-text-muted)]")}
                            >
                                <Grid3X3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={cn("p-2 rounded-full transition-colors",
                                    viewMode === "list" ? "bg-white text-[var(--c-primary)] shadow-sm" : "text-[var(--c-text-muted)]")}
                            >
                                <LayoutList className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters across the top, when that layout is chosen */}
            {hasFilters && layout === "top" && (
                <div className="hidden lg:block mb-8">{filterPanel}</div>
            )}

            <div className={cn("flex gap-8 lg:gap-12", layout === "sidebar-right" && "flex-row-reverse")}>
                {showSidebar && (
                    <aside className="hidden lg:block w-64 shrink-0">
                        <div className="sticky top-8">{filterPanel}</div>
                    </aside>
                )}

                <div className="flex-1 min-w-0">
                    {loading ? (
                        <div className={cn("grid gap-4 lg:gap-6",
                            viewMode === "grid" ? COLUMN_CLASS[columns] || COLUMN_CLASS[4] : "grid-cols-1")}>
                            {Array.from({ length: Math.min(8, pageSize) }).map((_, i) => (
                                <ProductCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-32 bg-white rounded-2xl border border-[var(--c-border)]">
                            <p className="text-5xl mb-4">🏷️</p>
                            <h3 className="font-serif text-2xl text-[var(--c-text)] mb-2">{emptyTitle}</h3>
                            <p className="text-[var(--c-text-muted)] mb-6 max-w-md mx-auto text-sm">{emptyText}</p>
                            <button
                                onClick={clearFilters}
                                className="bg-[var(--c-primary)] text-white px-8 py-3 rounded-full text-sm font-semibold"
                            >
                                Reset Filters
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className={cn("grid gap-4 lg:gap-6",
                                viewMode === "grid" ? COLUMN_CLASS[columns] || COLUMN_CLASS[4] : "grid-cols-1")}>
                                {products.map((product) => (
                                    <ProductCard
                                        key={product._id}
                                        product={product}
                                        viewMode={viewMode}
                                        preset={data.cardPreset}
                                    />
                                ))}
                            </div>

                            {pagination.pages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-12 pt-8 border-t border-[var(--c-border)]">
                                    <button
                                        onClick={() => fetchProducts(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                        className="px-5 py-2.5 border border-[var(--c-border)] text-sm font-semibold rounded-full disabled:opacity-30"
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                        const num = i + 1;
                                        return (
                                            <button
                                                key={num}
                                                onClick={() => fetchProducts(num)}
                                                className={cn(
                                                    "w-10 h-10 rounded-full text-sm font-semibold flex items-center justify-center",
                                                    pagination.page === num
                                                        ? "bg-[var(--c-primary)] text-white"
                                                        : "text-[var(--c-text-muted)] hover:bg-[var(--c-surface-alt)]"
                                                )}
                                            >
                                                {num}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => fetchProducts(pagination.page + 1)}
                                        disabled={pagination.page === pagination.pages}
                                        className="px-5 py-2.5 border border-[var(--c-border)] text-sm font-semibold rounded-full disabled:opacity-30"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Mobile filter sheet */}
            {showMobileFilters && hasFilters && (
                <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
                    <div className="w-[85vw] max-w-sm bg-white h-full relative z-50 flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-[var(--c-border)]">
                            <h2 className="font-serif text-2xl font-bold text-[var(--c-text)]">Filters</h2>
                            <button onClick={() => setShowMobileFilters(false)} className="p-2 text-[var(--c-text-muted)]">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">{filterPanel}</div>
                        <div className="p-6 border-t border-[var(--c-border)] grid grid-cols-2 gap-4">
                            <button
                                onClick={() => { clearFilters(); setShowMobileFilters(false); }}
                                className="py-3.5 border border-[var(--c-border)] text-sm font-semibold rounded-xl"
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="py-3.5 bg-[var(--c-primary)] text-white text-sm font-semibold rounded-xl"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function FilterPanel({
    categories, selectedCategory, onCategory, showCategories,
    showPrice, priceCeiling, maxPrice, onMaxPrice,
    facets, metaFilters, onToggleMeta, onClear,
}) {
    return (
        <div className="space-y-6">
            {showCategories && (
                <Card title="Categories">
                    <div className="space-y-1">
                        {[{ _id: "", name: "All Products" }, ...categories].map((category) => {
                            const active = selectedCategory === category._id;
                            return (
                                <button
                                    key={category._id || "all"}
                                    onClick={() => onCategory(category._id)}
                                    className={cn(
                                        "w-full flex items-center px-4 py-3 rounded-xl text-[14px] transition-all relative",
                                        active
                                            ? "text-[var(--c-primary-dark)] font-bold"
                                            : "text-[var(--c-text-muted)] hover:text-[var(--c-text)]"
                                    )}
                                >
                                    <span className="relative z-10">{category.name}</span>
                                    {active && (
                                        <motion.div
                                            layoutId="listing-pill"
                                            className="absolute inset-0 bg-[var(--c-accent-soft)] rounded-xl z-0"
                                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </Card>
            )}

            {showPrice && (
                <Card title="Price Range">
                    <input
                        type="range"
                        min="0"
                        max={priceCeiling}
                        step="50"
                        value={maxPrice}
                        onChange={(e) => onMaxPrice(e.target.value)}
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
                            <span className="text-sm font-bold text-[var(--c-text)]">₹{maxPrice}</span>
                        </div>
                    </div>
                </Card>
            )}

            {/* Facets generated from custom product fields — no code per field */}
            {facets.map((facet) => (
                <Card key={facet.key} title={facet.label}>
                    <div className="flex flex-wrap gap-1.5">
                        {facet.values.map(({ value, count }) => {
                            const active = (metaFilters[facet.key] || []).includes(value);
                            const display = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
                            return (
                                <button
                                    key={String(value)}
                                    onClick={() => onToggleMeta(facet.key, value)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-[13px] border transition-colors",
                                        active
                                            ? "bg-[var(--c-primary)] text-white border-[var(--c-primary)]"
                                            : "bg-white text-[var(--c-text-muted)] border-[var(--c-border)] hover:border-[var(--c-primary)]"
                                    )}
                                >
                                    {display}
                                    {facet.unit ? ` ${facet.unit}` : ""}
                                    <span className={cn("ml-1", active ? "text-white/70" : "text-[var(--c-text-faint)]")}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </Card>
            ))}

            <button
                onClick={onClear}
                className="w-full py-3 bg-[var(--c-surface-alt)] text-[var(--c-text)] text-sm font-semibold rounded-xl"
            >
                Clear All Filters
            </button>
        </div>
    );
}

function Card({ title, children }) {
    return (
        <div className="bg-white rounded-2xl border border-[var(--c-border)] p-6">
            <h3 className="font-semibold text-[17px] text-[var(--c-text)] mb-5 pb-3 border-b border-[var(--c-border)]/60">
                {title}
            </h3>
            {children}
        </div>
    );
}
