"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "ESSVORA";

export default function Navbar() {
    const { user, isAuthenticated, isAdmin, logout, loading } = useUser();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [showNavbar, setShowNavbar] = useState(true);

    const pathname = usePathname();

    const handleLogout = async () => {
        await logout();
        setIsUserMenuOpen(false);
    };

    useEffect(() => {
        pathname.includes("login") || pathname.includes("signup") || pathname.includes("admin") ? setShowNavbar(false) : setShowNavbar(true);
    }, [pathname]);

    return (
        showNavbar && <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
            <nav className="container mx-auto px-4 lg:px-8">
                <div className="flex items-center justify-between h-16 lg:h-20">

                    {/* Minimalist Brand Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <span className="text-xl lg:text-2xl font-bold text-white tracking-tight group-hover:text-primary transition-colors">
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
                                className="text-sm font-semibold text-white/70 hover:text-white transition-colors uppercase tracking-wide"
                            >
                                {item}
                            </Link>
                        ))}
                    </div>

                    {/* Right Actions - Neon CTA */}
                    <div className="hidden lg:flex items-center gap-6">
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        ) : isAuthenticated ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center gap-3 px-1 py-1 rounded-full hover:bg-white/5 transition-colors"
                                >
                                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-black font-bold text-sm">
                                        {user?.name?.[0]?.toUpperCase() || "U"}
                                    </div>
                                </button>
                                {/* User Dropdown */}
                                {isUserMenuOpen && (
                                    <div className="absolute right-0 top-full mt-4 w-48 bg-[#1E1E1E] border border-white/10 rounded-xl shadow-xl py-2 animate-fade-in-up">
                                        <div className="px-4 py-3 border-b border-white/5">
                                            <p className="font-bold text-white truncate">{user?.name}</p>
                                            <p className="text-xs text-white/50 truncate">{user?.email}</p>
                                        </div>
                                        <Link href="/account" className="block px-4 py-2 text-sm text-white/70 hover:text-primary hover:bg-white/5 transition-colors" onClick={() => setIsUserMenuOpen(false)}>Account</Link>
                                        <Link href="/orders" className="block px-4 py-2 text-sm text-white/70 hover:text-primary hover:bg-white/5 transition-colors" onClick={() => setIsUserMenuOpen(false)}>Orders</Link>
                                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors">Sign Out</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link href="/login" className="text-sm font-bold text-white hover:text-primary transition-colors">
                                    Login
                                </Link>
                                <Link href="/shop">
                                    <Button className="bg-primary hover:bg-primary/90 text-black font-bold rounded-full px-6 h-10 shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:shadow-[0_0_20px_rgba(204,255,0,0.5)] transition-all">
                                        Shop Now
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="lg:hidden p-2 text-white"
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

                {/* Mobile Drawer */}
                {isMenuOpen && (
                    <div className="lg:hidden bg-[#1E1E1E] border-t border-white/10 absolute left-0 right-0 top-[64px] p-6 shadow-2xl animate-fade-in-up">
                        <div className="flex flex-col gap-6">
                            {["Home", "Shop", "Story", "Contact"].map((item) => (
                                <Link
                                    key={item}
                                    href={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                                    className="text-xl font-bold text-white hover:text-primary transition-colors"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {item}
                                </Link>
                            ))}
                            {!isAuthenticated && (
                                <div className="pt-6 border-t border-white/10 flex flex-col gap-4">
                                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                                        <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 py-5 rounded-xl">Login</Button>
                                    </Link>
                                    <Link href="/shop" onClick={() => setIsMenuOpen(false)}>
                                        <Button className="w-full bg-primary text-black font-bold py-5 rounded-xl">Shop Now</Button>
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
