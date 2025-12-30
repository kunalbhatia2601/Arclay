"use client";

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
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-32 h-40 mx-auto bg-gradient-to-b from-amber-600 to-amber-800 rounded-xl shadow-lg mb-4"></div>
                                        <span className="text-amber-900 font-semibold">Premium Pickles</span>
                                    </div>
                                </div>
                            </div>

                            {/* Smaller Images */}
                            <div className="relative aspect-square rounded-xl overflow-hidden shadow-lg hover-lift">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-200 via-green-300 to-green-500"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-16 h-20 bg-gradient-to-b from-green-600 to-green-800 rounded-lg"></div>
                                </div>
                            </div>

                            <div className="relative aspect-square rounded-xl overflow-hidden shadow-lg hover-lift">
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 via-yellow-300 to-yellow-500"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-16 h-20 bg-gradient-to-b from-yellow-600 to-yellow-700 rounded-lg"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right - Content */}
                    <div className="space-y-6 animate-slide-in-right">
                        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                            OUR STORY
                        </p>

                        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                            Rooted in tradition, perfected for the modern palate.
                        </h2>

                        <p className="text-lg text-muted-foreground leading-relaxed">
                            We source the finest ingredients to bring authentic flavours to your table.
                            Each jar tells a story of heritage, crafted with recipes passed down through generations.
                        </p>

                        <p className="text-muted-foreground leading-relaxed">
                            From the sun-ripened mangoes of South India to the aromatic spices of the
                            Western Ghats, every ingredient is handpicked to ensure uncompromising quality
                            and taste that takes you back to grandmother&apos;s kitchen.
                        </p>

                        <div className="flex flex-wrap gap-6 pt-4">
                            <div className="text-center">
                                <p className="font-serif text-3xl font-bold text-primary">25+</p>
                                <p className="text-sm text-muted-foreground">Years of Heritage</p>
                            </div>
                            <div className="text-center">
                                <p className="font-serif text-3xl font-bold text-primary">50+</p>
                                <p className="text-sm text-muted-foreground">Unique Recipes</p>
                            </div>
                            <div className="text-center">
                                <p className="font-serif text-3xl font-bold text-primary">10K+</p>
                                <p className="text-sm text-muted-foreground">Happy Customers</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
