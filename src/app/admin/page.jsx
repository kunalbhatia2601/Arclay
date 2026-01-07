"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "ESSVORA";

// Helper function to get price display from variants
const getProductPriceDisplay = (product) => {
    const variants = product.variants || [];
    if (variants.length === 0) return "—";

    // Get all effective prices (sale price if exists, else regular price)
    const prices = variants.map(v => v.salePrice || v.regularPrice).filter(p => p != null);
    if (prices.length === 0) return "—";

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
        return `₹${minPrice.toLocaleString()}`;
    }
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
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const statCards = [
        {
            title: "Total Orders",
            value: stats?.stats?.orders?.total || 0,
            subtext: `${stats?.stats?.orders?.delivered || 0} delivered`,
            icon: "🛍️",
            color: "bg-green-500/10 text-green-600",
        },
        {
            title: "Total Revenue",
            value: `₹${(stats?.stats?.orders?.totalRevenue || 0).toLocaleString()}`,
            subtext: "All orders",
            icon: "💰",
            color: "bg-yellow-500/10 text-yellow-600",
        },
        {
            title: "Confirmed Revenue",
            value: `₹${(stats?.stats?.orders?.deliveredRevenue || 0).toLocaleString()}`,
            subtext: "Delivered orders only",
            icon: "✅",
            color: "bg-emerald-500/10 text-emerald-600",
        },
        {
            title: "Total Products",
            value: stats?.stats?.products?.total || 0,
            subtext: `${stats?.stats?.products?.active || 0} active`,
            icon: "📦",
            color: "bg-primary/10 text-primary",
        },
        {
            title: "Total Categories",
            value: stats?.stats?.categories?.total || 0,
            subtext: `${stats?.stats?.categories?.active || 0} active`,
            icon: "🏷️",
            color: "bg-secondary/20 text-secondary-foreground",
        },
        {
            title: "Total Users",
            value: stats?.stats?.users?.total || 0,
            subtext: `${stats?.stats?.users?.active || 0} active`,
            icon: "👥",
            color: "bg-accent/10 text-accent",
        },
    ];

    const orderStatusColors = {
        pending: "bg-yellow-100 text-yellow-800",
        confirmed: "bg-blue-100 text-blue-800",
        processing: "bg-purple-100 text-purple-800",
        shipped: "bg-indigo-100 text-indigo-800",
        delivered: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800"
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="font-serif text-3xl font-bold text-foreground">
                    Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                    Welcome to {siteName} Admin Panel
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((card, index) => (
                    <div
                        key={index}
                        className="bg-card rounded-2xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">
                                    {card.title}
                                </p>
                                <p className="font-serif text-4xl font-bold text-foreground mt-2">
                                    {card.value}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {card.subtext}
                                </p>
                            </div>
                            <div
                                className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center text-2xl`}
                            >
                                {card.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Orders */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-serif text-xl font-bold text-foreground">
                        Recent Orders
                    </h2>
                    <Link
                        href="/admin/orders"
                        className="text-sm text-primary hover:underline"
                    >
                        View All →
                    </Link>
                </div>
                {stats?.recentOrders?.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Order ID</th>
                                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Customer</th>
                                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Amount</th>
                                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Payment</th>
                                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {stats.recentOrders.map((order) => (
                                    <tr key={order._id} className="hover:bg-muted/50 transition-colors">
                                        <td className="py-3 px-2">
                                            <Link href={`/admin/orders/${order._id}`} className="font-mono text-sm text-primary hover:underline">
                                                #{order._id.slice(-8)}
                                            </Link>
                                        </td>
                                        <td className="py-3 px-2">
                                            <div>
                                                <p className="font-medium text-sm">{order.user?.name || 'N/A'}</p>
                                                <p className="text-xs text-muted-foreground">{order.user?.email || ''}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2">
                                            <p className="font-semibold">₹{order.totalAmount?.toLocaleString()}</p>
                                            {order.couponCode && (
                                                <p className="text-xs text-primary">-₹{order.discountAmount} ({order.couponCode})</p>
                                            )}
                                        </td>
                                        <td className="py-3 px-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${orderStatusColors[order.orderStatus] || 'bg-gray-100 text-gray-800'}`}>
                                                {order.orderStatus}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2">
                                            <span className="text-sm capitalize">{order.paymentMethod}</span>
                                        </td>
                                        <td className="py-3 px-2 text-sm text-muted-foreground">
                                            {new Date(order.createdAt).toLocaleDateString('en-IN')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No orders yet</p>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-2 gap-6">
                {/* Recent Products */}
                <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-serif text-xl font-bold text-foreground">
                            Recent Products
                        </h2>
                        <Link
                            href="/admin/products"
                            className="text-sm text-primary hover:underline"
                        >
                            View All →
                        </Link>
                    </div>
                    {stats?.recentProducts?.length > 0 ? (
                        <div className="space-y-3">
                            {stats.recentProducts.map((product) => (
                                <div
                                    key={product._id}
                                    className="flex items-center gap-3 p-3 bg-muted rounded-xl"
                                >
                                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-lg">
                                        <img src={product.images[0] || '/globe.svg'} className="w-full h-full object-cover rounded-lg" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground truncate">
                                            {product.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {getProductPriceDisplay(product)}
                                        </p>
                                    </div>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${product.isActive
                                            ? "bg-primary/10 text-primary"
                                            : "bg-muted-foreground/10 text-muted-foreground"
                                            }`}
                                    >
                                        {product.isActive ? "Active" : "Inactive"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No products yet</p>
                            <Link
                                href="/admin/products/new"
                                className="text-primary hover:underline text-sm mt-2 inline-block"
                            >
                                Create your first product →
                            </Link>
                        </div>
                    )}
                </div>

                {/* Recent Categories */}
                <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-serif text-xl font-bold text-foreground">
                            Recent Categories
                        </h2>
                        <Link
                            href="/admin/categories"
                            className="text-sm text-primary hover:underline"
                        >
                            View All →
                        </Link>
                    </div>
                    {stats?.recentCategories?.length > 0 ? (
                        <div className="space-y-3">
                            {stats.recentCategories.map((category) => (
                                <div
                                    key={category._id}
                                    className="flex items-center gap-3 p-3 bg-muted rounded-xl"
                                >
                                    <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center text-lg overflow-hidden">
                                        {category.image ? (
                                            <img
                                                src={category.image}
                                                alt={category.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span>🏷️</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground truncate">
                                            {category.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {category.description || "No description"}
                                        </p>
                                    </div>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${category.isActive
                                            ? "bg-primary/10 text-primary"
                                            : "bg-muted-foreground/10 text-muted-foreground"
                                            }`}
                                    >
                                        {category.isActive ? "Active" : "Inactive"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No categories yet</p>
                            <Link
                                href="/admin/categories/new"
                                className="text-primary hover:underline text-sm mt-2 inline-block"
                            >
                                Create your first category →
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Users */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-serif text-xl font-bold text-foreground">
                        Recent Users
                    </h2>
                    <Link
                        href="/admin/users"
                        className="text-sm text-primary hover:underline"
                    >
                        View All →
                    </Link>
                </div>
                {stats?.recentUsers?.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {stats.recentUsers.map((user) => (
                            <div
                                key={user._id}
                                className="flex flex-col items-center text-center p-4 bg-muted rounded-xl"
                            >
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg mb-2">
                                    {user.name?.[0]?.toUpperCase() || "U"}
                                </div>
                                <p className="font-medium text-foreground text-sm truncate w-full">
                                    {user.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate w-full">
                                    {user.email}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.role === "admin"
                                            ? "bg-accent/10 text-accent"
                                            : "bg-secondary/20 text-secondary-foreground"
                                            }`}
                                    >
                                        {user.role}
                                    </span>
                                    <span
                                        className={`w-2 h-2 rounded-full ${user.isActive ? "bg-green-500" : "bg-muted-foreground"
                                            }`}
                                        title={user.isActive ? "Active" : "Inactive"}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No users yet</p>
                    </div>
                )}
            </div>

            {/* Quick Links */}
            <div className="grid sm:grid-cols-3 gap-4">
                <Link
                    href="/admin/products/new"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl p-4 text-center font-medium transition-all hover:shadow-lg hover:shadow-primary/25"
                >
                    + Add New Product
                </Link>
                <Link
                    href="/admin/categories/new"
                    className="bg-card hover:bg-muted text-foreground rounded-xl p-4 text-center font-medium border border-border transition-all"
                >
                    + Add New Category
                </Link>
                <Link
                    href="/"
                    className="bg-card hover:bg-muted text-foreground rounded-xl p-4 text-center font-medium border border-border transition-all"
                >
                    View Store →
                </Link>
            </div>
        </div>
    );
}
