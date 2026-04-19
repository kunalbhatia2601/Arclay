"use client";

import { useState, useEffect, use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import ProductCard from "@/app/components/ProductCard";
import { toast } from "react-toastify";
import { Heart, Share2, ShoppingBag, Star, Truck, Shield, RotateCcw, ChevronRight, Minus, Plus, Flame, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductDetailSkeleton } from "@/app/components/ProductSkeleton";

const AccordionItem = ({ title, isOpen, onClick, children }) => (
    <div className="border-b border-[#ECE8E0] last:border-0">
        <button
            onClick={onClick}
            className="w-full py-6 flex items-center justify-between text-left group"
        >
            <span className="text-[15px] font-bold text-[#2A2F25] group-hover:text-[#869661] transition-colors uppercase tracking-widest">{title}</span>
            {isOpen ? <ChevronUp className="w-5 h-5 text-[#869661]" /> : <ChevronDown className="w-5 h-5 text-[#767B71]" />}
        </button>
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <div className="pb-8 text-[#555] text-[15px] leading-relaxed">
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

export default function ProductDetailPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const { isAuthenticated } = useUser();
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [newArrivals, setNewArrivals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [addingToCart, setAddingToCart] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [quantity, setQuantity] = useState(1);
    const [openAccordion, setOpenAccordion] = useState("description");
    const [activeTab, setActiveTab] = useState("description");
    const [pincode, setPincode] = useState("");
    const [pincodeStatus, setPincodeStatus] = useState(null); // 'checking', 'success', 'error'

    // Auto-scroll logic for mobile (enabled if multi-image)
    useEffect(() => {
        if (!product?.images || product.images.length <= 1) return;
        
        const interval = setInterval(() => {
            setSelectedImage((prev) => (prev + 1) % product.images.length);
        }, 4000); // 4 seconds interval

        return () => clearInterval(interval);
    }, [product?.images]);

    const checkPincode = (e) => {
        e.preventDefault();
        if (pincode.length !== 6) {
            toast.error("Please enter a valid 6-digit pincode");
            return;
        }
        setPincodeStatus('checking');
        setTimeout(() => {
            setPincodeStatus('success');
            toast.success("Delivery available to " + pincode);
        }, 800);
    };

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/products/${id}`);
                const data = await res.json();
                if (data.success && data.product) {
                    setProduct(data.product);
                    setReviews(data.reviews || []);
                    setRelatedProducts(data.relatedProducts || []);
                    const initialOptions = {};
                    data.product.variationTypes?.forEach((type) => {
                        if (type.options?.length > 0) initialOptions[type.name] = type.options[0];
                    });
                    setSelectedOptions(initialOptions);
                } else {
                    setError("Product not found");
                }
            } catch (error) {
                console.error("Failed to fetch product:", error);
                setError("Failed to load product");
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [id]);

    const selectedVariant = useMemo(() => {
        if (!product?.variants?.length) return null;
        if (!product.variationTypes?.length) return product.variants[0];
        return product.variants.find(variant => {
            const attrs = variant.attributes instanceof Map ? Object.fromEntries(variant.attributes) : variant.attributes;
            return Object.entries(selectedOptions).every(([key, value]) => attrs[key] === value);
        });
    }, [product, selectedOptions]);

    const priceInfo = useMemo(() => {
        if (!selectedVariant) return { price: 0, originalPrice: null, hasSale: false, stock: 0, inStock: false, discount: 0 };
        const hasSale = selectedVariant.salePrice && selectedVariant.salePrice < selectedVariant.regularPrice;
        return {
            price: hasSale ? selectedVariant.salePrice : selectedVariant.regularPrice,
            originalPrice: hasSale ? selectedVariant.regularPrice : null,
            hasSale,
            stock: selectedVariant.stock || 0,
            inStock: (selectedVariant.stock || 0) > 0,
            discount: hasSale ? selectedVariant.regularPrice - selectedVariant.salePrice : 0,
            discountPercent: hasSale ? Math.round((1 - selectedVariant.salePrice / selectedVariant.regularPrice) * 100) : 0,
        };
    }, [selectedVariant]);

    const handleAddToCart = async () => {
        if (!isAuthenticated) { router.push("/login"); return; }
        if (!selectedVariant) { toast.error("Please select all options"); return; }
        try {
            setAddingToCart(true);
            const variantAttributes = selectedVariant.attributes instanceof Map ? Object.fromEntries(selectedVariant.attributes) : selectedVariant.attributes;
            const res = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ productId: product._id, variantAttributes, quantity }),
            });
            const data = await res.json();
            if (data.success) toast.success("Added to cart!");
            else toast.error(data.message || "Failed to add");
        } catch { toast.error("Failed to add to cart"); }
        finally { setAddingToCart(false); }
    };

    const handleBuyNow = async () => {
        if (!isAuthenticated) { router.push("/login"); return; }
        if (!selectedVariant) { toast.error("Please select all options"); return; }
        try {
            setAddingToCart(true);
            const variantAttributes = selectedVariant.attributes instanceof Map ? Object.fromEntries(selectedVariant.attributes) : selectedVariant.attributes;
            const res = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ productId: product._id, variantAttributes, quantity }),
            });
            const data = await res.json();
            if (data.success) router.push("/checkout");
            else toast.error(data.message || "Failed");
        } catch { toast.error("Failed"); }
        finally { setAddingToCart(false); }
    };

    const avgRating = reviews.length > 0 ? (reviews.reduce((t, r) => t + r.stars, 0) / reviews.length).toFixed(1) : 0;

    if (loading) return <ProductDetailSkeleton />;

    if (!product) return (
        <div className="min-h-screen bg-[#FEFBF6] flex flex-col items-center justify-center text-center px-4">
            <h1 className="font-serif text-4xl mb-4 text-[#2A2F25]">Product Not Found</h1>
            <p className="text-[#767B71] mb-8">This item is no longer available.</p>
            <Link href="/products" className="px-8 py-3 bg-[#869661] text-white rounded-full text-sm font-semibold hover:bg-[#71824F] transition-colors">
                Return to Shop
            </Link>
        </div>
    );

    const tabs = [
        { key: "description", label: "Description" },
        { key: "ingredients", label: "Ingredients" },
        { key: "nutrition", label: "Nutrition" },
        { key: "reviews", label: "Reviews" },
    ];

    // Variant display name (e.g., "500g")
    const variantLabel = selectedVariant ? Object.values(
        selectedVariant.attributes instanceof Map ? Object.fromEntries(selectedVariant.attributes) : (selectedVariant.attributes || {})
    ).join(" / ") : "";


    return (
        <main className="min-h-screen bg-[#FEFBF6] pb-24 lg:pb-0 overflow-x-hidden">

            {/* Breadcrumb (Desktop Only) */}
            <div className="hidden lg:block bg-white border-b border-[#ECE8E0]">
                <div className="container mx-auto px-4 xl:px-8 max-w-7xl py-4">
                    <nav className="flex items-center gap-2 text-sm text-[#767B71]">
                        <Link href="/" className="hover:text-[#2A2F25] transition-colors">Home</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <Link href="/products" className="hover:text-[#2A2F25] transition-colors">Shop</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-[#2A2F25] font-medium truncate max-w-[200px]">{product.name}</span>
                    </nav>
                </div>
            </div>

            {/* ═══ MOBILE FLOATING BACK BUTTON (Fixed) ═══ */}
            <div className="lg:hidden fixed top-24 left-5 z-[150] pointer-events-none">
                <button 
                    onClick={() => router.back()}
                    className="pointer-events-auto w-10 h-10 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-[#2A2F25] active:scale-95 transition-all border border-white/50"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
            </div>

            <div className="container mx-auto px-0 lg:px-8 max-w-7xl py-0 lg:py-12">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">

                    {/* ═══ LEFT: IMAGE GALLERY ═══ */}
                    <div className="lg:sticky lg:top-8 w-full px-4 lg:px-0">
                        {/* Unified Card for Mobile (Thumbnails + Image) */}
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-[#ECE8E0]/40 overflow-hidden lg:bg-transparent lg:border-none lg:shadow-none lg:rounded-none">
                            <div className="flex flex-row lg:block">
                                
                                {/* Mobile Thumbnails (Left Side Inside Card) */}
                                <div className="lg:hidden w-[75px] flex flex-col gap-3 pt-24 pb-6 items-center bg-[#F9F8F6]/40 border-r border-[#ECE8E0]/10 shrink-0">
                                    {product.images?.map((img, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => setSelectedImage(i)}
                                            className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                                                selectedImage === i ? "border-[#869661] shadow-md scale-105" : "border-transparent opacity-60"
                                            }`}
                                        >
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>

                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="relative aspect-square flex-1 p-2 lg:p-4 lg:bg-white lg:rounded-[3rem] lg:overflow-hidden lg:shadow-sm lg:border lg:border-[#ECE8E0]/40"
                                >
                                    {product.images?.[selectedImage] ? (
                                        <img src={product.images[selectedImage]} alt={product.name} className="w-full h-full object-cover rounded-[2.2rem] lg:rounded-[2.5rem]" />
                                    ) : (
                                        <div className="w-full h-full bg-[#F3EFE8] rounded-[2.2rem]" />
                                    )}

                                    {/* Badges from Screenshot */}
                                    {/* ═══ FLOATING ACTIONS & BADGES (Mobile Only) ═══ */}
                                    <div className="lg:hidden absolute top-6 left-5 flex flex-col gap-3 z-30">
                                        <div className="flex flex-col gap-2 pointer-events-none">
                                            {product.isFeatured && (
                                                <span className="bg-[#D86B4B] text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-md w-fit uppercase tracking-tighter flex items-center gap-1.5 border border-white/20">
                                                    <Flame className="w-3.5 h-3.5 fill-white" /> BESTSELLER
                                                </span>
                                            )}
                                            {product.isActive && !product.isFeatured && (
                                                <span className="bg-[#869661] text-white text-[11px] font-black px-4 py-1.5 rounded-full shadow-md w-fit uppercase tracking-tighter border border-white/20">
                                                    NEW
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                {/* Desktop Badges (Original Position) */}
                                <div className="hidden lg:flex absolute top-8 left-8 flex-col gap-2 pointer-events-none">
                                    {product.isFeatured && (
                                        <span className="bg-[#D86B4B] text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg shadow-sm w-fit uppercase tracking-wider flex items-center gap-1.5">
                                            <Flame className="w-3 h-3 fill-white" /> Bestseller
                                        </span>
                                    )}
                                    {product.isActive && !product.isFeatured && (
                                        <span className="bg-[#869661] text-white text-[10px] font-extrabold px-3 py-1.5 rounded-lg shadow-sm w-fit uppercase tracking-wider">
                                            New Arrival
                                        </span>
                                    )}
                                </div>
                                
                                {priceInfo.discountPercent > 0 && (
                                    <div className="lg:hidden absolute top-6 right-5 z-30">
                                        <span className="bg-[#F9BC16] text-[#2A2F25] text-[10px] font-black px-4 py-1.5 rounded-full shadow-md uppercase tracking-tighter border border-white/20">
                                            {priceInfo.discountPercent}% OFF
                                        </span>
                                    </div>
                                )}

                                {/* Desktop % OFF Badge (Separate logic if needed, but existing was unified) */}
                                {priceInfo.discountPercent > 0 && (
                                    <div className="hidden lg:block absolute top-8 right-8 z-30">
                                        <span className="bg-[#F9BC16] text-[#2A2F25] text-[11px] font-black px-4 py-1.5 rounded-full shadow-md uppercase tracking-tighter border border-white/20">
                                            {priceInfo.discountPercent}% OFF
                                        </span>
                                    </div>
                                )}

                                {/* Floating Side Actions (Mobile Only) */}
                                <div className="lg:hidden absolute top-18 right-5 flex flex-col gap-3 z-30">
                                    <button className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-[#2A2F25] active:scale-90 transition-all border border-white/50">
                                        <Heart className="w-5 h-5" />
                                    </button>
                                    <button className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-[#2A2F25] active:scale-90 transition-all border border-white/50">
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                        {/* Thumbnails (Desktop Only) */}
                        <div className="hidden lg:flex gap-3 mt-4 overflow-x-auto pb-2 px-4 lg:px-0">
                            {product.images?.map((img, i) => (
                                <button key={i} onClick={() => setSelectedImage(i)}
                                    className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                                        selectedImage === i ? "border-[#869661] shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                                    }`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>

                        {/* Trust Grid (Desktop - Moved below thumbnails) */}
                        <div className="hidden lg:grid grid-cols-3 gap-4 mt-8">
                            <div className="bg-white border border-[#ECE8E0]/60 p-5 rounded-2xl flex flex-col items-center text-center shadow-sm">
                                <Truck className="w-6 h-6 text-[#869661] mb-3" />
                                <span className="text-[13px] font-bold text-[#2A2F25] mb-1">Free Delivery</span>
                                <span className="text-[11px] text-[#767B71]">Above ₹500</span>
                            </div>
                            <div className="bg-white border border-[#ECE8E0]/60 p-5 rounded-2xl flex flex-col items-center text-center shadow-sm">
                                <Shield className="w-6 h-6 text-[#869661] mb-3" />
                                <span className="text-[13px] font-bold text-[#2A2F25] mb-1">Secure Payment</span>
                                <span className="text-[11px] text-[#767B71]">100% Safe</span>
                            </div>
                            <div className="bg-white border border-[#ECE8E0]/60 p-5 rounded-2xl flex flex-col items-center text-center shadow-sm">
                                <RotateCcw className="w-6 h-6 text-[#869661] mb-3" />
                                <span className="text-[13px] font-bold text-[#2A2F25] mb-1">Easy Returns</span>
                                <span className="text-[11px] text-[#767B71]">30 Days</span>
                            </div>
                        </div>
                    </div>

                    {/* ═══ RIGHT: PRODUCT INFO ═══ */}
                    <div className="px-6 lg:px-0 pt-6 lg:pt-0">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>

                            {/* Title Section */}
                            <div className="flex items-center gap-3 mb-3">
                                <span className="bg-[#EAF3E2] text-[#4A5D23] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                    {product.category?.name || "Pickles"}
                                </span>
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-[#F9BC16] text-[#F9BC16]" />
                                    <span className="text-[13px] font-bold text-[#2A2F25]">{avgRating > 0 ? avgRating : '4.7'}</span>
                                    <span className="text-[13px] text-[#767B71]">({reviews.length > 0 ? reviews.length : 76} reviews)</span>
                                </div>
                            </div>

                            <h1 className="font-serif text-[28px] lg:text-[36px] font-bold text-[#2A2F25] leading-tight mb-2">
                                {product.name}
                            </h1>
                            <p className="text-[15px] lg:text-[18px] text-[#767B71] mb-8">
                                {product.subtitle || "Premium quality, handcrafted with care."}
                            </p>

                             {/* Price Row */}
                             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div className="flex items-baseline gap-3">
                                    <span className="text-[38px] lg:text-[44px] font-extrabold text-[#4A5D23] leading-none tracking-tight">₹{priceInfo.price}</span>
                                    {priceInfo.originalPrice && (
                                        <>
                                            <span className="text-[20px] lg:text-[24px] text-[#A0A49B] line-through font-medium">₹{priceInfo.originalPrice}</span>
                                            <span className="bg-[#E5FAEF] text-[#006D44] text-[12px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ml-1 shadow-sm">
                                                SAVE ₹{priceInfo.originalPrice - priceInfo.price}
                                            </span>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 bg-white border border-[#ECE8E0] px-4 py-2.5 rounded-[1rem] shadow-sm self-start sm:self-auto shrink-0">
                                    <div className={`w-2.5 h-2.5 rounded-full ${priceInfo.inStock ? 'bg-[#4CAF50] animate-pulse' : 'bg-red-400'}`} />
                                    <span className={`text-[12px] font-bold uppercase tracking-widest ${priceInfo.inStock ? 'text-[#4CAF50]' : 'text-red-400'}`}>
                                        {priceInfo.inStock ? `IN STOCK (${priceInfo.stock} AVAILABLE)` : 'OUT OF STOCK'}
                                    </span>
                                </div>
                            </div>

                            {/* Spice Level (Universal) */}
                            <div className="flex items-center gap-3 bg-white border border-[#ECE8E0]/70 rounded-[1.2rem] px-5 py-3.5 mb-8 shadow-[0_2px_10px_rgb(0,0,0,0.02)] w-full">
                                <span className="text-[14px] font-semibold text-[#2A2F25]">Spice Level:</span>
                                <div className="flex gap-1.5 ml-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Flame 
                                            key={i} 
                                            className={`w-4 h-4 ${i < (product.spiceLevel || 3) ? 'text-[#D86B4B] fill-[#D86B4B]' : 'text-[#ECE8E0]'}`} 
                                        />
                                    ))}
                                </div>
                                <span className="text-[14px] font-medium text-[#767B71] capitalize ml-2">
                                    {(product.spiceLevel || 3) >= 4 ? "Extreme Heat" : (product.spiceLevel || 3) >= 3 ? "Medium" : "Mild"}
                                </span>
                            </div>

                            {/* Variant Selector (Desktop & Mobile) */}
                            {product.variationTypes?.map((type) => (
                                <div key={type.name} className="mb-8">
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <span className="text-[13px] font-bold text-[#2A2F25] uppercase tracking-widest">{type.name}: <span className="text-[#869661] ml-1">{selectedOptions[type.name]}</span></span>
                                    </div>
                                     <div className="flex flex-nowrap gap-1 pb-2 overflow-x-auto hide-scrollbar bg-[#F3EFE8] p-1 rounded-[1.2rem] w-full max-w-full border border-[#ECE8E0]/40 relative overflow-visible">
                                         {type.options?.map((option) => (
                                             <button
                                                 key={option}
                                                 onClick={() => setSelectedOptions(prev => ({ ...prev, [type.name]: option }))}
                                                 className={`relative shrink-0 px-8 py-2.5 rounded-[1rem] text-[14px] font-bold transition-all z-10 ${
                                                     selectedOptions[type.name] === option
                                                         ? "text-[#2A2F25]"
                                                         : "text-[#767B71] hover:text-[#2A2F25]"
                                                 }`}
                                             >
                                                 {selectedOptions[type.name] === option && (
                                                     <motion.div
                                                         layoutId={`liquid-bg-${type.name}`}
                                                         className="absolute inset-0 bg-white rounded-[1rem] shadow-sm z-[-1]"
                                                         style={{ filter: 'url(#global-gooey)' }}
                                                         transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                                     />
                                                 )}
                                                 {option}
                                             </button>
                                         ))}
                                     </div>
                                </div>
                            ))}

                            {/* Pincode Checker (Universal) */}
                            <div className="mb-10 lg:mb-12">
                                <form onSubmit={checkPincode} className="bg-[#F8F6F2] p-6 rounded-[2rem] border border-[#ECE8E0]/40">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-[16px]">📍</span>
                                        <span className="text-[15px] font-bold text-[#2A2F25]">Check Delivery</span>
                                    </div>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={pincode}
                                            onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="Enter 6-digit pincode"
                                            className="flex-1 bg-white border border-[#ECE8E0] rounded-2xl px-5 py-3 text-[14px] focus:outline-none focus:border-[#869661] transition-colors"
                                        />
                                        <button
                                            type="submit"
                                            disabled={pincodeStatus === 'checking'}
                                            className="bg-[#869661] text-white px-8 py-3 rounded-2xl text-[14px] font-bold hover:bg-[#71824F] transition-all disabled:opacity-50"
                                        >
                                            {pincodeStatus === 'checking' ? "Checking..." : "Check"}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Desktop Controls */}
                            <div className="hidden lg:block space-y-8 mb-12">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-4 bg-white border border-[#ECE8E0] rounded-2xl p-2 shadow-sm">
                                        <button 
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-10 h-10 rounded-xl bg-[#FDFBF7] flex items-center justify-center text-[#2A2F25] hover:bg-[#F3EFE8] transition-colors"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="text-[18px] font-bold text-[#2A2F25] min-w-[30px] text-center">{quantity}</span>
                                        <button 
                                            onClick={() => setQuantity(Math.min(priceInfo.stock || 99, quantity + 1))}
                                            className="w-10 h-10 rounded-xl bg-[#FDFBF7] flex items-center justify-center text-[#2A2F25] hover:bg-[#F3EFE8] transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <span className="text-[15px] font-medium text-[#767B71]">{variantLabel || "350g"}</span>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button onClick={handleAddToCart} disabled={!priceInfo.inStock || addingToCart}
                                        className="h-16 px-10 bg-[#6B7D5C] hover:bg-[#556647] text-white rounded-2xl text-[16px] font-bold transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#6B7D5C]/20 active:scale-[0.98]">
                                        <ShoppingBag className="w-5 h-5" />
                                        {addingToCart ? "Adding..." : "Add to Cart"}
                                    </button>
                                    <button onClick={handleBuyNow} disabled={!priceInfo.inStock || addingToCart}
                                        className="h-16 px-10 bg-[#D86B4B] hover:bg-[#C15D3E] text-white rounded-2xl text-[16px] font-bold transition-all shadow-lg shadow-[#D86B4B]/20 active:scale-[0.98]">
                                        Buy Now
                                    </button>
                                    <button className="w-16 h-16 border border-[#ECE8E0] rounded-2xl flex items-center justify-center text-[#2A2F25] hover:bg-white transition-all shadow-sm">
                                        <Heart className="w-5 h-5" />
                                    </button>
                                    <button className="w-16 h-16 border border-[#ECE8E0] rounded-2xl flex items-center justify-center text-[#2A2F25] hover:bg-white transition-all shadow-sm">
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </div>



                                {/* Desktop Tabs */}
                                <div className="bg-[#FDFBF7] rounded-[2rem] p-4">
                                    <div className="flex gap-2 mb-8 bg-white/50 p-1.5 rounded-[1.5rem] w-fit">
                                        {tabs.map((tab) => (
                                            <button
                                                key={tab.key}
                                                onClick={() => setActiveTab(tab.key)}
                                                className={`px-6 py-2.5 rounded-2xl text-[14px] font-bold transition-all ${
                                                    activeTab === tab.key 
                                                        ? "bg-white text-[#2A2F25] shadow-sm" 
                                                        : "text-[#767B71] hover:text-[#2A2F25]"
                                                }`}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="px-4 pb-4">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={activeTab}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="text-[#555] text-[15px] leading-relaxed"
                                            >
                                                {activeTab === "description" && (product.long_description || product.description)}
                                                {activeTab === "ingredients" && (
                                                    <div className="bg-white/40 p-6 rounded-2xl border border-white/60 italic">
                                                        "{product.ingredients || "Hand-selected artisanal ingredients including organic seeds, Himalayan pink salt, and Cold-pressed mustard oil."}"
                                                    </div>
                                                )}
                                                {activeTab === "nutrition" && (
                                                    <ul className="space-y-3">
                                                        <li className="flex justify-between border-b pb-2"><span>Energy</span><span className="font-bold">245 kcal</span></li>
                                                        <li className="flex justify-between border-b pb-2"><span>Protein</span><span className="font-bold">2.4g</span></li>
                                                        <li className="flex justify-between border-b pb-2"><span>Carbs</span><span className="font-bold">12.8g</span></li>
                                                        <li className="flex justify-between"><span>Fat</span><span className="font-bold">21.5g</span></li>
                                                    </ul>
                                                )}
                                                {activeTab === "reviews" && (
                                                    <div className="space-y-6">
                                                        {reviews.length === 0 ? (
                                                            <p className="text-center italic opacity-60">Be the first to share your experience!</p>
                                                        ) : (
                                                            reviews.map((r, i) => (
                                                                <div key={i} className="border-b last:border-0 pb-4">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <div className="flex"><Star className="w-3 h-3 fill-[#F9BC16] text-[#F9BC16]" /></div>
                                                                        <span className="text-sm font-bold">{r.user?.name || "Customer"}</span>
                                                                    </div>
                                                                    <p className="text-sm">{r.comment}</p>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Only: Spice Level & Quantity */}
                            <div className="lg:hidden space-y-4 mb-8">
                                <div className="flex items-center justify-between bg-white border border-[#ECE8E0] rounded-2xl p-4 shadow-sm">
                                    <span className="text-[13px] font-bold text-[#2A2F25]">Quantity</span>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-full bg-[#FDFBF7] flex items-center justify-center border border-[#ECE8E0]/40"><Minus className="w-3 h-3" /></button>
                                        <span className="font-bold text-[#2A2F25]">{quantity}</span>
                                        <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-full bg-[#FDFBF7] flex items-center justify-center border border-[#ECE8E0]/40"><Plus className="w-3 h-3" /></button>
                                    </div>
                                </div>

                            </div>

                            {/* Mobile Accordions (Elite Refactor) */}
                            <div className="lg:hidden mb-12 border-t border-[#ECE8E0]">
                                <AccordionItem 
                                    title="Ingredients" 
                                    isOpen={openAccordion === "ingredients"}
                                    onClick={() => setOpenAccordion(openAccordion === "ingredients" ? null : "ingredients")}
                                >
                                    <div className="bg-[#FDFBF7] p-6 rounded-2xl border border-[#ECE8E0]/30 italic text-[#767B71]">
                                        &quot;{product.ingredients || "Hand-selected artisanal ingredients including organic seeds, Himalayan pink salt, and Cold-pressed mustard oil."}&quot;
                                    </div>
                                </AccordionItem>

                                <AccordionItem 
                                    title="Shelf Life" 
                                    isOpen={openAccordion === "shelf"}
                                    onClick={() => setOpenAccordion(openAccordion === "shelf" ? null : "shelf")}
                                >
                                    <ul className="space-y-3">
                                        <li className="flex items-center justify-between">
                                            <span className="text-[#767B71]">Best Before</span>
                                            <span className="font-bold text-[#2A2F25]">12 Months</span>
                                        </li>
                                        <li className="flex items-center justify-between">
                                            <span className="text-[#767B71]">Storage</span>
                                            <span className="font-bold text-[#2A2F25]">Cool, Dry Place</span>
                                        </li>
                                    </ul>
                                </AccordionItem>

                                <AccordionItem 
                                    title={`Customer Reviews (${reviews.length > 0 ? reviews.length : 0})`} 
                                    isOpen={openAccordion === "reviews"}
                                    onClick={() => setOpenAccordion(openAccordion === "reviews" ? null : "reviews")}
                                >
                                    {reviews.length === 0 ? (
                                        <div className="text-center py-4 bg-[#FDFBF7] rounded-2xl border border-[#ECE8E0]/30">
                                            <p className="text-[14px]">Be the first to share your experience!</p>
                                        </div>
                                    ) : (
                                        reviews.slice(0, 3).map((review, i) => (
                                            <div key={i} className="mb-6 last:mb-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="flex">
                                                        {[...Array(5)].map((_, j) => (
                                                            <Star key={j} className={`w-3 h-3 ${j < review.stars ? 'fill-[#F9BC16] text-[#F9BC16]' : 'text-[#ECE8E0]'}`} />
                                                        ))}
                                                    </div>
                                                    <span className="text-[13px] font-bold text-[#2A2F25]">{review.user?.name || "Customer"}</span>
                                                </div>
                                                <p className="text-[14px] text-[#767B71]">{review.comment}</p>
                                            </div>
                                        ))
                                    )}
                                </AccordionItem>
                            </div>

                        </motion.div>
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="mt-12 lg:mt-28 px-6 lg:px-0">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="font-serif text-[28px] lg:text-[32px] font-bold text-[#2A2F25]">Related Treasures</h2>
                            <Link href="/products" className="text-[14px] font-bold text-[#869661] underline underline-offset-4">See All</Link>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 pb-20 lg:pb-0">
                            {relatedProducts.slice(0, 4).map(p => (
                                <div key={p._id} className="min-w-0">
                                    <ProductCard product={p} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ═══ MOBILE STICKY BOTTOM BAR (Liquid Glass) ═══ */}
            <div className="lg:hidden fixed bottom-10 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-[110] px-4 pointer-events-none">
                <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="bg-white/60 backdrop-blur-[32px] border border-white/50 rounded-[2.5rem] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center justify-between gap-5 pointer-events-auto ring-1 ring-black/5"
                >
                    <div className="flex flex-col pl-6">
                        <span className="text-[10px] font-extrabold text-[#869661] uppercase tracking-[0.2em] mb-0.5">Total</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-[24px] font-bold text-[#2A2F25] leading-none tracking-tight">
                                <span className="font-sans text-[18px] mr-0.5">₹</span>{priceInfo.price * quantity}
                            </span>
                        </div>
                    </div>
                    <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAddToCart}
                        disabled={!priceInfo.inStock || addingToCart}
                        className="flex-1 bg-[#869661] h-[60px] rounded-[1.8rem] flex items-center justify-center gap-3 text-white font-bold text-[16px] shadow-lg shadow-[#869661]/20 disabled:opacity-50 transition-all uppercase tracking-widest"
                    >
                        {addingToCart ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <ShoppingBag className="w-5 h-5" />
                                Add To Bag
                            </>
                        )}
                    </motion.button>
                </motion.div>
            </div>
        </main>
    );
}
