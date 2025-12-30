"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    useEffect(() => {
        fetchCategories();
    }, [pagination.page, search]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page,
                limit: 10,
                search,
            });
            const res = await fetch(`/api/admin/categories?${params}`, {
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                setCategories(data.categories);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this category?")) return;

        try {
            const res = await fetch(`/api/admin/categories/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                fetchCategories();
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete category");
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            const res = await fetch(`/api/admin/categories/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ isActive: !currentStatus }),
            });
            const data = await res.json();
            if (data.success) {
                fetchCategories();
            }
        } catch (error) {
            console.error("Toggle status failed:", error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl font-bold text-foreground">
                        Categories
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your product categories
                    </p>
                </div>
                <Link href="/admin/categories/new">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6">
                        + Add Category
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <div className="bg-card rounded-2xl p-4 border border-border">
                <input
                    type="text"
                    placeholder="Search categories..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPagination({ ...pagination, page: 1 });
                    }}
                    className="w-full sm:w-80 px-4 py-2 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            {/* Categories Table */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground mb-4">No categories found</p>
                        <Link href="/admin/categories/new">
                            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                                Create your first category
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                                        Category
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground hidden md:table-cell">
                                        Description
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
                                {categories.map((category) => (
                                    <tr key={category._id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center text-lg">
                                                    {category.image ? "🖼️" : "🏷️"}
                                                </div>
                                                <span className="font-medium text-foreground">
                                                    {category.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <span className="text-muted-foreground text-sm line-clamp-1">
                                                {category.description || "—"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleStatus(category._id, category.isActive)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${category.isActive
                                                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                                                        : "bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20"
                                                    }`}
                                            >
                                                {category.isActive ? "Active" : "Inactive"}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/admin/categories/${category._id}/edit`}
                                                    className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(category._id)}
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
