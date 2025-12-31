"use client";

import { getBrandContent, getSiteName } from "@/config/brandContent";

const siteName = getSiteName();
const content = getBrandContent(siteName);
const whyUsContent = content.whyUs;

// Icon components based on icon type
const icons = {
    leaf: (
        <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 5C20 5 8 12 8 22C8 28.627 13.373 34 20 34C26.627 34 32 28.627 32 22C32 12 20 5 20 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 34V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M14 24C14 24 17 21 20 21C23 21 26 24 26 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
    jar: (
        <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 32H32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 32V14C12 12.895 12.895 12 14 12H26C27.105 12 28 12.895 28 14V32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 12H30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M16 8H24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M16 18H24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M16 24H24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
    "no-preservatives": (
        <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="2" />
            <path d="M12 12L28 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M17 16L23 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
    package: (
        <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 12L20 6L32 12V28L20 34L8 28V12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M20 6V34" stroke="currentColor" strokeWidth="2" />
            <path d="M8 12L20 18L32 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M15 24L18 27L25 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
};

export default function WhyEssvora() {
    return (
        <section className="py-20 lg:py-28 bg-muted">
            <div className="container mx-auto px-4 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase mb-4">
                        {whyUsContent.sectionTitle}
                    </p>
                    <div className="decorative-line mx-auto"></div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                    {whyUsContent.features.map((feature, index) => (
                        <div
                            key={feature.id}
                            className="group text-center animate-fade-in-up"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Icon */}
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-card flex items-center justify-center text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg group-hover:scale-110">
                                {icons[feature.icon] || icons.leaf}
                            </div>

                            {/* Title */}
                            <h3 className="font-medium text-sm text-foreground leading-tight">
                                {feature.title}
                            </h3>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
