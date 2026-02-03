"use client";

import { Button } from "@/components/ui/button";
import { getBrandContent, getSiteName } from "@/config/brandContent";
import Link from "next/link";

const siteName = getSiteName();
const content = getBrandContent(siteName);

// Fallback images if not provided in content
const MAIN_IMG = "https://images.unsplash.com/photo-1757358967353-0a256c8f8f03?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

export default function Hero() {
    const heroContent = content.hero;

    return (
        <section className="relative min-h-[95vh] flex items-center pt-24 pb-12 overflow-hidden bg-background">

            {/* Background Texture / Doodle (Optional) */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }}>
            </div>

            <div className="container mx-auto px-4 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

                    {/* Left Content - Bold & Direct */}
                    <div className="space-y-8 lg:pr-12 animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            <span className="text-xs font-bold text-foreground tracking-widest uppercase">New Collection</span>
                        </div>

                        <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-foreground leading-[0.9] tracking-tight">
                            {heroContent.titleLine1 || "CRAFTED"} <br />
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-foreground">
                                {heroContent.titleLine2 || "QUALITY"}
                            </span>
                        </h1>

                        <p className="text-lg text-muted-foreground max-w-md leading-relaxed font-light">
                            {heroContent.subtitle}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Link href="/shop">
                                <Button className="h-14 px-8 bg-primary hover:bg-foreground hover:text-background text-primary-foreground text-base font-bold rounded-full transition-all duration-300 shadow-xl hover:shadow-primary/20">
                                    {heroContent.ctaPrimary} <span className="ml-2">→</span>
                                </Button>
                            </Link>
                            <Button variant="outline" className="h-14 px-8 border-border text-foreground hover:bg-accent hover:border-foreground/20 rounded-full text-base font-bold">
                                {heroContent.ctaSecondary}
                            </Button>
                        </div>

                        {/* Trust/Stats Mini-Block */}
                        <div className="flex items-center gap-6 pt-8 border-t border-border">
                            <div className="flex -space-x-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                                        <div className="w-full h-full bg-linear-to-br from-gray-500 to-gray-700"></div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-black text-foreground">4.9/5</span>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">From 2k+ Reviews</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Circular Composition */}
                    <div className="relative flex justify-center lg:justify-end animate-slide-in-right">
                        <div className="relative w-[350px] h-[350px] md:w-[500px] md:h-[500px]">

                            {/* Decorative Orbit Rings */}
                            <div className="absolute inset-0 rounded-full border border-border animate-[spin_10s_linear_infinite]"></div>
                            <div className="absolute inset-4 rounded-full border border-border animate-[spin_15s_linear_infinite_reverse]"></div>

                            {/* Main Circular Mask */}
                            <div className="absolute inset-8 rounded-full overflow-hidden border-4 border-muted shadow-2xl">
                                <img
                                    src={MAIN_IMG}
                                    alt="Hero Product"
                                    className="w-full h-full object-cover scale-110 hover:scale-100 transition-transform duration-700"
                                />
                                {/* Gradient Overlay for Depth */}
                                <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/30"></div>
                            </div>

                            {/* Floating "Experience" Badge */}
                            <div className="absolute -left-4 top-1/2 -translate-y-1/2 bg-card border border-border p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-float">
                                <div className="p-3 bg-primary/20 rounded-full text-primary">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                                </div>
                                <div>
                                    <p className="text-foreground font-bold text-sm">Valid Quality</p>
                                    <p className="text-muted-foreground text-xs">Certified Organic</p>
                                </div>
                            </div>

                            {/* Floating Price Tag */}
                            <div className="absolute right-0 bottom-12 animate-float" style={{ animationDelay: '1s' }}>
                                <div className="bg-foreground text-background px-5 py-2 rounded-full font-black text-lg shadow-xl transform rotate-[-6deg] hover:rotate-0 transition-transform">
                                    Start ₹249
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* Benefits Bar - Floating Bottom */}
            {/* <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex items-center bg-[#1E1E1E]/90 backdrop-blur-md border border-white/10 rounded-full p-2 pr-6 pl-8 gap-12 shadow-2xl max-w-4xl w-full mx-4 justify-between">
                {[
                    { label: 'Shipping', val: 'Fast Delivery' },
                    { label: 'Quality', val: '100% Authentic' },
                    { label: 'Support', val: '24/7 Service' }
                ].map(benefit => (
                    <div key={benefit.label} className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">{benefit.label}</span>
                        <span className="text-sm font-bold text-white hover:text-primary transition-colors">{benefit.val}</span>
                    </div>
                ))}
                <div className="h-8 w-[1px] bg-white/10 ml-auto mr-4"></div>
                <Link href="/shop">
                    <Button className="bg-primary text-black font-bold h-12 rounded-full px-8 hover:bg-white transition-colors">
                        Start Shopping
                    </Button>
                </Link>
            </div> */}

        </section>
    );
}
