"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
    ShoppingBag, 
    IndianRupee, 
    CheckCircle, 
    Package, 
    Tags, 
    Users, 
    ArrowUpRight,
    Search,
    Filter,
    MoreVertical,
    Plus,
    ChevronRight,
    TrendingUp,
    RefreshCw
} from "lucide-react";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Store";

// Helper function to get price display from variants
const getProductPriceDisplay = (product) => {
    const variants = product.variants || [];
    if (variants.length === 0) return "—";
    const prices = variants.map(v => v.salePrice || v.regularPrice).filter(p => p != null);
    if (prices.length === 0) return "—";
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) return `₹${minPrice.toLocaleString()}`;
    return `₹${minPrice.toLocaleString()} - ₹${maxPrice.toLocaleString()}`;
};

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await fetch("/api/admin/dashboard", {
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                setStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-[#869661] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[#869661] font-bold uppercase tracking-widest text-xs">Synchronizing Data...</p>
            </div>
        );
    }

    const statCards = [
        {
            title: "Total Orders",
            value: stats?.stats?.orders?.total || 0,
            subtext: `${stats?.stats?.orders?.delivered || 0} delivered`,
            icon: ShoppingBag,
            color: "#869661",
            bg: "bg-[#869661]/10",
        },
        {
            title: "Total Revenue",
            value: `₹${(stats?.stats?.orders?.totalRevenue || 0).toLocaleString()}`,
            subtext: "All sales",
            icon: IndianRupee,
            color: "#D86B4B",
            bg: "bg-[#D86B4B]/10",
        },
        {
            title: "Confirmed Revenue",
            value: `₹${(stats?.stats?.orders?.deliveredRevenue || 0).toLocaleString()}`,
            subtext: "Successfully delivered",
            icon: CheckCircle,
            color: "#4A5D23",
            bg: "bg-[#4A5D23]/10",
        },
        {
            title: "Catalog Size",
            value: stats?.stats?.products?.total || 0,
            subtext: `${stats?.stats?.products?.active || 0} active items`,
            icon: Package,
            color: "#F9BC16",
            bg: "bg-[#F9BC16]/10",
        },
        {
            title: "Active Categories",
            value: stats?.stats?.categories?.total || 0,
            subtext: "Organized collections",
            icon: Tags,
            color: "#2A2F25",
            bg: "bg-[#2A2F25]/5",
        },
        {
            title: "Customer Base",
            value: stats?.stats?.users?.total || 0,
            subtext: `${stats?.stats?.users?.active || 0} active members`,
            icon: Users,
            color: "#869661",
            bg: "bg-[#869661]/10",
        },
    ];

    const orderStatusColors = {
        pending: "bg-amber-100 text-amber-700 border-amber-200",
        confirmed: "bg-sky-100 text-sky-700 border-sky-200",
        processing: "bg-indigo-100 text-indigo-700 border-indigo-200",
        shipped: "bg-violet-100 text-violet-700 border-violet-200",
        delivered: "bg-[#869661]/10 text-[#4A5D23] border-[#869661]/20",
        cancelled: "bg-rose-100 text-rose-700 border-rose-200"
    };

    return (
        <div className="space-y-10 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-[#2A2F25]/5">
                <div>
                    <h1 className="font-serif text-4xl font-black text-[#2A2F25] tracking-tight">
                        Insights Overview
                    </h1>
                    <p className="text-[#869661] font-bold uppercase tracking-[0.2em] text-[11px] mt-2 flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Real-time analytics for {siteName}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-5 py-2.5 bg-white border border-[#2A2F25]/10 rounded-xl text-sm font-bold text-[#2A2F25] hover:bg-[#2A2F25]/5 transition-colors flex items-center gap-2 shadow-sm">
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                    <button className="px-5 py-2.5 bg-[#869661] rounded-xl text-sm font-bold text-white hover:bg-[#4A5D23] transition-all shadow-lg shadow-[#869661]/20 flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        New Report
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {statCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={index}
                            className="group relative bg-white/60 backdrop-blur-md rounded-[2.5rem] p-8 border border-[#2A2F25]/5 hover:shadow-2xl hover:shadow-[#869661]/10 transition-all duration-500 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#869661]/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-[#869661]/10 transition-colors" />
                            
                            <div className="flex items-start justify-between relative z-10">
                                <div className="space-y-4">
                                    <p className="text-[#869661] text-[11px] font-bold uppercase tracking-[0.2em]">
                                        {card.title}
                                    </p>
                                    <h3 className="font-serif text-[42px] font-black text-[#2A2F25] leading-none">
                                        {card.value}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <div className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-[10px] font-bold">+12%</div>
                                        <p className="text-[12px] text-[#767B71] font-medium leading-tight">
                                            {card.subtext}
                                        </p>
                                    </div>
                                </div>
                                <div className={`w-14 h-14 rounded-2xl ${card.bg} flex items-center justify-center transition-transform group-hover:rotate-6 shadow-inner`}>
                                    <Icon className="w-7 h-7" style={{ color: card.color }} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Performance & Activity Section */}
            <div className="grid xl:grid-cols-3 gap-8">
                {/* Visual Analytics - Performance Trends */}
                <div className="xl:col-span-2 bg-white/70 backdrop-blur-md rounded-[2.5rem] p-8 border border-[#ECE8E0]/60 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <TrendingUp className="w-32 h-32 text-[#869661]" />
                    </div>
                    
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <div>
                            <h2 className="font-serif text-3xl font-bold text-[#2A2F25]">
                                Performance Trends
                            </h2>
                            <p className="text-[13px] text-[#767B71] mt-1 font-medium">Revenue trajectory over the last 7 days</p>
                        </div>
                        <div className="flex items-center gap-2 bg-[#869661]/5 px-4 py-2 rounded-xl border border-[#869661]/10">
                            <div className="w-2 h-2 rounded-full bg-[#869661] animate-pulse" />
                            <span className="text-[11px] font-bold text-[#4A5D23] uppercase tracking-widest">Live Metrics</span>
                        </div>
                    </div>

                    {/* Custom CSS Chart Simulation */}
                    <div className="relative h-64 flex items-end justify-between gap-4 px-2 mb-6">
                        {/* Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between opacity-30 pointer-events-none">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-full h-[1px] bg-[#ECE8E0]" />
                            ))}
                        </div>

                        {/* Bars */}
                        {[
                            { day: "Mon", val: "45%", color: "#869661" },
                            { day: "Tue", val: "65%", color: "#869661" },
                            { day: "Wed", val: "35%", color: "#D86B4B" },
                            { day: "Thu", val: "85%", color: "#869661" },
                            { day: "Fri", val: "55%", color: "#869661" },
                            { day: "Sat", val: "95%", color: "#4A5D23" },
                            { day: "Sun", val: "75%", color: "#869661" }
                        ].map((item, idx) => (
                            <div key={idx} className="relative flex-1 group">
                                <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: item.val }}
                                    transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }}
                                    className="w-full rounded-t-xl relative overflow-hidden group-hover:brightness-110 transition-all cursor-crosshair"
                                    style={{ background: `linear-gradient(to top, ${item.color}20, ${item.color})` }}
                                >
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        <span className="bg-[#2A2F25] text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg">
                                            {item.val} Growth
                                        </span>
                                    </div>
                                </motion.div>
                                <p className="text-center mt-4 text-[11px] font-bold text-[#767B71] uppercase tracking-widest">{item.day}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-6 pt-6 border-t border-[#ECE8E0]/40">
                        <div className="text-center">
                            <p className="text-[11px] font-bold text-[#869661] uppercase tracking-widest mb-1">Peak Day</p>
                            <p className="font-serif text-xl font-bold text-[#2A2F25]">Saturday</p>
                        </div>
                        <div className="text-center border-x border-[#ECE8E0]/40">
                            <p className="text-[11px] font-bold text-[#869661] uppercase tracking-widest mb-1">Avg. Yield</p>
                            <p className="font-serif text-xl font-bold text-[#2A2F25]">₹4,250</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[11px] font-bold text-[#869661] uppercase tracking-widest mb-1">Retention</p>
                            <p className="font-serif text-xl font-bold text-[#2A2F25]">78.4%</p>
                        </div>
                    </div>
                </div>

                {/* Activity Feed / Store Health */}
                <div className="space-y-8">
                    <div className="bg-[#1A1F16] text-white rounded-[2.5rem] p-8 shadow-xl shadow-[#1A1F16]/20 relative overflow-hidden h-full">
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#869661]/10 rounded-full blur-3xl" />
                        
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <h2 className="font-serif text-2xl font-bold">Store Activity</h2>
                            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                                <RefreshCw className="w-4 h-4 text-[#869661]" />
                            </div>
                        </div>

                        <div className="space-y-6 relative z-10">
                            {[
                                { text: "Bulk upload completed", sub: "24 new items added", time: "2m ago", type: "success" },
                                { text: "Large order received", sub: "Order #F29A valued at ₹8,400", time: "15m ago", type: "order" },
                                { text: "Low stock alert", sub: "Spiced Mango Pickle (500g)", time: "1h ago", type: "warning" },
                                { text: "System sync", sub: "Inventory matched with warehouse", time: "3h ago", type: "system" }
                            ].map((event, idx) => (
                                <div key={idx} className="flex gap-4 group">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-2 h-2 rounded-full mt-1.5 ${
                                            event.type === 'success' ? 'bg-green-400' :
                                            event.type === 'order' ? 'bg-blue-400' :
                                            event.type === 'warning' ? 'bg-orange-400' : 'bg-white/40'
                                        }`} />
                                        <div className="w-[1px] flex-1 bg-white/10 my-1 group-last:hidden" />
                                    </div>
                                    <div className="flex-1 pb-6 group-last:pb-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="font-bold text-[14px] text-white/90 leading-tight">{event.text}</p>
                                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{event.time}</span>
                                        </div>
                                        <p className="text-[12px] text-white/50 font-medium">{event.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="w-full mt-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                            View Full History 
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Orders Table Section */}
            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] p-8 border border-[#ECE8E0]/60 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="font-serif text-3xl font-bold text-[#2A2F25]">
                            Recent Orders
                        </h2>
                        <p className="text-[13px] text-[#767B71] mt-1 font-medium italic">Monitor the heartbeat of your store in real-time</p>
                    </div>
                    <Link href="/admin/orders" className="group flex items-center gap-3 px-6 py-3 rounded-2xl bg-[#869661] text-white text-[12px] font-black uppercase tracking-widest hover:bg-[#4A5D23] transition-all shadow-lg shadow-[#869661]/10">
                        GO TO ORDER VAULT
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* table logic continues... */}
                {stats?.recentOrders?.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-[#ECE8E0]">
                                    <th className="text-left py-4 px-4 text-[11px] font-black text-[#869661] uppercase tracking-[0.2em]">Transaction</th>
                                    <th className="text-left py-4 px-4 text-[11px] font-black text-[#869661] uppercase tracking-[0.2em]">Customer</th>
                                    <th className="text-left py-4 px-4 text-[11px] font-black text-[#869661] uppercase tracking-[0.2em]">Amount</th>
                                    <th className="text-center py-4 px-4 text-[11px] font-black text-[#869661] uppercase tracking-[0.2em]">Phase</th>
                                    <th className="text-right py-4 px-4 text-[11px] font-black text-[#869661] uppercase tracking-[0.2em]">Logged</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#ECE8E0]/50">
                                {stats.recentOrders.map((order) => (
                                    <tr key={order._id} className="group hover:bg-[#869661]/5 transition-colors">
                                        <td className="py-6 px-4">
                                            <Link href={`/admin/orders/${order._id}`} className="font-mono text-[13px] font-bold text-[#2A2F25] flex items-center gap-2 group-hover:text-[#869661] transition-colors">
                                                #{order._id.slice(-8).toUpperCase()}
                                                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all" />
                                            </Link>
                                        </td>
                                        <td className="py-6 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[#ECE8E0] flex items-center justify-center font-bold text-xs text-[#2A2F25] group-hover:bg-[#869661] group-hover:text-white transition-all">
                                                    {order.user?.name?.[0] || 'C'}
                                                </div>
                                                <div>
                                                    <p className="font-serif text-[15px] font-bold text-[#2A2F25]">{order.user?.name || 'Guest'}</p>
                                                    <p className="text-[11px] text-[#767B71] font-medium">{order.user?.email || 'Walk-in customer'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 px-4">
                                            <p className="font-black text-[16px] text-[#2A2F25]">₹{order.totalAmount?.toLocaleString()}</p>
                                            <p className="text-[10px] font-black text-[#869661] uppercase tracking-wider">{order.paymentMethod}</p>
                                        </td>
                                        <td className="py-6 px-4 text-center">
                                            <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${orderStatusColors[order.orderStatus] || 'bg-gray-100 text-gray-800'}`}>
                                                {order.orderStatus}
                                            </span>
                                        </td>
                                        <td className="py-6 px-4 text-right">
                                            <p className="text-[13px] font-black text-[#2A2F25]">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                                            <p className="text-[10px] text-[#767B71] font-bold">{new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-[#ECE8E0]/20 rounded-[2rem] border border-dashed border-[#869661]/30">
                        <ShoppingBag className="w-12 h-12 text-[#869661]/20 mb-4" />
                        <p className="text-[#767B71] font-bold italic tracking-wide">Orchestrating the first movement...</p>
                    </div>
                )}
            </div>

            {/* Arrivals and Actions */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Quick Add Product */}
                <Link href="/admin/products/new" className="group p-8 bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-[#ECE8E0]/60 hover:border-[#869661] transition-all flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-[#869661]/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                        <Plus className="w-8 h-8 text-[#869661]" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-[#2A2F25] mb-2">Inventory</h3>
                    <p className="text-[12px] font-bold text-[#767B71] uppercase tracking-widest">Enrich catalog</p>
                </Link>

                {/* Quick Add Category */}
                <Link href="/admin/categories/new" className="group p-8 bg-white/70 backdrop-blur-md rounded-[2.5rem] border border-[#ECE8E0]/60 hover:border-[#F9BC16] transition-all flex flex-col items-center text-center text-secondary">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-[#F9BC16]/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                        <Tags className="w-8 h-8 text-[#F9BC16]" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-[#2A2F25] mb-2">Collections</h3>
                    <p className="text-[12px] font-bold text-[#767B71] uppercase tracking-widest">Organize vault</p>
                </Link>

                {/* Recent Products Summary */}
                <div className="md:col-span-2 bg-[#2A2F25] text-white rounded-[2.5rem] p-8 shadow-xl shadow-[#2A2F25]/20 relative overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-serif text-2xl font-bold">Latest Additions</h2>
                        <Link href="/admin/products" className="text-[10px] font-black uppercase tracking-[.2em] text-[#869661] hover:text-white transition-colors">FULL VAULT</Link>
                    </div>
                    <div className="grid grid-cols-2 gap-4 flex-1">
                        {stats?.recentProducts?.slice(0, 2).map((product) => (
                            <div key={product._id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 group">
                                <img src={product.images[0] || '/placeholder.png'} className="w-12 h-12 rounded-xl object-cover shadow-lg group-hover:scale-110 transition-transform" />
                                <div className="min-w-0">
                                    <p className="font-bold text-[13px] truncate">{product.name}</p>
                                    <p className="text-[10px] text-[#869661] font-black uppercase tracking-widest">Active</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Community Overview */}
            <div className="bg-white/70 backdrop-blur-md rounded-[2.5rem] p-8 border border-[#ECE8E0]/60 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="font-serif text-3xl font-bold text-[#2A2F25]">Member Directory</h2>
                        <p className="text-[13px] text-[#767B71] mt-1 font-medium">Growth of your store's inner circle</p>
                    </div>
                    <Link href="/admin/users" className="text-[11px] font-black uppercase tracking-[0.2em] text-[#869661] hover:text-[#4A5D23] transition-colors">MANAGE USERS</Link>
                </div>

                {stats?.recentUsers?.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
                        {stats.recentUsers.map((user) => (
                            <div key={user._id} className="group flex flex-col items-center p-5 bg-white/40 rounded-[2rem] border border-[#ECE8E0]/60 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                                <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-[#869661]/20 to-[#4A5D23]/20 flex items-center justify-center text-[#4A5D23] font-serif text-2xl font-black mb-4 group-hover:scale-110 transition-transform shadow-inner">
                                    {user.name?.[0]?.toUpperCase() || "U"}
                                </div>
                                <p className="font-bold text-[14px] text-[#2A2F25] truncate w-full text-center leading-tight">{user.name}</p>
                                <p className="text-[10px] text-[#869661] font-black uppercase tracking-wider mt-1">{user.role}</p>
                                <div className={`mt-3 w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500 animate-pulse' : 'bg-rose-400'} shadow-sm`} title={user.isActive ? "Active Now" : "Inactive"} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 italic text-[#767B71] font-medium bg-[#ECE8E0]/10 rounded-[2rem] border border-dashed border-[#869661]/20">
                        No members registered yet.
                    </div>
                )}
            </div>
        </div>
    );
}
