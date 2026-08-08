"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight, Lock, Shield, Truck } from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";

export default function CartSidebar({ isOpen, onClose }) {
    const { isAuthenticated, loading: userLoading, setCartCount } = useUser();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (isOpen && isAuthenticated) {
            fetchCart();
        }
    }, [isOpen, isAuthenticated]);

    const fetchCart = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/cart", { credentials: "include" });
            const data = await res.json();
            if (data.success) {
                setCart(data.cart);
                setCartCount(data.cart?.items?.length || 0);
            }
        } catch (error) {
            console.error("Failed to fetch cart:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (itemId, quantity) => {
        if (quantity < 1) return;
        try {
            setUpdating(true);
            const res = await fetch(`/api/cart/${itemId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ quantity }),
            });
            const data = await res.json();
            if (data.success) await fetchCart();
            else toast.error(data.message || "Failed to update");
        } catch { toast.error("Failed to update quantity"); }
        finally { setUpdating(false); }
    };

    const removeItem = async (itemId) => {
        try {
            setUpdating(true);
            const res = await fetch(`/api/cart/${itemId}`, { method: "DELETE", credentials: "include" });
            const data = await res.json();
            if (data.success) await fetchCart();
            else toast.error(data.message || "Failed to remove");
        } catch { toast.error("Failed to remove item"); }
        finally { setUpdating(false); }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: "100%", filter: "blur(10px)" }}
                        animate={{ x: 0, filter: "blur(0px)" }}
                        exit={{ x: "100%", filter: "blur(10px)" }}
                        transition={{ type: "spring", damping: 30, stiffness: 250 }}
                        className="fixed right-0 top-0 bottom-0 z-[120] w-full max-w-md bg-white/70 backdrop-blur-2xl shadow-[-20px_0_50px_rgba(0,0,0,0.1)] flex flex-col border-l border-white/40"
                    >
                        {/* Header */}
                        <div className="px-8 py-8 border-b border-gray-100 flex items-center justify-between bg-white/40">
                            <div>
                                <h2 className="font-serif text-[28px] font-bold text-[var(--c-text)] leading-tight">Your Cart</h2>
                                <p className="text-[11px] text-[var(--c-primary)] font-bold uppercase tracking-[0.2em] mt-1">{cart?.items?.length || 0} items selected</p>
                            </div>
                            <motion.button 
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="w-12 h-12 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-md text-[var(--c-text)] shadow-lg border border-white/50 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </motion.button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar p-6">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="w-8 h-8 border-2 border-[var(--c-primary)]/30 border-t-[var(--c-primary)] rounded-full animate-spin"></div>
                                </div>
                            ) : !cart || cart.items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <ShoppingBag className="w-16 h-16 text-[var(--c-border)] mb-4" strokeWidth={1} />
                                    <h3 className="font-serif text-xl text-[var(--c-text)] mb-2">Cart is Empty</h3>
                                    <p className="text-sm text-[var(--c-text-muted)] mb-8">Ready to add some artisanal flavors?</p>
                                    <button 
                                        onClick={onClose}
                                        className="bg-[var(--c-text)] text-white px-8 py-3 rounded-xl text-sm font-bold"
                                    >
                                        Start Shopping
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {cart.items.map((item) => (
                                        <div key={item._id} className="flex gap-4 group">
                                            <div className="shrink-0 w-20 h-24 rounded-xl overflow-hidden bg-white border border-[var(--c-border)]">
                                                <img src={item.product.images?.[0]} alt={item.product.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="font-bold text-[var(--c-text)] text-sm leading-tight truncate">{item.product.name}</h4>
                                                    <button 
                                                        onClick={() => removeItem(item._id)}
                                                        className="text-[var(--c-text-muted)] hover:text-[var(--c-accent)] transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-[var(--c-text-muted)] mt-1 italic uppercase tracking-wider">
                                                    {Object.values(item.variant.attributes).join(" · ")}
                                                </p>
                                                <div className="flex items-center justify-between mt-4">
                                                    <div className="flex items-center bg-white border border-[var(--c-border)] rounded-lg p-0.5">
                                                        <button 
                                                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                                            className="w-7 h-7 flex items-center justify-center text-[var(--c-text-muted)] hover:bg-gray-50 rounded"
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <span className="w-8 text-center text-xs font-bold text-[var(--c-text)]">{item.quantity}</span>
                                                        <button 
                                                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                                            className="w-7 h-7 flex items-center justify-center text-[var(--c-text-muted)] hover:bg-gray-50 rounded"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <span className="font-bold text-[var(--c-text)]">₹{item.subtotal}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {cart && cart.items.length > 0 && (
                            <div className="p-6 bg-white border-t border-[var(--c-border)] space-y-4">
                                <div className="flex items-center justify-between text-sm font-bold text-[var(--c-text)]">
                                    <span>Subtotal</span>
                                    <span>₹{cart.total}</span>
                                </div>
                                <p className="text-[10px] text-[var(--c-text-muted)] text-center uppercase tracking-widest font-bold">
                                    Shipping & taxes calculated at checkout
                                </p>
                                <div className="grid grid-cols-1 gap-3">
                                    <Link 
                                        href="/checkout"
                                        onClick={onClose}
                                        className="flex items-center justify-center gap-2 bg-[var(--c-primary)] text-white py-4 rounded-2xl text-[15px] font-bold hover:bg-[var(--c-primary-dark)] transition-all"
                                    >
                                        <Lock className="w-4 h-4" />
                                        Secure Checkout
                                        <ArrowRight className="w-4 h-4 ml-1" />
                                    </Link>
                                    <Link 
                                        href="/cart"
                                        onClick={onClose}
                                        className="flex items-center justify-center py-3 text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--c-text)] border border-[var(--c-border)] rounded-2xl hover:bg-[var(--c-surface-alt)] transition-all"
                                    >
                                        View Full Bag
                                    </Link>
                                </div>
                                
                                <div className="flex items-center justify-center gap-4 pt-2 text-[var(--c-text-muted)]">
                                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                                        <Shield className="w-3 h-3 text-[var(--c-primary)]" /> Secure
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                                        <Truck className="w-3 h-3 text-[var(--c-primary)]" /> Worldwide
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
