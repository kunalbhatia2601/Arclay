"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
    Search,
    ShoppingCart,
    Plus,
    Minus,
    X,
    Receipt as ReceiptIcon,
    Barcode,
    Camera,
    CreditCard,
    Banknote,
    Smartphone,
    UserCheck,
    Printer,
} from "lucide-react";
import { toast } from "react-toastify";
import BarcodeScanner from "@/app/components/BarcodeScanner";
import Receipt, { RECEIPT_PRINT_CSS } from "@/app/components/Receipt";

const STORAGE_KEY = "pos-tickets-v1";

// A ticket is one open bill. The POS keeps several at once so a customer who
// steps away does not block the counter.
const newTicket = (label) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    cart: [],
    customerInfo: { name: "", phone: "" },
    discountType: "flat",
    discountInput: "",
    paymentMethod: "cash",
    tendered: "",
});

export default function POSPage() {
    const [tickets, setTickets] = useState([newTicket("Bill 1")]);
    const [activeId, setActiveId] = useState(null);

    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [processing, setProcessing] = useState(false);

    const [manualBarcode, setManualBarcode] = useState("");
    const [scanLog, setScanLog] = useState([]);

    const [knownCustomer, setKnownCustomer] = useState(null);
    const [lookingUpCustomer, setLookingUpCustomer] = useState(false);
    const [customerMatches, setCustomerMatches] = useState([]);
    const [showCustomerList, setShowCustomerList] = useState(false);
    const [highlightedMatch, setHighlightedMatch] = useState(0);
    const [customerPicked, setCustomerPicked] = useState(false);

    const [lastSale, setLastSale] = useState(null);
    const [storeInfo, setStoreInfo] = useState({});
    const [hydrated, setHydrated] = useState(false);

    const searchInputRef = useRef(null);
    const scanInputRef = useRef(null);
    const scanBuffer = useRef({ value: "", lastKeyTime: 0 });
    const handleBarcodeScanRef = useRef(() => {});

    const active = tickets.find((t) => t.id === activeId) || tickets[0];

    // Patch only the ticket being worked on.
    const updateActive = useCallback(
        (patch) => {
            setTickets((prev) =>
                prev.map((t) =>
                    t.id === (activeId || prev[0]?.id)
                        ? { ...t, ...(typeof patch === "function" ? patch(t) : patch) }
                        : t
                )
            );
        },
        [activeId]
    );

    // ---------- persistence ----------
    // Restored after mount so the server and client render the same first pass.
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed?.tickets) && parsed.tickets.length > 0) {
                    setTickets(parsed.tickets);
                    setActiveId(parsed.activeId || parsed.tickets[0].id);
                    setHydrated(true);
                    return;
                }
            }
        } catch (err) {
            console.error("Could not restore parked bills:", err);
        }
        setActiveId((prev) => prev || tickets[0].id);
        setHydrated(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ tickets, activeId }));
        } catch (err) {
            console.error("Could not save parked bills:", err);
        }
    }, [tickets, activeId, hydrated]);

    // ---------- data ----------
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
            if (data.success) setProducts(data.products || []);
        } catch (err) {
            console.error("Failed to fetch products:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Store details for the bill header
    useEffect(() => {
        const loadStore = async () => {
            try {
                const res = await fetch("/api/admin/settings", { credentials: "include" });
                const data = await res.json();
                if (data.success) {
                    const w = data.settings?.shipping?.warehouse || {};
                    setStoreInfo({
                        name: w.name || process.env.NEXT_PUBLIC_SITE_NAME || "Store",
                        address: w.address || "",
                        city: w.city || "",
                        state: w.state || "",
                        pincode: w.pincode || "",
                        phone: w.phone || "",
                    });
                }
            } catch (err) {
                console.error("Failed to load store info:", err);
            }
        };
        loadStore();
    }, []);

    const handleSearch = (value) => {
        setSearch(value);
        fetchProducts(value);
    };

    // ---------- ticket management ----------
    const addTicket = () => {
        setTickets((prev) => {
            // Reuse the lowest free number so labels stay tidy after closing bills.
            const used = new Set(
                prev.map((t) => parseInt(String(t.label).replace(/\D/g, ""), 10)).filter(Boolean)
            );
            let n = 1;
            while (used.has(n)) n++;

            const ticket = newTicket(`Bill ${n}`);
            setActiveId(ticket.id);
            return [...prev, ticket];
        });
        setKnownCustomer(null);
        setCustomerPicked(false);
        setCustomerMatches([]);
    };

    const closeTicket = (id) => {
        const ticket = tickets.find((t) => t.id === id);
        if (ticket?.cart.length > 0 && !confirm(`Discard ${ticket.label} and its items?`)) return;

        setTickets((prev) => {
            const remaining = prev.filter((t) => t.id !== id);
            const next = remaining.length > 0 ? remaining : [newTicket("Bill 1")];
            if (id === activeId) setActiveId(next[0].id);
            return next;
        });
    };

    const switchTicket = (id) => {
        setActiveId(id);
        setKnownCustomer(null);
        setCustomerPicked(false);
        setCustomerMatches([]);
        setShowCustomerList(false);
        scanInputRef.current?.focus();
    };

    const ticketTotal = (ticket) =>
        ticket.cart.reduce((sum, item) => {
            const price = item.variant?.salePrice || item.variant?.regularPrice || 0;
            return sum + price * item.quantity;
        }, 0);

    // ---------- barcode ----------
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

            if (now - buffer.lastKeyTime > SCAN_GAP_MS) buffer.value = "";
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

            if (e.key.length === 1) buffer.value += e.key;
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

    const getVariantName = (variant) => {
        if (!variant?.attributes) return null;
        return Object.values(variant.attributes).join(" / ");
    };

    const getProductPrice = (product, variant) => {
        if (variant) return variant.salePrice || variant.regularPrice;
        if (product.variants?.[0]) {
            return product.variants[0].salePrice || product.variants[0].regularPrice;
        }
        return 0;
    };

    // Adds to the active ticket. Uses a functional update so rapid scanner
    // input cannot drop lines by racing against stale state.
    const addToCart = (product, variant = null, quantity = 1, variantIndex = null) => {
        const resolvedVariant = variant || product.variants?.[0] || null;
        const resolvedIndex =
            variantIndex ??
            Math.max(
                0,
                (product.variants || []).findIndex((v) => variantKey(v) === variantKey(resolvedVariant))
            );
        const stock = resolvedVariant?.stock ?? 0;

        let blocked = false;

        updateActive((ticket) => {
            const existingIndex = ticket.cart.findIndex(
                (item) =>
                    item.product._id === product._id &&
                    variantKey(item.variant) === variantKey(resolvedVariant)
            );

            if (existingIndex >= 0) {
                const nextQty = ticket.cart[existingIndex].quantity + quantity;
                if (nextQty > stock) {
                    blocked = true;
                    return ticket;
                }
                const cart = [...ticket.cart];
                cart[existingIndex] = { ...cart[existingIndex], quantity: nextQty };
                return { cart };
            }

            if (quantity > stock) {
                blocked = true;
                return ticket;
            }

            return {
                cart: [
                    ...ticket.cart,
                    { product, variant: resolvedVariant, variantIndex: resolvedIndex, quantity },
                ],
            };
        });

        if (blocked) {
            toast.error(`Only ${stock} left of ${product.name}`);
            return false;
        }
        return true;
    };

    const pushScanLog = (entry) => setScanLog((prev) => [entry, ...prev].slice(0, 6));

    // Shared by the manual/scanner input, the USB wedge listener and the camera
    // scanner, so all three behave identically.
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

    handleBarcodeScanRef.current = handleBarcodeScan;

    const handleManualScanSubmit = async (e) => {
        e.preventDefault();
        const code = manualBarcode.trim();
        if (!code) return;

        setManualBarcode("");
        await handleBarcodeScan(code);
        scanInputRef.current?.focus();
    };

    // ---------- cart lines ----------
    const updateQuantity = (index, delta) => {
        updateActive((ticket) => {
            const item = ticket.cart[index];
            if (!item) return ticket;

            const stock = item.variant?.stock ?? 0;
            const next = item.quantity + delta;

            if (next > stock) {
                toast.error(`Only ${stock} in stock`);
                return ticket;
            }

            const cart = [...ticket.cart];
            cart[index] = { ...item, quantity: Math.max(1, next) };
            return { cart };
        });
    };

    const removeFromCart = (index) => {
        updateActive((ticket) => ({ cart: ticket.cart.filter((_, i) => i !== index) }));
    };

    const clearCart = () => updateActive({ cart: [] });

    // ---------- customer ----------
    // From 4 characters on, look for customers whose number contains what has
    // been typed. Debounced so it is one request per pause, not per keystroke.
    useEffect(() => {
        const phone = (active?.customerInfo.phone || "").trim();

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
    }, [active?.customerInfo.phone, customerPicked]);

    const selectCustomer = (customer) => {
        setCustomerPicked(true);
        updateActive({ customerInfo: { name: customer.name || "", phone: customer.phone } });
        setKnownCustomer(customer);
        setShowCustomerList(false);
        setCustomerMatches([]);
    };

    const handlePhoneChange = (value) => {
        setCustomerPicked(false);
        updateActive((t) => ({ customerInfo: { ...t.customerInfo, phone: value } }));
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

    // ---------- totals ----------
    const cart = active?.cart || [];
    const subtotal = ticketTotal(active || { cart: [] });
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Counter discount: a flat rupee amount or a percentage of subtotal, never
    // more than the subtotal itself (the server clamps it too).
    const discountAmount = (() => {
        const value = Math.max(0, parseFloat(active?.discountInput) || 0);
        if (!value) return 0;
        const raw =
            active?.discountType === "percent" ? (subtotal * Math.min(value, 100)) / 100 : value;
        return Math.min(Math.round(raw * 100) / 100, subtotal);
    })();

    const grandTotal = Math.max(0, subtotal - discountAmount);
    const tenderedValue = parseFloat(active?.tendered);
    const changeDue =
        active?.paymentMethod === "cash" && active?.tendered !== "" && !Number.isNaN(tenderedValue)
            ? tenderedValue - grandTotal
            : null;

    // ---------- checkout ----------
    const createOrder = async () => {
        if (cart.length === 0) {
            toast.error("Cart is empty");
            return;
        }

        if (changeDue != null && changeDue < 0) {
            toast.error("Cash received is less than the total");
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
                    customerInfo: active.customerInfo,
                    paymentMethod: active.paymentMethod,
                    discountAmount,
                    notes: "POS Walk-in Sale",
                }),
            });

            const data = await res.json();

            if (data.success) {
                setLastSale({ order: data.order, tendered: changeDue != null ? tenderedValue : null });

                // Close the finished bill; keep any others parked as they are.
                setTickets((prev) => {
                    const remaining = prev.filter((t) => t.id !== active.id);
                    const next = remaining.length > 0 ? remaining : [newTicket("Bill 1")];
                    setActiveId(next[0].id);
                    return next;
                });

                setKnownCustomer(null);
                setCustomerPicked(false);
                setCustomerMatches([]);
                setScanLog([]);
                fetchProducts(search);
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

    const closeReceipt = () => {
        setLastSale(null);
        scanInputRef.current?.focus();
    };

    return (
        <div className="flex h-[calc(100vh-80px)] gap-4">
            <style>{RECEIPT_PRINT_CSS}</style>

            {/* Left Panel - Products */}
            <div className="flex-1 flex flex-col bg-card rounded-2xl border border-border overflow-hidden print:hidden">
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

                    {showScanner && (
                        <div className="p-4 bg-muted rounded-xl">
                            <BarcodeScanner value="" onChange={() => {}} onScanSuccess={handleBarcodeScan} />
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
                        <div className="text-center text-muted-foreground py-8">No products found</div>
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
                                            // eslint-disable-next-line @next/next/no-img-element
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

            {/* Right Panel - Bills */}
            <div className="w-[420px] flex flex-col bg-card rounded-2xl border border-border overflow-hidden print:hidden">
                {/* Bill tabs */}
                <div className="flex items-center gap-1 p-2 border-b border-border overflow-x-auto">
                    {tickets.map((ticket) => {
                        const count = ticket.cart.reduce((s, i) => s + i.quantity, 0);
                        const isActive = ticket.id === active?.id;

                        return (
                            <div
                                key={ticket.id}
                                className={`group flex items-center gap-1.5 pl-3 pr-1.5 py-2 rounded-lg cursor-pointer shrink-0 border ${
                                    isActive
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "border-border hover:bg-muted"
                                }`}
                                onClick={() => switchTicket(ticket.id)}
                            >
                                <span className="text-sm font-medium whitespace-nowrap">
                                    {ticket.label}
                                </span>
                                {count > 0 && (
                                    <span
                                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                            isActive ? "bg-white/25" : "bg-muted-foreground/15"
                                        }`}
                                    >
                                        {count}
                                    </span>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        closeTicket(ticket.id);
                                    }}
                                    className="p-0.5 rounded hover:bg-black/10 opacity-60 hover:opacity-100"
                                    title="Close this bill"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        );
                    })}

                    <button
                        onClick={addTicket}
                        title="New bill"
                        className="shrink-0 p-2 rounded-lg border border-dashed border-border hover:bg-muted"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Cart Header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                        <h2 className="font-bold text-lg">{active?.label}</h2>
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                            {totalItems}
                        </span>
                    </div>
                    {cart.length > 0 && (
                        <button onClick={clearCart} className="text-xs text-destructive hover:underline">
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
                            <p className="text-sm">Scan a barcode or pick a product</p>
                        </div>
                    ) : (
                        cart.map((item, index) => (
                            <div key={index} className="p-3 bg-background border border-border rounded-xl">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-sm truncate">{item.product.name}</h3>
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
                                        <span className="px-3 py-1 min-w-10 text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(index, 1)}
                                            className="p-2 hover:bg-muted"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <span className="font-bold text-primary">
                                        ₹
                                        {(
                                            getProductPrice(item.product, item.variant) * item.quantity
                                        ).toLocaleString("en-IN")}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Customer */}
                <div className="p-4 border-t border-border space-y-3">
                    <div className="relative">
                        <input
                            type="tel"
                            value={active?.customerInfo.phone || ""}
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
                        value={active?.customerInfo.name || ""}
                        onChange={(e) =>
                            updateActive((t) => ({
                                customerInfo: { ...t.customerInfo, name: e.target.value },
                            }))
                        }
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

                {/* Discount */}
                <div className="px-4 pb-2">
                    <p className="text-sm text-muted-foreground mb-2">Discount</p>
                    <div className="flex gap-2">
                        <div className="flex rounded-lg border border-border overflow-hidden">
                            <button
                                onClick={() => updateActive({ discountType: "flat" })}
                                className={`px-3 py-2 text-sm ${
                                    active?.discountType === "flat"
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-muted"
                                }`}
                            >
                                ₹
                            </button>
                            <button
                                onClick={() => updateActive({ discountType: "percent" })}
                                className={`px-3 py-2 text-sm ${
                                    active?.discountType === "percent"
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-muted"
                                }`}
                            >
                                %
                            </button>
                        </div>
                        <input
                            type="number"
                            min="0"
                            value={active?.discountInput || ""}
                            onChange={(e) => updateActive({ discountInput: e.target.value })}
                            placeholder="0"
                            className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm"
                        />
                        {discountAmount > 0 && (
                            <span className="self-center text-sm text-destructive font-medium whitespace-nowrap">
                                -₹{discountAmount.toLocaleString("en-IN")}
                            </span>
                        )}
                    </div>
                </div>

                {/* Payment Method */}
                <div className="px-4 pb-2">
                    <p className="text-sm text-muted-foreground mb-2">Payment Method</p>
                    <div className="flex gap-2">
                        {[
                            { key: "cash", label: "Cash", Icon: Banknote },
                            { key: "card", label: "Card", Icon: CreditCard },
                            { key: "upi", label: "UPI", Icon: Smartphone },
                        ].map(({ key, label, Icon }) => (
                            <button
                                key={key}
                                onClick={() => updateActive({ paymentMethod: key })}
                                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border ${
                                    active?.paymentMethod === key
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border text-muted-foreground"
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="text-sm">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cash tendered */}
                {active?.paymentMethod === "cash" && (
                    <div className="px-4 pb-2 flex items-center gap-2">
                        <input
                            type="number"
                            min="0"
                            value={active?.tendered || ""}
                            onChange={(e) => updateActive({ tendered: e.target.value })}
                            placeholder="Cash received"
                            className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm"
                        />
                        {changeDue != null && (
                            <span
                                className={`text-sm font-bold whitespace-nowrap ${
                                    changeDue < 0 ? "text-destructive" : "text-emerald-600"
                                }`}
                            >
                                {changeDue < 0 ? "Short " : "Change "}₹
                                {Math.abs(changeDue).toLocaleString("en-IN")}
                            </span>
                        )}
                    </div>
                )}

                {/* Total & Checkout */}
                <div className="p-4 border-t border-border bg-muted/30">
                    {discountAmount > 0 && (
                        <div className="flex justify-between items-center text-sm text-muted-foreground mb-1">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toLocaleString("en-IN")}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-bold">Total</span>
                        <span className="text-2xl font-bold text-primary">
                            ₹{grandTotal.toLocaleString("en-IN")}
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
                                <ReceiptIcon className="w-5 h-5" />
                                Complete Sale
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Receipt after a completed sale */}
            {lastSale && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 print:bg-transparent print:p-0 print:block">
                    <div className="bg-card rounded-2xl max-h-[90vh] overflow-y-auto print:overflow-visible print:max-h-none print:rounded-none">
                        <div className="p-4 border-b border-border flex items-center justify-between gap-6 print:hidden">
                            <div>
                                <p className="font-bold text-lg">Sale complete</p>
                                <p className="text-sm text-muted-foreground">
                                    ₹{Number(lastSale.order.totalAmount).toLocaleString("en-IN")} ·{" "}
                                    {lastSale.order.paymentMethod}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium flex items-center gap-2"
                                >
                                    <Printer className="w-4 h-4" />
                                    Print Bill
                                </button>
                                <button
                                    onClick={closeReceipt}
                                    className="px-4 py-2 rounded-xl border border-border hover:bg-muted"
                                >
                                    New Sale
                                </button>
                            </div>
                        </div>

                        <div className="p-4 print:p-0">
                            <Receipt
                                order={lastSale.order}
                                store={storeInfo}
                                tendered={lastSale.tendered}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
