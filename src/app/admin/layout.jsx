"use client";

import { useUser } from "@/context/UserContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "ESSVORA";

const navItems = [
    { href: "/admin", label: "Dashboard", icon: "📊" },
    { href: "/admin/orders", label: "Orders", icon: "🛍️" },
    { href: "/admin/products", label: "Products", icon: "📦" },
    { href: "/admin/categories", label: "Categories", icon: "🏷️" },
    { href: "/admin/bundles", label: "Bundles", icon: "🎁" },
    { href: "/admin/coupons", label: "Coupons", icon: "🎟️" },
    { href: "/admin/reviews", label: "Reviews", icon: "⭐" },
    { href: "/admin/carts", label: "User Carts", icon: "🛒" },
    { href: "/admin/users", label: "Users", icon: "👥" },
    { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminLayout({ children }) {
    const { user, loading, isAdmin, logout } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push("/admin/login");
        }
    }, [loading, isAdmin, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-muted flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin && pathname !== "/admin/login") {
        return null;
    }

    const handleLogout = async () => {
        await logout();
        router.push("/admin/login");
    };

    return (
        <div className="min-h-screen bg-muted">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full bg-card shadow-xl transform transition-all duration-300 
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                    lg:translate-x-0
                    ${sidebarCollapsed ? "lg:w-20" : "lg:w-64"}
                    w-64
                `}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b border-border">
                        <Link href="/admin" className="flex items-center gap-2">
                            <span className={`font-serif text-2xl font-bold text-primary ${sidebarCollapsed ? "lg:hidden" : ""}`}>
                                {siteName}
                            </span>
                            {sidebarCollapsed && (
                                <span className="hidden lg:block font-serif text-2xl font-bold text-primary">
                                    {siteName[0]}
                                </span>
                            )}
                        </Link>
                        <p className={`text-xs text-muted-foreground mt-1 ${sidebarCollapsed ? "lg:hidden" : ""}`}>Admin Panel</p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-2 max-h-[70vh] overflow-y-auto">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== "/admin" && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : "text-foreground hover:bg-muted"
                                        } ${sidebarCollapsed ? "lg:justify-center lg:px-0" : ""}`}
                                    onClick={() => setSidebarOpen(false)}
                                    title={sidebarCollapsed ? item.label : ""}
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    <span className={`font-medium ${sidebarCollapsed ? "lg:hidden" : ""}`}>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Section */}
                    <div className="p-4 border-t border-border">
                        <div className={`flex items-center gap-3 mb-4 ${sidebarCollapsed ? "lg:justify-center" : ""}`}>
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                {user?.name?.[0]?.toUpperCase() || "A"}
                            </div>
                            <div className={`flex-1 min-w-0 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
                                <p className="font-medium text-foreground truncate">
                                    {user?.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {user?.email}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className={`w-full px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-destructive hover:text-white rounded-lg transition-colors ${sidebarCollapsed ? "lg:px-2" : ""}`}
                            title={sidebarCollapsed ? "Logout" : ""}
                        >
                            <span className={sidebarCollapsed ? "lg:hidden" : ""}>Logout</span>
                            <span className={`hidden ${sidebarCollapsed ? "lg:inline" : ""}`}>🚪</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`transition-all duration-300 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}>
                {/* Top Header */}
                <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-sm border-b border-border">
                    <div className="flex items-center justify-between h-16 px-4 lg:px-8">
                        <div className="flex items-center gap-2">
                            {/* Mobile menu button */}
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 text-foreground hover:bg-muted rounded-lg"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                            </button>

                            {/* Desktop collapse button */}
                            <button
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                className="hidden lg:flex p-2 text-foreground hover:bg-muted rounded-lg items-center gap-2"
                                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {sidebarCollapsed ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    )}
                                </svg>
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <Link
                                href="/"
                                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                ← View Store
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-8">{children}</main>
            </div>
        </div>
    );
}

