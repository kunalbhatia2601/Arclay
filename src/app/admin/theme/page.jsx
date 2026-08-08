"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Loader2, Palette, RotateCcw, Save, ExternalLink } from "lucide-react";

export default function ThemePage() {
    const [groups, setGroups] = useState([]);
    const [tokens, setTokens] = useState({});
    const [defaults, setDefaults] = useState({});
    const [customCss, setCustomCss] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/admin/theme", { credentials: "include" });
                const data = await res.json();
                if (data.success) {
                    setGroups(data.groups || []);
                    setTokens(data.tokens || {});
                    setDefaults(data.defaults || {});
                    setCustomCss(data.customCss || "");
                }
            } catch {
                toast.error("Failed to load theme");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/theme", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ tokens, customCss }),
            });
            const data = await res.json();
            if (!data.success) return toast.error(data.message);
            toast.success("Theme saved — reload the storefront to see it");
        } catch {
            toast.error("Failed to save theme");
        } finally {
            setSaving(false);
        }
    };

    const resetAll = () => {
        if (!confirm("Reset every token back to its default?")) return;
        setTokens({ ...defaults });
    };

    const changed = Object.keys(defaults).filter(k => tokens[k] !== defaults[k]);

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto pb-28">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Palette className="w-6 h-6 text-blue-600" />
                        Theme
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Colours, fonts and shapes for the whole storefront. Every page reads these.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900"
                    >
                        View site <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                        onClick={resetAll}
                        className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>
                </div>
            </div>

            <div className="space-y-5">
                {groups.map((group) => (
                    <div key={group.name} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                            <h2 className="text-sm font-bold text-gray-800">{group.name}</h2>
                        </div>
                        <div className="p-5 grid sm:grid-cols-2 gap-4">
                            {group.tokens.map((token) => (
                                <TokenInput
                                    key={token.key}
                                    token={token}
                                    value={tokens[token.key] ?? token.default}
                                    isDefault={tokens[token.key] === defaults[token.key]}
                                    onChange={(v) => setTokens({ ...tokens, [token.key]: v })}
                                    onReset={() => setTokens({ ...tokens, [token.key]: defaults[token.key] })}
                                />
                            ))}
                        </div>
                    </div>
                ))}

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                        <h2 className="text-sm font-bold text-gray-800">Custom CSS</h2>
                        <p className="text-[12px] text-gray-500 mt-0.5">
                            Appended after the tokens. For tweaks the options above do not cover.
                        </p>
                    </div>
                    <div className="p-5">
                        <textarea
                            value={customCss}
                            onChange={(e) => setCustomCss(e.target.value)}
                            rows={8}
                            spellCheck={false}
                            placeholder={".product-card { box-shadow: none; }"}
                            className="input-admin font-mono text-[13px] resize-y"
                        />
                    </div>
                </div>
            </div>

            {/* Sticky save bar — the page is long, so the action follows you. */}
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-200 px-5 py-3 flex items-center justify-between gap-4 z-30">
                <p className="text-sm text-gray-500">
                    {changed.length === 0
                        ? "All values are at their defaults"
                        : `${changed.length} token${changed.length === 1 ? "" : "s"} changed`}
                </p>
                <button
                    onClick={save}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                >
                    {saving
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                        : <><Save className="w-4 h-4" /> Save Theme</>}
                </button>
            </div>
        </div>
    );
}

function TokenInput({ token, value, isDefault, onChange, onReset }) {
    const header = (
        <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                {token.label}
            </label>
            {!isDefault && (
                <button
                    type="button"
                    onClick={onReset}
                    className="text-[10px] font-semibold text-blue-600 hover:text-blue-700"
                >
                    reset
                </button>
            )}
        </div>
    );

    if (token.type === "color") {
        return (
            <div>
                {header}
                <div className="flex gap-2">
                    <input
                        type="color"
                        value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
                        onChange={(e) => onChange(e.target.value.toUpperCase())}
                        className="w-11 h-9 rounded border border-gray-200 cursor-pointer shrink-0"
                    />
                    <input
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="input-admin font-mono text-[13px]"
                    />
                </div>
            </div>
        );
    }

    if (token.type === "select") {
        return (
            <div>
                {header}
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="input-admin"
                >
                    {(token.options || []).map((option) => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            </div>
        );
    }

    return (
        <div>
            {header}
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="input-admin font-mono text-[13px]"
            />
            {token.type === "size" && (
                <p className="text-[11px] text-gray-400 mt-1">
                    Any CSS length — 1rem, 24px, 2.5rem
                </p>
            )}
        </div>
    );
}
