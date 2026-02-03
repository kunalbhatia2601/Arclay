"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "ESSVORA";

export default function Navbar() {
    const { user, isAuthenticated, isAdmin, logout, loading } = useUser();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [showNavbar, setShowNavbar] = useState(true);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
        pathname.includes("login") || pathname.includes("signup") || pathname.includes("admin") ? setShowNavbar(false) : setShowNavbar(true);
    }, [pathname]);

    const handleLogout = async () => {
        await logout();
        setIsUserMenuOpen(false);
    };

    if (!mounted) return null;

    return (
        showNavbar && <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
            <nav className="container mx-auto px-4 lg:px-8">
                <div className="flex items-center justify-between h-16 lg:h-20">

                    {/* Minimalist Brand Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <span className="text-xl lg:text-2xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                            {siteName}
                        </span>
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1"></div>
                    </Link>

                    {/* Centered Navigation */}
                    <div className="hidden lg:flex items-center gap-10">
                        {["Home", "Products", "Contact"].map((item) => (
                            <Link
                                key={item}
                                href={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                                className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide"
                            >
                                {item}
                            </Link>
                        ))}
                    </div>

                    {/* Right Actions */}
                    <div className="hidden lg:flex items-center gap-6">
                        {/* Theme Toggle */}
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="p-2 rounded-full hover:bg-muted transition-colors text-foreground"
                            aria-label="Toggle Theme"
                        >
                            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {loading ? (
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        ) : isAuthenticated ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center gap-3 px-1 py-1 rounded-full hover:bg-muted transition-colors"
                                >
                                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                                        {user?.name?.[0]?.toUpperCase() || "U"}
                                    </div>
                                </button>
                                {/* User Dropdown */}
                                {isUserMenuOpen && (
                                    <div className="absolute right-0 top-full mt-4 w-48 bg-card border border-border rounded-xl shadow-xl py-2 animate-fade-in-up">
                                        <div className="px-4 py-3 border-b border-border">
                                            <p className="font-bold text-foreground truncate">{user?.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                        </div>
                                        <Link href="/account" className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted transition-colors" onClick={() => setIsUserMenuOpen(false)}>Account</Link>
                                        <Link href="/orders" className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted transition-colors" onClick={() => setIsUserMenuOpen(false)}>Orders</Link>
                                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors">Sign Out</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link href="/login" className="text-sm font-bold text-foreground hover:text-primary transition-colors">
                                    Login
                                </Link>
                                <Link href="/products">
                                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-6 h-10 shadow-lg hover:shadow-primary/20 transition-all">
                                        Shop Now
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Toggle & Theme Toggle */}
                    <div className="lg:hidden flex items-center gap-4">
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="p-2 rounded-full hover:bg-muted transition-colors text-foreground"
                        >
                            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 text-foreground"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Drawer */}
                {isMenuOpen && (
                    <div className="lg:hidden bg-card border-t border-border absolute left-0 right-0 top-[64px] p-6 shadow-2xl animate-fade-in-up">
                        <div className="flex flex-col gap-6">
                            {["Home", "Products", "Contact"].map((item) => (
                                <Link
                                    key={item}
                                    href={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                                    className="text-xl font-bold text-foreground hover:text-primary transition-colors"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {item}
                                </Link>
                            ))}
                            {!isAuthenticated && (
                                <div className="pt-6 border-t border-border flex flex-col gap-4">
                                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                                        <Button variant="outline" className="w-full border-border text-foreground hover:bg-muted py-5 rounded-xl">Login</Button>
                                    </Link>
                                    <Link href="/shop" onClick={() => setIsMenuOpen(false)}>
                                        <Button className="w-full bg-primary text-primary-foreground font-bold py-5 rounded-xl">Shop Now</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
}
