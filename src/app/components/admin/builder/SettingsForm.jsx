"use client";

import { useEffect, useState } from "react";
import { ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react";
import ImagePicker from "../../ImagePicker";
import ProductQueryBuilder from "./ProductQueryBuilder";

/**
 * Renders a block's settings form from its registry schema.
 *
 * This is what makes new block types cheap: declare the fields in the registry
 * and the editor appears here automatically, with no per-block admin code.
 */
export default function SettingsForm({ schema = [], values = {}, onChange }) {
    const set = (key, value) => onChange({ ...values, [key]: value });

    return (
        <div className="space-y-4">
            {schema.map((field) => (
                <Field
                    key={field.key}
                    field={field}
                    value={values[field.key]}
                    onChange={(v) => set(field.key, v)}
                />
            ))}
        </div>
    );
}

function Label({ children, hint }) {
    return (
        <>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                {children}
            </label>
            {hint && <p className="text-[11px] text-gray-400 -mt-1 mb-1.5">{hint}</p>}
        </>
    );
}

function Field({ field, value, onChange }) {
    switch (field.type) {
        case "textarea":
        case "richtext":
            return (
                <div>
                    <Label hint={field.hint}>{field.label}</Label>
                    <textarea
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        rows={field.type === "richtext" ? 6 : 3}
                        placeholder={field.placeholder}
                        className="input-admin resize-y"
                    />
                    {field.type === "richtext" && (
                        <p className="text-[11px] text-gray-400 mt-1">
                            Basic HTML is allowed here (&lt;p&gt;, &lt;strong&gt;, &lt;a&gt;)
                        </p>
                    )}
                </div>
            );

        case "number":
            return (
                <div>
                    <Label hint={field.hint}>{field.label}</Label>
                    <input
                        type="number"
                        value={value ?? ""}
                        min={field.min}
                        max={field.max}
                        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
                        className="input-admin"
                    />
                </div>
            );

        case "boolean":
            return (
                <label className="flex items-center gap-2.5 cursor-pointer py-1">
                    <input
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => onChange(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{field.label}</span>
                </label>
            );

        case "select":
            return (
                <div>
                    <Label hint={field.hint}>{field.label}</Label>
                    <select
                        value={value ?? field.default ?? ""}
                        onChange={(e) => onChange(e.target.value)}
                        className="input-admin"
                    >
                        {(field.options || []).map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            );

        case "color":
            return (
                <div>
                    <Label hint={field.hint}>{field.label}</Label>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={/^#[0-9a-f]{6}$/i.test(value || "") ? value : "#000000"}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-11 h-9 rounded border border-gray-200 cursor-pointer shrink-0"
                        />
                        <input
                            value={value || ""}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="leave blank for theme default"
                            className="input-admin font-mono text-[13px]"
                        />
                    </div>
                </div>
            );

        case "image":
            return (
                <ImagePicker
                    label={field.label}
                    value={value || ""}
                    onChange={(url) => onChange(url)}
                />
            );

        case "link":
            return (
                <div>
                    <Label hint={field.hint}>{field.label}</Label>
                    <input
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="/products"
                        className="input-admin font-mono text-[13px]"
                    />
                </div>
            );

        case "icon":
            return (
                <div>
                    <Label hint="Any lucide icon name, e.g. Truck, Leaf, ShieldCheck">
                        {field.label}
                    </Label>
                    <input
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Truck"
                        className="input-admin"
                    />
                </div>
            );

        case "html":
            return (
                <div>
                    <Label hint="Scripts and event handlers are stripped when rendered">
                        {field.label}
                    </Label>
                    <textarea
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        rows={10}
                        spellCheck={false}
                        className="input-admin font-mono text-[12px] resize-y"
                    />
                </div>
            );

        case "datetime": {
            // Stored as a full ISO timestamp so it is unambiguous, but shown
            // and edited in the admin's own timezone.
            const local = (() => {
                if (!value) return "";
                const d = new Date(value);
                if (Number.isNaN(d.getTime())) return "";
                const pad = (n) => String(n).padStart(2, "0");
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            })();

            return (
                <div>
                    <Label hint={field.hint || "Your local time"}>{field.label}</Label>
                    <div className="flex gap-2">
                        <input
                            type="datetime-local"
                            value={local}
                            onChange={(e) => onChange(
                                e.target.value ? new Date(e.target.value).toISOString() : ""
                            )}
                            className="input-admin"
                        />
                        {value && (
                            <button
                                type="button"
                                onClick={() => onChange("")}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 shrink-0"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        case "cardPreset":
            return <CardPresetPicker field={field} value={value} onChange={onChange} />;

        case "productField":
            return <ProductFieldPicker field={field} value={value} onChange={onChange} />;

        case "productQuery":
            return (
                <div>
                    <Label>{field.label}</Label>
                    <ProductQueryBuilder value={value} onChange={onChange} />
                </div>
            );

        case "repeater":
            return <Repeater field={field} value={value} onChange={onChange} />;

        default:
            return (
                <div>
                    <Label hint={field.hint}>{field.label}</Label>
                    <input
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={field.placeholder}
                        className="input-admin"
                    />
                </div>
            );
    }
}

/** Chooses which saved card style this block renders its products with. */
function CardPresetPicker({ field, value, onChange }) {
    const [presets, setPresets] = useState([]);

    useEffect(() => {
        fetch("/api/admin/card-presets", { credentials: "include" })
            .then(r => r.json())
            .then(d => d.success && setPresets(d.presets || []))
            .catch(() => {});
    }, []);

    return (
        <div>
            <Label hint="Manage styles under Product Cards">{field.label}</Label>
            <select
                value={value || ""}
                onChange={(e) => onChange(e.target.value || null)}
                className="input-admin"
            >
                <option value="">Use the default style</option>
                {presets.map(p => (
                    <option key={p._id} value={p._id}>
                        {p.name}{p.isDefault ? " (default)" : ""}
                    </option>
                ))}
            </select>
        </div>
    );
}

/**
 * Picks which product value a card should display: a built-in field like stock
 * or GST rate, or any custom metadata field defined in a template.
 */
function ProductFieldPicker({ field, value, onChange }) {
    const [customFields, setCustomFields] = useState([]);

    useEffect(() => {
        fetch("/api/admin/meta-templates", { credentials: "include" })
            .then(r => r.json())
            .then((data) => {
                if (!data.success) return;
                const seen = new Map();
                for (const template of data.templates || []) {
                    for (const f of template.fields || []) {
                        if (!seen.has(f.key)) seen.set(f.key, f);
                    }
                }
                setCustomFields([...seen.values()]);
            })
            .catch(() => {});
    }, []);

    return (
        <div>
            <Label>{field.label}</Label>
            <select
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="input-admin"
            >
                <option value="">— pick a value —</option>
                <optgroup label="Product fields">
                    {BUILT_IN_PRODUCT_FIELDS.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                </optgroup>
                {customFields.length > 0 && (
                    <optgroup label="Custom fields">
                        {customFields.map(f => (
                            <option key={f.key} value={f.key}>{f.label}</option>
                        ))}
                    </optgroup>
                )}
            </select>
        </div>
    );
}

// Mirrors PRODUCT_FIELD_SOURCES in the PDP blocks. Duplicated rather than
// imported so this admin form never pulls in storefront components.
const BUILT_IN_PRODUCT_FIELDS = [
    { value: "name", label: "Product name" },
    { value: "subtitle", label: "Subtitle" },
    { value: "category", label: "Category" },
    { value: "sku", label: "SKU (selected variant)" },
    { value: "barcode", label: "Barcode (selected variant)" },
    { value: "price", label: "Current price" },
    { value: "mrp", label: "MRP" },
    { value: "stock", label: "Stock (selected variant)" },
    { value: "totalStock", label: "Total stock" },
    { value: "salesCount", label: "Units sold" },
    { value: "taxRate", label: "GST rate" },
    { value: "hsn", label: "HSN code" },
    { value: "rating", label: "Average rating" },
    { value: "reviewCount", label: "Number of reviews" },
];

/** Repeating group of sub-fields — stats, badges, quotes, marquee messages. */
function Repeater({ field, value, onChange }) {
    const items = Array.isArray(value) ? value : [];
    const [open, setOpen] = useState(null);

    const update = (index, patch) => {
        const next = [...items];
        next[index] = { ...next[index], ...patch };
        onChange(next);
    };

    const move = (index, direction) => {
        const target = index + direction;
        if (target < 0 || target >= items.length) return;
        const next = [...items];
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
        setOpen(target);
    };

    const add = () => {
        const blank = Object.fromEntries(field.fields.map(f => [f.key, ""]));
        onChange([...items, blank]);
        setOpen(items.length);
    };

    return (
        <div>
            <Label>{field.label}</Label>
            <div className="space-y-2">
                {items.map((item, index) => {
                    // First sub-field doubles as the row's summary label.
                    const summary = item[field.fields[0]?.key] || `Item ${index + 1}`;
                    const isOpen = open === index;

                    return (
                        <div key={index} className="border border-gray-200 rounded-lg bg-white">
                            <div className="flex items-center gap-1.5 px-2.5 py-2">
                                <GripVertical className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                                <button
                                    type="button"
                                    onClick={() => setOpen(isOpen ? null : index)}
                                    className="flex-1 text-left text-sm text-gray-800 truncate"
                                >
                                    {String(summary).slice(0, 60) || `Item ${index + 1}`}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => move(index, -1)}
                                    disabled={index === 0}
                                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-25"
                                >
                                    ↑
                                </button>
                                <button
                                    type="button"
                                    onClick={() => move(index, 1)}
                                    disabled={index === items.length - 1}
                                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-25"
                                >
                                    ↓
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onChange(items.filter((_, i) => i !== index))}
                                    className="p-1 text-gray-400 hover:text-red-600"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {isOpen && (
                                <div className="border-t border-gray-100 p-3 space-y-3 bg-gray-50/60">
                                    {field.fields.map((sub) => (
                                        <Field
                                            key={sub.key}
                                            field={sub}
                                            value={item[sub.key]}
                                            onChange={(v) => update(index, { [sub.key]: v })}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <button
                type="button"
                onClick={add}
                className="mt-2 w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm font-semibold text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center justify-center gap-1.5"
            >
                <Plus className="w-3.5 h-3.5" /> Add
            </button>
        </div>
    );
}
