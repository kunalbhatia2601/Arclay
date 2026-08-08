"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

/**
 * Visual builder for a productQuery.
 *
 * Blocks store a structured query, not a URL, so this is dropdowns and toggles
 * plus a live "matches N products" counter and thumbnails — the admin can see
 * exactly what a filter selects before saving.
 */

const SORTS = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "bestselling", label: "Best selling" },
    { value: "price-asc", label: "Price: low to high" },
    { value: "price-desc", label: "Price: high to low" },
    { value: "name", label: "Name: A–Z" },
];

const EMPTY = {
    source: "auto",
    filter: {
        categories: [], isFeatured: false, onSale: false, inStock: false,
        priceMin: null, priceMax: null, createdWithinDays: null, meta: [],
    },
    sort: "newest",
    limit: 8,
    productIds: [],
};

export default function ProductQueryBuilder({ value, onChange }) {
    const query = value || EMPTY;
    const filter = query.filter || EMPTY.filter;

    const [categories, setCategories] = useState([]);
    const [metaFields, setMetaFields] = useState([]);
    const [preview, setPreview] = useState({ total: null, products: [], loading: false });

    // Manual-pick state
    const [search, setSearch] = useState("");
    const [results, setResults] = useState([]);
    const [picked, setPicked] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const [cats, templates] = await Promise.all([
                    fetch("/api/admin/categories?limit=100", { credentials: "include" }).then(r => r.json()),
                    fetch("/api/admin/meta-templates", { credentials: "include" }).then(r => r.json()),
                ]);
                if (cats.success) setCategories(cats.categories || []);
                if (templates.success) {
                    // Only fields explicitly marked filterable can be queried,
                    // which is also what the storefront facets use.
                    const seen = new Map();
                    for (const template of templates.templates || []) {
                        for (const field of template.fields || []) {
                            if (field.filterable && !seen.has(field.key)) seen.set(field.key, field);
                        }
                    }
                    setMetaFields([...seen.values()]);
                }
            } catch {
                // Non-fatal — the builder still works without these lists.
            }
        })();
    }, []);

    const set = (patch) => onChange({ ...query, ...patch });
    const setFilter = (patch) => onChange({ ...query, filter: { ...filter, ...patch } });

    // Debounced so dragging a price field does not fire a request per keystroke.
    const timer = useRef(null);
    const runPreview = useCallback(() => {
        clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
            setPreview(p => ({ ...p, loading: true }));
            try {
                const res = await fetch("/api/admin/product-query", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ query }),
                });
                const data = await res.json();
                if (data.success) setPreview({ total: data.total, products: data.products, loading: false });
                else setPreview({ total: 0, products: [], loading: false });
            } catch {
                setPreview({ total: null, products: [], loading: false });
            }
        }, 350);
    }, [query]);

    useEffect(() => {
        runPreview();
        return () => clearTimeout(timer.current);
    }, [runPreview]);

    // Keep the picked-product cards in step with the stored id list.
    useEffect(() => {
        if (query.source !== "manual") return;
        const ids = query.productIds || [];
        if (!ids.length) return setPicked([]);
        if (picked.length === ids.length && picked.every(p => ids.includes(String(p._id)))) return;

        (async () => {
            const res = await fetch("/api/admin/product-query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ query: { source: "manual", productIds: ids, limit: 48 }, sample: 12 }),
            });
            const data = await res.json();
            if (data.success) setPicked(data.products);
        })();
    }, [query.source, query.productIds]); // eslint-disable-line react-hooks/exhaustive-deps

    const searchProducts = async (term) => {
        setSearch(term);
        if (term.trim().length < 2) return setResults([]);
        const res = await fetch(`/api/admin/products?search=${encodeURIComponent(term)}&limit=8`, {
            credentials: "include",
        });
        const data = await res.json();
        if (data.success) setResults(data.products || []);
    };

    const toggleCategory = (id) => {
        const current = filter.categories || [];
        setFilter({
            categories: current.includes(id) ? current.filter(c => c !== id) : [...current, id],
        });
    };

    return (
        <div className="border border-gray-200 rounded-xl bg-gray-50/60 p-3 space-y-3">
            {/* Source toggle */}
            <div className="flex gap-1.5 p-1 bg-gray-100 rounded-lg">
                {[
                    { value: "auto", label: "By filter" },
                    { value: "manual", label: "Hand-picked" },
                ].map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => set({ source: option.value })}
                        className={`flex-1 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                            query.source === option.value
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {query.source === "manual" ? (
                <>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => searchProducts(e.target.value)}
                            placeholder="Search products to add..."
                            className="input-admin pl-9"
                        />
                    </div>

                    {results.length > 0 && (
                        <div className="border border-gray-200 rounded-lg bg-white max-h-48 overflow-y-auto">
                            {results.map((product) => (
                                <button
                                    key={product._id}
                                    type="button"
                                    onClick={() => {
                                        const ids = query.productIds || [];
                                        if (ids.includes(String(product._id))) return;
                                        set({ productIds: [...ids, String(product._id)] });
                                        setSearch("");
                                        setResults([]);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left"
                                >
                                    {product.images?.[0] && (
                                        <img src={product.images[0]} alt="" className="w-8 h-8 rounded object-cover" />
                                    )}
                                    <span className="text-sm text-gray-800 truncate">{product.name}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        {picked.map((product, index) => (
                            <div
                                key={product._id}
                                className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5"
                            >
                                <span className="text-[11px] text-gray-400 w-4">{index + 1}</span>
                                {product.image && (
                                    <img src={product.image} alt="" className="w-7 h-7 rounded object-cover" />
                                )}
                                <span className="text-sm text-gray-800 truncate flex-1">{product.name}</span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        set({
                                            productIds: (query.productIds || []).filter(
                                                id => String(id) !== String(product._id)
                                            ),
                                        })
                                    }
                                    className="p-1 text-gray-400 hover:text-red-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                        {picked.length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-3">
                                No products picked yet
                            </p>
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* Categories */}
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                            Categories
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {categories.map((category) => {
                                const active = (filter.categories || []).includes(String(category._id));
                                return (
                                    <button
                                        key={category._id}
                                        type="button"
                                        onClick={() => toggleCategory(String(category._id))}
                                        className={`px-2.5 py-1 rounded-full text-[13px] border transition-colors ${
                                            active
                                                ? "bg-blue-600 text-white border-blue-600"
                                                : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                                        }`}
                                    >
                                        {category.name}
                                    </button>
                                );
                            })}
                            {categories.length === 0 && (
                                <span className="text-sm text-gray-400">All categories</span>
                            )}
                        </div>
                    </div>

                    {/* Flags */}
                    <div className="flex flex-wrap gap-3">
                        {[
                            { key: "isFeatured", label: "Featured only" },
                            { key: "onSale", label: "On sale" },
                            { key: "inStock", label: "In stock" },
                        ].map((flag) => (
                            <label key={flag.key} className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={!!filter[flag.key]}
                                    onChange={(e) => setFilter({ [flag.key]: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                />
                                <span className="text-sm text-gray-700">{flag.label}</span>
                            </label>
                        ))}
                    </div>

                    {/* Price + recency */}
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Min ₹</p>
                            <input
                                type="number"
                                value={filter.priceMin ?? ""}
                                onChange={(e) => setFilter({ priceMin: e.target.value === "" ? null : Number(e.target.value) })}
                                className="input-admin"
                            />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Max ₹</p>
                            <input
                                type="number"
                                value={filter.priceMax ?? ""}
                                onChange={(e) => setFilter({ priceMax: e.target.value === "" ? null : Number(e.target.value) })}
                                className="input-admin"
                            />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Added in (days)</p>
                            <input
                                type="number"
                                value={filter.createdWithinDays ?? ""}
                                onChange={(e) => setFilter({ createdWithinDays: e.target.value === "" ? null : Number(e.target.value) })}
                                className="input-admin"
                            />
                        </div>
                    </div>

                    {/* Custom field conditions */}
                    {metaFields.length > 0 && (
                        <MetaConditions
                            fields={metaFields}
                            conditions={filter.meta || []}
                            onChange={(meta) => setFilter({ meta })}
                        />
                    )}

                    {/* Sort + limit */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Sort by</p>
                            <select
                                value={query.sort || "newest"}
                                onChange={(e) => set({ sort: e.target.value })}
                                className="input-admin"
                            >
                                {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">How many</p>
                            <input
                                type="number"
                                min={1}
                                max={48}
                                value={query.limit ?? 8}
                                onChange={(e) => set({ limit: Number(e.target.value) })}
                                className="input-admin"
                            />
                        </div>
                    </div>
                </>
            )}

            {/* Live preview — the point of the whole component */}
            <div className="border-t border-gray-200 pt-2.5">
                <div className="flex items-center gap-2 mb-2">
                    {preview.loading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                    ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    )}
                    <p className="text-[13px] text-gray-600">
                        {preview.total === null
                            ? "Checking..."
                            : <>Matches <strong className="text-gray-900">{preview.total}</strong> product{preview.total === 1 ? "" : "s"}</>}
                        {preview.total > 0 && query.source === "auto" && (
                            <span className="text-gray-400">
                                {" "}· showing {Math.min(preview.total, query.limit || 8)}
                            </span>
                        )}
                    </p>
                </div>

                {preview.products.length > 0 && (
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {preview.products.map((product) => (
                            <div key={product._id} className="shrink-0 w-14" title={product.name}>
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt=""
                                        className="w-14 h-14 rounded-md object-cover border border-gray-200"
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-md bg-gray-100 border border-gray-200" />
                                )}
                                <p className="text-[9px] text-gray-500 truncate mt-0.5">{product.name}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/** Conditions on custom product fields, e.g. spice_level > 3. */
function MetaConditions({ fields, conditions, onChange }) {
    const OPS = [
        { value: "eq", label: "is" },
        { value: "ne", label: "is not" },
        { value: "gt", label: ">" },
        { value: "lt", label: "<" },
        { value: "exists", label: "has any value" },
    ];

    const update = (index, patch) => {
        const next = [...conditions];
        next[index] = { ...next[index], ...patch };
        onChange(next);
    };

    return (
        <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Custom field conditions
            </p>

            <div className="space-y-1.5">
                {conditions.map((condition, index) => {
                    const field = fields.find(f => f.key === condition.key);
                    return (
                        <div key={index} className="flex gap-1.5">
                            <select
                                value={condition.key || ""}
                                onChange={(e) => update(index, { key: e.target.value, value: "" })}
                                className="input-admin flex-1"
                            >
                                <option value="">Pick a field</option>
                                {fields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                            </select>

                            <select
                                value={condition.op || "eq"}
                                onChange={(e) => update(index, { op: e.target.value })}
                                className="input-admin w-28"
                            >
                                {OPS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>

                            {condition.op !== "exists" && (
                                field?.options?.length ? (
                                    <select
                                        value={condition.value ?? ""}
                                        onChange={(e) => update(index, { value: e.target.value })}
                                        className="input-admin flex-1"
                                    >
                                        <option value="">—</option>
                                        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                ) : (
                                    <input
                                        value={condition.value ?? ""}
                                        onChange={(e) => update(index, { value: e.target.value })}
                                        placeholder="value"
                                        className="input-admin flex-1"
                                    />
                                )
                            )}

                            <button
                                type="button"
                                onClick={() => onChange(conditions.filter((_, i) => i !== index))}
                                className="p-2 text-gray-400 hover:text-red-600 shrink-0"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    );
                })}
            </div>

            <button
                type="button"
                onClick={() => onChange([...conditions, { key: "", op: "eq", value: "" }])}
                className="mt-1.5 text-[13px] font-semibold text-blue-600 hover:text-blue-700"
            >
                + Add condition
            </button>
        </div>
    );
}
