"use client";

import { useUser } from "@/context/UserContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

import { 
    LayoutDashboard, 
    ShoppingBag, 
    CreditCard, 
    Package, 
    Megaphone, 
    Tags, 
    Boxes, 
    Image as ImageIcon, 
    Ticket, 
    Star, 
    ShoppingCart, 
    Users, 
    Smartphone, 
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Menu,
    ExternalLink
} from "lucide-react";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Store";

const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/pos", label: "POS", icon: CreditCard },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/product-ads", label: "Product Ads", icon: Megaphone },
    { href: "/admin/categories", label: "Categories", icon: Tags },
    { href: "/admin/bundles", label: "Bundles", icon: Boxes },
    { href: "/admin/gallery", label: "Gallery", icon: ImageIcon },
    { href: "/admin/coupons", label: "Coupons", icon: Ticket },
    { href: "/admin/reviews", label: "Reviews", icon: Star },
    { href: "/admin/carts", label: "User Carts", icon: ShoppingCart },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/app-config", label: "Application", icon: Smartphone },
    { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }) {
    const { user, loading, isAdmin, logout } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push("/login");
        }
    }, [loading, isAdmin, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#869661] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[#767B71] font-medium">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-[#FDFCFB] text-[#2A2F25]">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full bg-[#1A1F16] text-white/90 shadow-2xl transform transition-all duration-500 ease-in-out border-r border-white/5
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                    lg:translate-x-0
                    ${sidebarCollapsed ? "lg:w-[88px]" : "lg:w-72"}
                    w-72
                `}
            >
                <div className="flex flex-col h-full">
                    {/* Logo/Brand Section */}
                    <div className="p-8 border-b border-white/5">
                        <Link href="/admin" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-[#869661] rounded-xl flex items-center justify-center shadow-lg shadow-[#869661]/20 group-hover:rotate-12 transition-transform duration-500">
                                <span className="font-serif text-xl font-bold text-white">
                                    {siteName[0]}
                                </span>
                            </div>
                            <div className={`transition-all duration-300 ${sidebarCollapsed ? "lg:opacity-0 lg:w-0 overflow-hidden" : "opacity-100"}`}>
                                <span className="font-serif text-2xl font-bold tracking-tight text-white block">
                                    {siteName}
                                </span>
                                <span className="text-[10px] font-bold text-[#869661] uppercase tracking-[0.2em] block mt-0.5">
                                    Admin Suite
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar pt-6">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== "/admin" && pathname.startsWith(item.href));
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${isActive
                                        ? "bg-[#869661] text-white shadow-xl shadow-[#869661]/20 translate-x-1"
                                        : "text-white/60 hover:bg-white/5 hover:text-white"
                                        } ${sidebarCollapsed ? "lg:justify-center lg:px-0" : ""}`}
                                    onClick={() => setSidebarOpen(false)}
                                    title={sidebarCollapsed ? item.label : ""}
                                >
                                    <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-[#869661]"}`} />
                                    <span className={`font-medium text-[15px] whitespace-nowrap transition-all duration-300 ${sidebarCollapsed ? "lg:opacity-0 lg:w-0 overflow-hidden" : "opacity-100"}`}>
                                        {item.label}
                                    </span>
                                    {isActive && !sidebarCollapsed && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile Footer */}
                    <div className="p-4 bg-black/20 border-t border-white/5">
                        <div className={`flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 mb-4 ${sidebarCollapsed ? "lg:justify-center lg:p-2" : ""}`}>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#869661] to-[#4A5D23] flex items-center justify-center text-white font-bold text-lg shadow-inner">
                                {user?.name?.[0]?.toUpperCase() || "A"}
                            </div>
                            <div className={`flex-1 min-w-0 transition-all duration-300 ${sidebarCollapsed ? "lg:hidden" : "opacity-100"}`}>
                                <p className="font-bold text-[14px] text-white truncate">
                                    {user?.name}
                                </p>
                                <p className="text-[10px] text-white/40 truncate font-medium uppercase tracking-wider">
                                    Store Manager
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-white/60 hover:text-white hover:bg-red-500/10 rounded-xl transition-all group ${sidebarCollapsed ? "lg:justify-center lg:px-0" : ""}`}
                            title={sidebarCollapsed ? "Logout" : ""}
                        >
                            <LogOut className="w-5 h-5 text-red-400 group-hover:rotate-12 transition-transform" />
                            <span className={`uppercase tracking-[0.1em] ${sidebarCollapsed ? "lg:hidden" : ""}`}>Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`transition-all duration-500 ease-in-out ${sidebarCollapsed ? "lg:ml-[88px]" : "lg:ml-72"}`}>
                {/* Top Header */}
                <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-[#2A2F25]/5">
                    <div className="flex items-center justify-between h-20 px-6 lg:px-10">
                        <div className="flex items-center gap-4">
                            {/* Mobile menu button */}
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2.5 text-[#2A2F25] hover:bg-[#869661]/10 rounded-xl transition-colors"
                            >
                                <Menu className="w-6 h-6" />
                            </button>

                            {/* Desktop collapse button */}
                            <button
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                className="hidden lg:flex p-2.5 text-[#2A2F25]/40 hover:text-[#869661] hover:bg-[#869661]/10 rounded-xl transition-all duration-300"
                                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                            >
                                {sidebarCollapsed ? (
                                    <ChevronRight className="w-5 h-5" />
                                ) : (
                                    <ChevronLeft className="w-5 h-5" />
                                )}
                            </button>

                            <div className="h-6 w-px bg-[#2A2F25]/10 mx-2 hidden lg:block" />
                            
                            <h2 className="text-[13px] font-bold text-[#869661] uppercase tracking-[0.2em] hidden sm:block">
                                {pathname === '/admin' ? 'Overview' : pathname.split('/').pop().replace(/-/g, ' ')}
                            </h2>
                        </div>

                        <div className="flex items-center gap-6">
                            <Link
                                href="/"
                                className="flex items-center gap-2 text-sm font-bold text-[#2A2F25]/60 hover:text-[#869661] transition-colors group"
                            >
                                <span className="hidden md:inline uppercase tracking-widest text-[11px]">Visit Store</span>
                                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </Link>
                            
                            <div className="w-10 h-10 rounded-full bg-[#2A2F25]/5 flex items-center justify-center border border-[#2A2F25]/5 relative">
                                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
                                <Star className="w-5 h-5 text-[#2A2F25]/40" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6 lg:p-10 min-h-[calc(100-80px)]">
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

