"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "ESSVORA";

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
                                        📦
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground truncate">
                                            {product.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            ₹{product.regularPrice}
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
                                    <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center text-lg">
                                        🏷️
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
