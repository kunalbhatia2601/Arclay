"use client";

import { motion } from "framer-motion";
import { HelpCircle, ChevronRight, MessageSquare, PhoneCall } from "lucide-react";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Store";

const faqs = [
    {
        category: "Product & Quality",
        questions: [
            { q: "Are your products 100% natural?", a: `Yes, all ${SITE_NAME} products are handcrafted using traditional methods with no artificial preservatives, colors, or flavors. We use only the finest artisanal spices and cold-pressed oils.` },
            { q: "What is the shelf life of your pickles?", a: "Most of our pickles have a shelf life of 12-18 months. Since we use traditional preservation techniques, they actually develop more depth of flavor over time. Please keep them in a cool, dry place." },
            { q: "Are your products organic?", a: "We source our ingredients from certified organic farms whenever possible. Our process is rooted in 'Vedic' purity, ensuring the highest nutritional value." }
        ]
    },
    {
        category: "Shipping & Gifting",
        questions: [
            { q: "How long does delivery take?", a: "We typically ship within 24-48 hours. Domestic delivery takes 3-5 business days, while international shipping can take 7-12 days depending on the location." },
            { q: "Do you offer corporate gifting?", a: "Absolutely. We specialize in luxury corporate hampers. You can visit our Wholesale/Gifting page or contact our concierge for customized branding options." },
            { q: "Can I track my order?", a: "Yes, once your order is dispatched, you will receive a tracking link via email and WhatsApp to monitor your shipment in real-time." }
        ]
    }
];

export default function FAQsPage() {
    return (
        <div className="min-h-screen bg-[#FEFBF6] pt-24 pb-20 px-4">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#869661]/10 text-[#869661] text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                        <HelpCircle className="w-3.5 h-3.5" />
                        Common Queries
                    </div>
                    <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#2A2F25] mb-4">Frequently Asked Questions</h1>
                    <p className="text-[#767B71] text-lg max-w-xl mx-auto">Everything you need to know about our artisanal products and luxury service.</p>
                </motion.div>

                {/* FAQ Grid */}
                <div className="space-y-12">
                    {faqs.map((group, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <h2 className="font-serif text-2xl font-bold text-[#2A2F25] mb-6 flex items-center gap-3">
                                <div className="w-8 h-1 bg-[#D86B4B] rounded-full" />
                                {group.category}
                            </h2>
                            <div className="grid gap-4">
                                {group.questions.map((item, i) => (
                                    <div key={i} className="bg-white rounded-2xl p-6 border border-[#ECE8E0] shadow-sm hover:shadow-md transition-all">
                                        <h3 className="font-bold text-[#2A2F25] mb-3 flex items-start gap-3">
                                            <span className="text-[#869661]">Q.</span>
                                            {item.q}
                                        </h3>
                                        <p className="text-[#767B71] text-sm leading-relaxed pl-7">
                                            {item.a}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Still have questions? */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="mt-20 bg-[#2A2F25] rounded-[3rem] p-10 md:p-16 text-center text-white relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#869661]/20 blur-[100px] rounded-full" />
                    <div className="relative z-10">
                        <h2 className="font-serif text-3xl font-bold mb-4">Still have questions?</h2>
                        <p className="text-white/60 mb-8 max-w-md mx-auto">Our artisanal concierge is here to help you with any specific queries you may have.</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <button className="bg-[#869661] hover:bg-[#71824F] text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all">
                                <MessageSquare className="w-5 h-5" /> Chat with Us
                            </button>
                            <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-bold border border-white/20 flex items-center gap-2 transition-all">
                                <PhoneCall className="w-5 h-5" /> Call Concierge
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
