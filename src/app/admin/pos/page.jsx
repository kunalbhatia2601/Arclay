"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ShoppingCart, Plus, Minus, X, Trash2, Receipt, Barcode, CreditCard, Banknote, Smartphone } from "lucide-react";
import { toast } from "react-toastify";
import BarcodeScanner from "@/app/components/BarcodeScanner";

export default function POSPage() {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [customerInfo, setCustomerInfo] = useState({
        name: "",
        phone: "",
    });
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [processing, setProcessing] = useState(false);
    const searchInputRef = useRef(null);
    const scanBuffer = useRef({ value: "", lastKeyTime: 0 });
    const handleBarcodeScanRef = useRef(() => {});

    // Fetch products
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async (searchQuery = "") => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                search: searchQuery,
                limit: 50,
                status: "active",
            });
            const res = await fetch(`/api/products?${params}`);
            const data = await res.json();
            if (data.success) {
                setProducts(data.products || []);
            }
        } catch (err) {
            console.error("Failed to fetch products:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearch(value);
        fetchProducts(value);
    };

    // USB/Bluetooth scanners act as keyboards: they emit the whole code in a
    // burst and finish with Enter. Keystrokes slower than SCAN_GAP_MS are
    // treated as human typing and ignored, so normal input is unaffected.
    useEffect(() => {
        const SCAN_GAP_MS = 60;
        const MIN_CODE_LENGTH = 6;

        const handleKeyDown = (e) => {
            const now = Date.now();
            const buffer = scanBuffer.current;

            if (now - buffer.lastKeyTime > SCAN_GAP_MS) {
                buffer.value = "";
            }
            buffer.lastKeyTime = now;

            if (e.key === "Enter") {
                const code = buffer.value;
                buffer.value = "";
                if (code.length >= MIN_CODE_LENGTH) {
                    e.preventDefault();
                    handleBarcodeScanRef.current(code);
                }
                return;
            }

            if (e.key.length === 1) {
                buffer.value += e.key;
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Stable key for a variant, independent of attribute ordering
    const variantKey = (variant) => {
        const attrs = variant?.attributes || {};
        return Object.keys(attrs)
            .sort()
            .map((k) => `${k}=${attrs[k]}`)
            .join("|");
    };

    // Add to cart. Uses a functional update so rapid scanner input cannot drop
    // lines by racing against a stale `cart` closure.
    const addToCart = (product, variant = null, quantity = 1) => {
        setCart((prev) => {
            const existingIndex = prev.findIndex(
                (item) =>
                    item.product._id === product._id &&
                    variantKey(item.variant) === variantKey(variant)
            );

            if (existingIndex >= 0) {
                const newCart = [...prev];
                newCart[existingIndex] = {
                    ...newCart[existingIndex],
                    quantity: newCart[existingIndex].quantity + quantity,
                };
                return newCart;
            }

            return [...prev, { product, variant, quantity }];
        });
    };

    // Update quantity
    const updateQuantity = (index, delta) => {
        const newCart = [...cart];
        newCart[index].quantity = Math.max(1, newCart[index].quantity + delta);
        setCart(newCart);
    };

    // Remove from cart
    const removeFromCart = (index) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    // Clear cart
    const clearCart = () => {
        setCart([]);
    };

    // Calculate totals
    const calculateTotals = () => {
        let subtotal = 0;
        let totalItems = 0;

        cart.forEach((item) => {
            const price = item.variant?.salePrice || item.variant?.regularPrice || item.product.variants?.[0]?.salePrice || item.product.variants?.[0]?.regularPrice || 0;
            subtotal += price * item.quantity;
            totalItems += item.quantity;
        });

        return { subtotal, totalItems };
    };

    const { subtotal, totalItems } = calculateTotals();

    // Create order
    const createOrder = async () => {
        if (cart.length === 0) {
            toast.error("Cart is empty");
            return;
        }

        if (!customerInfo.name.trim()) {
            toast.error("Customer name is required");
            return;
        }

        if (!customerInfo.phone.trim()) {
            toast.error("Customer phone is required");
            return;
        }

        setProcessing(true);

        try {
            const orderItems = cart.map((item) => {
                const price = item.variant?.salePrice || item.variant?.regularPrice || item.product.variants?.[0]?.salePrice || item.product.variants?.[0]?.regularPrice || 0;
                return {
                    product: item.product._id,
                    name: item.product.name,
                    price,
                    quantity: item.quantity,
                    variant: item.variant ? {
                        attributes: Object.fromEntries(item.variant.attributes),
                        regularPrice: item.variant.regularPrice,
                        salePrice: item.variant.salePrice,
                    } : null,
                };
            });

            const res = await fetch("/api/admin/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    items: orderItems,
                    customerInfo: {
                        name: customerInfo.name,
                        phone: customerInfo.phone,
                    },
                    paymentMethod,
                    paymentStatus: "paid",
                    orderStatus: "confirmed",
                    notes: "POS Walk-in Sale",
                }),
            });

            const data = await res.json();

            if (data.success) {
                toast.success(`Order created! Order ID: ${data.order?.orderId || data.order?._id}`);
                setCart([]);
                setCustomerInfo({ name: "", phone: "" });
            } else {
                toast.error(data.message || "Failed to create order");
            }
        } catch (err) {
            console.error("Order error:", err);
            toast.error("Failed to create order");
        } finally {
            setProcessing(false);
        }
    };

    // Handle barcode scan — resolves to the exact variant the label belongs to
    const handleBarcodeScan = async (barcode) => {
        const code = String(barcode || "").trim();
        if (!code) return;

        setShowScanner(false);

        try {
            const res = await fetch(
                `/api/admin/products/barcode?code=${encodeURIComponent(code)}`,
                { credentials: "include" }
            );
            const data = await res.json();

            if (!data.success) {
                toast.error(data.message || "Product not found for this barcode");
                return;
            }

            const variantName = getVariantName(data.variant);
            addToCart(data.product, data.variant);
            toast.success(`Added: ${data.product.name}${variantName ? ` (${variantName})` : ""}`);
        } catch (err) {
            console.error("Barcode scan error:", err);
            toast.error("Barcode lookup failed");
        }
    };

    // Keeps the always-on key listener pointed at the latest handler
    handleBarcodeScanRef.current = handleBarcodeScan;

    // Get product price
    const getProductPrice = (product, variant) => {
        if (variant) {
            return variant.salePrice || variant.regularPrice;
        }
        if (product.variants?.[0]) {
            return product.variants[0].salePrice || product.variants[0].regularPrice;
        }
        return 0;
    };

    // Get product display name
    const getVariantName = (variant) => {
        if (!variant) return null;
        if (variant.attributes instanceof Map) {
            return Object.values(Object.fromEntries(variant.attributes)).join(" / ");
        }
        return variant.attributes ? Object.values(variant.attributes).join(" / ") : null;
    };

    return (
        <div className="flex h-[calc(100vh-80px)] gap-4">
            {/* Left Panel - Products */}
            <div className="flex-1 flex flex-col bg-card rounded-2xl border border-border overflow-hidden">
                {/* Search Header */}
                <div className="p-4 border-b border-border">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search products..."
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <button
                            onClick={() => setShowScanner(!showScanner)}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90"
                        >
                            <Barcode className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Barcode Scanner */}
                    {showScanner && (
                        <div className="mt-4 p-4 bg-muted rounded-xl">
                            <BarcodeScanner
                                value=""
                                onChange={() => {}}
                                onScanSuccess={handleBarcodeScan}
                            />
                        </div>
                    )}
                </div>

                {/* Products Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            No products found
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {products.map((product) => (
                                <button
                                    key={product._id}
                                    onClick={() => addToCart(product, product.variants?.[0])}
                                    className="p-3 bg-background border border-border rounded-xl hover:border-primary/50 hover:bg-muted/50 transition-all text-left"
                                >
                                    <div className="aspect-square bg-muted rounded-lg mb-2 overflow-hidden">
                                        {product.images?.[0] ? (
                                            <img
                                                src={product.images[0]}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                No Image
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-medium text-sm text-foreground truncate">
                                        {product.name}
                                    </h3>
                                    <p className="text-primary font-bold text-sm">
                                        ₹{getProductPrice(product).toLocaleString("en-IN")}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel - Cart */}
            <div className="w-96 flex flex-col bg-card rounded-2xl border border-border overflow-hidden">
                {/* Cart Header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                        <h2 className="font-bold text-lg">Cart</h2>
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                            {totalItems}
                        </span>
                    </div>
                    {cart.length > 0 && (
                        <button
                            onClick={clearCart}
                            className="text-xs text-destructive hover:underline"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Cart is empty</p>
                            <p className="text-sm">Add products from the left</p>
                        </div>
                    ) : (
                        cart.map((item, index) => (
                            <div
                                key={index}
                                className="p-3 bg-background border border-border rounded-xl"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-sm truncate">
                                            {item.product.name}
                                        </h3>
                                        {getVariantName(item.variant) && (
                                            <p className="text-xs text-muted-foreground">
                                                {getVariantName(item.variant)}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(index)}
                                        className="p-1 text-muted-foreground hover:text-destructive"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center border border-border rounded-lg">
                                        <button
                                            onClick={() => updateQuantity(index, -1)}
                                            className="p-2 hover:bg-muted"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="px-3 py-1 min-w-[40px] text-center">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(index, 1)}
                                            className="p-2 hover:bg-muted"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <span className="font-bold text-primary">
                                        ₹{(getProductPrice(item.product, item.variant) * item.quantity).toLocaleString("en-IN")}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Customer Info */}
                <div className="p-4 border-t border-border space-y-3">
                    <input
                        type="text"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                        placeholder="Customer Name *"
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                    />
                    <input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                        placeholder="Phone Number *"
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                    />
                </div>

                {/* Payment Method */}
                <div className="px-4 pb-2">
                    <p className="text-sm text-muted-foreground mb-2">Payment Method</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPaymentMethod("cash")}
                            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border ${
                                paymentMethod === "cash"
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border text-muted-foreground"
                            }`}
                        >
                            <Banknote className="w-4 h-4" />
                            <span className="text-sm">Cash</span>
                        </button>
                        <button
                            onClick={() => setPaymentMethod("card")}
                            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border ${
                                paymentMethod === "card"
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border text-muted-foreground"
                            }`}
                        >
                            <CreditCard className="w-4 h-4" />
                            <span className="text-sm">Card</span>
                        </button>
                        <button
                            onClick={() => setPaymentMethod("upi")}
                            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border ${
                                paymentMethod === "upi"
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border text-muted-foreground"
                            }`}
                        >
                            <Smartphone className="w-4 h-4" />
                            <span className="text-sm">UPI</span>
                        </button>
                    </div>
                </div>

                {/* Total & Checkout */}
                <div className="p-4 border-t border-border bg-muted/30">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-bold">Total</span>
                        <span className="text-2xl font-bold text-primary">
                            ₹{subtotal.toLocaleString("en-IN")}
                        </span>
                    </div>
                    <button
                        onClick={createOrder}
                        disabled={processing || cart.length === 0}
                        className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {processing ? (
                            <>
                                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Receipt className="w-5 h-5" />
                                Complete Sale
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
