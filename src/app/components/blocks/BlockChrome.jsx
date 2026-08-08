import { cn } from "@/lib/utils";

/**
 * The wrapper every block renders inside.
 *
 * Background, vertical rhythm and width are section-level settings rather than
 * per-block ones, so they live here and every block inherits the same
 * behaviour instead of reimplementing it.
 */

const PADDING = {
    none: "py-0",
    tight: "py-8 lg:py-10",
    normal: "py-12 lg:py-16",
    loose: "py-20 lg:py-28",
};

const BACKGROUNDS = {
    "": "",
    none: "",
    surface: "bg-site-surface",
    alt: "bg-site-surface-alt",
    warm: "bg-site-surface-warm",
    dark: "bg-site-text text-white",
};

// Sections can be hidden per breakpoint. Done in CSS so one cached HTML
// response serves both, rather than branching on a user-agent guess.
const DEVICE_CLASS = {
    "mobile,desktop": "",
    mobile: "lg:hidden",
    desktop: "hidden lg:block",
};

export default function BlockChrome({ style = {}, visibility = {}, children }) {
    const devices = [...(visibility.devices || ["mobile", "desktop"])].sort().join(",");
    const background = BACKGROUNDS[style.background] ?? "";

    // A background value that is not a known keyword is treated as a raw colour.
    const isCustomColor = style.background && BACKGROUNDS[style.background] === undefined;

    return (
        <section
            className={cn(
                PADDING[style.paddingY] ?? PADDING.normal,
                background,
                DEVICE_CLASS[devices] ?? ""
            )}
            style={isCustomColor ? { backgroundColor: style.background } : undefined}
        >
            <div
                className={cn(
                    style.fullWidth
                        ? "w-full"
                        : "container mx-auto px-4 xl:px-8 max-w-[var(--container-w)]"
                )}
            >
                {children}
            </div>
        </section>
    );
}

/** Shared section heading, so every block titles itself the same way. */
export function BlockHeading({ title, subtitle, action, align = "left" }) {
    if (!title && !subtitle) return null;

    return (
        <div
            className={cn(
                "mb-10",
                align === "center" ? "text-center" : "flex items-end justify-between gap-4"
            )}
        >
            <div>
                {subtitle && (
                    <div
                        className={cn(
                            "flex items-center gap-2 mb-3",
                            align === "center" && "justify-center"
                        )}
                    >
                        <span className="text-site-accent font-bold text-[10px] uppercase tracking-[0.2em]">
                            {subtitle}
                        </span>
                        <div className="h-px w-8 bg-site-accent/20" />
                    </div>
                )}
                {title && (
                    <h2 className="font-serif text-[32px] lg:text-[42px] font-bold text-site-text leading-none">
                        {title}
                    </h2>
                )}
            </div>
            {action}
        </div>
    );
}
