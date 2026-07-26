"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ShoppingCart, Plus, Minus, X, Trash2, Receipt, Barcode, Camera, CreditCard, Banknote, Smartphone, UserCheck } from "lucide-react";
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
    const [manualBarcode, setManualBarcode] = useState("");
    const [scanLog, setScanLog] = useState([]);
    const [knownCustomer, setKnownCustomer] = useState(null);
    const [lookingUpCustomer, setLookingUpCustomer] = useState(false);
    const [customerMatches, setCustomerMatches] = useState([]);
    const [showCustomerList, setShowCustomerList] = useState(false);
    const [highlightedMatch, setHighlightedMatch] = useState(0);
    const [customerPicked, setCustomerPicked] = useState(false);
    const searchInputRef = useRef(null);
    const scanInputRef = useRef(null);
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
            // When the scan box has focus it submits the code itself; letting
            // this listener also fire would add every scan twice.
            if (document.activeElement === scanInputRef.current) return;

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

    // Phone typeahead: from 4 characters on, look for customers whose number
    // contains what has been typed. Debounced so it is one request per pause,
    // not per keystroke.
    useEffect(() => {
        const phone = customerInfo.phone.trim();

        if (phone.length < 4 || customerPicked) {
            setCustomerMatches([]);
            setShowCustomerList(false);
            return;
        }

        let cancelled = false;
        setLookingUpCustomer(true);

        const timer = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/api/admin/customers?phoneSearch=${encodeURIComponent(phone)}`,
                    { credentials: "include" }
                );
                const data = await res.json();
                if (cancelled) return;

                const matches = data.success ? data.customers || [] : [];
                setCustomerMatches(matches);
                setShowCustomerList(matches.length > 0);
                setHighlightedMatch(0);

                // An exact hit still shows the returning-customer badge.
                setKnownCustomer(matches.find((c) => c.phone === phone) || null);
            } catch (err) {
                console.error("Customer lookup failed:", err);
            } finally {
                if (!cancelled) setLookingUpCustomer(false);
            }
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [customerInfo.phone, customerPicked]);

    const selectCustomer = (customer) => {
        setCustomerPicked(true);
        setCustomerInfo({ name: customer.name || "", phone: customer.phone });
        setKnownCustomer(customer);
        setShowCustomerList(false);
        setCustomerMatches([]);
    };

    const handlePhoneChange = (value) => {
        // Typing again after picking someone re-opens the search.
        setCustomerPicked(false);
        setCustomerInfo((prev) => ({ ...prev, phone: value }));
    };

    // Arrow keys + Enter so the counter can pick without reaching for a mouse.
    const handlePhoneKeyDown = (e) => {
        if (!showCustomerList || customerMatches.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedMatch((i) => (i + 1) % customerMatches.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedMatch((i) => (i - 1 + customerMatches.length) % customerMatches.length);
        } else if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            selectCustomer(customerMatches[highlightedMatch]);
        } else if (e.key === "Escape") {
            setShowCustomerList(false);
        }
    };

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
    const addToCart = (product, variant = null, quantity = 1, variantIndex = null) => {
        const resolvedIndex =
            variantIndex ??
            Math.max(
                0,
                (product.variants || []).findIndex((v) => variantKey(v) === variantKey(variant))
            );
        const resolvedVariant = variant || product.variants?.[0] || null;
        const stock = resolvedVariant?.stock ?? 0;

        let blocked = false;

        setCart((prev) => {
            const existingIndex = prev.findIndex(
                (item) =>
                    item.product._id === product._id &&
                    variantKey(item.variant) === variantKey(resolvedVariant)
            );

            if (existingIndex >= 0) {
                const nextQty = prev[existingIndex].quantity + quantity;
                if (nextQty > stock) {
                    blocked = true;
                    return prev;
                }

                const newCart = [...prev];
                newCart[existingIndex] = { ...newCart[existingIndex], quantity: nextQty };
                return newCart;
            }

            if (quantity > stock) {
                blocked = true;
                return prev;
            }

            return [
                ...prev,
                { product, variant: resolvedVariant, variantIndex: resolvedIndex, quantity },
            ];
        });

        if (blocked) {
            toast.error(`Only ${stock} left of ${product.name}`);
            return false;
        }
        return true;
    };

    // Update quantity, capped at available stock
    const updateQuantity = (index, delta) => {
        setCart((prev) => {
            const item = prev[index];
            if (!item) return prev;

            const stock = item.variant?.stock ?? 0;
            const next = item.quantity + delta;

            if (next > stock) {
                toast.error(`Only ${stock} in stock`);
                return prev;
            }

            const newCart = [...prev];
            newCart[index] = { ...item, quantity: Math.max(1, next) };
            return newCart;
        });
    };

    // Remove from cart
    const removeFromCart = (index) => {
        setCart((prev) => prev.filter((_, i) => i !== index));
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

        setProcessing(true);

        try {
            // Only identifiers and quantities go to the server; it resolves the
            // price from the database itself.
            const orderItems = cart.map((item) => ({
                product: item.product._id,
                variantIndex: item.variantIndex,
                barcode: item.variant?.barcode || "",
                quantity: item.quantity,
            }));

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
                    notes: "POS Walk-in Sale",
                }),
            });

            const data = await res.json();

            if (data.success) {
                const shortId = String(data.order?._id || "").slice(-8).toUpperCase();
                toast.success(`Sale complete — #${shortId} · ₹${data.order?.totalAmount}`);
                setCart([]);
                setCustomerInfo({ name: "", phone: "" });
                setKnownCustomer(null);
                setCustomerPicked(false);
                setCustomerMatches([]);
                setShowCustomerList(false);
                setScanLog([]);
                // Refresh stock counts shown in the grid after the sale.
                fetchProducts(search);
                scanInputRef.current?.focus();
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

    const pushScanLog = (entry) => {
        setScanLog((prev) => [entry, ...prev].slice(0, 6));
    };

    // Handle barcode scan — resolves to the exact variant the label belongs to.
    // Shared by the manual/scanner input box, the USB wedge listener and the
    // camera scanner, so all three behave identically.
    const handleBarcodeScan = async (barcode) => {
        const code = String(barcode || "").trim();
        if (!code) return;

        try {
            const res = await fetch(
                `/api/admin/products/barcode?code=${encodeURIComponent(code)}`,
                { credentials: "include" }
            );
            const data = await res.json();

            if (!data.success) {
                toast.error(data.message || `No product for barcode ${code}`);
                pushScanLog({ code, ok: false, text: "Not found" });
                return;
            }

            const variantName = getVariantName(data.variant);
            const label = `${data.product.name}${variantName ? ` (${variantName})` : ""}`;
            const added = addToCart(data.product, data.variant, 1, data.variantIndex);

            if (added) {
                toast.success(`Added: ${label}`);
                pushScanLog({ code, ok: true, text: label });
            } else {
                pushScanLog({ code, ok: false, text: `${label} — out of stock` });
            }
        } catch (err) {
            console.error("Barcode scan error:", err);
            toast.error("Barcode lookup failed");
            pushScanLog({ code, ok: false, text: "Lookup failed" });
        }
    };

    // Manual entry / hardware scanner box: submit, add, clear, stay focused so
    // the next code can go straight in.
    const handleManualScanSubmit = async (e) => {
        e.preventDefault();
        const code = manualBarcode.trim();
        if (!code) return;

        setManualBarcode("");
        await handleBarcodeScan(code);
        scanInputRef.current?.focus();
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
                {/* Scan + Search Header */}
                <div className="p-4 border-b border-border space-y-3">
                    {/* Always-on scan box: hardware scanner or typed by hand */}
                    <form onSubmit={handleManualScanSubmit} className="flex gap-2">
                        <div className="flex-1 relative">
                            <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                            <input
                                ref={scanInputRef}
                                type="text"
                                inputMode="numeric"
                                autoFocus
                                autoComplete="off"
                                value={manualBarcode}
                                onChange={(e) => setManualBarcode(e.target.value)}
                                placeholder="Scan barcode or type it and press Enter"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-primary/40 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-5 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-medium"
                        >
                            Add
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowScanner(!showScanner)}
                            title="Scan with camera"
                            className="px-4 py-3 rounded-xl border border-border hover:bg-muted"
                        >
                            <Camera className="w-5 h-5" />
                        </button>
                    </form>

                    <p className="text-xs text-muted-foreground">
                        Keep this box focused and keep scanning — each scan adds a unit. A USB
                        scanner also works anywhere on this page.
                    </p>

                    {/* Recent scan feedback */}
                    {scanLog.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {scanLog.map((entry, i) => (
                                <span
                                    key={`${entry.code}-${i}`}
                                    className={`text-xs px-2.5 py-1 rounded-full border ${
                                        entry.ok
                                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                            : "border-red-300 bg-red-50 text-red-700"
                                    }`}
                                >
                                    {entry.ok ? "✓" : "✕"} {entry.text}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Or search products by name..."
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    {/* Camera Scanner */}
                    {showScanner && (
                        <div className="p-4 bg-muted rounded-xl">
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
                                    onClick={() => addToCart(product, product.variants?.[0], 1, 0)}
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
                                    <p className="text-xs text-muted-foreground">
                                        {product.variants?.[0]?.stock ?? 0} in stock
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
                    <div className="relative">
                        <input
                            type="tel"
                            value={customerInfo.phone}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            onKeyDown={handlePhoneKeyDown}
                            onFocus={() => {
                                if (customerMatches.length > 0) setShowCustomerList(true);
                            }}
                            // Delayed so a click on a suggestion lands before the list closes
                            onBlur={() => setTimeout(() => setShowCustomerList(false), 150)}
                            placeholder="Phone Number (optional)"
                            autoComplete="off"
                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                        />
                        {lookingUpCustomer && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        )}

                        {showCustomerList && customerMatches.length > 0 && (
                            <ul className="absolute z-20 bottom-full mb-1 w-full max-h-60 overflow-y-auto bg-card border border-border rounded-xl shadow-lg py-1">
                                {customerMatches.map((customer, index) => (
                                    <li key={customer._id}>
                                        <button
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => selectCustomer(customer)}
                                            onMouseEnter={() => setHighlightedMatch(index)}
                                            className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-3 ${
                                                index === highlightedMatch ? "bg-muted" : ""
                                            }`}
                                        >
                                            <span className="min-w-0">
                                                <span className="block font-mono">{customer.phone}</span>
                                                <span className="block text-xs text-muted-foreground truncate">
                                                    {customer.name || "No name saved"}
                                                </span>
                                            </span>
                                            <span className="text-xs text-muted-foreground shrink-0">
                                                {customer.totalOrders} order
                                                {customer.totalOrders === 1 ? "" : "s"}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <input
                        type="text"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                        placeholder="Customer Name (optional)"
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                    />

                    {knownCustomer && (
                        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                            <UserCheck className="w-4 h-4 shrink-0" />
                            <span>
                                Returning customer · {knownCustomer.totalOrders} order
                                {knownCustomer.totalOrders === 1 ? "" : "s"} · ₹
                                {Number(knownCustomer.totalSpent || 0).toLocaleString("en-IN")} spent
                            </span>
                        </div>
                    )}
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
