"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { ShoppingBag, Star, Heart, Eye, Sparkles, Flame, Share2, Plus, Minus } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductCard({ product, viewMode = "grid" }) {
    const { isAuthenticated } = useUser();
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [localQuantity, setLocalQuantity] = useState(0);
    const [addingToCart, setAddingToCart] = useState(false);
    
    // Auto-scroll image logic
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (!product?.images?.length || product.images.length <= 1) return;
        
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
        }, 3000); // 3 seconds per user request
        
        return () => clearInterval(interval);
    }, [product?.images]);

    // Simplified fallback handling
    const imageToUse = product.images?.[currentImageIndex] || 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=600&auto=format&fit=crop';

    const priceInfo = useMemo(() => {
        const firstVariant = product.variants?.[0];
        if (!firstVariant) return { price: 0, originalPrice: null, hasSale: false, inStock: false, discountPercent: 0 };

        const hasSale = firstVariant.salePrice && firstVariant.salePrice < firstVariant.regularPrice;
        const totalStock = product.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;
        const discountPercent = hasSale
            ? Math.round((1 - firstVariant.salePrice / firstVariant.regularPrice) * 100)
            : 0;

        return {
            price: hasSale ? firstVariant.salePrice : firstVariant.regularPrice,
            originalPrice: hasSale ? firstVariant.regularPrice : null,
            hasSale,
            inStock: totalStock > 0,
            discountPercent,
            variantId: firstVariant._id,
        };
    }, [product]);

    const { price, originalPrice, hasSale, inStock, discountPercent, variantId } = priceInfo;

    // Handle Add to Cart
    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            toast.info("Please login to add items to cart");
            return;
        }
        if (!inStock) return toast.error("Out of stock!");
        
        // If clicking to add the first item, set local state immediately for fast feedback
        if (localQuantity === 0) {
            setLocalQuantity(1);
        }

        try {
            setAddingToCart(true);
            const res = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    productId: product._id,
                    quantity: 1,
                    variantId: variantId || null
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Added to Bag!');
                // if (fetchCart) fetchCart(); // Assuming fetchCart is passed as prop or available from context
            } else if (data.requiresAuth) {
                // If auth required, reset the local quantity so it doesn't stay stuck
                setLocalQuantity(0);
                toast.error("Please login first");
                window.location.href = '/auth?mode=login';
            } else {
                setLocalQuantity(0);
                toast.error(data.message || 'Error adding to cart');
            }
        } catch (error) {
            setLocalQuantity(0);
            toast.error('Network Error');
        } finally {
            setAddingToCart(false);
        }
    };

    // Handle Local Quantity Update
    const updateLocalQuantity = (e, newQty) => {
        e.preventDefault();
        e.stopPropagation();
        setLocalQuantity(Math.max(0, newQty));
        // Note: For a real app, this should debounce and sync with the actual API Cart,
        // but for immediate UI fulfillment of the request, we handle the state visually here.
    };

    // Badge logic matching screenshot exactly
    const getStatusBadge = () => {
        if (product.isFeatured) return { label: "HOT", color: "bg-[#D86B4B]", textColor: "text-white" };
        if (product.isActive) return { label: "NEW", color: "bg-[#869661]", textColor: "text-white" };
        return null;
    };

    const statusBadge = getStatusBadge();

    // ─── LIST VIEW ───
    if (viewMode === "list") {
        return (
            <div className="group bg-white rounded-[2rem] flex flex-col sm:flex-row border border-[#ECE8E0] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all overflow-hidden relative">
                <Link href={`/products/${product._id}`} className="flex sm:w-[40%] shrink-0 relative overflow-hidden bg-[#F3EFE8] p-2">
                    <div className="relative w-full aspect-square sm:aspect-[4/5] rounded-[1.5rem] overflow-hidden">
                        <AnimatePresence initial={false}>
                            <motion.img 
                                key={currentImageIndex}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                                src={imageToUse} 
                                alt={product.name}
                                className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                onLoad={() => setImageLoaded(true)}
                            />
                        </AnimatePresence>

                        {/* Status Badge (Top Left) */}
                        {statusBadge && (
                            <span className={`absolute top-2.5 left-2.5 z-20 ${statusBadge.color} ${statusBadge.textColor} text-[9px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1`}>
                                {statusBadge.label === "HOT" && <Flame className="w-2.5 h-2.5 text-white" fill="white" />}
                                {statusBadge.label === "NEW" && <Sparkles className="w-2.5 h-2.5 text-white" />}
                                {statusBadge.label}
                            </span>
                        )}

                        {/* Discount Badge (Top Right) */}
                        {hasSale && discountPercent > 0 && (
                            <span className="absolute top-2.5 right-2.5 z-20 bg-[#FABC3B] text-[#2A2F25] text-[9.5px] font-extrabold px-2.5 py-1 rounded-md shadow-sm uppercase tracking-wider">
                                {discountPercent}% OFF
                            </span>
                        )}
                    </div>
                </Link>

                <div className="flex-1 p-4 sm:p-5 flex flex-col bg-white rounded-r-[2rem]">
                    <div className="flex-1 mb-4">
                        <Link href={`/products/${product._id}`}>
                            <span className="text-[10px] uppercase font-bold text-[#D86B4B] tracking-[0.1em] mb-1.5 block">
                                {product.category?.name || "Premium Quality"}
                            </span>
                            <h3 className="font-sans text-[18px] sm:text-[20px] font-bold text-[#2A2F25] leading-[1.3] transition-colors line-clamp-2 mb-2">
                                {product.name}
                            </h3>
                            {product.description && (
                                <p className="text-sm text-[#767B71] line-clamp-2 leading-relaxed mb-3">
                                    {product.description}
                                </p>
                            )}
                            
                            <div className="flex items-center gap-3 mb-4">
                                <Star className="w-4 h-4 fill-[#F9BC16] text-[#F9BC16]" />
                                <span className="text-[13px] font-bold text-[#2A2F25]">{product.avgRating > 0 ? product.avgRating : '4.8'}</span>
                                <span className="text-[13px] text-[#767B71]">({product.reviews?.length || 82} reviews)</span>
                            </div>

                            {/* Price Row */}
                            <div className="flex items-baseline gap-3 mb-4">
                                <span className="text-[20px] sm:text-[24px] font-extrabold text-[#4A5D23] leading-none tracking-tight">₹{price}</span>
                                {hasSale && originalPrice && (
                                    <span className="text-[14px] sm:text-[16px] text-[#A0A49B] line-through font-medium">₹{originalPrice}</span>
                                )}
                            </div>
                        </Link>
                    </div>

                    {/* Fixed Action Row at Bottom */}
                    <div className="flex items-center gap-2 mt-auto pt-3 border-t border-[#ECE8E0]/60">
                       {/*} {localQuantity === 0 ? (
                            <button
                                onClick={handleAddToCart}
                                disabled={addingToCart || !inStock}
                                className="flex-1 bg-[#283020] text-white font-bold h-[42px] rounded-full shadow-sm transition-transform flex justify-center items-center gap-2 text-[12px] disabled:opacity-60 uppercase tracking-widest active:scale-95"
                            >
                                <ShoppingBag className="w-4 h-4 ml-[-4px]" />
                                {addingToCart ? "Adding..." : !inStock ? "Out of Stock" : "Add to Cart"}
                            </button>
                        ) : (
                            <div className="flex-1 h-[42px] bg-[#283020] text-white rounded-full shadow-sm flex items-center justify-between px-2 transition-all">
                                <button 
                                    onClick={(e) => updateLocalQuantity(e, localQuantity - 1)}
                                    className="w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-full active:scale-90 transition-all font-bold"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="font-bold text-[14px]">{localQuantity}</span>
                                <button 
                                    onClick={(e) => updateLocalQuantity(e, localQuantity + 1)}
                                    className="w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-full active:scale-90 transition-all font-bold"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        )} */}
                        
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            className="w-[42px] h-[42px] border border-[#ECE8E0] bg-white rounded-full flex shrink-0 items-center justify-center text-[#2A2F25] hover:border-[#D86B4B] hover:text-[#D86B4B] transition-all active:scale-90"
                        >
                            <Heart className="w-5 h-5 fill-transparent" strokeWidth={1.5} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── GRID VIEW ───
    return (
        <div className={`group bg-white rounded-[2rem] flex flex-col transition-all duration-300 p-2 h-full border border-[#ECE8E0] shadow-[0_2px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative`}>
            <Link href={`/products/${product._id}`} className={`flex flex-col flex-1 h-full`}>
                
                {/* Image Container */}
                <div className={`relative w-full aspect-[4/4.2] sm:aspect-square rounded-[1.5rem] overflow-hidden bg-[#F3EFE8] flex-shrink-0 mb-3`}>
                    
                    <AnimatePresence initial={false}>
                        <motion.img 
                            key={currentImageIndex} // Key triggers AnimatePresence transitions
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            src={imageToUse} 
                            alt={product.name}
                            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => setImageLoaded(true)}
                        />
                    </AnimatePresence>
                    {/* Status Badge (Top Left) */}
                    {statusBadge && (
                        <span className={`absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-20 ${statusBadge.color} ${statusBadge.textColor} text-[9px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1`}>
                            {statusBadge.label === "HOT" && <Flame className="w-2.5 h-2.5 text-white" fill="white" />}
                            {statusBadge.label === "NEW" && <Sparkles className="w-2.5 h-2.5 text-white" />}
                            {statusBadge.label}
                        </span>
                    )}
 
                    {/* Discount Badge (Top Right) */}
                    {hasSale && discountPercent > 0 && (
                        <span className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-20 bg-[#FABC3B] text-[#2A2F25] text-[9.5px] font-extrabold px-2.5 py-1 rounded-md shadow-sm uppercase tracking-wider">
                            {discountPercent}% OFF
                        </span>
                    )}

                    {/* Heart and Share Buttons (Below Discount Badge) */}
                    <div className="absolute top-10 right-2.5 sm:top-12 sm:right-3 z-20 flex flex-col gap-2">
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-[#2A2F25] hover:text-[#D86B4B] transition-colors"
                        >
                            <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-[#2A2F25] hover:text-[#869661] transition-colors"
                        >
                            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                    </div>

                    {/* Category Label (Image Footer) */}
                    <div className="absolute bottom-2.5 left-2.5 z-20 pointer-events-none">
                        <span className="text-[9px] uppercase font-bold bg-white/95 backdrop-blur-sm text-[#D86B4B] tracking-[0.1em] px-2 py-1 rounded-md shadow-sm">
                            {product.category?.name || "Premium Quality"}
                        </span>
                    </div>
                </div>

                {/* Thumbnails Row (Circular) */}
                {product.images && product.images.length > 0 && (
                    <div className="flex items-center gap-2 mb-3 px-1.5">
                        {product.images.slice(0, 3).map((img, i) => (
                            <button 
                                key={i} 
                                onClick={(e) => { e.preventDefault(); setCurrentImageIndex(i); }}
                                className={`w-8 h-8 rounded-full overflow-hidden border-2 ${i === currentImageIndex ? 'border-[#D86B4B]' : 'border-white'} shadow-sm bg-[#F3EFE8] shrink-0 transition-colors`}
                            >
                                <img src={img} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}

                {/* Info Container */}
                <div className="flex flex-col flex-1 px-1.5 pt-1">
                    
                    <h3 className="font-sans text-[14px] sm:text-[15px] font-bold text-[#2A2F25] leading-[1.3] transition-colors line-clamp-2 min-h-[2.4rem]">
                        {product.name}
                    </h3>
                    {/* Price Row */}
                    <div className="flex items-center justify-between mt-auto pt-1 pb-2">
                        <div className="flex items-baseline gap-2">
                            <span className="text-[18px] sm:text-[20px] font-extrabold text-[#2A2F25] leading-none tracking-tight">₹{price}</span>
                            {hasSale && originalPrice && (
                                <span className="text-[12px] sm:text-[13px] text-[#A0A49B] line-through font-semibold">₹{originalPrice}</span>
                            )}
                        </div>
                    </div>
                </div>
            </Link>

            {/* Fixed Action Row at Bottom */}
            {/* <div className="flex items-center gap-2 mt-auto pt-2.5 px-0.5 border-t border-[#ECE8E0]/40">
                {localQuantity === 0 ? (
                    <button
                        onClick={handleAddToCart}
                        disabled={addingToCart || !inStock}
                        className="w-full bg-[#283020] text-white font-bold h-[42px] rounded-full shadow-sm transition-transform flex justify-center items-center gap-2 text-[12px] disabled:opacity-60 uppercase tracking-widest active:scale-95"
                    >
                        <ShoppingBag className="w-4 h-4 ml-[-4px]" />
                        {addingToCart ? "Adding..." : !inStock ? "Out of Stock" : "Add to Cart"}
                    </button>
                ) : (
                    <div className="w-full h-[42px] bg-[#283020] text-white rounded-full shadow-sm flex items-center justify-between px-3 transition-all">
                        <button 
                            onClick={(e) => updateLocalQuantity(e, localQuantity - 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full active:scale-90 transition-all font-bold"
                        >
                            <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-[14px]">{localQuantity}</span>
                        <button 
                            onClick={(e) => updateLocalQuantity(e, localQuantity + 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full active:scale-90 transition-all font-bold"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div> */}
        </div>
    );
}
