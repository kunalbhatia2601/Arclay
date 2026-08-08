import * as Icons from "lucide-react";
import BlockChrome from "./BlockChrome";
import {
    CategoryGridBlock,
    ImageTextBlock,
    ProductGridBlock,
    ProductRailBlock,
    PromoStripBlock,
    RichTextBlock,
    SpacerBlock,
    TestimonialsBlock,
    UspRowBlock,
} from "./ContentBlocks";
import { CountdownBlock, HeroSliderBlock, MarqueeBlock } from "./InteractiveBlocks";
import ProductListingBlock from "./ProductListingBlock";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

/**
 * Maps a stored block type to its component.
 *
 * An unrecognised type renders nothing instead of throwing, so retiring a
 * block type or rolling back a deploy cannot take a live page down.
 */
const COMPONENTS = {
    "hero-slider": ({ settings, data }) => (
        <HeroSliderBlock settings={settings} slides={data?.slides || []} />
    ),
    banner: BannerBlock,
    "product-listing": ProductListingBlock,
    "product-grid": ProductGridBlock,
    "product-rail": ProductRailBlock,
    "category-grid": CategoryGridBlock,
    "rich-text": RichTextBlock,
    "image-text": ImageTextBlock,
    "usp-row": ({ settings }) => <UspRowBlock settings={settings} icons={Icons} />,
    marquee: MarqueeBlock,
    "promo-strip": PromoStripBlock,
    countdown: CountdownBlock,
    testimonials: ({ settings }) => <TestimonialsBlock settings={settings} StarIcon={Icons.Star} />,
    "blog-rail": BlogRailBlock,
    spacer: SpacerBlock,
    "raw-html": RawHtmlBlock,
};

// Blocks that paint their own full-bleed surface and must not sit inside the
// padded container that BlockChrome would otherwise apply.
const BARE_BLOCKS = new Set(["marquee"]);

export default function SectionRenderer({ sections = [] }) {
    if (!sections.length) return null;

    return (
        <>
            {sections.map((section, index) => {
                const Component = COMPONENTS[section.type];
                if (!Component) return null;

                const rendered = (
                    <Component settings={section.settings || {}} data={section.data || {}} />
                );

                if (BARE_BLOCKS.has(section.type)) {
                    return <div key={section._id || `bare-${index}`}>{rendered}</div>;
                }

                return (
                    <BlockChrome
                        key={section._id || `section-${index}`}
                        style={section.style}
                        visibility={section.visibility}
                    >
                        {rendered}
                    </BlockChrome>
                );
            })}
        </>
    );
}

// ── Blocks small enough to live here ─────────────────────────────

function BannerBlock({ settings }) {
    const align =
        settings.align === "center" ? "items-center text-center"
        : settings.align === "right" ? "items-end text-right"
        : "items-start text-left";

    return (
        <div className="relative rounded-[var(--radius-hero)] overflow-hidden min-h-[320px] lg:min-h-[420px] flex">
            {settings.image && (
                <img
                    src={settings.image}
                    alt={settings.heading || ""}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            )}
            {settings.overlay && <div className="absolute inset-0 bg-black/40" />}

            <div className={`relative z-10 flex flex-col justify-center p-8 lg:p-16 w-full ${align}`}>
                {settings.eyebrow && (
                    <span className="inline-block px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 bg-site-accent text-white">
                        {settings.eyebrow}
                    </span>
                )}
                {settings.heading && (
                    <h2 className="font-serif text-[32px] lg:text-[52px] font-bold text-white leading-tight mb-4 drop-shadow">
                        {settings.heading}
                    </h2>
                )}
                {settings.body && (
                    <p className="text-white/90 text-[15px] lg:text-[17px] max-w-xl mb-6 drop-shadow">
                        {settings.body}
                    </p>
                )}
                {settings.buttonLabel && (
                    <a
                        href={settings.buttonHref || "/products"}
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-[var(--radius-btn)] bg-site-primary text-site-on-primary text-sm font-bold hover:bg-site-primary-dark transition-colors w-fit"
                    >
                        {settings.buttonLabel}
                    </a>
                )}
            </div>
        </div>
    );
}

function BlogRailBlock({ settings, data }) {
    const posts = data?.posts || [];
    if (!posts.length) return null;

    return (
        <>
            {settings.title && (
                <h2 className="font-serif text-[32px] lg:text-[42px] font-bold text-site-text mb-10">
                    {settings.title}
                </h2>
            )}
            <div className="grid md:grid-cols-3 gap-6">
                {posts.map((post) => (
                    <article
                        key={post._id || post.slug}
                        className="rounded-[var(--radius-card)] overflow-hidden bg-site-surface border border-site-border"
                    >
                        {post.image && (
                            <img src={post.image} alt={post.title} className="w-full aspect-[16/10] object-cover" />
                        )}
                        <div className="p-5">
                            <h3 className="font-bold text-site-text mb-2">{post.title}</h3>
                            {post.excerpt && (
                                <p className="text-sm text-site-muted line-clamp-2">{post.excerpt}</p>
                            )}
                        </div>
                    </article>
                ))}
            </div>
        </>
    );
}

function RawHtmlBlock({ settings }) {
    if (!settings.html) return null;

    // Admin-authored, but still stripped of scripts and event handlers: a
    // stored-XSS bug here would run for every visitor, and the convenience of
    // inline script is not worth that.
    return (
        <div
            className="prose prose-neutral max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(settings.html) }}
        />
    );
}
