"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MyAccountPage() {
    const { isAuthenticated, user, loading: userLoading } = useUser();
    const router = useRouter();
    const [stats, setStats] = useState({ totalOrders: 0, pendingOrders: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userLoading && !isAuthenticated) {
            router.push("/login");
        } else if (isAuthenticated) {
            fetchStats();
        }
    }, [isAuthenticated, userLoading]);

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/orders", {
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                const totalOrders = data.orders.length;
                const pendingOrders = data.orders.filter(o => o.orderStatus === 'pending' || o.orderStatus === 'processing').length;
                setStats({ totalOrders, pendingOrders });
            }
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        } finally {
            setLoading(false);
        }
    };

    if (userLoading || loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center pt-24">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-12 pt-24">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="font-serif text-4xl font-bold text-foreground">
                        My Account
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Welcome back, {user?.name}!
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                        <div className="text-3xl mb-2">📦</div>
                        <h3 className="font-bold text-2xl text-foreground">{stats.totalOrders}</h3>
                        <p className="text-muted-foreground text-sm">Total Orders</p>
                    </div>
                    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                        <div className="text-3xl mb-2">⏳</div>
                        <h3 className="font-bold text-2xl text-foreground">{stats.pendingOrders}</h3>
                        <p className="text-muted-foreground text-sm">Pending Orders</p>
                    </div>
                    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                        <div className="text-3xl mb-2">📍</div>
                        <h3 className="font-bold text-2xl text-foreground">-</h3>
                        <p className="text-muted-foreground text-sm">Saved Addresses</p>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Orders Card */}
                    <Link href="/orders" className="block group">
                        <div className="bg-card rounded-2xl p-8 shadow-sm border border-border hover:shadow-md hover:border-primary/50 transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="text-4xl">🛍️</div>
                                <svg className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                            <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                                My Orders
                            </h2>
                            <p className="text-muted-foreground">
                                Track, return, or view your order history
                            </p>
                        </div>
                    </Link>

                    {/* Addresses Card */}
                    <Link href="/account/addresses" className="block group">
                        <div className="bg-card rounded-2xl p-8 shadow-sm border border-border hover:shadow-md hover:border-primary/50 transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="text-4xl">📍</div>
                                <svg className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                            <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                                Saved Addresses
                            </h2>
                            <p className="text-muted-foreground">
                                Manage your delivery addresses
                            </p>
                        </div>
                    </Link>

                    {/* Account Details Card */}
                    <div className="bg-card rounded-2xl p-8 shadow-sm border border-border">
                        <div className="text-4xl mb-4">👤</div>
                        <h2 className="font-serif text-2xl font-bold text-foreground mb-4">
                            Account Details
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Name</p>
                                <p className="font-medium text-foreground">{user?.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-medium text-foreground">{user?.email}</p>
                            </div>
                            {user?.phone && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Phone</p>
                                    <p className="font-medium text-foreground">{user?.phone}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cart Card */}
                    <Link href="/cart" className="block group">
                        <div className="bg-card rounded-2xl p-8 shadow-sm border border-border hover:shadow-md hover:border-primary/50 transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="text-4xl">🛒</div>
                                <svg className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                            <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
                                Shopping Cart
                            </h2>
                            <p className="text-muted-foreground">
                                View and manage items in your cart
                            </p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
