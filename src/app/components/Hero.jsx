"use client";

import { Button } from "@/components/ui/button";
import { getBrandContent, getSiteName } from "@/config/brandContent";

const siteName = getSiteName();
const content = getBrandContent(siteName);
const isVedicBro = siteName.toLowerCase().includes('vedicbro');

// Color mappings for product cards
const colorMap = {
    amber: {
        bg: "from-amber-100 to-amber-200",
        inner: "from-amber-600 to-amber-800",
        border: "border-amber-300/50",
        text: "text-amber-900"
    },
    yellow: {
        bg: "from-yellow-50 to-yellow-100",
        inner: "from-yellow-400 to-yellow-600",
        border: "border-yellow-200/50",
        text: "text-yellow-900"
    },
    green: {
        bg: "from-green-50 to-green-100",
        inner: "from-green-500 to-green-700",
        border: "border-green-200/50",
        text: "text-green-900"
    },
    orange: {
        bg: "from-orange-50 to-orange-100",
        inner: "from-orange-400 to-orange-600",
        border: "border-orange-200/50",
        text: "text-orange-900"
    },
    emerald: {
        bg: "from-emerald-50 to-emerald-100",
        inner: "from-emerald-500 to-emerald-700",
        border: "border-emerald-200/50",
        text: "text-emerald-900"
    },
    teal: {
        bg: "from-teal-100 to-teal-200",
        inner: "from-teal-600 to-teal-800",
        border: "border-teal-300/50",
        text: "text-teal-900"
    },
    lime: {
        bg: "from-lime-50 to-lime-100",
        inner: "from-lime-500 to-lime-700",
        border: "border-lime-200/50",
        text: "text-lime-900"
    }
};

export default function Hero() {
    const heroContent = content.hero;
    const products = heroContent.products;

    return (
        <section className="relative min-h-screen flex items-center bg-background bg-pattern pt-20">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left Content */}
                    <div className="space-y-8 animate-fade-in-up">
                        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight">
                            {heroContent.titleLine1}
                            <br />
                            <span className="text-gradient">{heroContent.titleLine2}</span>
                        </h1>

                        <p className="text-lg md:text-xl text-muted-foreground max-w-md leading-relaxed">
                            {heroContent.subtitle}
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <Button
                                size="lg"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 text-base font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                            >
                                {heroContent.ctaPrimary}
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-2 border-foreground text-foreground hover:bg-foreground hover:text-background rounded-full px-8 py-6 text-base font-medium transition-all"
                            >
                                {heroContent.ctaSecondary}
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
                                {/* Center Product - Large */}
                                {products[0] && (
                                    <div className="absolute z-10 animate-float">
                                        <div className={`w-40 h-56 md:w-48 md:h-64 lg:w-56 lg:h-72 bg-gradient-to-b ${colorMap[products[0].color]?.bg || colorMap.amber.bg} rounded-xl shadow-2xl flex flex-col items-center justify-center p-4 border ${colorMap[products[0].color]?.border || colorMap.amber.border}`}>
                                            <div className={`w-full h-3/4 bg-gradient-to-b ${colorMap[products[0].color]?.inner || colorMap.amber.inner} rounded-lg mb-2`}></div>
                                            <span className={`text-xs font-semibold ${colorMap[products[0].color]?.text || colorMap.amber.text}`}>{products[0].name}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Top Left Product */}
                                {products[1] && (
                                    <div className="absolute -top-4 left-4 md:left-8 z-20 animate-float delay-200">
                                        <div className={`w-24 h-32 md:w-28 md:h-36 bg-gradient-to-b ${colorMap[products[1].color]?.bg || colorMap.yellow.bg} rounded-lg shadow-xl flex flex-col items-center justify-center p-2 border ${colorMap[products[1].color]?.border || colorMap.yellow.border} -rotate-6`}>
                                            <div className={`w-full h-3/4 bg-gradient-to-b ${colorMap[products[1].color]?.inner || colorMap.yellow.inner} rounded mb-1`}></div>
                                            <span className={`text-[10px] font-semibold ${colorMap[products[1].color]?.text || colorMap.yellow.text}`}>{products[1].name}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Top Right Product */}
                                {products[2] && (
                                    <div className="absolute -top-4 right-4 md:right-8 z-20 animate-float delay-300">
                                        <div className={`w-24 h-32 md:w-28 md:h-36 bg-gradient-to-b ${colorMap[products[2].color]?.bg || colorMap.amber.bg} rounded-lg shadow-xl flex flex-col items-center justify-center p-2 border ${colorMap[products[2].color]?.border || colorMap.amber.border} rotate-6`}>
                                            <div className={`w-full h-3/4 bg-gradient-to-b ${colorMap[products[2].color]?.inner || colorMap.amber.inner} rounded mb-1`}></div>
                                            <span className={`text-[10px] font-semibold ${colorMap[products[2].color]?.text || colorMap.amber.text}`}>{products[2].name}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Bottom Left Product */}
                                {products[3] && (
                                    <div className="absolute bottom-8 left-0 md:left-4 z-5 animate-float delay-400">
                                        <div className={`w-20 h-28 md:w-24 md:h-32 bg-gradient-to-b ${colorMap[products[3].color]?.bg || colorMap.green.bg} rounded-lg shadow-lg flex flex-col items-center justify-center p-2 border ${colorMap[products[3].color]?.border || colorMap.green.border} -rotate-3`}>
                                            <div className={`w-full h-3/4 bg-gradient-to-b ${colorMap[products[3].color]?.inner || colorMap.green.inner} rounded mb-1`}></div>
                                            <span className={`text-[10px] font-semibold ${colorMap[products[3].color]?.text || colorMap.green.text}`}>{products[3].name}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Bottom Right Product */}
                                {products[4] && (
                                    <div className="absolute bottom-8 right-0 md:right-4 z-5 animate-float delay-500">
                                        <div className={`w-20 h-28 md:w-24 md:h-32 bg-gradient-to-b ${colorMap[products[4].color]?.bg || colorMap.orange.bg} rounded-lg shadow-lg flex flex-col items-center justify-center p-2 border ${colorMap[products[4].color]?.border || colorMap.orange.border} rotate-3`}>
                                            <div className={`w-full h-3/4 bg-gradient-to-b ${colorMap[products[4].color]?.inner || colorMap.orange.inner} rounded mb-1`}></div>
                                            <span className={`text-[10px] font-semibold ${colorMap[products[4].color]?.text || colorMap.orange.text}`}>{products[4].name}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Small Product - Right Side */}
                                {products[5] && (
                                    <div className="absolute right-0 md:right-2 top-1/3 z-15 animate-float delay-100">
                                        <div className={`w-16 h-24 md:w-20 md:h-28 bg-gradient-to-b ${colorMap[products[5].color]?.bg || colorMap.emerald.bg} rounded-lg shadow-lg flex flex-col items-center justify-center p-1 border ${colorMap[products[5].color]?.border || colorMap.emerald.border} rotate-12`}>
                                            <div className={`w-full h-3/4 bg-gradient-to-b ${colorMap[products[5].color]?.inner || colorMap.emerald.inner} rounded mb-1`}></div>
                                            <span className={`text-[8px] font-semibold ${colorMap[products[5].color]?.text || colorMap.emerald.text}`}>{products[5].name}</span>
                                        </div>
                                    </div>
                                )}
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
