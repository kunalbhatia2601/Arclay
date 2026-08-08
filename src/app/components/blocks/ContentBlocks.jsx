import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BlockHeading } from "./BlockChrome";
import ProductCard from "../ProductCard";

/**
 * Server-rendered block components.
 *
 * Each receives `{ settings, data }` — `data` holds anything the layout
 * service pre-resolved (product queries), so no block fetches on the client
 * and the markup is complete in the first response.
 */

function Button({ href, children, variant = "primary" }) {
    if (!href || !children) return null;
    return (
        <Link
            href={href}
            className={cn(
                "inline-flex items-center gap-2 px-8 py-3.5 rounded-[var(--radius-btn)] text-sm font-bold transition-colors",
                variant === "primary"
                    ? "bg-site-primary text-site-on-primary hover:bg-site-primary-dark"
                    : "border border-white/20 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
            )}
        >
            {children}
            <ArrowRight className="w-4 h-4" />
        </Link>
    );
}

// ── Products ─────────────────────────────────────────────────────

const COLUMN_CLASS = {
    2: "grid-cols-2",
    3: "grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 lg:grid-cols-5",
};

export function ProductGridBlock({ settings, data }) {
    const products = data?.query || [];
    if (!products.length) return null;

    return (
        <>
            <BlockHeading
                title={settings.title}
                subtitle={settings.subtitle}
                action={
                    settings.showViewAll && (
                        <Link
                            href={settings.viewAllHref || "/products"}
                            className="hidden lg:flex items-center gap-2 text-site-text font-bold hover:text-site-primary transition-colors text-xs uppercase tracking-widest border-b border-site-text/10 pb-1"
                        >
                            View All <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    )
                }
            />
            <div className={cn("grid gap-4 lg:gap-6", COLUMN_CLASS[settings.columns] || COLUMN_CLASS[4])}>
                {products.map((product) => (
                    <ProductCard key={product._id} product={product} preset={data?.cardPreset} />
                ))}
            </div>
            {settings.showViewAll && (
                <div className="mt-8 lg:hidden flex justify-center">
                    <Link
                        href={settings.viewAllHref || "/products"}
                        className="flex items-center justify-center w-full py-3.5 rounded-[var(--radius-btn)] border border-site-border text-site-text font-semibold text-sm hover:bg-site-surface-alt transition-colors"
                    >
                        View All <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                </div>
            )}
        </>
    );
}

export function ProductRailBlock({ settings, data }) {
    const products = data?.query || [];
    if (!products.length) return null;

    return (
        <>
            <BlockHeading
                title={settings.title}
                subtitle={settings.subtitle}
                action={
                    settings.showViewAll && (
                        <Link
                            href={settings.viewAllHref || "/products"}
                            className="hidden lg:flex items-center gap-2 text-site-text font-bold hover:text-site-primary transition-colors text-xs uppercase tracking-widest border-b border-site-text/10 pb-1"
                        >
                            View All <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    )
                }
            />
            {/* Horizontal scroll on every breakpoint — that is what makes it a
                rail rather than a grid. */}
            <div className="flex gap-4 lg:gap-6 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-2 -mx-4 px-4 xl:mx-0 xl:px-0">
                {products.map((product) => (
                    <div
                        key={product._id}
                        className="snap-start shrink-0 w-[45%] sm:w-[38%] lg:w-[23%]"
                    >
                        <ProductCard product={product} preset={data?.cardPreset} />
                    </div>
                ))}
            </div>
        </>
    );
}

export function CategoryGridBlock({ settings, data }) {
    const categories = (data?.categories || []).slice(0, settings.limit || 6);
    if (!categories.length) return null;

    const shape =
        settings.shape === "circle" ? "rounded-full aspect-square"
        : settings.shape === "wide" ? "rounded-[var(--radius-card)] aspect-[16/9]"
        : "rounded-[var(--radius-card)] aspect-square";

    return (
        <>
            <BlockHeading title={settings.title} subtitle={settings.subtitle} />
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
                {categories.map((category) => (
                    <Link
                        key={category._id}
                        href={`/products?category=${category._id}`}
                        className="group text-center"
                    >
                        <div className={cn("overflow-hidden bg-site-surface-alt mb-3", shape)}>
                            {category.image && (
                                <img
                                    src={category.image}
                                    alt={category.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            )}
                        </div>
                        <p className="text-[13px] font-semibold text-site-text group-hover:text-site-primary transition-colors">
                            {category.name}
                        </p>
                    </Link>
                ))}
            </div>
        </>
    );
}

// ── Content ──────────────────────────────────────────────────────

export function RichTextBlock({ settings }) {
    return (
        <div className={cn("max-w-3xl", settings.align === "center" && "mx-auto text-center")}>
            {settings.eyebrow && (
                <span className="inline-block bg-site-accent-soft text-site-primary-dark text-[13px] font-semibold px-4 py-1.5 rounded-full mb-6">
                    {settings.eyebrow}
                </span>
            )}
            {settings.heading && (
                <h2 className="font-serif text-[32px] lg:text-[40px] font-bold text-site-text leading-tight mb-6">
                    {settings.heading}
                </h2>
            )}
            {settings.body && (
                <div
                    className="prose prose-neutral max-w-none text-site-muted text-[15px] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: settings.body }}
                />
            )}
            {settings.buttonLabel && (
                <div className="mt-8">
                    <Button href={settings.buttonHref}>{settings.buttonLabel}</Button>
                </div>
            )}
        </div>
    );
}

export function ImageTextBlock({ settings }) {
    const imageFirst = settings.imageSide !== "right";

    return (
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className={cn("relative h-[380px] lg:h-[520px]", !imageFirst && "lg:order-2")}>
                {settings.image && (
                    <div className="absolute top-0 right-0 w-[85%] h-[85%] rounded-[var(--radius-card)] overflow-hidden bg-site-surface-alt shadow-2xl">
                        <img src={settings.image} alt={settings.heading || ""} className="w-full h-full object-cover" />
                    </div>
                )}
                {settings.insetImage && (
                    <div className="absolute bottom-0 left-0 w-[50%] h-[50%] rounded-[var(--radius-card)] overflow-hidden border-8 border-white bg-white shadow-xl z-20">
                        <img src={settings.insetImage} alt="" className="w-full h-full object-cover" />
                    </div>
                )}
            </div>

            <div className={cn(!imageFirst && "lg:order-1")}>
                {settings.eyebrow && (
                    <span className="inline-block bg-site-accent-soft text-site-primary-dark text-[13px] font-semibold px-4 py-1.5 rounded-full mb-6">
                        {settings.eyebrow}
                    </span>
                )}
                {settings.heading && (
                    <h2 className="font-serif text-[32px] lg:text-[40px] font-bold text-site-text leading-tight mb-6">
                        {settings.heading}
                    </h2>
                )}
                {settings.body && (
                    <div
                        className="prose prose-neutral max-w-none text-site-muted text-[15px] leading-relaxed mb-8"
                        dangerouslySetInnerHTML={{ __html: settings.body }}
                    />
                )}

                {settings.stats?.length > 0 && (
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        {settings.stats.map((stat, i) => (
                            <div key={i}>
                                <p className="text-2xl lg:text-3xl font-serif font-bold text-site-text mb-1">
                                    {stat.value}
                                </p>
                                <p className="text-sm text-site-muted">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                <Button href={settings.buttonHref}>{settings.buttonLabel}</Button>
            </div>
        </div>
    );
}

export function UspRowBlock({ settings, icons }) {
    const items = settings.items || [];
    if (!items.length) return null;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((item, i) => {
                const Icon = icons?.[item.icon];
                return (
                    <div
                        key={i}
                        className="flex flex-col items-center text-center p-6 rounded-[var(--radius-card)] bg-site-surface border border-site-border"
                    >
                        {Icon && <Icon className="w-6 h-6 text-site-primary mb-3" />}
                        <p className="font-bold text-site-text text-sm">{item.title}</p>
                        {item.subtitle && (
                            <p className="text-[12px] text-site-muted mt-1">{item.subtitle}</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Merchandising ────────────────────────────────────────────────

export function PromoStripBlock({ settings }) {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 lg:p-8 rounded-[var(--radius-card)] bg-site-accent-soft">
            <div className="flex items-center gap-5">
                {settings.image && (
                    <img src={settings.image} alt="" className="w-16 h-16 object-contain shrink-0" />
                )}
                <div>
                    <p className="font-bold text-site-text text-lg">{settings.heading}</p>
                    {settings.code && (
                        <p className="text-sm text-site-muted mt-1">
                            Use code{" "}
                            <span className="font-mono font-bold bg-site-primary text-site-on-primary px-2 py-0.5 rounded">
                                {settings.code}
                            </span>
                        </p>
                    )}
                </div>
            </div>
            <Button href={settings.buttonHref}>{settings.buttonLabel}</Button>
        </div>
    );
}

export function SpacerBlock({ settings }) {
    return (
        <div style={{ height: `${Number(settings.height) || 0}px` }}>
            {settings.rule && <hr className="border-site-border" />}
        </div>
    );
}

export function TestimonialsBlock({ settings, StarIcon }) {
    const items = settings.items || [];
    if (!items.length) return null;

    return (
        <>
            <BlockHeading title={settings.title} align="center" />
            <div className="grid md:grid-cols-3 gap-6">
                {items.map((item, i) => (
                    <div
                        key={i}
                        className="p-6 rounded-[var(--radius-card)] bg-site-surface border border-site-border"
                    >
                        {StarIcon && (
                            <div className="flex gap-0.5 mb-4">
                                {Array.from({ length: Math.min(5, Number(item.stars) || 5) }).map((_, s) => (
                                    <StarIcon key={s} className="w-4 h-4 fill-site-star text-site-star" />
                                ))}
                            </div>
                        )}
                        <p className="text-site-muted text-[15px] leading-relaxed mb-5">
                            &ldquo;{item.quote}&rdquo;
                        </p>
                        <div className="flex items-center gap-3">
                            {item.avatar && (
                                <img src={item.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                            )}
                            <div>
                                <p className="font-bold text-site-text text-sm">{item.author}</p>
                                {item.meta && <p className="text-[12px] text-site-muted">{item.meta}</p>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
