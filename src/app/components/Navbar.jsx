"use client";

import { useState } from "react";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "ESSVORA";

export default function Navbar() {
    const { user, isAuthenticated, isAdmin, logout, loading } = useUser();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        setIsUserMenuOpen(false);
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
            <nav className="container mx-auto px-4 lg:px-8">
                <div className="flex items-center justify-between h-16 lg:h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <span className="font-serif text-2xl lg:text-3xl font-bold text-foreground tracking-wide">
                            {siteName}
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-8">
                        <Link
                            href="/products"
                            className="text-foreground/80 hover:text-primary transition-colors font-medium"
                        >
                            Products
                        </Link>
                        <a
                            href="#bundles"
                            className="text-foreground/80 hover:text-primary transition-colors font-medium"
                        >
                            Bundles
                        </a>
                        <a
                            href="#pricing"
                            className="text-foreground/80 hover:text-primary transition-colors font-medium"
                        >
                            Pricing
                        </a>
                        <a
                            href="#contact"
                            className="text-foreground/80 hover:text-primary transition-colors font-medium"
                        >
                            Contact
                        </a>
                    </div>

                    {/* Desktop CTA Buttons / User Menu */}
                    <div className="hidden lg:flex items-center gap-4">
                        {loading ? (
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        ) : isAuthenticated ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center gap-3 px-4 py-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                        {user?.name?.[0]?.toUpperCase() || "U"}
                                    </div>
                                    <span className="font-medium text-foreground max-w-[120px] truncate">
                                        {user?.name}
                                    </span>
                                    <svg
                                        className={`w-4 h-4 text-muted-foreground transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {isUserMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-card rounded-xl shadow-lg border border-border py-2 animate-fade-in-up">
                                        <div className="px-4 py-2 border-b border-border">
                                            <p className="font-medium text-foreground truncate">{user?.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                        </div>
                                        {isAdmin && (
                                            <Link
                                                href="/admin"
                                                className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                Admin Panel
                                            </Link>
                                        )}
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="ghost" className="text-foreground hover:text-primary">
                                        Log in
                                    </Button>
                                </Link>
                                <Link href="/signup">
                                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6">
                                        Sign up
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="lg:hidden p-2 text-foreground"
                        aria-label="Toggle menu"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {isMenuOpen ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="lg:hidden border-t border-border py-4 animate-fade-in-up">
                        <div className="flex flex-col gap-4">
                            <Link
                                href="/products"
                                className="text-foreground/80 hover:text-primary transition-colors font-medium py-2"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Products
                            </Link>
                            <a
                                href="#bundles"
                                className="text-foreground/80 hover:text-primary transition-colors font-medium py-2"
                            >
                                Bundles
                            </a>
                            <a
                                href="#pricing"
                                className="text-foreground/80 hover:text-primary transition-colors font-medium py-2"
                            >
                                Pricing
                            </a>
                            <a
                                href="#contact"
                                className="text-foreground/80 hover:text-primary transition-colors font-medium py-2"
                            >
                                Contact
                            </a>
                            <div className="flex flex-col gap-2 pt-4 border-t border-border">
                                {isAuthenticated ? (
                                    <>
                                        <div className="flex items-center gap-3 px-2 py-2">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                                {user?.name?.[0]?.toUpperCase() || "U"}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{user?.name}</p>
                                                <p className="text-xs text-muted-foreground">{user?.email}</p>
                                            </div>
                                        </div>
                                        {isAdmin && (
                                            <Link
                                                href="/admin"
                                                className="px-2 py-2 text-foreground hover:text-primary transition-colors font-medium"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                Admin Panel
                                            </Link>
                                        )}
                                        <Button
                                            variant="ghost"
                                            className="justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={handleLogout}
                                        >
                                            Logout
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                                            <Button variant="ghost" className="w-full justify-start text-foreground">
                                                Log in
                                            </Button>
                                        </Link>
                                        <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                                            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                                                Sign up
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
}

