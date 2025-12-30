"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
            <nav className="container mx-auto px-4 lg:px-8">
                <div className="flex items-center justify-between h-16 lg:h-20">
                    {/* Logo */}
                    <a href="/" className="flex items-center gap-2">
                        <span className="font-serif text-2xl lg:text-3xl font-bold text-foreground tracking-wide">
                            ESSVORA
                        </span>
                    </a>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-8">
                        <a
                            href="#products"
                            className="text-foreground/80 hover:text-primary transition-colors font-medium"
                        >
                            Products
                        </a>
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

                    {/* Desktop CTA Buttons */}
                    <div className="hidden lg:flex items-center gap-4">
                        <Button variant="ghost" className="text-foreground hover:text-primary">
                            Log in
                        </Button>
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6">
                            Sign up
                        </Button>
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
                            <a
                                href="#products"
                                className="text-foreground/80 hover:text-primary transition-colors font-medium py-2"
                            >
                                Products
                            </a>
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
                                <Button variant="ghost" className="justify-start text-foreground">
                                    Log in
                                </Button>
                                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                                    Sign up
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
}
