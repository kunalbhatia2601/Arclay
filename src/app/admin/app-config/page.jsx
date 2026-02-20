"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";

const RichEditor = dynamic(() => import("@/components/RichEditor"), { ssr: false });

const TABS = ["Get Help", "Legal & Policies", "FAQs"];

export default function AppConfigPage() {
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [helpContacts, setHelpContacts] = useState([]);
    const [legalPolicies, setLegalPolicies] = useState([]);
    const [faqs, setFaqs] = useState([]);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch("/api/admin/app-config", { credentials: "include" });
            const data = await res.json();
            if (data.success) {
                setHelpContacts(data.config.helpContacts || []);
                setLegalPolicies(data.config.legalPolicies || []);
                setFaqs(data.config.faqs || []);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load config");
        } finally {
            setLoading(false);
        }
    };

    const saveConfig = async (partial) => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/app-config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(partial)
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Saved successfully");
                // Sync state from server
                setHelpContacts(data.config.helpContacts || []);
                setLegalPolicies(data.config.legalPolicies || []);
                setFaqs(data.config.faqs || []);
            } else {
                toast.error(data.message || "Failed to save");
            }
        } catch {
            toast.error("Failed to save");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-foreground">Application Config</h1>
                    <p className="text-muted-foreground mt-1">Manage help contacts, legal policies, and FAQs</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-muted p-1 rounded-xl mb-8 w-fit">
                {TABS.map((tab, i) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(i)}
                        className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${activeTab === i
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 0 && (
                <HelpContactsTab
                    contacts={helpContacts}
                    onChange={setHelpContacts}
                    onSave={() => saveConfig({ helpContacts })}
                    saving={saving}
                />
            )}
            {activeTab === 1 && (
                <LegalPoliciesTab
                    policies={legalPolicies}
                    onChange={setLegalPolicies}
                    onSave={() => saveConfig({ legalPolicies })}
                    saving={saving}
                />
            )}
            {activeTab === 2 && (
                <FAQsTab
                    faqs={faqs}
                    onChange={setFaqs}
                    onSave={() => saveConfig({ faqs })}
                    saving={saving}
                />
            )}
        </div>
    );
}

// ═══════════════════════════
// Tab 1: Get Help
// ═══════════════════════════

function HelpContactsTab({ contacts, onChange, onSave, saving }) {
    const updateContact = (index, field, value) => {
        const updated = [...contacts];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    const addContact = () => {
        onChange([...contacts, { type: "email", label: "", value: "", isEnabled: true }]);
    };

    const removeContact = (index) => {
        onChange(contacts.filter((_, i) => i !== index));
    };

    const typeOptions = [
        { value: "email", label: "📧 Email", icon: "📧" },
        { value: "call", label: "📞 Call", icon: "📞" },
        { value: "live_chat", label: "💬 Live Chat", icon: "💬" }
    ];

    return (
        <div className="space-y-4">
            {contacts.map((contact, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">
                                {typeOptions.find(t => t.value === contact.type)?.icon || "📧"}
                            </span>
                            <select
                                value={contact.type}
                                onChange={(e) => updateContact(i, "type", e.target.value)}
                                className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm"
                            >
                                {typeOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span className="text-sm text-muted-foreground">
                                    {contact.isEnabled ? "Enabled" : "Disabled"}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => updateContact(i, "isEnabled", !contact.isEnabled)}
                                    className={`w-11 h-6 rounded-full transition-colors relative ${contact.isEnabled ? "bg-primary" : "bg-muted-foreground/30"
                                        }`}
                                >
                                    <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform absolute top-0.5 ${contact.isEnabled ? "translate-x-5" : "translate-x-0.5"
                                        }`} />
                                </button>
                            </label>
                            <button
                                onClick={() => removeContact(i)}
                                className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors"
                                title="Remove"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Label</label>
                            <input
                                type="text"
                                value={contact.label}
                                onChange={(e) => updateContact(i, "label", e.target.value)}
                                placeholder="e.g. Email Us"
                                className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Value</label>
                            <input
                                type="text"
                                value={contact.value}
                                onChange={(e) => updateContact(i, "value", e.target.value)}
                                placeholder={contact.type === "email" ? "support@example.com" : contact.type === "call" ? "+91 98765 43210" : "Available 9 AM - 6 PM"}
                                className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                </div>
            ))}

            <button
                onClick={addContact}
                className="w-full p-4 bg-card border-2 border-dashed border-border rounded-xl text-primary font-medium hover:border-primary transition-colors"
            >
                + Add Contact Option
            </button>

            <div className="flex justify-end pt-4">
                <button
                    onClick={onSave}
                    disabled={saving}
                    className="px-8 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                    {saving ? "Saving..." : "Save Help Contacts"}
                </button>
            </div>
        </div>
    );
}

// ═══════════════════════════
// Tab 2: Legal & Policies
// ═══════════════════════════

function LegalPoliciesTab({ policies, onChange, onSave, saving }) {
    const [editingIndex, setEditingIndex] = useState(null);

    const updatePolicy = (index, field, value) => {
        const updated = [...policies];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    const addPolicy = () => {
        onChange([...policies, { slug: "", title: "", content: "", isEnabled: true }]);
        setEditingIndex(policies.length);
    };

    const removePolicy = (index) => {
        onChange(policies.filter((_, i) => i !== index));
        if (editingIndex === index) setEditingIndex(null);
    };

    return (
        <div className="space-y-4">
            {policies.map((policy, i) => (
                <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                    {/* Header row */}
                    <div className="flex items-center justify-between p-5">
                        <div
                            className="flex-1 cursor-pointer"
                            onClick={() => setEditingIndex(editingIndex === i ? null : i)}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg">📄</span>
                                <div>
                                    <h3 className="font-medium text-foreground">
                                        {policy.title || "Untitled Policy"}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Slug: {policy.slug || "—"}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => updatePolicy(i, "isEnabled", !policy.isEnabled)}
                                className={`w-11 h-6 rounded-full transition-colors relative ${policy.isEnabled ? "bg-primary" : "bg-muted-foreground/30"
                                    }`}
                            >
                                <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform absolute top-0.5 ${policy.isEnabled ? "translate-x-5" : "translate-x-0.5"
                                    }`} />
                            </button>
                            <button
                                onClick={() => setEditingIndex(editingIndex === i ? null : i)}
                                className="text-sm text-primary hover:underline"
                            >
                                {editingIndex === i ? "Collapse" : "Edit"}
                            </button>
                            <button
                                onClick={() => removePolicy(i)}
                                className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>

                    {/* Expanded editor */}
                    {editingIndex === i && (
                        <div className="border-t border-border p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Title</label>
                                    <input
                                        type="text"
                                        value={policy.title}
                                        onChange={(e) => updatePolicy(i, "title", e.target.value)}
                                        placeholder="Privacy Policy"
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Slug</label>
                                    <input
                                        type="text"
                                        value={policy.slug}
                                        onChange={(e) => updatePolicy(i, "slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                                        placeholder="privacy-policy"
                                        className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">
                                    Content
                                </label>
                                <RichEditor
                                    content={policy.content}
                                    onChange={(html) => updatePolicy(i, "content", html)}
                                    placeholder="Write your policy content here..."
                                />
                            </div>
                        </div>
                    )}
                </div>
            ))}

            <button
                onClick={addPolicy}
                className="w-full p-4 bg-card border-2 border-dashed border-border rounded-xl text-primary font-medium hover:border-primary transition-colors"
            >
                + Add Policy
            </button>

            <div className="flex justify-end pt-4">
                <button
                    onClick={onSave}
                    disabled={saving}
                    className="px-8 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                    {saving ? "Saving..." : "Save Policies"}
                </button>
            </div>
        </div>
    );
}

// ═══════════════════════════
// Tab 3: FAQs
// ═══════════════════════════

function FAQsTab({ faqs, onChange, onSave, saving }) {
    const updateFaq = (index, field, value) => {
        const updated = [...faqs];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    const addFaq = () => {
        onChange([...faqs, { question: "", answer: "", order: faqs.length, isEnabled: true }]);
    };

    const removeFaq = (index) => {
        onChange(faqs.filter((_, i) => i !== index));
    };

    const moveFaq = (index, direction) => {
        const updated = [...faqs];
        const target = index + direction;
        if (target < 0 || target >= updated.length) return;
        [updated[index], updated[target]] = [updated[target], updated[index]];
        // Update order
        updated.forEach((f, i) => f.order = i);
        onChange(updated);
    };

    return (
        <div className="space-y-4">
            {faqs.map((faq, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground font-mono text-sm">#{i + 1}</span>
                            <div className="flex flex-col">
                                <button
                                    onClick={() => moveFaq(i, -1)}
                                    disabled={i === 0}
                                    className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                                >
                                    ▲
                                </button>
                                <button
                                    onClick={() => moveFaq(i, 1)}
                                    disabled={i === faqs.length - 1}
                                    className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                                >
                                    ▼
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => updateFaq(i, "isEnabled", !faq.isEnabled)}
                                className={`w-11 h-6 rounded-full transition-colors relative ${faq.isEnabled ? "bg-primary" : "bg-muted-foreground/30"
                                    }`}
                            >
                                <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform absolute top-0.5 ${faq.isEnabled ? "translate-x-5" : "translate-x-0.5"
                                    }`} />
                            </button>
                            <button
                                onClick={() => removeFaq(i)}
                                className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Question</label>
                            <input
                                type="text"
                                value={faq.question}
                                onChange={(e) => updateFaq(i, "question", e.target.value)}
                                placeholder="How do I track my order?"
                                className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Answer</label>
                            <textarea
                                value={faq.answer}
                                onChange={(e) => updateFaq(i, "answer", e.target.value)}
                                rows={3}
                                placeholder="You can track your order from the Orders section..."
                                className="w-full px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                </div>
            ))}

            <button
                onClick={addFaq}
                className="w-full p-4 bg-card border-2 border-dashed border-border rounded-xl text-primary font-medium hover:border-primary transition-colors"
            >
                + Add FAQ
            </button>

            <div className="flex justify-end pt-4">
                <button
                    onClick={onSave}
                    disabled={saving}
                    className="px-8 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                    {saving ? "Saving..." : "Save FAQs"}
                </button>
            </div>
        </div>
    );
}
