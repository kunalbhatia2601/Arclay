"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";

export default function CartPage() {
    const { isAuthenticated, loading: userLoading, setCartCount } = useUser();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (!userLoading && !isAuthenticated) {
            router.push("/login");
        } else if (isAuthenticated) {
            fetchCart();
        }
    }, [isAuthenticated, userLoading]);

    const fetchCart = async () => {
        try {
            const res = await fetch("/api/cart", {
                credentials: "include",
            });
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
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ quantity }),
            });

            const data = await res.json();

            if (data.success) {
                await fetchCart();
            } else {
                toast.error(data.message || "Failed to update quantity");
            }
        } catch (error) {
            console.error("Update error:", error);
            toast.error("Failed to update quantity");
        } finally {
            setUpdating(false);
        }
    };

    const removeItem = async (itemId) => {
        if (!confirm("Remove this item from cart?")) return;

        try {
            setUpdating(true);
            const res = await fetch(`/api/cart/${itemId}`, {
                method: "DELETE",
                credentials: "include",
            });

            const data = await res.json();

            if (data.success) {
                await fetchCart();
            } else {
                toast.error(data.message || "Failed to remove item");
            }
        } catch (error) {
            console.error("Remove error:", error);
            toast.error("Failed to remove item");
        } finally {
            setUpdating(false);
        }
    };

    if (userLoading || loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-12 pt-24">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="font-serif text-4xl font-bold text-foreground">
                        Shopping Cart
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        {cart?.itemCount || 0} item(s) in your cart
                    </p>
                </div>

                {!cart || cart.items.length === 0 ? (
                    <div className="bg-card rounded-2xl p-12 text-center shadow-sm border border-border">
                        <p className="text-xl text-muted-foreground mb-6">Your cart is empty</p>
                        <Link
                            href="/products"
                            className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium transition-all"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {cart.items.map((item) => (
                                <div
                                    key={item._id}
                                    className="bg-card rounded-2xl p-6 shadow-sm border border-border"
                                >
                                    <div className="flex gap-4">
                                        {item.product.images?.[0] && (
                                            <img
                                                src={item.product.images[0]}
                                                alt={item.product.name}
                                                className="w-24 h-24 object-cover rounded-lg"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <Link
                                                href={`/products/${item.product._id}`}
                                                className="font-serif text-xl font-bold hover:text-primary transition-colors"
                                            >
                                                {item.product.name}
                                            </Link>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {Object.entries(item.variant.attributes).map(([key, value]) => (
                                                    <span key={key} className="mr-2">
                                                        {key}: {value}
                                                    </span>
                                                ))}
                                            </p>
                                            <p className="text-lg font-bold text-primary mt-2">
                                                ₹{item.variant.price}
                                            </p>

                                            {!item.available && (
                                                <p className="text-sm text-destructive mt-2">
                                                    Out of stock or unavailable
                                                </p>
                                            )}

                                            <div className="flex items-center gap-4 mt-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                                        disabled={updating || item.quantity <= 1}
                                                        className="w-8 h-8 bg-muted hover:bg-muted/80 rounded-lg flex items-center justify-center disabled:opacity-50 transition-all"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-12 text-center font-medium">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                                        disabled={updating || item.quantity >= item.variant.stock}
                                                        className="w-8 h-8 bg-muted hover:bg-muted/80 rounded-lg flex items-center justify-center disabled:opacity-50 transition-all"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item._id)}
                                                    disabled={updating}
                                                    className="text-sm text-destructive hover:underline disabled:opacity-50"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-xl">₹{item.subtotal}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border sticky top-24">
                                <h2 className="font-serif text-2xl font-bold mb-6">
                                    Order Summary
                                </h2>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span className="font-medium">₹{cart.total}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Shipping</span>
                                        <span className="font-medium">Calculated at checkout</span>
                                    </div>
                                </div>

                                <div className="border-t border-border pt-4 mb-6">
                                    <div className="flex justify-between text-xl font-bold">
                                        <span>Total</span>
                                        <span>₹{cart.total}</span>
                                    </div>
                                </div>

                                <Link
                                    href="/checkout"
                                    className="block w-full bg-primary hover:bg-primary/90 text-primary-foreground text-center px-6 py-3 rounded-xl font-medium transition-all"
                                >
                                    Proceed to Checkout
                                </Link>

                                <Link
                                    href="/products"
                                    className="block w-full text-center mt-3 text-primary hover:underline"
                                >
                                    Continue Shopping
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
