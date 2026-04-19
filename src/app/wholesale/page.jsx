"use client";

import { motion } from "framer-motion";
import { Globe, Building2, PackageCheck, Zap, ArrowRight, ShieldCheck } from "lucide-react";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Store";

const benefits = [
    { icon: Globe, title: "Global Reach", desc: "Specialized logistics for international bulk shipments with door-to-door tracking." },
    { icon: Building2, title: "Premium Gifting", desc: "Custom branding and luxury packaging for corporate hospitality and events." },
    { icon: PackageCheck, title: "Artisanal Scale", desc: "Reliable production from our traditional kitchens to maintain artisanal quality at scale." },
    { icon: Zap, title: "Priority Support", desc: "Dedicated account manager for all your bulk ordering and customization needs." }
];

export default function WholesalePage() {
    return (
        <div className="min-h-screen bg-[#FEFBF6] pt-24 pb-20 px-4">
            <div className="container mx-auto max-w-6xl">
                {/* Hero section */}
                <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D86B4B]/10 text-[#D86B4B] text-[10px] font-bold uppercase tracking-[0.2em]">
                            <Building2 className="w-3.5 h-3.5" />
                            B2B & Partners
                        </div>
                        <h1 className="font-serif text-5xl md:text-6xl font-bold text-[#2A2F25] leading-tight">Artisanal Excellence at Scale</h1>
                        <p className="text-[#767B71] text-lg leading-relaxed">Join our network of luxury hotels, premium retailers, and corporate partners who choose {SITE_NAME} for handcrafted purity and heritage taste.</p>
                        
                        <div className="flex flex-wrap gap-4 pt-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#869661]/10 flex items-center justify-center text-[#869661]">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-bold text-[#2A2F25]">Certified Purity</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#D86B4B]/10 flex items-center justify-center text-[#D86B4B]">
                                    <Globe className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-bold text-[#2A2F25]">Worldwide Logistics</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-[#ECE8E0] relative"
                    >
                        <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#D86B4B] text-white rounded-2xl flex flex-col items-center justify-center shadow-lg transform rotate-12 z-10">
                            <span className="text-sm font-bold uppercase tracking-tighter">EST.</span>
                            <span className="text-2xl font-serif font-bold">1982</span>
                        </div>
                        
                        <h3 className="font-serif text-2xl font-bold text-[#2A2F25] mb-8 text-center">Business Inquiry</h3>
                        <form className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <input type="text" placeholder="Full Name" className="w-full bg-[#FEFBF6] border-none rounded-xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#869661]" />
                                <input type="text" placeholder="Company Name" className="w-full bg-[#FEFBF6] border-none rounded-xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#869661]" />
                            </div>
                            <input type="email" placeholder="Business Email" className="w-full bg-[#FEFBF6] border-none rounded-xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#869661]" />
                            <select className="w-full bg-[#FEFBF6] border-none rounded-xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#869661] text-[#767B71]">
                                <option>Nature of Interest</option>
                                <option>Retail Distribution</option>
                                <option>Corporate Gifting</option>
                                <option>Hotel Supply (HORECA)</option>
                                <option>Export Inquiry</option>
                            </select>
                            <textarea rows="4" placeholder="Your requirements..." className="w-full bg-[#FEFBF6] border-none rounded-xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#869661]"></textarea>
                            <button className="w-full bg-[#2A2F25] text-white py-4 rounded-xl font-bold hover:bg-[#3A3F35] transition-all flex items-center justify-center gap-2 group shadow-lg">
                                Send Inquiry
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </button>
                        </form>
                    </motion.div>
                </div>

                {/* Benefits grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {benefits.map((item, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white rounded-[2rem] p-8 border border-[#ECE8E0] hover:shadow-xl transition-all h-full"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-[#F0F4EC] flex items-center justify-center text-[#869661] mb-6">
                                <item.icon className="w-6 h-6" />
                            </div>
                            <h4 className="font-serif text-lg font-bold text-[#2A2F25] mb-3">{item.title}</h4>
                            <p className="text-sm text-[#767B71] leading-relaxed">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Trust banner */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-24 py-12 border-y border-[#ECE8E0]/50 text-center"
                >
                    <p className="text-[#869661] font-bold text-[10px] tracking-[0.4em] uppercase mb-8">Trusted by Global Partners</p>
                    <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-24 opacity-40 grayscale group-hover:grayscale-0 transition-all">
                        <span className="font-serif text-2xl font-bold">Oberoi Hotels</span>
                        <span className="font-serif text-2xl font-bold">Taj Hospitality</span>
                        <span className="font-serif text-2xl font-bold">Lulu Hypermarket</span>
                        <span className="font-serif text-2xl font-bold">Reliance Retail</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
