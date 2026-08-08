"use client";

import { useState } from "react";
import {
    ChevronDown,
    ChevronUp,
    GripVertical,
    Plus,
    Trash2,
    X,
} from "lucide-react";

export const FIELD_TYPES = [
    { value: "text", label: "Text" },
    { value: "textarea", label: "Long text" },
    { value: "richtext", label: "Rich text" },
    { value: "number", label: "Number" },
    { value: "boolean", label: "Yes / No" },
    { value: "select", label: "Dropdown" },
    { value: "multiselect", label: "Multi-select" },
    { value: "date", label: "Date" },
    { value: "image", label: "Image URL" },
    { value: "url", label: "Link" },
    { value: "color", label: "Color" },
];

export const DISPLAY_TARGETS = [
    { value: "specs-table", label: "Specs table" },
    { value: "accordion", label: "Accordion section" },
    { value: "badge", label: "Badge row" },
    { value: "inline", label: "Inline under title" },
    { value: "hidden", label: "Hidden (data only)" },
];

const TYPES_WITH_OPTIONS = ["select", "multiselect"];

function slugify(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

export function emptyField() {
    return {
        key: "",
        label: "",
        type: "text",
        options: [],
        unit: "",
        placeholder: "",
        helpText: "",
        required: false,
        group: "Details",
        display: { show: true, where: "specs-table", icon: "" },
        filterable: false,
        searchable: false,
    };
}

/**
 * Editor for a list of metadata field *definitions*.
 *
 * Used by the template manager and, for one-off fields, by the product form.
 * Keys auto-derive from the label but stay editable, and lock once the field
 * has been saved — renaming a key would orphan every value stored under it.
 */
export default function MetaFieldEditor({ fields, onChange, lockExistingKeys = true }) {
    const [expanded, setExpanded] = useState(null);

    const update = (index, patch) => {
        const next = [...fields];
        next[index] = { ...next[index], ...patch };
        onChange(next);
    };

    const addField = () => {
        onChange([...fields, emptyField()]);
        setExpanded(fields.length);
    };

    const removeField = (index) => {
        onChange(fields.filter((_, i) => i !== index));
        setExpanded(null);
    };

    const move = (index, direction) => {
        const target = index + direction;
        if (target < 0 || target >= fields.length) return;
        const next = [...fields];
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next.map((f, i) => ({ ...f, order: i })));
        setExpanded(target);
    };

    return (
        <div className="space-y-3">
            {fields.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                    <p className="text-sm text-gray-500 mb-3">No fields yet.</p>
                    <button
                        type="button"
                        onClick={addField}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                        Add the first field
                    </button>
                </div>
            )}

            {fields.map((field, index) => {
                const isOpen = expanded === index;
                // A key that came back from the server is already in use by
                // stored product values, so it must not be renamed.
                const keyLocked = lockExistingKeys && !!field._id;

                return (
                    <div
                        key={field._id || `new-${index}`}
                        className="border border-gray-200 rounded-xl bg-white overflow-hidden"
                    >
                        <div className="flex items-center gap-2 px-3 py-2.5">
                            <div className="flex flex-col text-gray-300">
                                <button
                                    type="button"
                                    onClick={() => move(index, -1)}
                                    disabled={index === 0}
                                    className="hover:text-gray-600 disabled:opacity-30"
                                    aria-label="Move up"
                                >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => move(index, 1)}
                                    disabled={index === fields.length - 1}
                                    className="hover:text-gray-600 disabled:opacity-30"
                                    aria-label="Move down"
                                >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />

                            <button
                                type="button"
                                onClick={() => setExpanded(isOpen ? null : index)}
                                className="flex-1 text-left min-w-0"
                            >
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {field.label || "Untitled field"}
                                </p>
                                <p className="text-[11px] text-gray-500 truncate">
                                    {field.key || "no key"} · {field.type}
                                    {field.required && " · required"}
                                    {field.filterable && " · filterable"}
                                </p>
                            </button>

                            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 px-2 py-1 bg-gray-50 rounded shrink-0 hidden sm:block">
                                {field.group || "Details"}
                            </span>

                            <button
                                type="button"
                                onClick={() => removeField(index)}
                                className="p-1.5 text-gray-400 hover:text-red-600 shrink-0"
                                aria-label="Remove field"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        {isOpen && (
                            <div className="border-t border-gray-100 p-4 bg-gray-50/60 space-y-4">
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <Labeled label="Label">
                                        <input
                                            value={field.label}
                                            onChange={(e) => {
                                                const label = e.target.value;
                                                // Auto-derive the key until it is
                                                // locked or manually edited.
                                                const shouldSync =
                                                    !keyLocked &&
                                                    (!field.key || field.key === slugify(field.label));
                                                update(index, {
                                                    label,
                                                    ...(shouldSync ? { key: slugify(label) } : {}),
                                                });
                                            }}
                                            placeholder="Shelf Life"
                                            className="input-admin"
                                        />
                                    </Labeled>

                                    <Labeled
                                        label="Key"
                                        hint={keyLocked ? "Locked — values are stored under this key" : "a-z, 0-9, _"}
                                    >
                                        <input
                                            value={field.key}
                                            disabled={keyLocked}
                                            onChange={(e) => update(index, { key: slugify(e.target.value) })}
                                            placeholder="shelf_life"
                                            className="input-admin disabled:bg-gray-100 disabled:text-gray-500"
                                        />
                                    </Labeled>

                                    <Labeled label="Type">
                                        <select
                                            value={field.type}
                                            onChange={(e) => update(index, { type: e.target.value })}
                                            className="input-admin"
                                        >
                                            {FIELD_TYPES.map((t) => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </Labeled>

                                    <Labeled label="Group" hint="Sections in the form and on the page">
                                        <input
                                            value={field.group || ""}
                                            onChange={(e) => update(index, { group: e.target.value })}
                                            placeholder="Specifications"
                                            className="input-admin"
                                        />
                                    </Labeled>

                                    {field.type === "number" && (
                                        <Labeled label="Unit" hint="Shown after the value">
                                            <input
                                                value={field.unit || ""}
                                                onChange={(e) => update(index, { unit: e.target.value })}
                                                placeholder="months"
                                                className="input-admin"
                                            />
                                        </Labeled>
                                    )}

                                    <Labeled label="Help text">
                                        <input
                                            value={field.helpText || ""}
                                            onChange={(e) => update(index, { helpText: e.target.value })}
                                            placeholder="Shown under the input"
                                            className="input-admin"
                                        />
                                    </Labeled>
                                </div>

                                {TYPES_WITH_OPTIONS.includes(field.type) && (
                                    <OptionsEditor
                                        options={field.options || []}
                                        onChange={(options) => update(index, { options })}
                                    />
                                )}

                                <div className="grid sm:grid-cols-2 gap-3">
                                    <Labeled label="Show on product page">
                                        <select
                                            value={field.display?.where || "specs-table"}
                                            onChange={(e) =>
                                                update(index, {
                                                    display: { ...field.display, where: e.target.value },
                                                })
                                            }
                                            className="input-admin"
                                        >
                                            {DISPLAY_TARGETS.map((t) => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </Labeled>
                                </div>

                                <div className="flex flex-wrap gap-4 pt-1">
                                    <Check
                                        label="Required"
                                        checked={!!field.required}
                                        onChange={(v) => update(index, { required: v })}
                                    />
                                    <Check
                                        label="Filterable"
                                        hint="Adds a facet on the products page"
                                        checked={!!field.filterable}
                                        onChange={(v) => update(index, { filterable: v })}
                                    />
                                    <Check
                                        label="Searchable"
                                        checked={!!field.searchable}
                                        onChange={(v) => update(index, { searchable: v })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {fields.length > 0 && (
                <button
                    type="button"
                    onClick={addField}
                    className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Add field
                </button>
            )}
        </div>
    );
}

function Labeled({ label, hint, children }) {
    return (
        <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                {label}
            </label>
            {children}
            {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
        </div>
    );
}

function Check({ label, hint, checked, onChange }) {
    return (
        <label className="flex items-center gap-2 cursor-pointer">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700">{label}</span>
            {hint && <span className="text-[11px] text-gray-400">({hint})</span>}
        </label>
    );
}

function OptionsEditor({ options, onChange }) {
    const [draft, setDraft] = useState("");

    const add = () => {
        const value = draft.trim();
        if (!value || options.includes(value)) return;
        onChange([...options, value]);
        setDraft("");
    };

    return (
        <Labeled label="Options">
            <div className="flex flex-wrap gap-2 mb-2">
                {options.map((option) => (
                    <span
                        key={option}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-sm"
                    >
                        {option}
                        <button
                            type="button"
                            onClick={() => onChange(options.filter((o) => o !== option))}
                            className="text-gray-400 hover:text-red-600"
                            aria-label={`Remove ${option}`}
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                {options.length === 0 && (
                    <span className="text-sm text-gray-400">No options yet</span>
                )}
            </div>
            <div className="flex gap-2">
                <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            add();
                        }
                    }}
                    placeholder="Add an option and press Enter"
                    className="input-admin flex-1"
                />
                <button
                    type="button"
                    onClick={add}
                    className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800"
                >
                    Add
                </button>
            </div>
        </Labeled>
    );
}
