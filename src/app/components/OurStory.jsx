"use client";

import { getBrandContent, getSiteName } from "@/config/brandContent";

const siteName = getSiteName();
const content = getBrandContent(siteName);
const storyContent = content.ourStory;
const isVedicBro = siteName.toLowerCase().includes('vedicbro');

export default function OurStory() {
    return (
        <section className="py-20 lg:py-28 bg-background relative overflow-hidden">

            <div className="container mx-auto px-4 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                    {/* Left - Image Grid (Dark Modern) */}
                    <div className="relative animate-slide-in-left">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Main Large Image Box */}
                            <div className="col-span-2 relative aspect-[16/10] rounded-3xl overflow-hidden border border-border group">
                                <div className={`absolute inset-0 bg-card`}></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center p-8">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-primary flex items-center justify-center text-primary text-2xl font-bold">
                                            E
                                        </div>
                                        <h3 className="text-2xl font-black text-foreground uppercase tracking-tight mb-2">
                                            {isVedicBro ? 'Pure Ayurveda' : 'Premium Craft'}
                                        </h3>
                                        <p className="text-muted-foreground text-sm">Since 1998</p>
                                    </div>
                                </div>
                                <div className="absolute inset-0 border-2 border-primary/20 scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 rounded-2xl"></div>
                            </div>

                            {/* Smaller Boxes */}
                            <div className="relative aspect-square rounded-3xl overflow-hidden border border-border bg-muted flex items-center justify-center group hover:bg-card transition-colors">
                                <div className="text-center">
                                    <span className="text-4xl mb-2 block animate-bounce-slow">🌿</span>
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Natural</span>
                                </div>
                            </div>

                            <div className="relative aspect-square rounded-3xl overflow-hidden border border-border bg-muted flex items-center justify-center group hover:bg-card transition-colors">
                                <div className="text-center">
                                    <span className="text-4xl mb-2 block animate-pulse">✨</span>
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Quality</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right - Content */}
                    <div className="space-y-8 animate-slide-in-right">
                        <div>
                            <p className="text-xs font-bold tracking-[0.3em] text-primary uppercase mb-4">
                                {storyContent.sectionLabel}
                            </p>
                            <h2 className="font-heading text-4xl lg:text-5xl font-black text-foreground leading-[0.9] tracking-tight">
                                {storyContent.title}
                            </h2>
                        </div>

                        <div className="space-y-6 text-lg text-muted-foreground font-light leading-relaxed">
                            <p>{storyContent.description}</p>
                            <p>{storyContent.additionalText}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border">
                            {storyContent.stats.map((stat, index) => (
                                <div key={index}>
                                    <p className="font-heading text-3xl lg:text-4xl font-black text-foreground mb-1">
                                        {stat.value}
                                    </p>
                                    <p className="text-xs font-bold text-primary uppercase tracking-wider">
                                        {stat.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
