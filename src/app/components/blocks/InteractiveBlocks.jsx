"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Blocks that need browser behaviour: auto-rotating slides, a ticking clock,
 * a CSS animation loop. Everything else stays a server component.
 */

// ── Hero slider ──────────────────────────────────────────────────

const HERO_HEIGHT = {
    compact: "h-[40vh] min-h-[320px] lg:h-[55vh] lg:min-h-[420px]",
    normal: "h-[50vh] min-h-[420px] sm:min-h-[500px] lg:h-[75vh] lg:min-h-[640px]",
    tall: "h-[65vh] min-h-[520px] lg:h-[88vh] lg:min-h-[720px]",
};

export function HeroSliderBlock({ settings, slides = [] }) {
    const [index, setIndex] = useState(0);

    const interval = Math.max(2, Number(settings.interval) || 6) * 1000;

    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => setIndex(i => (i + 1) % slides.length), interval);
        return () => clearInterval(timer);
    }, [slides.length, interval]);

    if (!slides.length) return null;

    const active = slides[index] || slides[0];

    return (
        <div
            className={cn(
                "relative w-full rounded-[var(--radius-hero)] overflow-hidden bg-site-surface-alt",
                HERO_HEIGHT[settings.height] || HERO_HEIGHT.normal
            )}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={active._id || index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    className="absolute inset-0 z-0"
                >
                    {active.mediaType === "video" ? (
                        <video src={active.mediaUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                    ) : (
                        <img src={active.mediaUrl} alt={active.title || ""} className="w-full h-full object-cover opacity-80" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-transparent z-10" />
                </motion.div>
            </AnimatePresence>

            <div className="relative z-20 h-full w-full flex flex-col justify-center px-6 sm:px-8 lg:px-24 max-w-5xl">
                <motion.div
                    key={`content-${active._id || index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                >
                    {settings.badgeText && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-4 sm:mb-6 bg-site-accent text-white">
                            <Sparkles className="w-3 h-3" strokeWidth={3} />
                            {settings.badgeText}
                        </div>
                    )}

                    <h1 className="text-[36px] sm:text-[44px] lg:text-[72px] font-serif font-bold mb-3 sm:mb-5 leading-tight text-white drop-shadow">
                        {active.title}
                    </h1>

                    {active.description && (
                        <p className="text-[14px] sm:text-[16px] lg:text-[18px] mb-6 sm:mb-10 max-w-xl leading-relaxed text-white/90 drop-shadow">
                            {active.description}
                        </p>
                    )}

                    <div className="flex flex-row flex-wrap gap-3 sm:gap-4">
                        {settings.primaryLabel && (
                            <Link
                                href={active.linkUrl || settings.primaryHref || "/products"}
                                className="bg-site-primary hover:bg-site-primary-dark text-site-on-primary rounded-[var(--radius-btn)] px-6 sm:px-10 py-3.5 sm:py-4 text-[13px] sm:text-sm font-bold transition-all flex items-center gap-2 shadow-lg"
                            >
                                {settings.primaryLabel}
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        )}
                        {settings.secondaryLabel && (
                            <Link
                                href={settings.secondaryHref || "/products"}
                                className="rounded-[var(--radius-btn)] px-6 sm:px-10 py-3.5 sm:py-4 text-[13px] sm:text-sm font-bold transition-all border border-white/20 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
                            >
                                {settings.secondaryLabel}
                            </Link>
                        )}
                    </div>
                </motion.div>
            </div>

            {slides.length > 1 && (
                <div className="absolute bottom-6 sm:bottom-10 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-12 flex items-center gap-2 z-30">
                    {slides.map((slide, i) => (
                        <button
                            key={slide._id || i}
                            onClick={() => setIndex(i)}
                            aria-label={`Go to slide ${i + 1}`}
                            className={cn(
                                "h-1.5 rounded-full transition-all duration-300",
                                i === index ? "bg-white w-8" : "bg-white/30 w-1.5"
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Marquee ──────────────────────────────────────────────────────

const MARQUEE_DURATION = { slow: "60s", normal: "35s", fast: "18s" };

export function MarqueeBlock({ settings }) {
    const items = (settings.items || []).map(i => i.text).filter(Boolean);
    if (!items.length) return null;

    // The track is duplicated so the loop has no visible seam when it resets.
    const track = [...items, ...items];
    const duration = MARQUEE_DURATION[settings.speed] || MARQUEE_DURATION.normal;

    return (
        <div
            className="relative overflow-hidden py-3"
            style={{
                backgroundColor: settings.bg || "var(--c-text)",
                color: settings.fg || "#fff",
            }}
        >
            <div
                className="flex gap-12 whitespace-nowrap w-max"
                style={{
                    animation: `block-marquee ${duration} linear infinite`,
                    animationDirection: settings.direction === "right" ? "reverse" : "normal",
                }}
            >
                {track.map((text, i) => (
                    <span key={i} className="text-sm font-semibold uppercase tracking-widest">
                        {text}
                    </span>
                ))}
            </div>

            <style jsx>{`
                @keyframes block-marquee {
                    from { transform: translateX(0); }
                    to   { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
}

// ── Countdown ────────────────────────────────────────────────────

export function CountdownBlock({ settings }) {
    const target = useMemo(() => {
        const parsed = new Date(settings.endsAt);
        return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
    }, [settings.endsAt]);

    // null until mounted: rendering a live value on the server would mismatch
    // the client on hydration.
    const [remaining, setRemaining] = useState(null);

    useEffect(() => {
        if (!target) return;
        const tick = () => setRemaining(Math.max(0, target - Date.now()));
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [target]);

    if (!target) return null;
    if (remaining === 0 && settings.hideWhenExpired) return null;

    const total = remaining ?? 0;
    const parts = [
        { label: "Days", value: Math.floor(total / 86400000) },
        { label: "Hours", value: Math.floor(total / 3600000) % 24 },
        { label: "Mins", value: Math.floor(total / 60000) % 60 },
        { label: "Secs", value: Math.floor(total / 1000) % 60 },
    ];

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 lg:p-8 rounded-[var(--radius-card)] bg-site-text text-white">
            <p className="font-serif text-2xl font-bold">{settings.heading}</p>

            <div className="flex gap-3">
                {parts.map((part) => (
                    <div key={part.label} className="text-center">
                        <div className="w-16 h-16 rounded-[var(--radius-btn)] bg-white/10 flex items-center justify-center">
                            <span className="text-2xl font-bold tabular-nums">
                                {remaining === null ? "--" : String(part.value).padStart(2, "0")}
                            </span>
                        </div>
                        <p className="text-[10px] uppercase tracking-widest mt-1.5 text-white/60">
                            {part.label}
                        </p>
                    </div>
                ))}
            </div>

            {settings.buttonLabel && (
                <Link
                    href={settings.buttonHref || "/products"}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-[var(--radius-btn)] bg-site-primary text-site-on-primary text-sm font-bold hover:bg-site-primary-dark transition-colors"
                >
                    {settings.buttonLabel}
                    <ArrowRight className="w-4 h-4" />
                </Link>
            )}
        </div>
    );
}
