"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import { ArrowRight, ChevronRight, ScanLine, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import ProductCard from "../ProductCard";

/**
 * Quick-commerce style blocks: a prominent search bar, a gradient promo hero,
 * a compact USP strip and a flash-deal rail with a live countdown.
 */

// ── Search bar ───────────────────────────────────────────────────

export function SearchBarBlock({ settings }) {
    const router = useRouter();
    const [term, setTerm] = useState("");

    const submit = (e) => {
        e.preventDefault();
        router.push(term.trim() ? `/products?search=${encodeURIComponent(term.trim())}` : "/products");
    };

    return (
        <form onSubmit={submit} className="flex items-center gap-3">
            <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--c-text-muted)]" />
                <input
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder={settings.placeholder || "Search for products, brands and more..."}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[var(--c-surface-alt)] border border-[var(--c-border)] text-[15px] placeholder:text-[var(--c-text-muted)] focus:outline-none focus:border-[var(--c-primary)] transition-colors"
                />
            </div>
            {settings.showScanner !== false && (
                <Link
                    href={settings.scannerHref || "/products"}
                    aria-label="Scan a barcode"
                    className="w-12 h-12 shrink-0 rounded-2xl bg-[var(--c-surface-alt)] border border-[var(--c-border)] flex items-center justify-center text-[var(--c-text)] hover:border-[var(--c-primary)] transition-colors"
                >
                    <ScanLine className="w-5 h-5" />
                </Link>
            )}
        </form>
    );
}

// ── Gradient promo hero ──────────────────────────────────────────

const HERO_HEIGHT = {
    compact: "min-h-[190px] lg:min-h-[260px]",
    normal: "min-h-[240px] lg:min-h-[340px]",
    tall: "min-h-[320px] lg:min-h-[440px]",
};

export function PromoHeroBlock({ settings, data }) {
    const slides = useMemo(() => {
        const configured = (settings.slides || []).filter(
            s => s.headingMain || s.headingTop || s.headingAccent || s.image
        );

        // Layouts saved before this block supported multiple slides stored the
        // content flat, so fold that into slide one rather than rendering blank.
        const legacy = !configured.length && (settings.headingMain || settings.image)
            ? [{
                headingTop: settings.headingTop, headingMain: settings.headingMain,
                headingAccent: settings.headingAccent, accentColor: settings.accentColor,
                image: settings.image, gradientFrom: settings.gradientFrom,
                gradientTo: settings.gradientTo, features: settings.features,
                buttonLabel: settings.buttonLabel, buttonHref: settings.buttonHref,
            }]
            : [];

        const ads = settings.useAds
            ? (data?.slides || []).map(ad => ({
                headingMain: ad.title,
                headingTop: "",
                headingAccent: ad.description || "",
                image: ad.mediaUrl,
                buttonLabel: settings.slides?.[0]?.buttonLabel || "Shop Now",
                buttonHref: ad.linkUrl || "/products",
            }))
            : [];

        return [...configured, ...legacy, ...ads];
    }, [settings, data]);

    const [index, setIndex] = useState(0);
    const interval = Math.max(2, Number(settings.interval) || 5) * 1000;

    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => setIndex(i => (i + 1) % slides.length), interval);
        return () => clearInterval(timer);
    }, [slides.length, interval]);

    if (!slides.length) return null;

    const slide = slides[Math.min(index, slides.length - 1)];
    const features = slide.features || [];
    const overlay = Math.min(90, Math.max(0, Number(settings.overlay ?? 45))) / 100;

    return (
        <div>
            <div
                className={cn(
                    "relative overflow-hidden rounded-3xl flex items-center",
                    HERO_HEIGHT[settings.height] || HERO_HEIGHT.normal
                )}
                style={{
                    background: `linear-gradient(115deg, ${slide.gradientFrom || "var(--c-primary-dark)"} 0%, ${slide.gradientTo || "var(--c-primary)"} 100%)`,
                }}
            >
                {/* The image fills the whole block; a scrim keeps the copy legible */}
                {slide.image && (
                    <>
                        <img
                            src={slide.image}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div
                            className="absolute inset-0"
                            style={{
                                background: `linear-gradient(100deg, rgba(0,0,0,${overlay + 0.15}) 0%, rgba(0,0,0,${overlay}) 45%, rgba(0,0,0,${Math.max(0, overlay - 0.25)}) 100%)`,
                            }}
                        />
                    </>
                )}

                <div className="relative z-10 px-6 py-7 lg:px-10 lg:py-10 max-w-[85%] sm:max-w-[70%]">
                    {slide.headingTop && (
                        <p className="text-white/90 text-[17px] lg:text-[22px] font-semibold leading-tight drop-shadow">
                            {slide.headingTop}
                        </p>
                    )}
                    {slide.headingMain && (
                        <h2 className="text-white text-[24px] lg:text-[38px] font-extrabold leading-[1.15] mt-0.5 drop-shadow">
                            {slide.headingMain}
                        </h2>
                    )}
                    {slide.headingAccent && (
                        <p
                            className="text-[24px] lg:text-[38px] font-extrabold leading-[1.15] drop-shadow"
                            style={{ color: slide.accentColor || "#FFE071" }}
                        >
                            {slide.headingAccent}
                        </p>
                    )}

                    {features.length > 0 && (
                        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4">
                            {features.map((feature, i) => {
                                const Icon = Icons[feature.icon] || Icons.Check;
                                return (
                                    <span key={i} className="flex items-center gap-1.5 text-white/90 text-[11px] lg:text-[13px] font-medium drop-shadow">
                                        <Icon className="w-3.5 h-3.5 shrink-0" />
                                        {feature.label}
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    {slide.buttonLabel && (
                        <Link
                            href={slide.buttonHref || "/products"}
                            className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-full bg-white text-[var(--c-text)] text-[14px] font-bold hover:bg-white/90 transition-colors"
                        >
                            {slide.buttonLabel}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    )}
                </div>
            </div>

            {settings.showDots !== false && slides.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-3">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setIndex(i)}
                            aria-label={`Slide ${i + 1}`}
                            className={cn(
                                "h-1.5 rounded-full transition-all",
                                i === index ? "w-6 bg-[var(--c-primary)]" : "w-1.5 bg-[var(--c-border)]"
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── USP strip ────────────────────────────────────────────────────

export function UspStripBlock({ settings }) {
    const items = settings.items || [];
    if (!items.length) return null;

    return (
        <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-2xl px-2 py-5">
            <div className="grid grid-cols-4 divide-x divide-[var(--c-border)]">
                {items.map((item, i) => {
                    const Icon = Icons[item.icon] || Icons.Check;
                    return (
                        <div key={i} className="flex flex-col items-center text-center px-2">
                            <Icon className="w-6 h-6 lg:w-7 lg:h-7 text-[var(--c-primary)] mb-2" strokeWidth={1.7} />
                            <p className="text-[12px] lg:text-[14px] font-bold text-[var(--c-text)] leading-tight">
                                {item.title}
                            </p>
                            {item.subtitle && (
                                <p className="text-[10px] lg:text-[12px] text-[var(--c-text-muted)] mt-0.5 leading-tight">
                                    {item.subtitle}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Section heading with a "See all" link ────────────────────────

function SectionHead({ title, href, right }) {
    return (
        <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-[20px] lg:text-[26px] font-extrabold text-[var(--c-text)]">{title}</h2>
            <div className="flex items-center gap-3">
                {right}
                {href && (
                    <Link
                        href={href}
                        className="flex items-center gap-0.5 text-[13px] font-bold text-[var(--c-primary)] shrink-0"
                    >
                        See All <ChevronRight className="w-4 h-4" />
                    </Link>
                )}
            </div>
        </div>
    );
}

// ── Flash deals ──────────────────────────────────────────────────

function Countdown({ endsAt }) {
    const target = useMemo(() => {
        if (!endsAt) return null;
        // Accepts a full ISO timestamp or the "YYYY-MM-DD HH:mm" an admin is
        // likely to type; the latter is read as local time, which is what they
        // mean when they set a sale to end at 9pm.
        const normalized = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/.test(String(endsAt).trim())
            ? String(endsAt).trim().replace(" ", "T")
            : endsAt;
        const parsed = new Date(normalized);
        return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
    }, [endsAt]);

    // null until mounted so the server and client agree on first paint.
    const [remaining, setRemaining] = useState(null);

    useEffect(() => {
        if (!target) return;
        const tick = () => setRemaining(Math.max(0, target - Date.now()));
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [target]);

    if (!target) return null;

    const total = remaining ?? 0;
    const parts = [
        Math.floor(total / 3600000),
        Math.floor(total / 60000) % 60,
        Math.floor(total / 1000) % 60,
    ];

    return (
        <span className="flex items-center gap-1.5">
            <Icons.AlarmClock className="w-4 h-4 text-[var(--c-danger)]" />
            <span className="flex items-center gap-1">
                {parts.map((part, i) => (
                    <span key={i} className="flex items-center gap-1">
                        {i > 0 && <span className="text-[var(--c-text-muted)] text-[12px]">:</span>}
                        <span className="px-1.5 py-0.5 rounded-md bg-[var(--c-danger)]/10 text-[var(--c-danger)] text-[12px] font-bold tabular-nums min-w-[26px] text-center">
                            {remaining === null ? "--" : String(part).padStart(2, "0")}
                        </span>
                    </span>
                ))}
            </span>
        </span>
    );
}

export function FlashDealsBlock({ settings, data }) {
    const products = data?.query || [];
    if (!products.length) return null;

    return (
        <div>
            <SectionHead
                title={settings.title || "Flash Deals"}
                href={settings.showViewAll !== false ? (settings.viewAllHref || "/products?onSale=true") : null}
                right={settings.endsAt ? <Countdown endsAt={settings.endsAt} /> : null}
            />
            {/* Scrolls horizontally on phones, which is what makes it feel like
                a deal rail rather than a grid. */}
            <div className="flex gap-3 overflow-x-auto hide-scrollbar snap-x pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 lg:gap-4">
                {products.map((product) => (
                    <div key={product._id} className="snap-start shrink-0 w-[42%] sm:w-[30%] lg:w-auto">
                        <ProductCard product={product} preset={data?.cardPreset} />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Category circles ─────────────────────────────────────────────

export function CategoryCirclesBlock({ settings, data }) {
    const categories = (data?.categories || []).slice(0, Number(settings.limit) || 5);
    if (!categories.length) return null;

    return (
        <div>
            <SectionHead
                title={settings.title || "Shop by Category"}
                href={settings.showViewAll !== false ? (settings.viewAllHref || "/products") : null}
            />
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 lg:gap-5">
                {categories.map((category) => (
                    <Link key={category._id} href={`/products?category=${category._id}`} className="group text-center">
                        <div className="aspect-square rounded-full overflow-hidden bg-[var(--c-surface-alt)] border border-[var(--c-border)] mb-2">
                            {category.image && (
                                <img
                                    src={category.image}
                                    alt={category.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            )}
                        </div>
                        <p className="text-[11px] lg:text-[13px] font-semibold text-[var(--c-text)] leading-tight">
                            {category.name}
                        </p>
                    </Link>
                ))}

                {/* Trailing tile into the full catalogue, like the reference */}
                {settings.showMoreTile !== false && (
                    <Link href={settings.viewAllHref || "/products"} className="group text-center">
                        <div className="aspect-square rounded-full bg-[var(--c-accent-soft)] border border-[var(--c-border)] mb-2 flex items-center justify-center">
                            <Icons.LayoutGrid className="w-6 h-6 text-[var(--c-primary)]" />
                        </div>
                        <p className="text-[11px] lg:text-[13px] font-semibold text-[var(--c-text)] leading-tight">
                            {settings.moreLabel || "More Categories"}
                        </p>
                    </Link>
                )}
            </div>
        </div>
    );
}

// ── Coupon strip ─────────────────────────────────────────────────

export function CouponStripBlock({ settings }) {
    return (
        <div
            className="flex items-center gap-4 rounded-2xl px-4 py-4 lg:px-6"
            style={{ backgroundColor: settings.background || "var(--c-accent-soft)" }}
        >
            {settings.image && (
                <img src={settings.image} alt="" className="w-12 h-12 lg:w-14 lg:h-14 object-contain shrink-0" />
            )}
            <div className="flex-1 min-w-0">
                <p className="text-[14px] lg:text-[17px] font-bold text-[var(--c-text)] leading-tight">
                    {settings.heading}
                </p>
                {settings.code && (
                    <p className="text-[12px] lg:text-[13px] text-[var(--c-text-muted)] mt-1">
                        {settings.codeLabel || "Use Code:"}{" "}
                        <span className="font-mono font-bold bg-[var(--c-primary)] text-white px-2 py-0.5 rounded">
                            {settings.code}
                        </span>
                    </p>
                )}
            </div>
            {settings.buttonLabel && (
                <Link
                    href={settings.buttonHref || "/products"}
                    className="shrink-0 inline-flex items-center gap-1.5 px-4 lg:px-6 py-2.5 rounded-full bg-[var(--c-primary)] text-white text-[13px] font-bold hover:bg-[var(--c-primary-dark)] transition-colors"
                >
                    {settings.buttonLabel}
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            )}
        </div>
    );
}

// ── Product grid with a "See all" header ─────────────────────────

export function ProductSectionBlock({ settings, data }) {
    const products = data?.query || [];
    if (!products.length) return null;

    const columns = Number(settings.columns) || 4;

    return (
        <div>
            <SectionHead
                title={settings.title || "Products"}
                href={settings.showViewAll !== false ? (settings.viewAllHref || "/products") : null}
            />
            <div
                className={cn(
                    "grid gap-3 lg:gap-4",
                    columns === 2 ? "grid-cols-2"
                        : columns === 3 ? "grid-cols-2 lg:grid-cols-3"
                        : columns === 5 ? "grid-cols-2 lg:grid-cols-5"
                        : "grid-cols-2 lg:grid-cols-4"
                )}
            >
                {products.map((product) => (
                    <ProductCard key={product._id} product={product} preset={data?.cardPreset} />
                ))}
            </div>
        </div>
    );
}
