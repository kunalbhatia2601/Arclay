"use client";

import { useState, useEffect, useCallback } from "react";

const timeOptions = [
    { value: 0, label: "All" },
    { value: 12, label: "12 Hours" },
    { value: 24, label: "24 Hours" },
    { value: 36, label: "36 Hours" },
    { value: 48, label: "48 Hours" },
    { value: 72, label: "72 Hours" },
];

export default function AdminCartsPage() {
    const [carts, setCarts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState({});
    const [hours, setHours] = useState(24);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    const fetchCarts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/admin/carts?page=${pagination.page}&hours=${hours}`,
                { credentials: "include" }
            );
            const data = await res.json();
            if (data.success) {
                setCarts(data.carts);
                setPagination(prev => ({
                    ...prev,
                    pages: data.pagination.pages,
                    total: data.pagination.total
                }));
            }
        } catch (error) {
            console.error("Failed to fetch carts:", error);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, hours]);

    useEffect(() => {
        fetchCarts();
    }, [fetchCarts]);

    const handleSendReminder = async (cartId) => {
        setSending(prev => ({ ...prev, [cartId]: true }));
        try {
            const res = await fetch("/api/admin/carts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ cartId }),
            });
            const data = await res.json();
            if (data.success) {
                alert("Reminder email sent successfully!");
                // Update local state
                setCarts(prev => prev.map(cart =>
                    cart._id === cartId
                        ? {
                            ...cart,
                            emails_sent_count: data.emails_sent_count,
                            last_email_sent_at: data.last_email_sent_at
                        }
                        : cart
                ));
            } else {
                alert(data.message || "Failed to send email");
            }
        } catch (error) {
            console.error("Send reminder error:", error);
            alert("Failed to send reminder email");
        } finally {
            setSending(prev => ({ ...prev, [cartId]: false }));
        }
    };

    const formatDate = (date) => {
        if (!date) return "Never";
        return new Date(date).toLocaleString();
    };

    const getTimeSince = (date) => {
        if (!date) return "";
        const diff = Date.now() - new Date(date).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        if (days > 0) return `${days}d ${hours % 24}h ago`;
        return `${hours}h ago`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl font-bold text-foreground">
                        Abandoned Carts
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        View and remind users about their abandoned carts
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Cart inactive for:</label>
                    <select
                        value={hours}
                        onChange={(e) => {
                            setHours(parseInt(e.target.value));
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                        className="px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        {timeOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-muted-foreground text-sm">Total Abandoned Carts</p>
                        <p className="text-3xl font-bold text-foreground">{pagination.total}</p>
                    </div>
                    <div className="text-5xl">🛒</div>
                </div>
            </div>

            {/* Carts Table */}
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : carts.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-5xl mb-4">✨</p>
                        <p className="text-muted-foreground">No abandoned carts found for the selected time period</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">User</th>
                                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Items</th>
                                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Cart Value</th>
                                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Last Updated</th>
                                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Emails Sent</th>
                                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {carts.map(cart => (
                                    <tr key={cart._id} className="hover:bg-muted/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className="font-medium">{cart.user?.name || 'Unknown'}</p>
                                                <p className="text-sm text-muted-foreground">{cart.user?.email}</p>
                                                {cart.user?.phone && (
                                                    <p className="text-sm text-muted-foreground">{cart.user.phone}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="space-y-1">
                                                {cart.items.slice(0, 2).map((item, i) => (
                                                    <div key={i} className="text-sm">
                                                        <span className="font-medium">{item.productName || 'Product'}</span>
                                                        <span className="text-muted-foreground"> × {item.quantity}</span>
                                                    </div>
                                                ))}
                                                {cart.items.length > 2 && (
                                                    <p className="text-sm text-muted-foreground">
                                                        +{cart.items.length - 2} more items
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="font-bold text-primary">
                                                ₹{cart.totalValue?.toLocaleString() || 0}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className="text-sm">{formatDate(cart.updatedAt)}</p>
                                                <p className="text-xs text-muted-foreground">{getTimeSince(cart.updatedAt)}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className="font-medium">{cart.emails_sent_count || 0}</p>
                                                {cart.last_email_sent_at && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Last: {formatDate(cart.last_email_sent_at)}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <button
                                                onClick={() => handleSendReminder(cart._id)}
                                                disabled={sending[cart._id]}
                                                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {sending[cart._id] ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        Sending...
                                                    </>
                                                ) : (
                                                    <>📧 Send Reminder</>
                                                )}
                                            </button>
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
                            Page {pagination.page} of {pagination.pages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="px-4 py-2 bg-muted hover:bg-muted/70 rounded-lg disabled:opacity-50 transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page === pagination.pages}
                                className="px-4 py-2 bg-muted hover:bg-muted/70 rounded-lg disabled:opacity-50 transition-colors"
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
