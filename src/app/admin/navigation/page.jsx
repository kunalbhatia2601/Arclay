"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ExternalLink, Loader2, Menu, RotateCcw, Save } from "lucide-react";
import SettingsForm from "@/app/components/admin/builder/SettingsForm";

const TABS = [
    { key: "navbar", label: "Header" },
    { key: "mobileBar", label: "Mobile bottom bar" },
    { key: "footer", label: "Footer" },
];

export default function NavigationPage() {
    const [navigation, setNavigation] = useState(null);
    const [schemas, setSchemas] = useState({});
    const [defaults, setDefaults] = useState({});
    const [tab, setTab] = useState("navbar");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/navigation", { credentials: "include" });
            const data = await res.json();
            if (!data.success) return toast.error(data.message);
            setNavigation(data.navigation);
            setSchemas(data.schemas || {});
            setDefaults(data.defaults || {});
        } catch {
            toast.error("Failed to load navigation");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const save = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/navigation", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ navigation }),
            });
            const data = await res.json();
            if (!data.success) return toast.error(data.message);
            toast.success("Saved — reload the storefront to see it");
        } catch {
            toast.error("Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const resetSection = () => {
        if (!confirm(`Reset the ${TABS.find(t => t.key === tab)?.label.toLowerCase()} to its defaults?`)) return;
        setNavigation(n => ({ ...n, [tab]: JSON.parse(JSON.stringify(defaults[tab] || {})) }));
    };

    if (loading || !navigation) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
        );
    }

    const schema = schemas[tab] || [];
    // Sections that declare groups render as cards; the mobile bar is a flat
    // list, so it falls through to a single card.
    const groups = [...new Set(schema.map(f => f.group).filter(Boolean))];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto pb-28">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Menu className="w-6 h-6 text-blue-600" />
                        Navigation
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Header menu, mobile bottom bar and footer — content and links.
                    </p>
                </div>
                <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 shrink-0"
                >
                    View site <ExternalLink className="w-3.5 h-3.5" />
                </a>
            </div>

            <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                            tab === t.key
                                ? "bg-gray-900 text-white"
                                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="space-y-5">
                {groups.length > 0 ? (
                    groups.map((group) => (
                        <div key={group} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                                <h2 className="text-sm font-bold text-gray-800">{group}</h2>
                            </div>
                            <div className="p-5">
                                <SettingsForm
                                    schema={schema.filter(f => f.group === group)}
                                    values={navigation[tab] || {}}
                                    onChange={(values) => setNavigation(n => ({ ...n, [tab]: values }))}
                                />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <SettingsForm
                            schema={schema}
                            values={navigation[tab] || {}}
                            onChange={(values) => setNavigation(n => ({ ...n, [tab]: values }))}
                        />
                    </div>
                )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-200 px-5 py-3 flex items-center justify-between gap-3 z-30">
                <button
                    onClick={resetSection}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900"
                >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset this tab
                </button>
                <button
                    onClick={save}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save navigation
                </button>
            </div>
        </div>
    );
}
