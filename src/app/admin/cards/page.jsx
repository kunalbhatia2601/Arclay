"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Loader2, Plus, Save, SquareStack, Star, Trash2 } from "lucide-react";
import SettingsForm from "@/app/components/admin/builder/SettingsForm";
import ProductCard from "@/app/components/ProductCard";

/**
 * Card preset editor.
 *
 * Options on the left, a live card on the right rendered by the same component
 * the storefront uses — so what is previewed is literally what ships.
 */
export default function CardsPage() {
    const [presets, setPresets] = useState([]);
    const [schema, setSchema] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [sample, setSample] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [presetRes, productRes] = await Promise.all([
                fetch("/api/admin/card-presets", { credentials: "include" }).then(r => r.json()),
                fetch("/api/products?limit=1&onSale=true").then(r => r.json()),
            ]);

            if (presetRes.success) {
                setPresets(presetRes.presets || []);
                setSchema(presetRes.schema || []);
                setActiveId(prev => prev || presetRes.presets?.[0]?._id || null);
            }
            // A real product makes the preview honest about long names and
            // missing images.
            if (productRes.success) setSample(productRes.products?.[0] || null);
        } catch {
            toast.error("Failed to load card presets");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const active = useMemo(
        () => presets.find(p => String(p._id) === String(activeId)) || null,
        [presets, activeId]
    );

    const update = (patch) => {
        setPresets(list => list.map(p =>
            String(p._id) === String(activeId) ? { ...p, ...patch } : p
        ));
    };

    const save = async () => {
        if (!active) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/card-presets/${active._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    name: active.name,
                    settings: active.settings,
                    isDefault: active.isDefault,
                }),
            });
            const data = await res.json();
            if (!data.success) return toast.error(data.message);
            toast.success("Saved");
            load();
        } catch {
            toast.error("Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const create = async () => {
        const name = prompt("Name this preset", "Compact card");
        if (!name) return;

        const res = await fetch("/api/admin/card-presets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ name, settings: active?.settings || {} }),
        });
        const data = await res.json();
        if (!data.success) return toast.error(data.message);
        toast.success("Preset created");
        setActiveId(data.preset._id);
        load();
    };

    const remove = async () => {
        if (!active || !confirm(`Delete "${active.name}"?`)) return;
        const res = await fetch(`/api/admin/card-presets/${active._id}`, {
            method: "DELETE",
            credentials: "include",
        });
        const data = await res.json();
        if (!data.success) return toast.error(data.message);
        toast.success(data.message);
        setActiveId(null);
        load();
    };

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto pb-28">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <SquareStack className="w-6 h-6 text-blue-600" />
                        Product Cards
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        How products look in every grid, carousel and catalogue.
                    </p>
                </div>
                <button
                    onClick={create}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shrink-0"
                >
                    <Plus className="w-4 h-4" /> New preset
                </button>
            </div>

            {presets.length > 1 && (
                <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
                    {presets.map((preset) => (
                        <button
                            key={preset._id}
                            onClick={() => setActiveId(preset._id)}
                            className={`px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                                String(activeId) === String(preset._id)
                                    ? "bg-gray-900 text-white"
                                    : "bg-white border border-gray-200 text-gray-600"
                            }`}
                        >
                            {preset.isDefault && <Star className="w-3 h-3" />}
                            {preset.name}
                        </button>
                    ))}
                </div>
            )}

            {active && (
                <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
                    <div className="space-y-5">
                        <div className="bg-white border border-gray-200 rounded-xl p-5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                Preset name
                            </label>
                            <input
                                value={active.name}
                                onChange={(e) => update({ name: e.target.value })}
                                className="input-admin"
                            />
                            <label className="flex items-center gap-2 cursor-pointer mt-3">
                                <input
                                    type="checkbox"
                                    checked={!!active.isDefault}
                                    onChange={(e) => update({ isDefault: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                />
                                <span className="text-sm text-gray-700">
                                    Use this everywhere by default
                                </span>
                            </label>
                        </div>

                        {/* Grouped exactly as the schema declares */}
                        {[...new Set(schema.map(f => f.group))].map((group) => (
                            <div key={group} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                                    <h2 className="text-sm font-bold text-gray-800">{group}</h2>
                                </div>
                                <div className="p-5">
                                    <SettingsForm
                                        schema={schema.filter(f => f.group === group)}
                                        values={active.settings || {}}
                                        onChange={(settings) => update({ settings })}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Live preview — same component the storefront renders */}
                    <div className="lg:sticky lg:top-6">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                            Preview
                        </p>
                        <div className="bg-[var(--c-bg)] border border-gray-200 rounded-xl p-5">
                            {sample ? (
                                <ProductCard product={sample} preset={active.settings} />
                            ) : (
                                <p className="text-sm text-gray-400 text-center py-10">
                                    Add a product to see a preview
                                </p>
                            )}
                        </div>
                        <p className="text-[12px] text-gray-500 mt-2">
                            Rendered with a real product, using the same card component as the
                            storefront.
                        </p>
                    </div>
                </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-200 px-5 py-3 flex items-center justify-between gap-3 z-30">
                <button
                    onClick={remove}
                    disabled={!active || active.isDefault}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-gray-600 hover:text-red-600 disabled:opacity-40"
                >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
                <button
                    onClick={save}
                    disabled={saving || !active}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save preset
                </button>
            </div>
        </div>
    );
}
