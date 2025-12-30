"use client";

import { Button } from "@/components/ui/button";

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center bg-background bg-pattern pt-20">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left Content */}
                    <div className="space-y-8 animate-fade-in-up">
                        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight">
                            Crafted Flavours.
                            <br />
                            <span className="text-gradient">Timeless Taste.</span>
                        </h1>

                        <p className="text-lg md:text-xl text-muted-foreground max-w-md leading-relaxed">
                            Premium pickles & snacks made with patience, purity, and passion.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <Button
                                size="lg"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 text-base font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                            >
                                SHOP NOW
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-2 border-foreground text-foreground hover:bg-foreground hover:text-background rounded-full px-8 py-6 text-base font-medium transition-all"
                            >
                                EXPLORE OUR STORY
                            </Button>
                        </div>
                    </div>

                    {/* Right Content - Product Showcase */}
                    <div className="relative animate-slide-in-right">
                        <div className="relative w-full aspect-square max-w-lg mx-auto">
                            {/* Background Circle */}
                            <div className="absolute inset-0 bg-muted rounded-full opacity-50"></div>

                            {/* Product Images Grid */}
                            <div className="relative w-full h-full flex items-center justify-center">
                                {/* Center Product - Large Jar */}
                                <div className="absolute z-10 animate-float">
                                    <div className="w-40 h-56 md:w-48 md:h-64 lg:w-56 lg:h-72 bg-gradient-to-b from-amber-100 to-amber-200 rounded-xl shadow-2xl flex flex-col items-center justify-center p-4 border border-amber-300/50">
                                        <div className="w-full h-3/4 bg-gradient-to-b from-amber-600 to-amber-800 rounded-lg mb-2"></div>
                                        <span className="text-xs font-semibold text-amber-900">Mango Pickle</span>
                                    </div>
                                </div>

                                {/* Top Left Product */}
                                <div className="absolute -top-4 left-4 md:left-8 z-20 animate-float delay-200">
                                    <div className="w-24 h-32 md:w-28 md:h-36 bg-gradient-to-b from-yellow-50 to-yellow-100 rounded-lg shadow-xl flex flex-col items-center justify-center p-2 border border-yellow-200/50 -rotate-6">
                                        <div className="w-full h-3/4 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded mb-1"></div>
                                        <span className="text-[10px] font-semibold text-yellow-900">Banana Chips</span>
                                    </div>
                                </div>

                                {/* Top Right Product */}
                                <div className="absolute -top-4 right-4 md:right-8 z-20 animate-float delay-300">
                                    <div className="w-24 h-32 md:w-28 md:h-36 bg-gradient-to-b from-amber-50 to-amber-100 rounded-lg shadow-xl flex flex-col items-center justify-center p-2 border border-amber-200/50 rotate-6">
                                        <div className="w-full h-3/4 bg-gradient-to-b from-amber-700 to-amber-900 rounded mb-1"></div>
                                        <span className="text-[10px] font-semibold text-amber-900">Roasted Nuts</span>
                                    </div>
                                </div>

                                {/* Bottom Left Product */}
                                <div className="absolute bottom-8 left-0 md:left-4 z-5 animate-float delay-400">
                                    <div className="w-20 h-28 md:w-24 md:h-32 bg-gradient-to-b from-green-50 to-green-100 rounded-lg shadow-lg flex flex-col items-center justify-center p-2 border border-green-200/50 -rotate-3">
                                        <div className="w-full h-3/4 bg-gradient-to-b from-green-500 to-green-700 rounded mb-1"></div>
                                        <span className="text-[10px] font-semibold text-green-900">Lime</span>
                                    </div>
                                </div>

                                {/* Bottom Right Product */}
                                <div className="absolute bottom-8 right-0 md:right-4 z-5 animate-float delay-500">
                                    <div className="w-20 h-28 md:w-24 md:h-32 bg-gradient-to-b from-orange-50 to-orange-100 rounded-lg shadow-lg flex flex-col items-center justify-center p-2 border border-orange-200/50 rotate-3">
                                        <div className="w-full h-3/4 bg-gradient-to-b from-orange-400 to-orange-600 rounded mb-1"></div>
                                        <span className="text-[10px] font-semibold text-orange-900">Quinoa Puffs</span>
                                    </div>
                                </div>

                                {/* Small Product - Right Side */}
                                <div className="absolute right-0 md:right-2 top-1/3 z-15 animate-float delay-100">
                                    <div className="w-16 h-24 md:w-20 md:h-28 bg-gradient-to-b from-emerald-50 to-emerald-100 rounded-lg shadow-lg flex flex-col items-center justify-center p-1 border border-emerald-200/50 rotate-12">
                                        <div className="w-full h-3/4 bg-gradient-to-b from-emerald-500 to-emerald-700 rounded mb-1"></div>
                                        <span className="text-[8px] font-semibold text-emerald-900">Mixed Veg</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-muted/50 to-transparent"></div>
        </section>
    );
}
