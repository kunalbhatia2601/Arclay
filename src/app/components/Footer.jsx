"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Phone, Mail, Truck, Shield, RotateCcw, Award, Instagram, Facebook, Twitter, Youtube } from "lucide-react";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Store";
const SITE_LOGO = process.env.NEXT_PUBLIC_SITE_LOGO || "";
const SITE_DESCRIPTION = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "";

export default function Footer() {
    const pathname = usePathname();
    const [showFooter, setShowFooter] = useState(true);
    const [email, setEmail] = useState("");
    const [contacts, setContacts] = useState({ phone: null, email: null });
    const [legalPolicies, setLegalPolicies] = useState([]);

    useEffect(() => {
        const isAuthPage = pathname.includes("login") || pathname.includes("signup") || pathname.includes("admin");
        setShowFooter(!isAuthPage);
    }, [pathname]);

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const res = await fetch("/api/app-config");
                const data = await res.json();
                const list = data?.config?.helpContacts || [];
                setContacts({
                    phone: list.find(c => c.type === "call") || null,
                    email: list.find(c => c.type === "email") || null,
                });
                setLegalPolicies(data?.config?.legalPolicies || []);
            } catch (err) {
                console.error("Failed to fetch contacts:", err);
            }
        };
        fetchContacts();
    }, []);

    if (!showFooter) return null;

    return (
        <div className="bg-gradient-to-b from-[#1C2018] to-[#12140F] text-white overflow-hidden relative">
            {/* Subtle glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-[#869661]/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Trust Strip */}
            <section className="py-14 border-b border-white/5 relative z-10">
                <div className="container mx-auto px-6 xl:px-8 max-w-7xl">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: Truck, title: "Free Shipping", desc: "On orders above ₹500" },
                            { icon: Shield, title: "Secure Payment", desc: "100% secure checkout" },
                            { icon: RotateCcw, title: "Easy Returns", desc: "30-day return policy" },
                            { icon: Award, title: "Premium Quality", desc: "Handcrafted with love" },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-5 group transition-transform hover:translate-x-1">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-[#869661]/20 group-hover:border-[#869661]/20 transition-all">
                                    <item.icon className="w-5 h-5 text-white/40 group-hover:text-[#869661] transition-colors" strokeWidth={1.5} />
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-white font-bold text-sm tracking-tight">{item.title}</h4>
                                    <p className="text-white/40 text-[11px] font-medium leading-none mt-1.5">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Newsletter Section - Glassmorphic Card */}
            <section className="py-24 relative z-10 px-6">
                <div className="container mx-auto max-w-7xl">
                    <div className="bg-white/[0.03] backdrop-blur-xl rounded-[40px] border border-white/10 p-10 lg:p-16 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D86B4B]/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-[#D86B4B]/20 transition-colors duration-700" />
                        
                        <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#869661]/20 border border-[#869661]/20 text-[#869661] text-[10px] font-bold uppercase tracking-widest mb-4">
                                    <Sparkles className="w-3 h-3" />
                                    The Gourmet Club
                                </div>
                                <h3 className="font-serif text-[36px] lg:text-[48px] font-bold mb-4 leading-tight text-white">Join Our Inner Circle</h3>
                                <p className="text-white/60 text-base max-w-md leading-relaxed">
                                    Unlock exclusive artisanal recipes, first access to seasonal batches, and member-only rewards.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 w-full">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="flex-1 px-8 py-5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-[#869661]/50 focus:bg-white/10 text-sm transition-all"
                                />
                                <button className="px-10 py-5 rounded-2xl bg-[#D86B4B] hover:bg-[#C05A3D] text-white font-bold text-sm transition-all shadow-xl shadow-[#D86B4B]/20 hover:shadow-[#D86B4B]/40 hover:-translate-y-0.5 active:translate-y-0">
                                    Subscribe Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Footer */}
            <footer className="pt-12 pb-12 relative z-10">
                <div className="container mx-auto px-6 xl:px-8 max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 lg:gap-12">

                        {/* Brand Column */}
                        <div className="lg:col-span-4">
                            <Link href="/" className="flex items-center gap-4 mb-8 group">
                                {SITE_LOGO ? (
                                    <img
                                        src={`/${SITE_LOGO}`}
                                        alt={SITE_NAME}
                                        className="w-12 h-12 rounded-2xl object-contain shrink-0 bg-white/5"
                                    />
                                ) : (
                                    <div className="w-12 h-12 bg-[#869661] rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#869661]/20 group-hover:rotate-6 transition-transform">
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <span className="font-serif text-[32px] font-bold text-white leading-none">{SITE_NAME}</span>
                                    {SITE_DESCRIPTION && (
                                        <span className="text-[11px] font-bold tracking-[0.2em] text-[#869661] mt-1 uppercase truncate max-w-[280px]">
                                            {SITE_DESCRIPTION}
                                        </span>
                                    )}
                                </div>
                            </Link>

                            <p className="text-white/50 text-[15px] leading-relaxed max-w-sm mb-10">
                                {SITE_DESCRIPTION || `Discover products you'll love, delivered with care.`}
                            </p>

                            <div className="space-y-6">
                                {contacts.phone && (
                                    <a href={`tel:${contacts.phone.value}`} className="flex items-center gap-4 text-[14px] text-white/60 hover:text-[#869661] transition-colors group">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-[#869661]/10">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        {contacts.phone.value}
                                    </a>
                                )}
                                {contacts.email && (
                                    <a href={`mailto:${contacts.email.value}`} className="flex items-center gap-4 text-[14px] text-white/60 hover:text-[#869661] transition-colors group">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-[#869661]/10">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        {contacts.email.value}
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Link Columns */}
                        <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-12 lg:gap-8">
                            <div>
                                <h4 className="font-bold text-[13px] text-white mb-8 uppercase tracking-[0.2em]">Curation</h4>
                                <ul className="space-y-4">
                                    {["All Products", "New Arrivals", "Bestsellers", "Gift Hampers", "Offers"].map(item => (
                                        <li key={item}><Link href="/products" className="text-white/40 hover:text-[#869661] text-[14px] transition-all hover:translate-x-1 inline-block">{item}</Link></li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-bold text-[13px] text-white mb-8 uppercase tracking-[0.2em]">Company</h4>
                                <ul className="space-y-4">
                                    <li><Link href="/about" className="text-white/40 hover:text-[#869661] text-[14px] transition-all hover:translate-x-1 inline-block">About Us</Link></li>
                                    <li><Link href="/blog" className="text-white/40 hover:text-[#869661] text-[14px] transition-all hover:translate-x-1 inline-block">Blog</Link></li>
                                    <li><Link href="/contact" className="text-white/40 hover:text-[#869661] text-[14px] transition-all hover:translate-x-1 inline-block">Contact</Link></li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-bold text-[13px] text-white mb-8 uppercase tracking-[0.2em]">Support</h4>
                                <ul className="space-y-4">
                                    <li><Link href="/faqs" className="text-white/40 hover:text-[#869661] text-[14px] transition-all hover:translate-x-1 inline-block">FAQs</Link></li>
                                    <li><Link href="/orders" className="text-white/40 hover:text-[#869661] text-[14px] transition-all hover:translate-x-1 inline-block">Track Order</Link></li>
                                    <li><Link href="/account" className="text-white/40 hover:text-[#869661] text-[14px] transition-all hover:translate-x-1 inline-block">My Account</Link></li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-bold text-[13px] text-white mb-8 uppercase tracking-[0.2em]">Legal</h4>
                                <ul className="space-y-4">
                                    {legalPolicies.length > 0 ? (
                                        legalPolicies.map(p => (
                                            <li key={p._id || p.slug}>
                                                <Link
                                                    href={`/policy/${p.slug}`}
                                                    className="text-white/40 hover:text-[#869661] text-[14px] transition-all hover:translate-x-1 inline-block"
                                                >
                                                    {p.title}
                                                </Link>
                                            </li>
                                        ))
                                    ) : (
                                        <li>
                                            <Link href="/policy" className="text-white/40 hover:text-[#869661] text-[14px] transition-all hover:translate-x-1 inline-block">
                                                Policies
                                            </Link>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="mt-24 pt-12 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-center gap-10">
                        {/* Copyright Section */}
                        <div className="flex flex-col gap-2 order-2 md:order-1 items-center md:items-start">
                             <p className="text-white/60 text-[13px]">
                                © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
                            </p>
                            {SITE_DESCRIPTION && (
                                <p className="text-white/40 text-[11px] font-medium tracking-wide">
                                    {SITE_DESCRIPTION}
                                </p>
                            )}
                        </div>
                        
                        {/* Social & Certs Section */}
                        <div className="flex flex-col items-center gap-6 order-1 lg:order-2">
                             <div className="flex items-center gap-4 relative">
                                {[Instagram, Facebook, Twitter, Youtube].map((Icon, i) => (
                                    <button key={i} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-[#869661] hover:text-white transition-all border border-white/5 group relative overflow-hidden">
                                        <Icon className="w-4 h-4 relative z-10" />
                                        <div className="absolute inset-0 bg-[#869661] scale-0 group-hover:scale-100 rounded-full transition-transform duration-500" />
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white/40 tracking-widest uppercase hover:text-white transition-all group relative overflow-hidden cursor-default">
                                    <span className="relative z-10">FSSAI Certified</span>
                                    <div className="absolute inset-0 bg-[#869661]/20 scale-0 group-hover:scale-100 rounded-xl transition-transform duration-500" />
                                </span>
                                <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white/40 tracking-widest uppercase hover:text-white transition-all group relative overflow-hidden cursor-default">
                                    <span className="relative z-10">100% Organic</span>
                                    <div className="absolute inset-0 bg-[#869661]/20 scale-0 group-hover:scale-100 rounded-xl transition-transform duration-500" />
                                </span>
                            </div>
                        </div>

                        {/* Attribution Section */}
                        <div className="flex justify-center md:justify-end order-3">
                            <Link 
                                href="https://biharinnovation.in" 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex flex-col items-center md:items-end gap-1.5"
                            >
                                <span className="text-white/30 text-[10px] uppercase font-bold tracking-[0.2em] group-hover:text-[#869661] transition-colors">Design & Developed by</span>
                                <span className="font-serif text-[18px] text-white/60 group-hover:text-white transition-all">Bihar Innovation</span>
                                <div className="h-px w-0 group-hover:w-full bg-[#869661] transition-all duration-500" />
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
