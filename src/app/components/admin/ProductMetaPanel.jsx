"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    Check,
    ChevronDown,
    Layers,
    Plus,
    Sparkles,
    Trash2,
    X,
} from "lucide-react";
import MetaFieldEditor, { emptyField } from "./MetaFieldEditor";
import ImagePicker from "../ImagePicker";

/**
 * Metadata section of the add/edit product form.
 *
 * Field *definitions* come from the applied templates plus any one-off fields
 * defined for this product alone; this panel only collects the *values*.
 *
 * Controlled by the parent form:
 *   value = { metaTemplates: string[], customMetaFields: [], meta: {} }
 */
export default function ProductMetaPanel({ value, onChange, categoryId }) {
    const { metaTemplates = [], customMetaFields = [], meta = {} } = value;

    const [templates, setTemplates] = useState([]);
    const [suggestedIds, setSuggestedIds] = useState([]);
    const [showPicker, setShowPicker] = useState(false);
    const [showCustom, setShowCustom] = useState(customMetaFields.length > 0);
    const [orphans, setOrphans] = useState([]);

    // Reloads whenever the category changes so suggestions stay accurate.
    const loadTemplates = useCallback(async () => {
        try {
            const query = categoryId ? `?category=${categoryId}` : "";
            const res = await fetch(`/api/admin/meta-templates${query}`, { credentials: "include" });
            const data = await res.json();
            if (data.success) {
                setTemplates(data.templates || []);
                setSuggestedIds(data.suggestedIds || []);
            }
        } catch {
            // Non-fatal: the admin can still save the product without metadata.
        }
    }, [categoryId]);

    useEffect(() => { loadTemplates(); }, [loadTemplates]);

    const appliedTemplates = useMemo(
        () => templates.filter(t => metaTemplates.map(String).includes(String(t._id))),
        [templates, metaTemplates]
    );

    // Same precedence as the server: a product's own field beats a template's.
    const definitions = useMemo(() => {
        const byKey = new Map();
        for (const field of customMetaFields) {
            if (field?.key) byKey.set(field.key, { ...field, source: "custom" });
        }
        for (const template of appliedTemplates) {
            for (const field of template.fields || []) {
                if (!field?.key || byKey.has(field.key)) continue;
                byKey.set(field.key, { ...field, source: "template", templateName: template.name });
            }
        }
        return [...byKey.values()].sort((a, b) => {
            const group = String(a.group || "").localeCompare(String(b.group || ""));
            return group !== 0 ? group : (a.order || 0) - (b.order || 0);
        });
    }, [appliedTemplates, customMetaFields]);

    // Values with no surviving definition — template detached or field removed.
    useEffect(() => {
        const defined = new Set(definitions.map(d => d.key));
        setOrphans(
            Object.entries(meta)
                .filter(([key, v]) => !defined.has(key) && v !== null && v !== "")
                .map(([key, v]) => ({ key, value: v }))
        );
    }, [definitions, meta]);

    const groups = useMemo(() => {
        const buckets = [];
        for (const field of definitions) {
            const name = field.group || "Details";
            let bucket = buckets.find(g => g.name === name);
            if (!bucket) buckets.push((bucket = { name, fields: [] }));
            bucket.fields.push(field);
        }
        return buckets;
    }, [definitions]);

    const setValue = (key, next) => onChange({ ...value, meta: { ...meta, [key]: next } });

    const applyTemplate = (id) => {
        if (metaTemplates.map(String).includes(String(id))) return;
        onChange({ ...value, metaTemplates: [...metaTemplates, String(id)] });
        setShowPicker(false);
    };

    const detachTemplate = (id) => {
        // Values stay in `meta` deliberately — they resurface as orphans so
        // nothing is silently destroyed by unticking a template.
        onChange({
            ...value,
            metaTemplates: metaTemplates.filter(t => String(t) !== String(id)),
        });
    };

    const dropOrphan = (key) => {
        const next = { ...meta };
        delete next[key];
        onChange({
            ...value,
            meta: next,
            removeOrphanKeys: [...(value.removeOrphanKeys || []), key],
        });
    };

    const unapplied = templates.filter(
        t => !metaTemplates.map(String).includes(String(t._id))
    );

    return (
        <div className="space-y-4">
            {/* ── Applied templates ─────────────────────────────── */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Field templates
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowPicker(v => !v)}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                            <Plus className="w-3.5 h-3.5" /> Apply template
                            <ChevronDown className="w-3.5 h-3.5" />
                        </button>

                        {showPicker && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowPicker(false)} />
                                <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1.5 max-h-72 overflow-y-auto">
                                    {unapplied.length === 0 ? (
                                        <p className="px-3 py-2 text-sm text-gray-400">
                                            All templates applied
                                        </p>
                                    ) : (
                                        unapplied.map((template) => (
                                            <button
                                                key={template._id}
                                                type="button"
                                                onClick={() => applyTemplate(template._id)}
                                                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-start gap-2"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {template.name}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500">
                                                        {template.fields?.length || 0} fields
                                                    </p>
                                                </div>
                                                {suggestedIds.includes(String(template._id)) && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                                                        <Sparkles className="w-2.5 h-2.5" /> Suggested
                                                    </span>
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {appliedTemplates.length === 0 ? (
                    <div className="px-3 py-4 border-2 border-dashed border-gray-200 rounded-lg text-center">
                        <p className="text-sm text-gray-500">
                            No templates applied.
                            {suggestedIds.length > 0 && " Suggested ones are marked in the list above."}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {appliedTemplates.map((template) => (
                            <span
                                key={template._id}
                                className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900"
                            >
                                <Layers className="w-3.5 h-3.5" />
                                {template.name}
                                <button
                                    type="button"
                                    onClick={() => detachTemplate(template._id)}
                                    className="text-blue-400 hover:text-red-600"
                                    aria-label={`Remove ${template.name}`}
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Values, grouped ───────────────────────────────── */}
            {groups.map((group) => (
                <div key={group.name} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                        <h4 className="text-sm font-bold text-gray-800">{group.name}</h4>
                    </div>
                    <div className="p-4 grid sm:grid-cols-2 gap-4">
                        {group.fields.map((field) => (
                            <MetaValueInput
                                key={field.key}
                                field={field}
                                value={meta[field.key]}
                                onChange={(v) => setValue(field.key, v)}
                            />
                        ))}
                    </div>
                </div>
            ))}

            {/* ── Orphaned values ───────────────────────────────── */}
            {orphans.length > 0 && (
                <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                    <div className="flex gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-amber-900">Orphaned values</h4>
                            <p className="text-[13px] text-amber-800">
                                Saved earlier, but no template or custom field defines them anymore.
                                They are kept until you delete them.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        {orphans.map((orphan) => (
                            <div
                                key={orphan.key}
                                className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2"
                            >
                                <code className="text-xs font-mono text-amber-900 shrink-0">
                                    {orphan.key}
                                </code>
                                <span className="text-sm text-gray-600 truncate flex-1">
                                    {String(Array.isArray(orphan.value) ? orphan.value.join(", ") : orphan.value)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => dropOrphan(orphan.key)}
                                    className="p-1 text-amber-500 hover:text-red-600 shrink-0"
                                    aria-label={`Delete ${orphan.key}`}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Product-only fields ───────────────────────────── */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                    type="button"
                    onClick={() => setShowCustom(v => !v)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                    <div className="text-left">
                        <h4 className="text-sm font-bold text-gray-800">Fields for this product only</h4>
                        <p className="text-[12px] text-gray-500">
                            One-off fields that are not part of any template
                        </p>
                    </div>
                    <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${showCustom ? "rotate-180" : ""}`}
                    />
                </button>

                {showCustom && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50/60">
                        <MetaFieldEditor
                            fields={customMetaFields}
                            lockExistingKeys={false}
                            onChange={(fields) => onChange({ ...value, customMetaFields: fields })}
                        />
                        {customMetaFields.length === 0 && (
                            <button
                                type="button"
                                onClick={() =>
                                    onChange({ ...value, customMetaFields: [emptyField()] })
                                }
                                className="sr-only"
                            >
                                Add field
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Renders the right input for a field type. Kept in one place so the admin
// form and any future bulk editor stay consistent.
function MetaValueInput({ field, value, onChange }) {
    const label = (
        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
            {field.label}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
            {field.source === "custom" && (
                <span className="ml-1.5 text-[9px] font-semibold text-purple-600 normal-case tracking-normal">
                    product-only
                </span>
            )}
        </label>
    );

    const help = field.helpText && (
        <p className="text-[11px] text-gray-400 mt-1">{field.helpText}</p>
    );

    const wrap = (input, fullWidth = false) => (
        <div className={fullWidth ? "sm:col-span-2" : ""}>
            {label}
            {input}
            {help}
        </div>
    );

    switch (field.type) {
        case "textarea":
        case "richtext":
            return wrap(
                <textarea
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    rows={4}
                    placeholder={field.placeholder}
                    className="input-admin resize-y"
                />,
                true
            );

        case "number":
            return wrap(
                <div className="relative">
                    <input
                        type="number"
                        value={value ?? ""}
                        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
                        placeholder={field.placeholder}
                        className="input-admin"
                    />
                    {field.unit && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                            {field.unit}
                        </span>
                    )}
                </div>
            );

        case "boolean":
            return wrap(
                <button
                    type="button"
                    onClick={() => onChange(!value)}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        value
                            ? "bg-green-50 border-green-300 text-green-800"
                            : "bg-white border-gray-200 text-gray-500"
                    }`}
                >
                    <span
                        className={`w-4 h-4 rounded flex items-center justify-center ${
                            value ? "bg-green-600" : "bg-gray-200"
                        }`}
                    >
                        {value && <Check className="w-3 h-3 text-white" />}
                    </span>
                    {value ? "Yes" : "No"}
                </button>
            );

        case "select":
            return wrap(
                <select
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value || null)}
                    className="input-admin"
                >
                    <option value="">— none —</option>
                    {(field.options || []).map((option) => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            );

        case "multiselect": {
            const selected = Array.isArray(value) ? value : [];
            return wrap(
                <div className="flex flex-wrap gap-1.5">
                    {(field.options || []).map((option) => {
                        const active = selected.includes(option);
                        return (
                            <button
                                key={option}
                                type="button"
                                onClick={() =>
                                    onChange(
                                        active
                                            ? selected.filter(v => v !== option)
                                            : [...selected, option]
                                    )
                                }
                                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                                    active
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                                }`}
                            >
                                {option}
                            </button>
                        );
                    })}
                </div>
            );
        }

        case "date":
            return wrap(
                <input
                    type="date"
                    value={value ? String(value).slice(0, 10) : ""}
                    onChange={(e) => onChange(e.target.value || null)}
                    className="input-admin"
                />
            );

        case "color":
            return wrap(
                <div className="flex gap-2">
                    <input
                        type="color"
                        value={value || "#000000"}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-11 h-9 rounded border border-gray-200 cursor-pointer"
                    />
                    <input
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="#000000"
                        className="input-admin flex-1"
                    />
                </div>
            );

        case "image":
            // ImagePicker renders its own label, so it is not passed through
            // the shared wrapper that would add a second one.
            return (
                <div className="sm:col-span-2">
                    <ImagePicker
                        label={field.label}
                        value={value || ""}
                        onChange={(url) => onChange(url)}
                    />
                    {help}
                </div>
            );

        default:
            return wrap(
                <input
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder}
                    className="input-admin"
                />
            );
    }
}
