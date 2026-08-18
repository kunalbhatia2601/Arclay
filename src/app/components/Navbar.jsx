"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@/context/UserContext";
import * as Icons from "lucide-react";
import { DEFAULT_NAVIGATION } from "@/lib/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    ShoppingBag,
    User,
    Phone,
    Truck,
    ChevronDown,
    Heart,
    Home,
    Sparkles,
    Package,
    Gift,
    Percent,
    BookOpen,
    ChevronRight,
    Bell
} from "lucide-react";
import SearchOverlay from "./SearchOverlay";
import NotificationDropdown from "./NotificationDropdown";
import CartSidebar from "./CartSidebar";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Store";
const SITE_LOGO = process.env.NEXT_PUBLIC_SITE_LOGO || "";
const SITE_DESCRIPTION = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "";

export default function Navbar({ config, mobileConfig }) {
    const { user, isAuthenticated, isAdmin, logout, loading, cartCount } = useUser();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isShopHovered, setIsShopHovered] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [showNavbar, setShowNavbar] = useState(true);
    const [categories, setCategories] = useState([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [phoneContact, setPhoneContact] = useState(null);
    const userMenuRef = useRef(null);
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        pathname.includes("login") || pathname.includes("signup") || pathname.includes("admin")
            ? setShowNavbar(false)
            : setShowNavbar(true);
    }, [pathname]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch("/api/products?limit=1");
                const data = await res.json();
                if (data.success && data.categories?.length > 0) {
                    setCategories(data.categories);
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        };
        fetchCategories();

        const fetchContacts = async () => {
            try {
                const res = await fetch("/api/app-config");
                const data = await res.json();
                const phone = (data?.config?.helpContacts || []).find(c => c.type === "call");
                if (phone) setPhoneContact(phone);
            } catch (error) {
                console.error("Failed to fetch contacts:", error);
            }
        };
        fetchContacts();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setIsUserMenuOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setIsUserMenuOpen(false);
        setIsShopHovered(false);
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        await logout();
        setIsUserMenuOpen(false);
    };

    if (!mounted) return null;

    const isActive = (path) => pathname === path || pathname.startsWith(`${path}/`);

    // Menu, announcement bar and actions all come from the Navigation config.
    const nav = config || DEFAULT_NAVIGATION.navbar;
    const mobileBar = mobileConfig || DEFAULT_NAVIGATION.mobileBar;
    // Config wins, then the env-var branding the site shipped with.
    const brandName = nav.brandName?.trim() || SITE_NAME;
    const tagline = nav.tagline?.trim() || SITE_DESCRIPTION;
    const barItems = mobileBar.items || [];

    const shopCategories = [
        { label: "All Products", href: "/products" },
        ...(Array.isArray(categories) ? categories.filter(cat => !cat.parent).map(cat => ({ 
            label: cat?.name || "Category", 
            href: `/products?category=${cat?._id || cat || ""}` 
        })) : []),
    ];

    // A 'categories' menu item is filled from the live category list, so new
    // categories appear in the dropdown without an edit.
    const menuItems = (nav.menu || []).map(item =>
        item.kind === "categories" ? { ...item, children: shopCategories } : item
    );

    return (
        showNavbar && (
            <>
                <div className={`w-full z-50 transition-all duration-300 ${nav.sticky === false ? "relative" : "sticky top-0"}`}>
                    {/* Top Announcement Bar */}
                    {nav.announcementEnabled !== false && (
                        <div className="hidden lg:block w-full bg-[var(--c-text)] text-white text-[12px] py-1.5 font-medium border-b border-white/5">
                            <div className="container mx-auto px-6 xl:px-8 flex justify-between items-center max-w-7xl">
                                <div className="flex gap-6 items-center">
                                    {(nav.announcementPhone || phoneContact?.value) && (
                                        <>
                                            <a
                                                href={`tel:${nav.announcementPhone || phoneContact.value}`}
                                                className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"
                                            >
                                                <Phone className="w-3.5 h-3.5" /> {nav.announcementPhone || phoneContact.value}
                                            </a>
                                            <span className="w-px h-3 bg-white/20" />
                                        </>
                                    )}
                                    {nav.announcementText && (
                                        <span className="flex items-center gap-1.5 opacity-80">
                                            <Truck className="w-3.5 h-3.5" /> {nav.announcementText}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-5 items-center">
                                    {(nav.announcementLinks || []).map((link, i) => (
                                        <Link key={i} href={link.href || "#"} className="opacity-70 hover:opacity-100 transition-opacity">
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Navbar */}
                    <header className={`w-full transition-all duration-300 border-b border-border/50 relative z-40 ${
                        isScrolled 
                            ? 'bg-white/80 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-[72px]' 
                            : 'bg-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] h-[84px]'
                    }`}>
                        <nav className={`w-full max-w-7xl mx-auto px-4 xl:px-8 flex items-center h-full ${nav.menuAlign === "left" ? "justify-start gap-8" : "justify-between"}`}>
                            
                            {/* Logo Area */}
                            <Link href="/" className="flex items-center gap-1 sm:gap-3 shrink-0 max-w-[45%]">
                                {(nav.logo || SITE_LOGO) ? (
                                    <img
                                        src={nav.logo || `/${SITE_LOGO}`}
                                        alt={brandName}
                                        className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl object-contain shrink-0"
                                    />
                                ) : (
                                    <div className="w-8 h-8 sm:w-11 sm:h-11 bg-[#7A8B56] rounded-lg sm:rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#7A8B56]/20">
                                        <Sparkles className="w-4 h-4 sm:w-6 sm:h-6" strokeWidth={1.5} />
                                    </div>
                                )}
                                <div className="flex flex-col min-w-0">
                                    <span className="font-serif text-[14px] xs:text-[16px] sm:text-[26px] font-bold tracking-tight text-[var(--c-text)] leading-none truncate">
                                        {brandName}
                                    </span>
                                    {tagline && (
                                        <span className="hidden sm:block text-[9px] sm:text-[11px] font-semibold tracking-wide text-[#7A8B56] mt-0.5 text-nowrap truncate">
                                            {tagline}
                                        </span>
                                    )}
                                </div>
                            </Link>

                            {/* Center Navigation Links (Desktop) */}
                            <div className={`hidden lg:flex items-center gap-2 ${nav.menuAlign === "left" ? "" : "mx-auto"}`}>
                                {menuItems.map((item, index) => {
                                    const Icon = Icons[item.icon];
                                    const hasDropdown = item.kind !== "link" && (item.children || []).length > 0;
                                    const active = item.href && isActive(item.href);

                                    const inner = (
                                        <>
                                            {Icon && <Icon className="w-4 h-4" strokeWidth={2} />}
                                            {item.label}
                                            {hasDropdown && <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
                                        </>
                                    );
                                    const classes = `flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                                        active
                                            ? "bg-[var(--c-accent-soft)] text-[var(--c-primary-dark)]"
                                            : "text-foreground hover:bg-[var(--c-accent-soft)]/50 hover:text-[var(--c-primary-dark)]"
                                    }`;

                                    if (!hasDropdown) {
                                        return (
                                            <Link key={index} href={item.href || "#"} className={classes}>
                                                {inner}
                                            </Link>
                                        );
                                    }

                                    return (
                                        <div key={index} className="relative group">
                                            {item.href ? (
                                                <Link href={item.href} className={classes}>{inner}</Link>
                                            ) : (
                                                <button className={classes}>{inner}</button>
                                            )}
                                            <div className="absolute left-0 top-full pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                                <div className="bg-white border border-border shadow-xl rounded-2xl py-3 overflow-hidden">
                                                    {(item.children || []).map((child, ci) => (
                                                        <Link
                                                            key={ci}
                                                            href={child.href || "#"}
                                                            className="block px-5 py-2.5 text-sm font-medium text-foreground hover:bg-[var(--c-accent-soft)] hover:text-[var(--c-primary-dark)] transition-colors text-nowrap"
                                                        >
                                                            {child.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Right Area - Luxury Liquid Icons */}
                            <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-2.5 bg-[var(--c-primary)]/5 backdrop-blur-md rounded-full border border-[var(--c-primary)]/10 relative shrink-0">
                                {[
                                    nav.showSearch !== false && { icon: Search, onClick: () => setIsSearchOpen(true), label: "Search" },
                                    nav.showNotifications === true && { icon: Bell, onClick: () => setIsNotificationsOpen(!isNotificationsOpen), label: "Notifications" },
                                    nav.showWishlist === true && { icon: Heart, href: "/wishlist", label: "Wishlist" },
                                    nav.showCart !== false && { icon: ShoppingBag, onClick: () => setIsCartOpen(true), label: "Cart", hasBadge: true, count: cartCount },
                                    // Always show account: /account when logged in, /login when not
                                    { icon: User, href: isAuthenticated ? "/account" : "/login", label: "Account", loading },
                                ].filter(Boolean).map((action) => (
                                    <div key={action.label} className="relative group flex items-center justify-center shrink-0">
                                        {action.href ? (
                                            <Link
                                                href={action.href}
                                                aria-label={action.label}
                                                title={action.label}
                                                className="p-2 sm:p-2.5 rounded-full hover:bg-[var(--c-primary)]/10 transition-all text-[var(--c-text)] block relative z-10"
                                            >
                                                {action.loading ? (
                                                    <div className="w-5 h-5 sm:w-[1.4rem] sm:h-[1.4rem] border-2 border-[var(--c-primary)] border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <action.icon className="w-5 h-5 sm:w-[1.4rem] sm:h-[1.4rem]" strokeWidth={1.5} />
                                                )}
                                            </Link>
                                        ) : (
                                            <button
                                                onClick={action.onClick}
                                                aria-label={action.label}
                                                title={action.label}
                                                className="p-2 sm:p-2.5 rounded-full hover:bg-[var(--c-primary)]/10 transition-all text-[var(--c-text)] relative z-10"
                                            >
                                                <action.icon className="w-5 h-5 sm:w-[1.4rem] sm:h-[1.4rem]" strokeWidth={1.5} />
                                                {action.hasBadge && action.count > 0 && (
                                                    <span className="absolute top-0 right-0 sm:-top-0.5 sm:-right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-[var(--c-accent)] text-white text-[9px] sm:text-[10px] flex items-center justify-center rounded-full font-bold ring-2 ring-white z-20 shadow-sm">
                                                        {action.count}
                                                    </span>
                                                )}
                                            </button>
                                        )}
                                        <div className="absolute inset-0 bg-[var(--c-primary)]/15 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 -z-10" style={{ filter: 'url(#global-gooey)' }} />
                                    </div>
                                ))}

                                <div className="w-px h-4 sm:h-5 bg-[var(--c-primary)]/20 mx-1 shrink-0 lg:hidden" />
                                <button
                                    onClick={() => setIsMobileMenuOpen(true)}
                                    aria-label="Open menu"
                                    className="lg:hidden p-2.5 rounded-full bg-[var(--c-primary)] text-white relative z-10 shadow-sm shrink-0"
                                >
                                    <Package className="w-5 h-5 sm:w-[1.4rem] sm:h-[1.4rem]" strokeWidth={2} />
                                </button>
                            </div>

                        </nav>
                    </header>
                    <NotificationDropdown isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
                </div>

                {/* Overlays */}
                <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
                <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: "100%" }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-xl lg:hidden flex flex-col"
                        >
                            <div className="p-6 flex justify-between items-center border-b border-[var(--c-border)]/50">
                                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2">
                                    {SITE_LOGO ? (
                                        <img src={`/${SITE_LOGO}`} alt={SITE_NAME} className="w-8 h-8 rounded-lg object-contain" />
                                    ) : (
                                        <div className="w-8 h-8 bg-[var(--c-primary)] rounded-lg flex items-center justify-center text-white font-serif font-bold italic">
                                            {SITE_NAME.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <span className="font-serif text-xl font-bold tracking-tight text-[var(--c-text)]">{SITE_NAME}</span>
                                </Link>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-[var(--c-text)] hover:bg-[var(--c-surface-alt)] rounded-full transition-colors">
                                    <ChevronRight className="w-6 h-6 rotate-90" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 py-8">
                                <nav className="space-y-8">
                                    <div>
                                        <h3 className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-text-muted)] font-bold mb-4">Shop Collections</h3>
                                        <div className="grid grid-cols-1 gap-3">
                                            {categories.filter(cat => !cat.parent).map((cat) => (
                                                <Link
                                                    key={cat._id}
                                                    href={`/products?category=${cat._id}`}
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className="flex items-center justify-between p-4 bg-[var(--c-surface-alt)]/50 rounded-2xl hover:bg-[var(--c-primary)] hover:text-white transition-all group relative overflow-hidden"
                                                >
                                                    <span className="font-serif text-lg font-bold relative z-10">{cat.name}</span>
                                                    <ChevronRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all relative z-10" />
                                                    <div className="absolute inset-0 bg-[var(--c-primary)] scale-x-0 group-hover:scale-x-100 transition-transform origin-left -z-0" />
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </nav>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mobile Bottom Navigation (Refined Liquid Glass) */}
                {mobileBar.enabled !== false && (!pathname.includes("/products/") || pathname.split("/").length < 3) ? (
                    <div className={`lg:hidden fixed left-1/2 -translate-x-1/2 z-[120] pointer-events-auto ${
                        mobileBar.style === "full"
                            ? "bottom-0 w-full"
                            : "bottom-6 w-[92%] max-w-[380px]"
                    }`}>
                        <div className={`bg-white/85 backdrop-blur-[24px] border border-[var(--c-primary)]/25 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] p-1.5 ${
                            mobileBar.style === "full" ? "rounded-t-3xl" : "rounded-[2.5rem]"
                        }`}>
                            <div
                                className="grid w-full h-[64px] items-center px-1"
                                style={{ gridTemplateColumns: `repeat(${barItems.length || 1}, minmax(0, 1fr))` }}
                            >
                                {barItems.map((item, index) => {
                                    const Icon = Icons[item.icon] || Icons.Circle;
                                    const active = item.kind === "link" && item.href && isActive(item.href);

                                    const body = (
                                        <div className={`relative z-10 flex flex-col items-center justify-center gap-0.5 transition-all duration-300 ${
                                            active
                                                ? "text-[var(--c-primary-dark)]"
                                                : "text-[var(--c-text)]/45 hover:text-[var(--c-primary)]"
                                        }`}>
                                            <span className="relative">
                                                <Icon className="w-6 h-6" strokeWidth={active ? 2.4 : 1.6} />
                                                {item.kind === "cart" && mounted && cartCount > 0 && (
                                                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[var(--c-accent)] text-white text-[9px] font-bold flex items-center justify-center">
                                                        {cartCount > 9 ? "9+" : cartCount}
                                                    </span>
                                                )}
                                            </span>
                                            {mobileBar.showLabels !== false && (
                                                <span className="text-[10px] font-semibold leading-none">{item.label}</span>
                                            )}
                                        </div>
                                    );

                                    // Search and cart open their overlays rather than navigating.
                                    if (item.kind === "search" || item.kind === "cart") {
                                        return (
                                            <button
                                                key={index}
                                                onClick={() => item.kind === "search" ? setIsSearchOpen(true) : setIsCartOpen(true)}
                                                className="relative flex items-center justify-center h-full"
                                                aria-label={item.label}
                                            >
                                                {body}
                                            </button>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={index}
                                            href={item.href || "/"}
                                            className="relative flex items-center justify-center h-full"
                                        >
                                            {body}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : null}
            </>
        )
    );
}
