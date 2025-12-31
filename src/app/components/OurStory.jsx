"use client";

import { getBrandContent, getSiteName } from "@/config/brandContent";

const siteName = getSiteName();
const content = getBrandContent(siteName);
const storyContent = content.ourStory;
const isVedicBro = siteName.toLowerCase().includes('vedicbro');

export default function OurStory() {
    return (
        <section className="py-20 lg:py-28 bg-background">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left - Image Grid */}
                    <div className="relative animate-slide-in-left">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Main Large Image */}
                            <div className="col-span-2 relative aspect-[16/10] rounded-2xl overflow-hidden shadow-xl hover-lift">
                                <div className={`absolute inset-0 bg-gradient-to-br ${isVedicBro ? 'from-teal-200 via-teal-300 to-teal-500' : 'from-amber-200 via-amber-300 to-amber-500'}`}></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className={`w-32 h-40 mx-auto bg-gradient-to-b ${isVedicBro ? 'from-teal-600 to-teal-800' : 'from-amber-600 to-amber-800'} rounded-xl shadow-lg mb-4`}></div>
                                        <span className={`${isVedicBro ? 'text-teal-900' : 'text-amber-900'} font-semibold`}>
                                            {isVedicBro ? 'Ayurvedic Wellness' : 'Premium Pickles'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Smaller Images */}
                            <div className="relative aspect-square rounded-xl overflow-hidden shadow-lg hover-lift">
                                <div className={`absolute inset-0 bg-gradient-to-br ${isVedicBro ? 'from-emerald-200 via-emerald-300 to-emerald-500' : 'from-green-200 via-green-300 to-green-500'}`}></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className={`w-16 h-20 bg-gradient-to-b ${isVedicBro ? 'from-emerald-600 to-emerald-800' : 'from-green-600 to-green-800'} rounded-lg`}></div>
                                </div>
                            </div>

                            <div className="relative aspect-square rounded-xl overflow-hidden shadow-lg hover-lift">
                                <div className={`absolute inset-0 bg-gradient-to-br ${isVedicBro ? 'from-lime-200 via-lime-300 to-lime-500' : 'from-yellow-200 via-yellow-300 to-yellow-500'}`}></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className={`w-16 h-20 bg-gradient-to-b ${isVedicBro ? 'from-lime-600 to-lime-700' : 'from-yellow-600 to-yellow-700'} rounded-lg`}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right - Content */}
                    <div className="space-y-6 animate-slide-in-right">
                        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                            {storyContent.sectionLabel}
                        </p>

                        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                            {storyContent.title}
                        </h2>

                        <p className="text-lg text-muted-foreground leading-relaxed">
                            {storyContent.description}
                        </p>

                        <p className="text-muted-foreground leading-relaxed">
                            {storyContent.additionalText}
                        </p>

                        <div className="flex flex-wrap gap-6 pt-4">
                            {storyContent.stats.map((stat, index) => (
                                <div key={index} className="text-center">
                                    <p className="font-serif text-3xl font-bold text-primary">{stat.value}</p>
                                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
