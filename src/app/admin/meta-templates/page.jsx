"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
    AlertTriangle,
    ListChecks,
    Loader2,
    Plus,
    Save,
    Search,
    Star,
    Trash2,
    X,
} from "lucide-react";
import MetaFieldEditor, { emptyField } from "@/app/components/admin/MetaFieldEditor";

const blankTemplate = () => ({
    name: "",
    description: "",
    fields: [emptyField()],
    appliesTo: { categories: [] },
    isDefault: false,
    isActive: true,
});

export default function MetaTemplatesPage() {
    const [templates, setTemplates] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [editing, setEditing] = useState(null);   // template being edited
    const [usageCount, setUsageCount] = useState(0);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [templatesRes, categoriesRes] = await Promise.all([
                fetch("/api/admin/meta-templates", { credentials: "include" }),
                fetch("/api/admin/categories?limit=100", { credentials: "include" }),
            ]);
            const templatesData = await templatesRes.json();
            const categoriesData = await categoriesRes.json();

            if (templatesData.success) setTemplates(templatesData.templates || []);
            if (categoriesData.success) setCategories(categoriesData.categories || []);
        } catch {
            toast.error("Failed to load templates");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openNew = () => {
        setEditing(blankTemplate());
        setUsageCount(0);
    };

    const openExisting = async (id) => {
        try {
            const res = await fetch(`/api/admin/meta-templates/${id}`, { credentials: "include" });
            const data = await res.json();
            if (!data.success) return toast.error(data.message || "Failed to load template");

            setEditing({
                ...data.template,
                appliesTo: {
                    categories: (data.template.appliesTo?.categories || []).map(c => String(c._id || c)),
                },
            });
            setUsageCount(data.usageCount || 0);
        } catch {
            toast.error("Failed to load template");
        }
    };

    const save = async () => {
        if (!editing.name?.trim()) return toast.error("Template name is required");
        if (!editing.fields?.length) return toast.error("Add at least one field");

        const incomplete = editing.fields.find(f => !f.key || !f.label);
        if (incomplete) return toast.error("Every field needs a label and a key");

        setSaving(true);
        try {
            const isNew = !editing._id;
            const res = await fetch(
                isNew ? "/api/admin/meta-templates" : `/api/admin/meta-templates/${editing._id}`,
                {
                    method: isNew ? "POST" : "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(editing),
                }
            );
            const data = await res.json();
            if (!data.success) return toast.error(data.message || "Failed to save");

            toast.success(data.message);
            setEditing(null);
            load();
        } catch {
            toast.error("Failed to save template");
        } finally {
            setSaving(false);
        }
    };

    const remove = async (template) => {
        if (!confirm(
            `Delete "${template.name}"?\n\nProducts using it keep their saved values — the fields just stop being listed.`
        )) return;

        try {
            const res = await fetch(`/api/admin/meta-templates/${template._id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (!data.success) return toast.error(data.message);
            toast.success(data.message);
            load();
        } catch {
            toast.error("Failed to delete template");
        }
    };

    const visible = templates.filter(t =>
        !search || t.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ListChecks className="w-6 h-6 text-blue-600" />
                        Field Templates
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Reusable sets of custom product fields. Build once, apply to any product.
                    </p>
                </div>
                <button
                    onClick={openNew}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shrink-0"
                >
                    <Plus className="w-4 h-4" /> New Template
                </button>
            </div>

            <div className="relative mb-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search templates..."
                    className="input-admin pl-9"
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
            ) : visible.length === 0 ? (
                <div className="text-center py-20 bg-white border border-gray-200 rounded-xl">
                    <ListChecks className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-1">No templates yet</h3>
                    <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">
                        A template is a form you define once — like &ldquo;Food Product&rdquo; with
                        Shelf Life, Ingredients and Origin — then reuse on every product.
                    </p>
                    <button
                        onClick={openNew}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                    >
                        Create your first template
                    </button>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visible.map((template) => (
                        <div
                            key={template._id}
                            className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all flex flex-col"
                        >
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <button
                                    onClick={() => openExisting(template._id)}
                                    className="text-left min-w-0 flex-1"
                                >
                                    <h3 className="font-semibold text-gray-900 truncate">
                                        {template.name}
                                    </h3>
                                </button>
                                {template.isDefault && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-1 rounded shrink-0">
                                        <Star className="w-3 h-3" /> Default
                                    </span>
                                )}
                            </div>

                            {template.description && (
                                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                                    {template.description}
                                </p>
                            )}

                            <p className="text-xs text-gray-500 mb-3">
                                {template.fields?.length || 0} field
                                {template.fields?.length === 1 ? "" : "s"}
                                {template.appliesTo?.categories?.length > 0 &&
                                    ` · ${template.appliesTo.categories.length} categor${template.appliesTo.categories.length === 1 ? "y" : "ies"}`}
                            </p>

                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {(template.fields || []).slice(0, 4).map((f) => (
                                    <span
                                        key={f.key}
                                        className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                                    >
                                        {f.label}
                                    </span>
                                ))}
                                {(template.fields?.length || 0) > 4 && (
                                    <span className="text-[11px] px-2 py-0.5 text-gray-400">
                                        +{template.fields.length - 4}
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100">
                                <button
                                    onClick={() => openExisting(template._id)}
                                    className="flex-1 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => remove(template)}
                                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                                    aria-label="Delete template"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {editing && (
                <TemplateDrawer
                    template={editing}
                    categories={categories}
                    usageCount={usageCount}
                    saving={saving}
                    onChange={setEditing}
                    onClose={() => setEditing(null)}
                    onSave={save}
                />
            )}
        </div>
    );
}

function TemplateDrawer({ template, categories, usageCount, saving, onChange, onClose, onSave }) {
    const toggleCategory = (id) => {
        const current = template.appliesTo?.categories || [];
        const next = current.includes(id)
            ? current.filter(c => c !== id)
            : [...current, id];
        onChange({ ...template, appliesTo: { categories: next } });
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-gray-50 h-full flex flex-col shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-200">
                    <h2 className="font-bold text-gray-900">
                        {template._id ? "Edit Template" : "New Template"}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {usageCount > 0 && (
                        <div className="flex gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-800">
                                Used by <strong>{usageCount}</strong> product
                                {usageCount === 1 ? "" : "s"}. Adding fields is safe — they show up
                                empty. Removing a field keeps its saved values on those products,
                                listed as orphaned until you delete them there.
                            </p>
                        </div>
                    )}

                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                Template name
                            </label>
                            <input
                                value={template.name}
                                onChange={(e) => onChange({ ...template, name: e.target.value })}
                                placeholder="Food Product"
                                className="input-admin"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                Description
                            </label>
                            <input
                                value={template.description || ""}
                                onChange={(e) => onChange({ ...template, description: e.target.value })}
                                placeholder="Fields for edible products"
                                className="input-admin"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                                Suggest for categories
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {categories.map((category) => {
                                    const active = (template.appliesTo?.categories || [])
                                        .includes(String(category._id));
                                    return (
                                        <button
                                            key={category._id}
                                            type="button"
                                            onClick={() => toggleCategory(String(category._id))}
                                            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                                                active
                                                    ? "bg-blue-600 text-white border-blue-600"
                                                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                                            }`}
                                        >
                                            {category.name}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1.5">
                                Products in these categories get this template offered automatically.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={!!template.isDefault}
                                    onChange={(e) => onChange({ ...template, isDefault: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                />
                                <span className="text-sm text-gray-700">Suggest for every product</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={template.isActive !== false}
                                    onChange={(e) => onChange({ ...template, isActive: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                />
                                <span className="text-sm text-gray-700">Active</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-2">Fields</h3>
                        <MetaFieldEditor
                            fields={template.fields || []}
                            onChange={(fields) => onChange({ ...template, fields })}
                        />
                    </div>
                </div>

                <div className="px-5 py-4 bg-white border-t border-gray-200 flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                    >
                        {saving
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                            : <><Save className="w-4 h-4" /> Save Template</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
