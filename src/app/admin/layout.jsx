"use client";

import { useUser } from "@/context/UserContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
    LayoutDashboard,
    ShoppingBag,
    CreditCard,
    Package,
    Barcode,
    LayoutTemplate,
    ListChecks,
    Megaphone,
    Palette,
    Tags,
    Boxes,
    Sheet,
    Image as ImageIcon,
    Ticket,
    Star,
    ShoppingCart,
    Users,
    Smartphone,
    Settings,
    SquareStack,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    LogOut,
    Menu,
    ExternalLink,
} from "lucide-react";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Store";

const navSections = [
    { type: "link", href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    {
        type: "group",
        id: "commerce",
        label: "Commerce",
        icon: ShoppingBag,
        items: [
            { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
            { href: "/admin/pos", label: "POS", icon: CreditCard },
            { href: "/admin/coupons", label: "Coupons", icon: Ticket },
            { href: "/admin/carts", label: "User Carts", icon: ShoppingCart },
            { href: "/admin/reviews", label: "Reviews", icon: Star },
            { href: "/admin/users", label: "Customers", icon: Users },
        ],
    },
    {
        type: "group",
        id: "catalog",
        label: "Catalog",
        icon: Package,
        items: [
            { href: "/admin/products", label: "Products", icon: Package },
            { href: "/admin/products/spreadsheet", label: "Catalog Sheet", icon: Sheet },
            { href: "/admin/categories", label: "Categories", icon: Tags },
            { href: "/admin/bundles", label: "Bundles", icon: Boxes },
            { href: "/admin/labels", label: "Product Labels", icon: Barcode },
            { href: "/admin/meta-templates", label: "Field Templates", icon: ListChecks },
        ],
    },
    {
        type: "group",
        id: "appearance",
        label: "Appearance",
        icon: Palette,
        items: [
            { href: "/admin/pages", label: "Pages", icon: LayoutTemplate },
            { href: "/admin/cards", label: "Product Cards", icon: SquareStack },
            { href: "/admin/navigation", label: "Navigation", icon: Menu },
            { href: "/admin/theme", label: "Theme", icon: Palette },
            { href: "/admin/product-ads", label: "Product Ads", icon: Megaphone },
            { href: "/admin/gallery", label: "Gallery", icon: ImageIcon },
        ],
    },
    {
        type: "group",
        id: "system",
        label: "System",
        icon: Settings,
        items: [
            { href: "/admin/app-config", label: "Application", icon: Smartphone },
            { href: "/admin/settings", label: "Settings", icon: Settings },
        ],
    },
];

function pathMatches(pathname, href) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
}

function groupHasActive(pathname, items) {
    return items.some((item) => pathMatches(pathname, item.href));
}

function NavLink({ href, label, icon: Icon, active, collapsed, onClick, nested }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            title={collapsed ? label : ""}
            className={`flex items-center gap-3 rounded-xl transition-all duration-200 group ${
                nested ? "px-3 py-2.5" : "px-3.5 py-3"
            } ${
                active
                    ? "bg-[#869661] text-white shadow-lg shadow-[#869661]/15"
                    : "text-white/55 hover:bg-white/[0.06] hover:text-white"
            } ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
        >
            <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? "text-white" : "text-[#869661]"}`} />
            <span
                className={`text-[13.5px] font-medium tracking-wide whitespace-nowrap ${
                    collapsed ? "lg:hidden" : ""
                }`}
            >
                {label}
            </span>
            {active && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/90" />
            )}
        </Link>
    );
}

function NavGroup({ section, pathname, collapsed, open, onToggle, onNavigate }) {
    const Icon = section.icon;
    const active = groupHasActive(pathname, section.items);
    const [flyout, setFlyout] = useState(false);

    if (collapsed) {
        return (
            <div
                className="relative"
                onMouseEnter={() => setFlyout(true)}
                onMouseLeave={() => setFlyout(false)}
            >
                <button
                    type="button"
                    className={`w-full flex items-center justify-center py-3 rounded-xl transition-colors ${
                        active ? "bg-[#869661]/25 text-white" : "text-white/50 hover:bg-white/[0.06] hover:text-white"
                    }`}
                    title={section.label}
                >
                    <Icon className={`w-5 h-5 ${active ? "text-[#869661]" : ""}`} />
                </button>
                {flyout && (
                    <div className="hidden lg:block absolute left-full top-0 ml-3 z-[60] min-w-[220px]">
                        <div className="rounded-2xl bg-[#141814] border border-white/10 shadow-2xl shadow-black/40 p-2">
                            <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#869661]">
                                {section.label}
                            </p>
                            {section.items.map((item) => (
                                <NavLink
                                    key={item.href}
                                    {...item}
                                    nested
                                    collapsed={false}
                                    active={pathMatches(pathname, item.href)}
                                    onClick={onNavigate}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="rounded-2xl">
            <button
                type="button"
                onClick={onToggle}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-colors ${
                    active ? "text-white" : "text-white/55 hover:text-white hover:bg-white/[0.04]"
                }`}
            >
                <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        active ? "bg-[#869661]/20" : "bg-white/[0.04]"
                    }`}
                >
                    <Icon className="w-4 h-4 text-[#869661]" />
                </span>
                <span className="flex-1 text-left text-[12px] font-bold uppercase tracking-[0.16em]">
                    {section.label}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-white/30 transition-transform duration-300 ${
                        open ? "rotate-180" : ""
                    }`}
                />
            </button>
            <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
            >
                <div className="overflow-hidden">
                    <div className="ml-5 pl-3 border-l border-white/10 mt-0.5 mb-1 space-y-0.5">
                        {section.items.map((item) => (
                            <NavLink
                                key={item.href}
                                {...item}
                                nested
                                collapsed={false}
                                active={pathMatches(pathname, item.href)}
                                onClick={onNavigate}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminLayout({ children }) {
    const { user, loading, isAdmin, logout } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [openGroups, setOpenGroups] = useState({});

    const activeGroupId = useMemo(() => {
        const group = navSections.find(
            (section) => section.type === "group" && groupHasActive(pathname, section.items)
        );
        return group?.id || null;
    }, [pathname]);

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push("/login");
        }
    }, [loading, isAdmin, router]);

    useEffect(() => {
        if (!activeGroupId) return;
        setOpenGroups((prev) => ({ ...prev, [activeGroupId]: true }));
    }, [activeGroupId]);

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

    const toggleGroup = (id) => {
        setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const closeMobile = () => setSidebarOpen(false);

    const crumb = pathname === "/admin"
        ? "Overview"
        : pathname.split("/").filter(Boolean).slice(1).join(" / ").replace(/-/g, " ");

    return (
        <div className="min-h-screen bg-[#FDFCFB] text-[#2A2F25]">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={closeMobile}
                />
            )}

            <aside
                className={`fixed top-0 left-0 z-50 h-full bg-[#121510] text-white/90 shadow-2xl transform transition-all duration-500 ease-in-out border-r border-white/[0.06]
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                    lg:translate-x-0
                    ${sidebarCollapsed ? "lg:w-[88px]" : "lg:w-[272px]"}
                    w-[272px]
                `}
            >
                <div className="flex flex-col h-full">
                    <div className={`border-b border-white/[0.06] ${sidebarCollapsed ? "p-5" : "p-6"}`}>
                        <Link href="/admin" className="flex items-center gap-3 group" onClick={closeMobile}>
                            <div className="w-10 h-10 bg-[#869661] rounded-xl flex items-center justify-center shadow-lg shadow-[#869661]/20 group-hover:rotate-6 transition-transform duration-500 shrink-0">
                                <span className="font-serif text-xl font-bold text-white">
                                    {siteName[0]}
                                </span>
                            </div>
                            <div className={`${sidebarCollapsed ? "lg:hidden" : ""}`}>
                                <span className="font-serif text-xl font-bold tracking-tight text-white block leading-none">
                                    {siteName}
                                </span>
                                <span className="text-[10px] font-bold text-[#869661] uppercase tracking-[0.18em] block mt-1">
                                    Admin
                                </span>
                            </div>
                        </Link>
                    </div>

                    <nav className={`flex-1 overflow-y-auto custom-scrollbar ${sidebarCollapsed ? "p-3 space-y-2" : "p-3 space-y-1"}`}>
                        {navSections.map((section) => {
                            if (section.type === "link") {
                                return (
                                    <NavLink
                                        key={section.href}
                                        {...section}
                                        collapsed={sidebarCollapsed}
                                        active={pathMatches(pathname, section.href)}
                                        onClick={closeMobile}
                                    />
                                );
                            }

                            return (
                                <NavGroup
                                    key={section.id}
                                    section={section}
                                    pathname={pathname}
                                    collapsed={sidebarCollapsed}
                                    open={!!openGroups[section.id]}
                                    onToggle={() => toggleGroup(section.id)}
                                    onNavigate={closeMobile}
                                />
                            );
                        })}
                    </nav>

                    <div className="p-3 bg-black/25 border-t border-white/[0.06]">
                        <div className={`flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] mb-2 ${sidebarCollapsed ? "lg:justify-center lg:p-2" : ""}`}>
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#869661] to-[#4A5D23] flex items-center justify-center text-white font-bold shadow-inner shrink-0">
                                {user?.name?.[0]?.toUpperCase() || "A"}
                            </div>
                            <div className={`flex-1 min-w-0 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
                                <p className="font-bold text-[13px] text-white truncate">
                                    {user?.name}
                                </p>
                                <p className="text-[10px] text-white/35 truncate font-medium uppercase tracking-wider">
                                    Administrator
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-white/50 hover:text-white hover:bg-red-500/10 rounded-xl transition-all ${sidebarCollapsed ? "lg:justify-center lg:px-0" : ""}`}
                            title={sidebarCollapsed ? "Sign out" : ""}
                        >
                            <LogOut className="w-4 h-4 text-red-400" />
                            <span className={`text-[12px] uppercase tracking-[0.12em] ${sidebarCollapsed ? "lg:hidden" : ""}`}>
                                Sign out
                            </span>
                        </button>
                    </div>
                </div>
            </aside>

            <div className={`transition-all duration-500 ease-in-out ${sidebarCollapsed ? "lg:ml-[88px]" : "lg:ml-[272px]"}`}>
                <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-[#2A2F25]/5">
                    <div className="flex items-center justify-between h-20 px-6 lg:px-10">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2.5 text-[#2A2F25] hover:bg-[#869661]/10 rounded-xl transition-colors"
                            >
                                <Menu className="w-6 h-6" />
                            </button>

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
                                {crumb}
                            </h2>
                        </div>

                        <Link
                            href="/"
                            className="flex items-center gap-2 text-sm font-bold text-[#2A2F25]/60 hover:text-[#869661] transition-colors group"
                        >
                            <span className="hidden md:inline uppercase tracking-widest text-[11px]">Visit Store</span>
                            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </Link>
                    </div>
                </header>

                <main className="p-6 lg:p-10 min-h-[calc(100vh-80px)]">
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
