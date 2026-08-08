"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import * as Icons from "lucide-react";
import {
    ArrowLeft, ChevronDown, ChevronUp, Copy, ExternalLink, Eye, EyeOff,
    Loader2, Plus, RotateCcw, Save, Search, Settings2, Trash2, Upload, X,
} from "lucide-react";
import SettingsForm from "@/app/components/admin/builder/SettingsForm";

const PAGE_TITLES = {
    home: "Home page",
    products: "Products page",
    "product-detail": "Product detail page",
};

export default function PageBuilder({ params }) {
    const { page } = use(params);

    const [slots, setSlots] = useState([]);
    const [blocks, setBlocks] = useState({});
    const [draft, setDraft] = useState({});
    const [activeSlot, setActiveSlot] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [hasUnpublished, setHasUnpublished] = useState(false);

    const [editing, setEditing] = useState(null);   // { slot, index }
    const [showPalette, setShowPalette] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/layouts/${page}`, { credentials: "include" });
            const data = await res.json();
            if (!data.success) return toast.error(data.message || "Failed to load page");

            setSlots(data.slots || []);
            setBlocks(data.blocks || {});
            setDraft(data.draft || {});
            setHasUnpublished(data.hasUnpublishedChanges);
            setActiveSlot(prev => prev || data.slots?.[0]?.key || "");
        } catch {
            toast.error("Failed to load page");
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { load(); }, [load]);

    const sections = useMemo(() => draft[activeSlot] || [], [draft, activeSlot]);

    const setSections = (next) => {
        setDraft(d => ({ ...d, [activeSlot]: next }));
        setDirty(true);
    };

    const save = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/layouts/${page}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ draft }),
            });
            const data = await res.json();
            if (!data.success) return toast.error(data.message);
            setDraft(data.draft);
            setDirty(false);
            setHasUnpublished(true);
            toast.success("Draft saved");
        } catch {
            toast.error("Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const act = async (action) => {
        // Publishing an unsaved draft would push stale content live.
        if (action === "publish" && dirty) await save();

        setPublishing(true);
        try {
            const res = await fetch(`/api/admin/layouts/${page}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ action }),
            });
            const data = await res.json();
            if (!data.success) return toast.error(data.message);
            toast.success(data.message);
            setDirty(false);
            load();
        } catch {
            toast.error("Action failed");
        } finally {
            setPublishing(false);
        }
    };

    const addBlock = (type) => {
        const definition = blocks[type];
        const settings = {};
        for (const field of definition.schema || []) {
            if (field.type === "repeater") settings[field.key] = [];
            else if (field.type === "productQuery") settings[field.key] = null;
            else if (field.default !== undefined) settings[field.key] = field.default;
            else settings[field.key] = field.type === "boolean" ? false : "";
        }

        setSections([
            ...sections,
            {
                _id: `new-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
                type,
                enabled: true,
                settings,
                style: { background: "", paddingY: "normal", fullWidth: false, column: page === "product-detail" ? "right" : "full" },
                visibility: { devices: ["mobile", "desktop"], from: null, to: null, auth: "any" },
            },
        ]);
        setShowPalette(false);
        setEditing({ slot: activeSlot, index: sections.length });
    };

    const updateSection = (index, patch) => {
        const next = [...sections];
        next[index] = { ...next[index], ...patch };
        setSections(next);
    };

    const move = (index, direction) => {
        const target = index + direction;
        if (target < 0 || target >= sections.length) return;
        const next = [...sections];
        [next[index], next[target]] = [next[target], next[index]];
        setSections(next);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
        );
    }

    const editingSection = editing && draft[editing.slot]?.[editing.index];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto pb-28">
            <Link
                href="/admin/pages"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4"
            >
                <ArrowLeft className="w-4 h-4" /> All pages
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {PAGE_TITLES[page] || page}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {hasUnpublished
                            ? "You have unpublished changes"
                            : "Draft matches what is live"}
                    </p>
                </div>
                <a
                    href={page === "home" ? "/" : `/${page === "products" ? "products" : ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 shrink-0"
                >
                    View live <ExternalLink className="w-3.5 h-3.5" />
                </a>
            </div>

            {/* Slot tabs — only pages with more than one slot need them */}
            {slots.length > 1 && (
                <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
                    {slots.map((slot) => (
                        <button
                            key={slot.key}
                            onClick={() => setActiveSlot(slot.key)}
                            className={`px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                                activeSlot === slot.key
                                    ? "bg-gray-900 text-white"
                                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                            }`}
                        >
                            {slot.label}
                            {(draft[slot.key]?.length || 0) > 0 && (
                                <span className={`ml-1.5 text-[11px] ${activeSlot === slot.key ? "text-white/60" : "text-gray-400"}`}>
                                    {draft[slot.key].length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Section list */}
            <div className="space-y-2">
                {sections.length === 0 && (
                    <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
                        <p className="text-sm text-gray-500 mb-4">
                            Nothing in this section yet.
                            {page === "home" && " The site falls back to the built-in layout until you publish."}
                        </p>
                        <button
                            onClick={() => setShowPalette(true)}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                        >
                            Add your first block
                        </button>
                    </div>
                )}

                {sections.map((section, index) => {
                    const definition = blocks[section.type];
                    const Icon = Icons[definition?.icon] || Icons.Square;

                    return (
                        <div
                            key={section._id || index}
                            className={`flex items-center gap-2 bg-white border rounded-xl px-3 py-2.5 transition-colors ${
                                section.enabled ? "border-gray-200" : "border-gray-200 opacity-55"
                            }`}
                        >
                            <div className="flex flex-col text-gray-300">
                                <button
                                    onClick={() => move(index, -1)}
                                    disabled={index === 0}
                                    className="hover:text-gray-600 disabled:opacity-30"
                                >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => move(index, 1)}
                                    disabled={index === sections.length - 1}
                                    className="hover:text-gray-600 disabled:opacity-30"
                                >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                <Icon className="w-4 h-4 text-gray-600" />
                            </div>

                            <button
                                onClick={() => setEditing({ slot: activeSlot, index })}
                                className="flex-1 text-left min-w-0"
                            >
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {section.settings?.title || section.settings?.heading || definition?.label || section.type}
                                </p>
                                <p className="text-[11px] text-gray-500 truncate">
                                    {definition?.label || section.type}
                                    {section.visibility?.auth === "in" && " · logged-in only"}
                                    {section.visibility?.auth === "out" && " · logged-out only"}
                                    {section.visibility?.devices?.length === 1 && ` · ${section.visibility.devices[0]} only`}
                                </p>
                            </button>

                            <button
                                onClick={() => updateSection(index, { enabled: !section.enabled })}
                                className="p-1.5 text-gray-400 hover:text-gray-700 shrink-0"
                                title={section.enabled ? "Hide this block" : "Show this block"}
                            >
                                {section.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => {
                                    const copy = JSON.parse(JSON.stringify(section));
                                    copy._id = `new-${Date.now()}`;
                                    const next = [...sections];
                                    next.splice(index + 1, 0, copy);
                                    setSections(next);
                                }}
                                className="p-1.5 text-gray-400 hover:text-gray-700 shrink-0"
                                title="Duplicate"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setEditing({ slot: activeSlot, index })}
                                className="p-1.5 text-gray-400 hover:text-blue-600 shrink-0"
                                title="Settings"
                            >
                                <Settings2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => {
                                    if (!confirm("Remove this block?")) return;
                                    setSections(sections.filter((_, i) => i !== index));
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 shrink-0"
                                title="Remove"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}

                {sections.length > 0 && (
                    <button
                        onClick={() => setShowPalette(true)}
                        className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add block
                    </button>
                )}
            </div>

            {/* Action bar */}
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-200 px-5 py-3 flex items-center justify-between gap-3 z-30">
                <button
                    onClick={() => act("revert")}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900"
                >
                    <RotateCcw className="w-3.5 h-3.5" /> Discard draft
                </button>

                <div className="flex items-center gap-2">
                    <button
                        onClick={save}
                        disabled={saving || !dirty}
                        className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save draft
                    </button>
                    <button
                        onClick={() => act("publish")}
                        disabled={publishing}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                    >
                        {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Publish
                    </button>
                </div>
            </div>

            {showPalette && (
                <BlockPalette
                    page={page}
                    blocks={blocks}
                    onPick={addBlock}
                    onClose={() => setShowPalette(false)}
                />
            )}

            {editingSection && (
                <SectionDrawer
                    page={page}
                    section={editingSection}
                    definition={blocks[editingSection.type]}
                    onChange={(patch) => updateSection(editing.index, patch)}
                    onClose={() => setEditing(null)}
                />
            )}
        </div>
    );
}

function BlockPalette({ page, blocks, onPick, onClose }) {
    const [search, setSearch] = useState("");

    const grouped = useMemo(() => {
        const out = new Map();
        for (const [type, definition] of Object.entries(blocks)) {
            // Product-page blocks read the product being viewed, so they are
            // meaningless anywhere else; the catalogue belongs on /products.
            if (type.startsWith("pdp-") && page !== "product-detail") continue;
            if (type === "product-listing" && page !== "products") continue;

            const haystack = `${definition.label} ${definition.description || ""}`.toLowerCase();
            if (search && !haystack.includes(search.toLowerCase())) continue;
            const group = definition.group || "Other";
            if (!out.has(group)) out.set(group, []);
            out.get(group).push({ type, ...definition });
        }
        return [...out.entries()];
    }, [blocks, search]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    <h2 className="font-bold text-gray-900">Add a block</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-5 py-3 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search blocks..."
                            className="input-admin pl-9"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {grouped.map(([group, items]) => (
                        <div key={group}>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                                {group}
                            </p>
                            <div className="grid sm:grid-cols-2 gap-2">
                                {items.map((item) => {
                                    const Icon = Icons[item.icon] || Icons.Square;
                                    return (
                                        <button
                                            key={item.type}
                                            onClick={() => onPick(item.type)}
                                            className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl text-left hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
                                        >
                                            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                                <Icon className="w-4 h-4 text-gray-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                                                <p className="text-[12px] text-gray-500 leading-snug">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    {grouped.length === 0 && (
                        <p className="text-center text-gray-400 py-10">No blocks match that search</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function SectionDrawer({ page, section, definition, onChange, onClose }) {
    const [tab, setTab] = useState("content");

    if (!definition) return null;

    const setStyle = (patch) => onChange({ style: { ...section.style, ...patch } });
    const setVisibility = (patch) => onChange({ visibility: { ...section.visibility, ...patch } });

    const toggleDevice = (device) => {
        const current = section.visibility?.devices || ["mobile", "desktop"];
        const next = current.includes(device)
            ? current.filter(d => d !== device)
            : [...current, device];
        // Never let both be off — that block could never render.
        setVisibility({ devices: next.length ? next : current });
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-gray-50 h-full flex flex-col shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-200">
                    <div>
                        <h2 className="font-bold text-gray-900">{definition.label}</h2>
                        <p className="text-[12px] text-gray-500">{definition.description}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex gap-1 px-5 pt-3 bg-white border-b border-gray-200">
                    {[
                        { key: "content", label: "Content" },
                        { key: "style", label: "Style" },
                        { key: "visibility", label: "Visibility" },
                    ].map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-3 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                                tab === t.key
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {tab === "content" && (
                        <SettingsForm
                            schema={definition.schema}
                            values={section.settings || {}}
                            onChange={(settings) => onChange({ settings })}
                        />
                    )}

                    {tab === "style" && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                    Background
                                </label>
                                <select
                                    value={section.style?.background || ""}
                                    onChange={(e) => setStyle({ background: e.target.value })}
                                    className="input-admin"
                                >
                                    <option value="">Page background</option>
                                    <option value="surface">White / surface</option>
                                    <option value="alt">Alternate tint</option>
                                    <option value="warm">Warm tint</option>
                                    <option value="dark">Dark</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                    Vertical spacing
                                </label>
                                <select
                                    value={section.style?.paddingY || "normal"}
                                    onChange={(e) => setStyle({ paddingY: e.target.value })}
                                    className="input-admin"
                                >
                                    <option value="none">None</option>
                                    <option value="tight">Tight</option>
                                    <option value="normal">Normal</option>
                                    <option value="loose">Loose</option>
                                </select>
                            </div>

                            {/* Product pages are two-column; this is how a block
                                picks a side. Consecutive left/right blocks are
                                grouped into one split row at render time. */}
                            {page === "product-detail" && (
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                        Column
                                    </label>
                                    <div className="flex gap-2">
                                        {[
                                            { value: "left", label: "Left" },
                                            { value: "right", label: "Right" },
                                            { value: "full", label: "Full width" },
                                        ].map((option) => {
                                            const active = (section.style?.column || "full") === option.value;
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => setStyle({ column: option.value })}
                                                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                                                        active
                                                            ? "bg-blue-600 text-white border-blue-600"
                                                            : "bg-white text-gray-500 border-gray-200"
                                                    }`}
                                                >
                                                    {option.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[12px] text-gray-500 mt-1.5">
                                        Typically: images on the left, title/price/buttons on the right.
                                    </p>
                                </div>
                            )}

                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={!!section.style?.fullWidth}
                                    onChange={(e) => setStyle({ fullWidth: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                />
                                <span className="text-sm text-gray-700">
                                    Full width (ignore page margins)
                                </span>
                            </label>
                        </div>
                    )}

                    {tab === "visibility" && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                    Show on
                                </label>
                                <div className="flex gap-2">
                                    {["mobile", "desktop"].map((device) => {
                                        const active = (section.visibility?.devices || []).includes(device);
                                        return (
                                            <button
                                                key={device}
                                                type="button"
                                                onClick={() => toggleDevice(device)}
                                                className={`px-4 py-2 rounded-lg text-sm font-semibold border capitalize transition-colors ${
                                                    active
                                                        ? "bg-blue-600 text-white border-blue-600"
                                                        : "bg-white text-gray-500 border-gray-200"
                                                }`}
                                            >
                                                {device}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                    Audience
                                </label>
                                <select
                                    value={section.visibility?.auth || "any"}
                                    onChange={(e) => setVisibility({ auth: e.target.value })}
                                    className="input-admin"
                                >
                                    <option value="any">Everyone</option>
                                    <option value="in">Logged-in customers only</option>
                                    <option value="out">Logged-out visitors only</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                        Show from
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={section.visibility?.from ? String(section.visibility.from).slice(0, 16) : ""}
                                        onChange={(e) => setVisibility({ from: e.target.value || null })}
                                        className="input-admin"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                        Show until
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={section.visibility?.to ? String(section.visibility.to).slice(0, 16) : ""}
                                        onChange={(e) => setVisibility({ to: e.target.value || null })}
                                        className="input-admin"
                                    />
                                </div>
                            </div>
                            <p className="text-[12px] text-gray-500">
                                Leave the dates blank to always show. Scheduling is handy for sale
                                banners that should disappear on their own.
                            </p>
                        </div>
                    )}
                </div>

                <div className="px-5 py-4 bg-white border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
