"use client";

import { cn } from "@/lib/utils";
import ProductProvider from "./ProductContext";
import {
    PdpActions, PdpDelivery, PdpDescription, PdpFieldCards, PdpGallery,
    PdpPrice, PdpQuantity, PdpRelated, PdpReviews, PdpSpecs, PdpStock,
    PdpTitle, PdpVariants,
} from "./PdpBlocks";
import { MarqueeBlock, CountdownBlock } from "../InteractiveBlocks";
import {
    ImageTextBlock, ProductGridBlock, PromoStripBlock, RichTextBlock,
    SpacerBlock, TestimonialsBlock, UspRowBlock,
} from "../ContentBlocks";
import * as Icons from "lucide-react";

const PDP_COMPONENTS = {
    "pdp-gallery": PdpGallery,
    "pdp-title": PdpTitle,
    "pdp-price": PdpPrice,
    "pdp-variants": PdpVariants,
    "pdp-stock": PdpStock,
    "pdp-quantity": PdpQuantity,
    "pdp-actions": PdpActions,
    "pdp-delivery": PdpDelivery,
    "pdp-fields": PdpFieldCards,
    "pdp-description": PdpDescription,
    "pdp-specs": PdpSpecs,
    "pdp-reviews": PdpReviews,
    "pdp-related": PdpRelated,

    // General blocks usable on a product page too.
    "rich-text": RichTextBlock,
    "image-text": ImageTextBlock,
    "usp-row": ({ settings }) => <UspRowBlock settings={settings} icons={Icons} />,
    "promo-strip": PromoStripBlock,
    marquee: MarqueeBlock,
    countdown: CountdownBlock,
    testimonials: ({ settings }) => <TestimonialsBlock settings={settings} StarIcon={Icons.Star} />,
    "product-grid": ProductGridBlock,
    spacer: SpacerBlock,
};

const PADDING = {
    none: "py-0",
    tight: "py-4",
    normal: "py-6",
    loose: "py-10",
};

const BACKGROUNDS = {
    "": "",
    surface: "bg-[var(--c-surface)]",
    alt: "bg-[var(--c-surface-alt)]",
    warm: "bg-[var(--c-surface-warm)]",
    dark: "bg-[var(--c-text)] text-white",
};

const DEVICE_CLASS = {
    "mobile,desktop": "",
    mobile: "lg:hidden",
    desktop: "hidden lg:block",
};

function renderOne(section, index = 0) {
    const Component = PDP_COMPONENTS[section.type];
    if (!Component) return null;

    const devices = [...(section.visibility?.devices || ["mobile", "desktop"])].sort().join(",");
    const background = BACKGROUNDS[section.style?.background] ?? "";
    const isCustomColor = section.style?.background && BACKGROUNDS[section.style.background] === undefined;

    return (
        <div
            key={section._id || `section-${index}`}
            className={cn(
                PADDING[section.style?.paddingY] ?? PADDING.normal,
                background,
                DEVICE_CLASS[devices] ?? "",
                background && "px-5 rounded-[var(--radius-card)]"
            )}
            style={isCustomColor ? { backgroundColor: section.style.background } : undefined}
        >
            <Component settings={section.settings || {}} data={section.data || {}} />
        </div>
    );
}

/**
 * Renders a product page from blocks.
 *
 * Blocks marked left/right are collected into a two-column row — the shape a
 * product page needs — while full-width blocks break out of it. That keeps the
 * stored layout a flat, reorderable list instead of a nested tree.
 */
export default function PdpRenderer({ sections = [], product, reviews, relatedProducts, meta }) {
    const rows = [];
    let split = null;

    for (const section of sections) {
        const column = section.style?.column || "full";

        if (column === "full") {
            if (split) { rows.push(split); split = null; }
            rows.push({ kind: "full", section });
            continue;
        }

        if (!split) split = { kind: "split", left: [], right: [] };
        split[column].push(section);
    }
    if (split) rows.push(split);

    return (
        <ProductProvider
            product={product}
            reviews={reviews}
            relatedProducts={relatedProducts}
            meta={meta}
        >
            {rows.map((row, index) =>
                row.kind === "full" ? (
                    <div key={row.section._id || `row-${index}`}>{renderOne(row.section, index)}</div>
                ) : (
                    <div
                        key={`split-${index}`}
                        className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-start"
                    >
                        <div>{row.left.map((s, i) => renderOne(s, i))}</div>
                        <div>{row.right.map((s, i) => renderOne(s, i))}</div>
                    </div>
                )
            )}
        </ProductProvider>
    );
}
