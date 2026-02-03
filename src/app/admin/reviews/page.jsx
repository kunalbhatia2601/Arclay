"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [statusFilter, setStatusFilter] = useState("");

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page,
                limit: 20
            });
            if (statusFilter) params.set("status", statusFilter);

            const res = await fetch(`/api/admin/reviews?${params}`, {
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                setReviews(data.reviews);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Failed to fetch reviews:", error);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, statusFilter]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const toggleStatus = async (review) => {
        try {
            const res = await fetch(`/api/admin/reviews/${review._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ isActive: !review.isActive })
            });
            const data = await res.json();
            if (data.success) {
                setReviews(prev => prev.map(r =>
                    r._id === review._id ? { ...r, isActive: !review.isActive } : r
                ));
            }
        } catch (error) {
            console.error("Toggle status error:", error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this review?")) return;
        try {
            const res = await fetch(`/api/admin/reviews/${id}`, {
                method: "DELETE",
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                fetchReviews();
            } else {
                toast.error(data.message || "Failed to delete review");
            }
        } catch (error) {
            console.error("Delete review error:", error);
            toast.error("Failed to delete review");
        }
    };

    const renderStars = (count) => {
        return "⭐".repeat(count) + "☆".repeat(5 - count);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl font-bold text-foreground">Reviews</h1>
                    <p className="text-muted-foreground mt-1">Manage product reviews and approvals</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                        className="px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="">All Reviews</option>
                        <option value="active">Active</option>
                        <option value="inactive">Pending Approval</option>
                    </select>
                </div>
            </div>

            {/* Reviews Table */}
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-5xl mb-4">⭐</p>
                        <p className="text-muted-foreground">No reviews found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Product</th>
                                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">User</th>
                                    <th className="text-center py-4 px-6 font-medium text-muted-foreground">Rating</th>
                                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Comment</th>
                                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Status</th>
                                    <th className="text-right py-4 px-6 font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {reviews.map(review => (
                                    <tr key={review._id} className="hover:bg-muted/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-muted rounded-lg overflow-hidden">
                                                    {review.product?.images?.[0] ? (
                                                        <img
                                                            src={review.product.images[0]}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-sm">📦</div>
                                                    )}
                                                </div>
                                                <span className="font-medium line-clamp-1 max-w-[150px]">
                                                    {review.product?.name || "Unknown Product"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className="font-medium">{review.user?.name || "Unknown"}</p>
                                                <p className="text-xs text-muted-foreground">{review.user?.email}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className="text-lg">{renderStars(review.stars)}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="line-clamp-2 max-w-[250px] text-sm text-muted-foreground">
                                                {review.comment}
                                            </p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <button
                                                onClick={() => toggleStatus(review)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${review.isActive
                                                        ? "bg-primary/10 text-primary"
                                                        : "bg-amber-500/10 text-amber-600"
                                                    }`}
                                            >
                                                {review.isActive ? "Active" : "Pending"}
                                            </button>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => toggleStatus(review)}
                                                    className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                >
                                                    {review.isActive ? "Deactivate" : "Approve"}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(review._id)}
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
                    <div className="flex items-center justify-between p-4 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                            Page {pagination.page} of {pagination.pages} ({pagination.total} reviews)
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="px-4 py-2 bg-muted rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/70"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page === pagination.pages}
                                className="px-4 py-2 bg-muted rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/70"
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
