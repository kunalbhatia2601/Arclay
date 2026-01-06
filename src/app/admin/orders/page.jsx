"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-purple-100 text-purple-800",
    shipped: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800"
};

const paymentStatusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800"
};

export default function AdminOrders() {
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [filters, setFilters] = useState({
        page: 1,
        limit: 20,
        orderStatus: '',
        paymentStatus: '',
        search: ''
    });

    // Debounce search value
    const debouncedSearch = useDebounce(filters.search, 400);

    useEffect(() => {
        fetchOrders();
    }, [filters.page, filters.orderStatus, filters.paymentStatus, debouncedSearch]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('page', filters.page);
            params.append('limit', filters.limit);
            if (filters.orderStatus) params.append('orderStatus', filters.orderStatus);
            if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
            if (debouncedSearch) params.append('search', debouncedSearch);

            const res = await fetch(`/api/admin/orders?${params}`, {
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                setOrders(data.orders);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="font-serif text-3xl font-bold text-foreground">
                    Orders
                </h1>
                <p className="text-muted-foreground mt-1">
                    Manage all customer orders
                </p>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Search Order ID</label>
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                            placeholder="Enter order ID"
                            className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Order Status</label>
                        <select
                            value={filters.orderStatus}
                            onChange={(e) => setFilters({ ...filters, orderStatus: e.target.value, page: 1 })}
                            className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">All</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Payment Status</label>
                        <select
                            value={filters.paymentStatus}
                            onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value, page: 1 })}
                            className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">All</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => setFilters({ page: 1, limit: 20, orderStatus: '', paymentStatus: '', search: '' })}
                            className="w-full px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg font-medium transition-all"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No orders found</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted border-b border-border">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Order ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Total
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Order Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Payment
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {orders.map((order) => (
                                        <tr key={order._id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono text-sm">{order._id.slice(-8)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium">{order.user?.name}</div>
                                                    <div className="text-sm text-muted-foreground">{order.user?.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {formatDate(order.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium">
                                                ₹{order.totalAmount.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.orderStatus]}`}>
                                                    {order.orderStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColors[order.paymentStatus]}`}>
                                                    {order.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link
                                                    href={`/admin/orders/${order._id}`}
                                                    className="text-primary hover:underline text-sm font-medium"
                                                >
                                                    View →
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.pages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                                <div className="text-sm text-muted-foreground">
                                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                        disabled={filters.page === 1}
                                        className="px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                        disabled={filters.page >= pagination.pages}
                                        className="px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
