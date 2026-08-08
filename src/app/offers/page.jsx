"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Copy, Check, Tag, Gift, Sparkles, Percent, Loader2 } from "lucide-react";
import ProductCard from "@/app/components/ProductCard";
import { toast } from "react-toastify";

const ICON_BY_TYPE = {
    percentage: Percent,
    fixed: Tag,
    buyXForY: Gift,
    buyXGetYFree: Gift,
    tierPricing: Sparkles,
};

const COLOR_VARIANTS = [
    { color: "bg-[var(--c-accent-soft)]", borderColor: "border-[var(--c-primary)]", tagColor: "text-[#647345]" },
    { color: "bg-[#FFF5F0]", borderColor: "border-[var(--c-accent)]", tagColor: "text-[var(--c-accent)]" },
    { color: "bg-[var(--c-surface-warm)]", borderColor: "border-[#C4A642]", tagColor: "text-[#8B7A2E]" },
];

function formatDiscountLabel(c) {
    switch (c.discountType) {
        case "percentage":
            return `${c.discountValue}% OFF`;
        case "fixed":
            return `₹${c.discountValue} OFF`;
        case "buyXForY":
            return "Bundle Deal";
        case "buyXGetYFree":
            return "Buy & Get Free";
        case "tierPricing":
            return "Volume Discount";
        default:
            return "Special Offer";
    }
}

export default function OffersPage() {
    const [coupons, setCoupons] = useState([]);
    const [trending, setTrending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState("");

    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const res = await fetch("/api/coupons");
                const data = await res.json();
                if (data.success) setCoupons(data.coupons || []);
            } catch (err) {
                console.error("Failed to fetch coupons:", err);
            } finally {
                setLoading(false);
            }
        };

        const fetchTrending = async () => {
            try {
                const res = await fetch("/api/products?limit=4&sort=newest");
                const data = await res.json();
                if (data.success) setTrending(data.products || []);
            } catch (err) {
                console.error("Failed to fetch products:", err);
            }
        };

        fetchCoupons();
        fetchTrending();
    }, []);

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        toast.success(`Copied: ${code}`);
        setTimeout(() => setCopiedCode(""), 3000);
    };

    return (
        <main className="min-h-screen bg-[var(--c-bg)]">
            {/* Hero */}
            <section className="relative h-[50vh] lg:h-[60vh] w-full overflow-hidden">
                <div className="absolute inset-0 bg-[var(--c-text)] z-10" />
                <img
                    src="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=2853&auto=format&fit=crop"
                    alt="Offers"
                    className="absolute inset-0 w-full h-full object-cover opacity-40 scale-105"
                />
                <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        <span className="inline-block bg-[var(--c-accent)] text-white text-xs font-semibold px-5 py-2 rounded-full mb-6">
                            🎉 Live Offers
                        </span>
                        <h1 className="font-serif text-[44px] lg:text-6xl text-white font-bold mb-4 leading-tight">
                            Deals & Discounts
                        </h1>
                        <p className="text-white/70 text-lg max-w-xl mx-auto mb-8">
                            Copy a code and apply it at checkout for instant savings.
                        </p>
                        <Link href="/products" className="inline-flex items-center bg-[var(--c-primary)] hover:bg-[var(--c-primary-dark)] text-white px-8 py-3.5 rounded-xl text-sm font-semibold transition-colors">
                            Browse Products
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Coupons Section */}
            <section className="py-16 lg:py-24">
                <div className="container mx-auto px-4 xl:px-8 max-w-7xl">
                    <div className="text-center mb-12">
                        <h2 className="font-serif text-[32px] font-bold text-[var(--c-text)] mb-3">Available Coupon Codes</h2>
                        <p className="text-[var(--c-text-muted)] text-[15px] max-w-lg mx-auto">
                            Click any code to copy and paste it at checkout.
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="w-8 h-8 text-[var(--c-primary)] animate-spin" />
                        </div>
                    ) : coupons.length === 0 ? (
                        <div className="text-center py-16 max-w-md mx-auto">
                            <Gift className="w-12 h-12 mx-auto mb-4 text-[var(--c-primary)]/40" strokeWidth={1.5} />
                            <h3 className="font-serif text-xl font-bold text-[var(--c-text)] mb-2">No Active Offers</h3>
                            <p className="text-[var(--c-text-muted)] text-sm">
                                Check back soon — new promotions drop regularly.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                            {coupons.map((coupon, idx) => {
                                const Icon = ICON_BY_TYPE[coupon.discountType] || Tag;
                                const style = COLOR_VARIANTS[idx % COLOR_VARIANTS.length];
                                return (
                                    <motion.div
                                        key={coupon._id || coupon.code}
                                        initial={{ opacity: 0, y: 15 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        className={`${style.color} border-2 ${style.borderColor} border-dashed rounded-2xl p-6 text-center hover:shadow-lg transition-all cursor-pointer group`}
                                        onClick={() => handleCopy(coupon.code)}
                                    >
                                        <Icon className={`w-8 h-8 ${style.tagColor} mx-auto mb-4`} strokeWidth={1.5} />
                                        <h3 className="font-serif text-xl font-bold text-[var(--c-text)] mb-2">
                                            {formatDiscountLabel(coupon)}
                                        </h3>
                                        <p className="text-[var(--c-text-muted)] text-sm mb-3 leading-relaxed min-h-[40px]">
                                            {coupon.description || "Exclusive discount on eligible products."}
                                        </p>
                                        {coupon.minPurchase > 0 && (
                                            <p className="text-[11px] text-[var(--c-text-muted)]/70 mb-4 font-medium">
                                                Min. order ₹{coupon.minPurchase}
                                                {coupon.maxDiscount ? ` · Max ₹${coupon.maxDiscount} off` : ""}
                                            </p>
                                        )}
                                        <div className={`inline-flex items-center gap-2 bg-white border border-[var(--c-border)] px-5 py-2.5 rounded-xl font-mono font-bold text-sm tracking-wider ${style.tagColor} group-hover:shadow-md transition-all`}>
                                            {coupon.code}
                                            {copiedCode === coupon.code
                                                ? <Check className="w-4 h-4 text-green-600" />
                                                : <Copy className="w-4 h-4 opacity-40" />
                                            }
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* Trending Products */}
            {trending.length > 0 && (
                <section className="py-16 lg:py-20 bg-white border-t border-[var(--c-border)]">
                    <div className="container mx-auto px-4 xl:px-8 max-w-7xl">
                        <div className="flex items-end justify-between mb-10">
                            <div>
                                <span className="text-[var(--c-accent)] text-sm font-medium mb-1 block">New In</span>
                                <h2 className="font-serif text-[28px] font-bold text-[var(--c-text)]">Latest Arrivals</h2>
                            </div>
                            <Link href="/products" className="hidden sm:inline-flex items-center text-sm font-medium text-[var(--c-text)] hover:text-[#647345] transition-colors">
                                View All →
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                            {trending.map(product => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </main>
    );
}
