"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Debounce hook
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    // Debounce search value
    const debouncedSearch = useDebounce(search, 400);

    useEffect(() => {
        fetchProducts();
    }, [pagination.page, debouncedSearch]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page,
                limit: 10,
                search: debouncedSearch,
            });
            const res = await fetch(`/api/admin/products?${params}`, {
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                setProducts(data.products);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this product?")) return;

        try {
            const res = await fetch(`/api/admin/products/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                fetchProducts();
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete product");
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            const res = await fetch(`/api/admin/products/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ isActive: !currentStatus }),
            });
            const data = await res.json();
            if (data.success) {
                fetchProducts();
            }
        } catch (error) {
            console.error("Toggle status failed:", error);
        }
    };

    const toggleFeatured = async (id, currentFeatured) => {
        try {
            const res = await fetch(`/api/admin/products/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ isFeatured: !currentFeatured }),
            });
            const data = await res.json();
            if (data.success) {
                setProducts(prev => prev.map(p =>
                    p._id === id ? { ...p, isFeatured: !currentFeatured } : p
                ));
            }
        } catch (error) {
            console.error("Toggle featured failed:", error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl font-bold text-foreground">
                        Products
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your product catalog
                    </p>
                </div>
                <Link href="/admin/products/new">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6">
                        + Add Product
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <div className="bg-card rounded-2xl p-4 border border-border">
                <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPagination({ ...pagination, page: 1 });
                    }}
                    className="w-full sm:w-80 px-4 py-2 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            {/* Products Table */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground mb-4">No products found</p>
                        <Link href="/admin/products/new">
                            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                                Create your first product
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                                        Product
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground hidden md:table-cell">
                                        Category
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                                        Price
                                    </th>
                                    <th className="text-center px-6 py-4 text-sm font-semibold text-foreground">
                                        Featured
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                                        Status
                                    </th>
                                    <th className="text-right px-6 py-4 text-sm font-semibold text-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {products.map((product) => (
                                    <tr key={product._id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center overflow-hidden">
                                                    {product.images?.[0] ? (
                                                        <img
                                                            src={product.images[0]}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-xl">📦</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground line-clamp-1">
                                                        {product.name}
                                                    </p>
                                                    {product.variants?.length > 0 && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {product.variants.length} variant(s)
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <span className="text-muted-foreground text-sm">
                                                {product.category?.name || "—"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                {(() => {
                                                    const variants = product.variants || [];
                                                    if (variants.length === 0) return <span className="text-muted-foreground">—</span>;

                                                    const prices = variants.map(v => v.salePrice || v.regularPrice).filter(p => p != null);
                                                    if (prices.length === 0) return <span className="text-muted-foreground">—</span>;

                                                    const minPrice = Math.min(...prices);
                                                    const maxPrice = Math.max(...prices);
                                                    const totalStock = variants.reduce((acc, v) => acc + (v.stock || 0), 0);

                                                    return (
                                                        <div>
                                                            <span className="font-medium text-foreground">
                                                                {minPrice === maxPrice
                                                                    ? `₹${minPrice.toLocaleString()}`
                                                                    : `₹${minPrice.toLocaleString()} - ₹${maxPrice.toLocaleString()}`
                                                                }
                                                            </span>
                                                            <p className={`text-xs mt-1 ${totalStock > 0 ? 'text-muted-foreground' : 'text-destructive'}`}>
                                                                Stock: {totalStock}
                                                            </p>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => toggleFeatured(product._id, product.isFeatured)}
                                                className="text-2xl transition-transform hover:scale-110"
                                                title={product.isFeatured ? "Remove from featured" : "Add to featured"}
                                            >
                                                {product.isFeatured ? "⭐" : "☆"}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleStatus(product._id, product.isActive)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${product.isActive
                                                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                                                    : "bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20"
                                                    }`}
                                            >
                                                {product.isActive ? "Active" : "Inactive"}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/admin/products/${product._id}/edit`}
                                                    className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(product._id)}
                                                    className="px-3 py-1 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                            Showing {(pagination.page - 1) * 10 + 1} to{" "}
                            {Math.min(pagination.page * 10, pagination.total)} of{" "}
                            {pagination.total}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                disabled={pagination.page === 1}
                                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                disabled={pagination.page === pagination.pages}
                                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
