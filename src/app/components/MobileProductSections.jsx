"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Flame, Sparkles, Star, ChevronRight, Gift } from "lucide-react";
import Link from "next/link";
import { getSiteName } from "@/config/brandContent";
import ProductCard from "./ProductCard";

const siteName = getSiteName();
const isSanatva = siteName.toLowerCase().includes("sanatva");

function CategoryPills() {
    const [categories, setCategories] = useState([]);
    const [active, setActive] = useState("all");
    const scrollRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch("/api/products?limit=1");
                const data = await res.json();
                if (data.success && data.categories?.length > 0) {
                    setCategories(data.categories);
                }
            } catch {}
        };
        fetchCategories();
    }, []);

    const handleCategoryClick = (catId) => {
        setActive(catId);
        if (catId === "all") {
            router.push("/products");
        } else {
            router.push(`/products?category=${catId}`);
        }
    };

    return (
        <div className="px-4 pt-6 pb-2 bg-[#FEFBF6]">
            <div
                ref={scrollRef}
                className="flex gap-3 px-1 pb-6 overflow-x-auto no-scrollbar"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
            >
                <button
                    onClick={() => handleCategoryClick("all")}
                    className={`shrink-0 px-6 py-2.5 rounded-full text-[13px] font-bold tracking-tight transition-all duration-300 ${
                        active === "all"
                            ? "bg-[#869661] text-white shadow-lg shadow-[#869661]/20 border border-[#869661]"
                            : "bg-[#F3EFE8]/50 text-[#2A2F25] border border-transparent hover:border-[#ECE8E0]"
                    }`}
                >
                    All Products
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat._id}
                        onClick={() => handleCategoryClick(cat._id)}
                        className={`shrink-0 px-6 py-2.5 rounded-full text-[13px] font-bold tracking-tight transition-all duration-300 ${
                            active === cat._id
                                ? "bg-[#869661] text-white shadow-lg shadow-[#869661]/20 border border-[#869661]"
                                : "bg-[#F3EFE8]/50 text-[#2A2F25] border border-transparent hover:border-[#ECE8E0]"
                    }`}
                >
                    {cat.name}
                </button>
            ))}
            </div>
            <div className="h-[2px] w-full bg-[#869661]/10 rounded-full mb-6">
                <div className="h-full w-24 bg-[#869661] rounded-full" />
            </div>
        </div>
    );
}

function Section({ title, viewAllLink, children, icon: Icon }) {
    return (
        <section className="py-2 px-4 mb-8">
            <div className="flex items-end justify-between mb-6">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-5 h-5 text-[#D86B4B]" />}
                    <h2 className="text-[26px] font-serif font-bold text-[#2A2F25] tracking-tight">{title}</h2>
                </div>
                <Link href={viewAllLink || "/products"} className="flex items-center gap-1 text-[14px] text-[#767B71] font-medium hover:text-[#869661] transition-colors">
                    See All
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
            {children}
        </section>
    );
}

function SimpleProductCard({ product }) {
    const variant = product.variants?.[0];
    const price = variant?.salePrice || variant?.regularPrice || 0;
    const originalPrice = variant?.regularPrice;
    const hasSale = variant?.salePrice && variant?.salePrice < variant?.regularPrice;
    const discountPercent = hasSale ? Math.round((1 - variant.salePrice / variant.regularPrice) * 100) : 0;
    const router = useRouter();

    return (
        <Link href={`/products/${product._id}`} className="flex flex-col group h-full">
            <div className="aspect-square rounded-[2rem] overflow-hidden bg-white border border-[#ECE8E0] shadow-sm relative group">
                <img src={product.images?.[0] || "/placeholder-product.jpg"} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                
                {/* Badges from Screenshot */}
                {product.isFeatured && (
                    <div className="absolute top-3 left-3 bg-[#D86B4B] text-white text-[9px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                         <Flame className="w-2.5 h-2.5 fill-white" /> HOT
                    </div>
                )}
                {hasSale && (
                    <div className="absolute top-3 right-3 bg-[#F9BC16] text-[#2A2F25] text-[9px] font-extrabold px-2.5 py-1 rounded-lg shadow-sm">
                        {discountPercent}% OFF
                    </div>
                )}
                {product.isActive && !product.isFeatured && (
                    <div className="absolute top-3 left-3 bg-[#869661] text-white text-[9px] font-extrabold px-2.5 py-1 rounded-lg shadow-sm">
                        NEW
                    </div>
                )}
            </div>
            <div className="px-1 pt-4 flex flex-col flex-1">
                <h3 className="font-serif text-[16px] font-bold text-[#2A2F25] line-clamp-1 leading-tight">{product.name}</h3>
                <p className="text-[11px] text-[#767B71] mt-1 line-clamp-1 italic">
                    {product.shortDescription || "Handcrafted with artisanal spices"}
                </p>
                <div className="flex items-center justify-between mt-auto pt-3">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-[16px] font-bold text-[#2A2F25]">₹{price}</span>
                        {hasSale && <span className="text-[11px] text-[#767B71] line-through">₹{originalPrice}</span>}
                    </div>
                    <div className="flex items-center gap-0.5 bg-[#F0F4EC] px-2 py-0.5 rounded-full">
                        <Star className="w-2.5 h-2.5 fill-[#D86B4B] text-[#D86B4B]" />
                        <span className="text-[10px] font-bold text-[#2A2F25]">{product.avgRating || '4.8'}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

function HorizontalProductCard({ product }) {
    const variant = product.variants?.[0];
    const price = variant?.salePrice || variant?.regularPrice || 0;
    const router = useRouter();
    return (
        <Link href={`/products/${product._id}`} className="flex gap-4 bg-white rounded-[2rem] p-3 shadow-sm border border-[#ECE8E0] mb-4 group transition-all hover:shadow-md">
            <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-[#FEFBF6] border border-[#ECE8E0]/50">
                <img src={product.images?.[0] || "/placeholder-product.jpg"} alt={product.name} className="w-full h-full object-cover transform transition-transform group-hover:scale-[1.05]" />
            </div>
            <div className="flex flex-col flex-1 py-1">
                <span className="inline-block self-start bg-[#F0F4EC] text-[#869661] text-[9px] font-bold px-2 py-0.5 rounded-full mb-1 tracking-widest uppercase">New Arrival</span>
                <h3 className="font-serif text-[16px] font-bold text-[#2A2F25] line-clamp-1 leading-tight">{product.name}</h3>
                <p className="text-[11px] text-[#767B71] line-clamp-1 mt-1">{product.shortDescription || "Premium quality handcrafted product"}</p>
                <div className="flex items-center justify-between mt-auto">
                    <span className="text-[16px] font-bold text-[#2A2F25]">₹{price}</span>
                    <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-[#D86B4B] text-[#D86B4B]" />
                        <span className="text-[11px] font-bold text-[#2A2F25]">{product.avgRating || '4.9'}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

function MobilePromoBanner() {
    return (
        <div className="px-4 py-6 mb-4">
            <div className="relative w-full h-[160px] rounded-[2.5rem] overflow-hidden bg-[#2A2F25] shadow-xl group">
                {/* Image overlay */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542841791-efa6ebba5121?q=80&w=600')] bg-cover bg-center opacity-30 transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#2A2F25] via-[#2A2F25]/60 to-transparent p-6 flex flex-col justify-center">
                    <div className="inline-flex items-center gap-1.5 text-[#D86B4B] text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
                        <Gift className="w-3.5 h-3.5" />
                        Festive Special
                    </div>
                    <h3 className="font-serif text-[24px] leading-tight font-bold text-white mb-1">Gift Hampers</h3>
                    <p className="text-[12px] text-white/60 mb-4 max-w-[200px] line-clamp-2">Premium collections for your loved ones.</p>
                    <Link href="/bundles" className="inline-flex items-center gap-1 text-[13px] text-white font-bold group-hover:underline">
                        Explore Collection
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

function SpecialOffers() {
    const offers = [
        { amount: "10", type: "Discount", title: "Welcome Gift", color: "from-[#869661] to-[#606E4D]" },
        { amount: "20", type: "Discount", title: "Summer Sale", color: "from-[#D86B4B] to-[#B35236]" },
        { amount: "30", type: "Discount", title: "Bulk Joy", color: "from-[#2A2F25] to-[#1A1F18]" }
    ];
    return (
        <div className="px-4 py-6 mb-8 bg-[#FCF9F2] border-y border-[#ECE8E0]/50 overflow-hidden">
            <div className="inline-flex items-center gap-2 mb-4">
                <div className="h-px w-6 bg-[#D86B4B]/30" />
                <h2 className="text-[10px] font-bold text-[#D86B4B] uppercase tracking-[0.3em]">Exclusive Offers</h2>
                <div className="h-px w-6 bg-[#D86B4B]/30" />
            </div>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar py-4 pb-8 -mx-4 px-4 snap-x snap-mandatory">
                {offers.map((off, idx) => (
                    <div key={idx} className="shrink-0 w-[200px] snap-start">
                        <div className={`relative h-[170px] rounded-[2.5rem] overflow-hidden bg-gradient-to-br ${off.color} p-6 shadow-xl shadow-black/10 flex flex-col justify-between group`}>
                            {/* Decorative Elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl transition-transform group-hover:scale-110" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl" />
                            
                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{off.type}</span>
                                    <h3 className="text-white font-serif text-[20px] font-bold mt-1 leading-tight">{off.title}</h3>
                                </div>
                                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-2 border border-white/20">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            
                            <div className="relative z-10 flex items-end justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[32px] font-bold text-white leading-none">{off.amount}%</span>
                                    <span className="text-[10px] font-bold text-white/80 tracking-[.2em] mt-1 ml-1 uppercase">OFFER</span>
                                </div>
                                <button className="bg-white text-[#2A2F25] text-[11px] font-bold px-5 py-2.5 rounded-full shadow-lg transform active:scale-95 transition-all">
                                    Claim Now
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function MobileProductSections() {
    const [featured, setFeatured] = useState([]);
    const [bestSellers, setBestSellers] = useState([]);
    const [newArrivals, setNewArrivals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [fRes, bRes, nRes] = await Promise.all([
                    fetch("/api/products?limit=2"),
                    fetch("/api/products?isFeatured=true&limit=2"),
                    fetch("/api/products?sort=newest&limit=3")
                ]);
                const [fData, bData, nData] = await Promise.all([fRes.json(), bRes.json(), nRes.json()]);

                if (fData.success && Array.isArray(fData.products)) setFeatured(fData.products);
                if (bData.success && Array.isArray(bData.products)) setBestSellers(bData.products);
                if (nData.success && Array.isArray(nData.products)) setNewArrivals(nData.products);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    if (loading) {
        return <div className="lg:hidden h-screen bg-[#FEFBF6] flex items-center justify-center"><div className="w-8 h-8 border-3 border-[#869661] border-t-transparent flex rounded-full animate-spin"></div></div>;
    }

    return (
        <div className="lg:hidden bg-[#FEFBF6] min-h-screen pb-16">

            {/* Featured Products (Cards) */}
            <Section title="Featured Products" viewAllLink="/products">
                <div className="grid grid-cols-2 gap-4">
                    {featured.map(product => (
                        <ProductCard key={product._id} product={product} viewMode="grid" />
                    ))}
                </div>
            </Section>

            {/* Promo Banner */}
            <MobilePromoBanner />

            {/* Best Sellers */}
            <Section title="Best Sellers" icon={Flame} viewAllLink="/products?isFeatured=true">
                <div className="grid grid-cols-2 gap-4">
                    {bestSellers.map(product => (
                        <ProductCard key={product._id} product={product} viewMode="grid" />
                    ))}
                </div>
            </Section>

            {/* New Arrivals */}
            <Section title="New Arrivals" icon={Sparkles} viewAllLink="/products?sort=newest">
                <div className="flex flex-col gap-4">
                    {newArrivals.map(product => (
                        <ProductCard key={product._id} product={product} viewMode="list" />
                    ))}
                </div>
            </Section>

            {/* Special Offers */}
            <SpecialOffers />
        </div>
    );
}
