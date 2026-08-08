"use client";

import { Check, Minus } from "lucide-react";

/**
 * Storefront rendering of a product's custom metadata.
 *
 * The API already filtered to visible fields and resolved each one against its
 * template, so these components only decide presentation. Which surface a
 * field lands on is set per-field in the admin (`display.where`).
 */

function formatValue(field, value) {
    if (value === null || value === undefined || value === "") return null;

    switch (field.type) {
        case "boolean":
            return value ? "Yes" : "No";
        case "multiselect":
            return Array.isArray(value) ? value.join(", ") : String(value);
        case "number":
            return field.unit ? `${value} ${field.unit}` : String(value);
        case "date":
            return new Date(value).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });
        default:
            return String(value);
    }
}

export function pickByTarget(fields, target) {
    return (fields || []).filter((f) => (f.display?.where || "specs-table") === target);
}

/** Key/value table — the default home for custom fields. */
export function MetaSpecsTable({ fields, title = "Specifications" }) {
    const rows = pickByTarget(fields, "specs-table");
    if (rows.length === 0) return null;

    return (
        <div>
            {title && (
                <h3 className="text-[13px] font-bold uppercase tracking-widest text-[var(--c-text)] mb-4">
                    {title}
                </h3>
            )}
            <dl className="divide-y divide-[var(--c-border)] border-y border-[var(--c-border)]">
                {rows.map((field) => {
                    const display = formatValue(field, field.value);
                    if (display === null) return null;

                    return (
                        <div
                            key={field.key}
                            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 py-3"
                        >
                            <dt className="text-[13px] text-[var(--c-text-muted)]">{field.label}</dt>
                            <dd className="text-[14px] font-medium text-[var(--c-text)] break-words">
                                {field.type === "color" ? (
                                    <span className="inline-flex items-center gap-2">
                                        <span
                                            className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                                            style={{ backgroundColor: display }}
                                        />
                                        {display}
                                    </span>
                                ) : field.type === "url" ? (
                                    <a
                                        href={display}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[var(--c-primary)] hover:underline break-all"
                                    >
                                        {display}
                                    </a>
                                ) : (
                                    display
                                )}
                            </dd>
                        </div>
                    );
                })}
            </dl>
        </div>
    );
}

/** Compact pill row, for short at-a-glance attributes. */
export function MetaBadges({ fields }) {
    const badges = pickByTarget(fields, "badge");
    if (badges.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2">
            {badges.map((field) => {
                const display = formatValue(field, field.value);
                if (display === null) return null;

                // Booleans read better as a single labelled chip than "Organic: Yes".
                if (field.type === "boolean") {
                    return (
                        <span
                            key={field.key}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold ${
                                field.value
                                    ? "bg-[var(--c-accent-soft)] text-[#3A4B29]"
                                    : "bg-[var(--c-surface-alt)] text-[var(--c-text-muted)]"
                            }`}
                        >
                            {field.value
                                ? <Check className="w-3 h-3" />
                                : <Minus className="w-3 h-3" />}
                            {field.label}
                        </span>
                    );
                }

                return (
                    <span
                        key={field.key}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--c-surface-alt)] text-[12px] text-[var(--c-text)]"
                    >
                        <span className="text-[var(--c-text-muted)]">{field.label}</span>
                        <span className="font-semibold">{display}</span>
                    </span>
                );
            })}
        </div>
    );
}

/** Short attributes rendered under the product title. */
export function MetaInline({ fields }) {
    const inline = pickByTarget(fields, "inline");
    if (inline.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[var(--c-text-muted)]">
            {inline.map((field) => {
                const display = formatValue(field, field.value);
                if (display === null) return null;
                return (
                    <span key={field.key}>
                        {field.label}:{" "}
                        <span className="font-semibold text-[var(--c-text)]">{display}</span>
                    </span>
                );
            })}
        </div>
    );
}

/**
 * Fields marked for accordions, bucketed by their group so each group becomes
 * one collapsible section. Returns the data; the page owns the accordion
 * chrome so it matches whatever it already uses.
 */
export function getAccordionGroups(fields) {
    const groups = [];

    for (const field of pickByTarget(fields, "accordion")) {
        const name = field.group || "Details";
        let bucket = groups.find((g) => g.name === name);
        if (!bucket) groups.push((bucket = { name, fields: [] }));
        bucket.fields.push(field);
    }

    return groups;
}

/** Body of one accordion group. */
export function MetaGroupBody({ fields }) {
    return (
        <dl className="space-y-3">
            {fields.map((field) => {
                const display = formatValue(field, field.value);
                if (display === null) return null;

                // Long-form types read as prose rather than a labelled row.
                if (field.type === "textarea" || field.type === "richtext") {
                    return (
                        <div key={field.key}>
                            <dt className="text-[12px] font-bold uppercase tracking-wider text-[var(--c-text-muted)] mb-1">
                                {field.label}
                            </dt>
                            <dd className="text-[15px] leading-relaxed text-[#555] whitespace-pre-line">
                                {display}
                            </dd>
                        </div>
                    );
                }

                return (
                    <div key={field.key} className="flex justify-between gap-4">
                        <dt className="text-[14px] text-[var(--c-text-muted)]">{field.label}</dt>
                        <dd className="text-[14px] font-semibold text-[var(--c-text)] text-right">
                            {display}
                        </dd>
                    </div>
                );
            })}
        </dl>
    );
}
