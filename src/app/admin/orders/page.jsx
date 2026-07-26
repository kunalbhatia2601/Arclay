"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ShoppingBag, 
    Search, 
    Filter, 
    ChevronLeft, 
    ChevronRight, 
    Calendar, 
    User as UserIcon, 
    CreditCard, 
    ExternalLink,
    RefreshCw,
    XCircle,
    CheckCircle2,
    Truck,
    Package,
    Clock
} from "lucide-react";

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

const statusConfig = {
    pending: { color: "bg-amber-50 text-amber-600 border-amber-200/50", icon: Clock, label: "Pending Approval" },
    confirmed: { color: "bg-[#869661]/10 text-[#4A5D23] border-[#869661]/20", icon: CheckCircle2, label: "Confirmed" },
    processing: { color: "bg-blue-50 text-blue-600 border-blue-200/50", icon: RefreshCw, label: "Processing" },
    shipped: { color: "bg-indigo-50 text-indigo-600 border-indigo-200/50", icon: Truck, label: "Shipped" },
    delivered: { color: "bg-emerald-50 text-emerald-600 border-emerald-200/50", icon: Package, label: "Delivered" },
    cancelled: { color: "bg-red-50 text-red-600 border-red-200/50", icon: XCircle, label: "Cancelled" }
};

const paymentStatusConfig = {
    pending: { color: "text-amber-500", label: "Unpaid" },
    completed: { color: "text-emerald-600", label: "Paid" },
    failed: { color: "text-red-500", label: "Failed" },
    refunded: { color: "text-gray-500", label: "Refunded" }
};

export default function AdminOrders() {
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        orderStatus: '',
        paymentStatus: '',
        search: ''
    });

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

    // POS orders have no user account, so fall back to the name captured at the
    // counter and stored on the order itself.
    const getCustomerName = (order) =>
        order.user?.name || order.shippingAddress?.fullName || "Walk-in Customer";

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-10"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <h1 className="font-serif text-[42px] font-bold text-[#2A2F25] leading-tight mb-2">
                        Orders
                    </h1>
                    <p className="text-[#767B71] font-medium flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-[#869661]" />
                        Management panel for all customer transactions
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchOrders()}
                        className="p-4 bg-white border border-[#ECE8E0] text-[#767B71] rounded-2xl hover:text-[#869661] hover:border-[#869661] transition-all shadow-sm active:scale-95"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Premium Filters Section */}
            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] p-6 border border-[#ECE8E0]/60 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <div className="md:col-span-1 lg:col-span-2 relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#767B71]" />
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                            placeholder="Find by Order ID, Name, or Email..."
                            className="w-full pl-14 pr-6 py-4 bg-white/50 border-none rounded-2xl text-[15px] font-medium text-[#2A2F25] placeholder:text-[#767B71]/50 focus:ring-2 focus:ring-[#869661]/20 transition-all shadow-inner"
                        />
                    </div>
                    
                    <div className="relative">
                        <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#869661]" />
                        <select
                            value={filters.orderStatus}
                            onChange={(e) => setFilters({ ...filters, orderStatus: e.target.value, page: 1 })}
                            className="w-full pl-12 pr-6 py-4 bg-white/50 border-none rounded-2xl text-[14px] font-bold text-[#2A2F25] appearance-none focus:ring-2 focus:ring-[#869661]/20 transition-all cursor-pointer shadow-inner"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <button
                        onClick={() => setFilters({ page: 1, limit: 10, orderStatus: '', paymentStatus: '', search: '' })}
                        className="px-6 py-4 bg-[#2A2F25] text-white rounded-2xl text-[13px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-black/10 active:scale-95"
                    >
                        Reset Views
                    </button>
                </div>
            </div>

            {/* Orders Table Container */}
            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-[#ECE8E0]/60 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-96">
                        <div className="w-12 h-12 border-4 border-[#869661] border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-[#767B71] font-medium">Fetching orders...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-24 px-6">
                        <div className="w-20 h-20 bg-gray-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="font-serif text-2xl font-bold text-[#2A2F25] mb-2">No results found</h3>
                        <p className="text-[#767B71] max-w-sm mx-auto">We couldn't find any orders matching your current filters.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-[#ECE8E0]/60">
                                    <th className="text-left px-8 py-6 text-[11px] font-bold text-[#869661] uppercase tracking-[0.2em]">ID & Date</th>
                                    <th className="text-left px-8 py-6 text-[11px] font-bold text-[#869661] uppercase tracking-[0.2em]">Customer</th>
                                    <th className="text-left px-8 py-6 text-[11px] font-bold text-[#869661] uppercase tracking-[0.2em]">Financials</th>
                                    <th className="text-left px-8 py-6 text-[11px] font-bold text-[#869661] uppercase tracking-[0.2em]">Order Phase</th>
                                    <th className="text-left px-8 py-6 text-[11px] font-bold text-[#869661] uppercase tracking-[0.2em]">Payment</th>
                                    <th className="text-right px-8 py-6 text-[11px] font-bold text-[#869661] uppercase tracking-[0.2em]">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#ECE8E0]/40">
                                <AnimatePresence mode="popLayout">
                                    {orders.map((order, index) => {
                                        const status = statusConfig[order.orderStatus] || statusConfig.pending;
                                        const StatusIcon = status.icon;
                                        const payment = paymentStatusConfig[order.paymentStatus] || paymentStatusConfig.pending;

                                        return (
                                            <motion.tr 
                                                key={order._id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="group hover:bg-[#869661]/5 transition-colors"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-mono text-[14px] font-bold text-[#2A2F25] tracking-tight mb-1">
                                                            #{order._id.slice(-8).toUpperCase()}
                                                        </span>
                                                        <span className="flex items-center gap-1.5 text-[12px] text-[#767B71] font-bold uppercase tracking-wider">
                                                            <Calendar className="w-3 h-3" />
                                                            {formatDate(order.createdAt)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-[#869661]/10 flex items-center justify-center text-[#4A5D23] font-black group-hover:bg-[#869661] group-hover:text-white transition-all">
                                                            {getCustomerName(order)?.[0]?.toUpperCase() || "?"}
                                                        </div>
                                                        <div className="max-w-[150px]">
                                                            <div className="font-serif text-[16px] font-bold text-[#2A2F25] truncate leading-tight mb-0.5">
                                                                {getCustomerName(order)}
                                                            </div>
                                                            <div className="text-[12px] text-[#767B71] truncate font-medium">
                                                                {order.user?.email || order.shippingAddress?.phone || "—"}
                                                            </div>
                                                            {order.source === "pos" && (
                                                                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-[#4A5D23]/10 text-[#4A5D23] rounded-md text-[10px] font-bold uppercase tracking-wider">
                                                                    Counter Sale
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div>
                                                        <p className="text-[18px] font-black text-[#2A2F25]">
                                                            ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </p>
                                                        {order.couponCode && (
                                                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-[#4A5D23]/5 text-[#4A5D23] rounded-md text-[10px] font-bold border border-[#4A5D23]/10">
                                                                {order.couponCode}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-[12px] font-bold uppercase tracking-widest ${status.color}`}>
                                                        <StatusIcon className="w-4 h-4" />
                                                        {status.label}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full animate-pulse ${payment.color.replace('text-', 'bg-')}`} />
                                                        <span className={`text-[13px] font-bold uppercase tracking-widest ${payment.color}`}>
                                                            {payment.label}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <Link
                                                        href={`/admin/orders/${order._id}`}
                                                        className="inline-flex items-center justify-center p-3 text-[#767B71] hover:text-[#869661] hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-[#ECE8E0]"
                                                        title="Examine Order"
                                                    >
                                                        <ExternalLink className="w-5 h-5" />
                                                    </Link>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Footer */}
                {pagination && pagination.pages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-8 py-8 border-t border-[#ECE8E0]/60 bg-white/30 backdrop-blur-sm gap-6">
                        <div className="flex flex-col">
                            <p className="text-[14px] font-bold text-[#2A2F25]">
                                Showing page {pagination.page} <span className="text-[#767B71] font-medium">of {pagination.pages}</span>
                            </p>
                            <p className="text-[12px] text-[#767B71] mt-1 font-medium italic">
                                Total of {pagination.total} processed orders
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                disabled={filters.page === 1}
                                className="p-4 rounded-2xl border border-[#ECE8E0] text-[#767B71] hover:bg-white hover:text-[#869661] hover:border-[#869661] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#767B71] transition-all group shadow-sm"
                            >
                                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                disabled={filters.page >= pagination.pages}
                                className="p-4 rounded-2xl border border-[#ECE8E0] text-[#767B71] hover:bg-white hover:text-[#869661] hover:border-[#869661] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#767B71] transition-all group shadow-sm"
                            >
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
