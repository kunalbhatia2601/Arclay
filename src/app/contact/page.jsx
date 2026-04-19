"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MessageCircle, Send, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Store";

const ICON_BY_TYPE = {
    email: Mail,
    call: Phone,
    live_chat: MessageCircle,
};

const LABEL_BY_TYPE = {
    email: "Email Us",
    call: "Call Us",
    live_chat: "Live Chat",
};

export default function ContactPage() {
    const [contacts, setContacts] = useState([]);
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const res = await fetch("/api/app-config");
                const data = await res.json();
                if (data.success) setContacts(data.config?.helpContacts || []);
            } catch (err) {
                console.error("Failed to fetch contacts:", err);
            }
        };
        fetchContacts();
    }, []);

    const handleChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
            toast.error("Please fill in your name, email, and message");
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.success) {
                setSent(true);
                toast.success("Message sent — we'll get back to you soon.");
                setForm({ name: "", email: "", subject: "", message: "" });
            } else {
                toast.error(data.message || "Failed to send message");
            }
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const contactHref = (c) => {
        if (c.type === "email") return `mailto:${c.value}`;
        if (c.type === "call") return `tel:${c.value}`;
        return c.value;
    };

    return (
        <main className="min-h-screen bg-[#FEFBF6]">
            {/* Hero */}
            <section className="bg-[#2A2F25] text-white pt-28 lg:pt-32 pb-20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-[#869661]/10 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-1/3 h-full bg-[#D86B4B]/10 blur-[80px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />

                <div className="container mx-auto px-6 max-w-4xl relative z-10 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold uppercase tracking-[0.2em] mb-6">
                            <MessageCircle className="w-3.5 h-3.5 text-[#D86B4B]" /> Get in Touch
                        </span>
                        <h1 className="font-serif text-[42px] lg:text-[60px] font-bold leading-tight mb-5">
                            We&apos;d love to hear from you
                        </h1>
                        <p className="text-white/60 text-base lg:text-lg max-w-xl mx-auto leading-relaxed">
                            Questions, feedback, or bespoke orders — send us a note and our team will reply shortly.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Contact cards + form */}
            <section className="container mx-auto px-4 lg:px-8 max-w-6xl -mt-12 pb-20 relative z-20">
                {/* Contact cards */}
                {contacts.length > 0 && (
                    <div className={`grid gap-4 mb-12 ${contacts.length === 1 ? "grid-cols-1 max-w-md mx-auto" : contacts.length === 2 ? "md:grid-cols-2 max-w-3xl mx-auto" : "md:grid-cols-3"}`}>
                        {contacts.map((c, idx) => {
                            const Icon = ICON_BY_TYPE[c.type] || Mail;
                            const href = contactHref(c);
                            return (
                                <motion.a
                                    key={idx}
                                    href={href}
                                    target={c.type === "live_chat" ? "_blank" : undefined}
                                    rel={c.type === "live_chat" ? "noopener noreferrer" : undefined}
                                    initial={{ opacity: 0, y: 15 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white border border-[#ECE8E0] rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-[#F0F4EC] flex items-center justify-center mb-4 group-hover:bg-[#869661] transition-colors">
                                        <Icon className="w-5 h-5 text-[#869661] group-hover:text-white transition-colors" strokeWidth={1.8} />
                                    </div>
                                    <h3 className="text-[11px] uppercase tracking-[0.15em] font-bold text-[#767B71] mb-2">
                                        {c.label || LABEL_BY_TYPE[c.type] || "Contact"}
                                    </h3>
                                    <p className="text-[15px] font-semibold text-[#2A2F25] break-words">
                                        {c.value}
                                    </p>
                                </motion.a>
                            );
                        })}
                    </div>
                )}

                {/* Form */}
                <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 bg-white border border-[#ECE8E0] rounded-3xl overflow-hidden shadow-sm">
                    {/* Left rail */}
                    <div className="lg:col-span-2 bg-[#2A2F25] text-white p-8 lg:p-10 relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#869661]/20 blur-[80px] rounded-full" />
                        <div className="relative z-10">
                            <h2 className="font-serif text-[28px] font-bold leading-tight mb-3">Send us a message</h2>
                            <p className="text-white/60 text-[14px] leading-relaxed mb-8">
                                Fill in the form and our team will respond within 1–2 business days.
                            </p>
                            <ul className="space-y-4 text-[13px] text-white/70">
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#869661] shrink-0" />
                                    Secure &amp; private — your details stay with us.
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#869661] shrink-0" />
                                    Real humans reply, not automated bots.
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#869661] shrink-0" />
                                    Bulk &amp; bespoke enquiries welcome.
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="lg:col-span-3 p-8 lg:p-10">
                        {sent ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="h-full min-h-[380px] flex flex-col items-center justify-center text-center"
                            >
                                <div className="w-16 h-16 rounded-full bg-[#F0F4EC] flex items-center justify-center mb-5">
                                    <CheckCircle2 className="w-8 h-8 text-[#647345]" strokeWidth={1.8} />
                                </div>
                                <h3 className="font-serif text-2xl font-bold text-[#2A2F25] mb-2">Message sent</h3>
                                <p className="text-[#767B71] text-sm max-w-xs mb-6">
                                    Thanks for reaching out. We&apos;ll get back to you as soon as possible.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setSent(false)}
                                    className="text-sm font-semibold text-[#647345] hover:text-[#2A2F25] transition-colors"
                                >
                                    Send another message
                                </button>
                            </motion.div>
                        ) : (
                            <>
                                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-[11px] uppercase tracking-[0.15em] font-bold text-[#767B71] mb-2">
                                            Your Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            maxLength={200}
                                            value={form.name}
                                            onChange={handleChange("name")}
                                            placeholder="Jane Doe"
                                            className="w-full px-4 py-3 rounded-xl border border-[#ECE8E0] bg-[#FEFBF6] text-sm focus:outline-none focus:border-[#869661] focus:bg-white transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] uppercase tracking-[0.15em] font-bold text-[#767B71] mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={form.email}
                                            onChange={handleChange("email")}
                                            placeholder="you@email.com"
                                            className="w-full px-4 py-3 rounded-xl border border-[#ECE8E0] bg-[#FEFBF6] text-sm focus:outline-none focus:border-[#869661] focus:bg-white transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-[11px] uppercase tracking-[0.15em] font-bold text-[#767B71] mb-2">
                                        Subject
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={200}
                                        value={form.subject}
                                        onChange={handleChange("subject")}
                                        placeholder="How can we help?"
                                        className="w-full px-4 py-3 rounded-xl border border-[#ECE8E0] bg-[#FEFBF6] text-sm focus:outline-none focus:border-[#869661] focus:bg-white transition-colors"
                                    />
                                </div>

                                <div className="mb-6">
                                    <label className="block text-[11px] uppercase tracking-[0.15em] font-bold text-[#767B71] mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        required
                                        rows={6}
                                        maxLength={5000}
                                        value={form.message}
                                        onChange={handleChange("message")}
                                        placeholder="Tell us a little more..."
                                        className="w-full px-4 py-3 rounded-xl border border-[#ECE8E0] bg-[#FEFBF6] text-sm focus:outline-none focus:border-[#869661] focus:bg-white transition-colors resize-none"
                                    />
                                    <div className="text-right text-[11px] text-[#767B71] mt-1">
                                        {form.message.length} / 5000
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#869661] hover:bg-[#71824F] text-white px-8 py-3.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#869661]/20"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                                        </>
                                    ) : (
                                        <>
                                            Send Message <Send className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </form>
                </div>
            </section>
        </main>
    );
}
