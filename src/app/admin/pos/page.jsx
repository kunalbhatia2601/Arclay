"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
    Search,
    ShoppingCart,
    Plus,
    Minus,
    X,
    Receipt as ReceiptIcon,
    Barcode,
    Camera,
    Printer,
    Percent,
    BarChart3,
    Keyboard,
    Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import BarcodeScanner from "@/app/components/BarcodeScanner";
import VariantPickerModal from "@/app/components/VariantPickerModal";
import Receipt, { RECEIPT_PRINT_CSS } from "@/app/components/Receipt";
import DayReportModal from "@/app/components/pos/DayReportModal";
import ShortcutsHelp from "@/app/components/pos/ShortcutsHelp";
import CheckoutModal from "@/app/components/pos/CheckoutModal";
import { computeBill } from "@/lib/billing";

const STORAGE_KEY = "pos-tickets-v2";
// Order used by the F6 cycle shortcut; the buttons live in CheckoutModal
const PAYMENT_METHOD_KEYS = ["cash", "card", "upi"];

// A ticket is one open bill. The POS keeps several at once so a customer who
// steps away does not block the counter.
const newTicket = (label) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    cart: [],
    customerInfo: { name: "", phone: "" },
    discountType: "flat",
    discountValue: "",
    couponCode: "",
    couponDiscount: 0,
    paymentMethod: "cash",
    tendered: "",
});

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export default function POSPage() {
    // ---------- state ----------
    const [tickets, setTickets] = useState([newTicket("Bill 1")]);
    const [activeId, setActiveId] = useState(null);
    const [hydrated, setHydrated] = useState(false);

    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [processing, setProcessing] = useState(false);

    const [manualBarcode, setManualBarcode] = useState("");
    const [scanLog, setScanLog] = useState([]);
    const [editingLine, setEditingLine] = useState(null);

    const [showCheckout, setShowCheckout] = useState(false);

    const [lastSale, setLastSale] = useState(null);
    const [storeInfo, setStoreInfo] = useState({});
    const [taxConfig, setTaxConfig] = useState({ taxEnabled: false, priceIncludesTax: true });

    const [showReport, setShowReport] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [variantPickerProduct, setVariantPickerProduct] = useState(null);

    const searchInputRef = useRef(null);
    const scanInputRef = useRef(null);
    const scanBuffer = useRef({ value: "", lastKeyTime: 0 });
    const actionsRef = useRef({});

    const active = tickets.find((t) => t.id === activeId) || tickets[0];

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
    const fetchProducts = useCallback(async (searchQuery = "") => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                search: searchQuery,
                limit: 60,
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
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Store identity + tax mode drive both the on-screen totals and the bill
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const res = await fetch("/api/admin/settings", { credentials: "include" });
                const data = await res.json();
                if (!data.success) return;

                const w = data.settings?.shipping?.warehouse || {};
                const s = data.settings?.store || {};

                setStoreInfo({
                    name: w.name || process.env.NEXT_PUBLIC_SITE_NAME || "Store",
                    legalName: s.legalName || w.name || process.env.NEXT_PUBLIC_SITE_NAME || "Store",
                    address: w.address || "",
                    city: w.city || "",
                    state: w.state || "",
                    pincode: w.pincode || "",
                    phone: w.phone || "",
                    gstin: s.gstin || "",
                    billFooter: s.billFooter || "Thank you! Visit again.",
                });
                setTaxConfig({
                    taxEnabled: !!s.taxEnabled,
                    priceIncludesTax: s.priceIncludesTax !== false,
                });
            } catch (err) {
                console.error("Failed to load store settings:", err);
            }
        };
        loadSettings();
    }, []);

    const handleSearch = (value) => {
        setSearch(value);
        fetchProducts(value);
    };

    // ---------- tickets ----------
    const addTicket = useCallback(() => {
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
    }, []);

    const dropTicket = (id) => {
        setTickets((prev) => {
            const remaining = prev.filter((t) => t.id !== id);
            const next = remaining.length > 0 ? remaining : [newTicket("Bill 1")];
            if (id === (activeId || prev[0]?.id)) setActiveId(next[0].id);
            return next;
        });
    };

    const closeTicket = (id) => {
        const ticket = tickets.find((t) => t.id === id);
        if (ticket?.cart.length > 0 && !confirm(`Discard ${ticket.label} and its items?`)) return;
        dropTicket(id);
    };

    const switchTicket = useCallback((id) => {
        setActiveId(id);
        setEditingLine(null);
    }, []);

    // ---------- helpers ----------
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

    const unitPrice = (product, variant) => {
        const v = variant || product?.variants?.[0];
        return v ? v.salePrice || v.regularPrice : 0;
    };

    // ---------- cart ----------
    const addToCart = useCallback(
        (product, variant = null, quantity = 1, variantIndex = null) => {
            const resolvedVariant = variant || product.variants?.[0] || null;
            const resolvedIndex =
                variantIndex ??
                Math.max(
                    0,
                    (product.variants || []).findIndex(
                        (v) => variantKey(v) === variantKey(resolvedVariant)
                    )
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
                        {
                            product,
                            variant: resolvedVariant,
                            variantIndex: resolvedIndex,
                            quantity,
                            lineDiscountType: "flat",
                            lineDiscountValue: "",
                        },
                    ],
                };
            });

            if (blocked) {
                toast.error(`Only ${stock} left of ${product.name}`);
                return false;
            }
            return true;
        },
        [updateActive]
    );

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

    const setLineField = (index, field, value) => {
        updateActive((ticket) => {
            const cart = [...ticket.cart];
            cart[index] = { ...cart[index], [field]: value };
            return { cart };
        });
    };

    const removeFromCart = (index) => {
        setEditingLine(null);
        updateActive((ticket) => ({ cart: ticket.cart.filter((_, i) => i !== index) }));
    };

    const clearCart = () => {
        if (!confirm("Clear all items from this bill?")) return;
        setEditingLine(null);
        updateActive({ cart: [], couponCode: "", couponDiscount: 0, discountValue: "" });
    };

    // ---------- barcode ----------
    const pushScanLog = (entry) => setScanLog((prev) => [entry, ...prev].slice(0, 5));

    const handleBarcodeScan = useCallback(
        async (barcode) => {
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

                pushScanLog({
                    code,
                    ok: added,
                    text: added ? label : `${label} — out of stock`,
                });
            } catch (err) {
                console.error("Barcode scan error:", err);
                toast.error("Barcode lookup failed");
                pushScanLog({ code, ok: false, text: "Lookup failed" });
            }
        },
        [addToCart]
    );

    actionsRef.current.scan = handleBarcodeScan;

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
                    actionsRef.current.scan?.(code);
                }
                return;
            }

            if (e.key.length === 1) buffer.value += e.key;
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleManualScanSubmit = async (e) => {
        e.preventDefault();
        const code = manualBarcode.trim();
        if (!code) return;

        setManualBarcode("");
        await handleBarcodeScan(code);
        scanInputRef.current?.focus();
    };

    // ---------- totals ----------
    // Memoised so the empty-array fallback does not create a new identity each
    // render and retrigger everything downstream.
    const cart = useMemo(() => active?.cart || [], [active?.cart]);

    // Exactly the function the server runs, so the quote and the bill agree.
    const bill = useMemo(
        () =>
            computeBill(
                cart.map((item) => ({
                    price: unitPrice(item.product, item.variant),
                    quantity: item.quantity,
                    taxRate: item.product?.taxRate || 0,
                    lineDiscountType: item.lineDiscountType,
                    lineDiscountValue: item.lineDiscountValue,
                })),
                {
                    discountType: active?.discountType,
                    discountValue: active?.discountValue,
                    couponDiscount: active?.couponDiscount || 0,
                    taxEnabled: taxConfig.taxEnabled,
                    priceIncludesTax: taxConfig.priceIncludesTax,
                }
            ),
        [cart, active?.discountType, active?.discountValue, active?.couponDiscount, taxConfig]
    );

    const tenderedValue = parseFloat(active?.tendered);
    const changeDue =
        active?.paymentMethod === "cash" && active?.tendered !== "" && !Number.isNaN(tenderedValue)
            ? tenderedValue - bill.total
            : null;

    const cartPayload = useCallback(
        () =>
            cart.map((item) => ({
                product: item.product._id,
                variantIndex: item.variantIndex,
                barcode: item.variant?.barcode || "",
                quantity: item.quantity,
                lineDiscountType: item.lineDiscountType,
                lineDiscountValue: item.lineDiscountValue,
            })),
        [cart]
    );

    // A coupon is priced against the cart it was applied to; changing the cart
    // invalidates it rather than silently keeping a stale discount.
    const cartSignature = cart
        .map((i) => `${i.product._id}:${i.variantIndex}:${i.quantity}`)
        .join(",");
    const couponSignature = useRef(cartSignature);

    useEffect(() => {
        if (active?.couponCode && couponSignature.current !== cartSignature) {
            updateActive({ couponCode: "", couponDiscount: 0 });
            toast.info("Cart changed — re-apply the coupon");
        }
        couponSignature.current = cartSignature;
    }, [cartSignature, active?.couponCode, updateActive]);

    // ---------- checkout ----------
    const createOrder = useCallback(async () => {
        if (processing) return;

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
            const res = await fetch("/api/admin/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    items: cartPayload(),
                    customerInfo: active.customerInfo,
                    paymentMethod: active.paymentMethod,
                    discountType: active.discountType,
                    discountValue: active.discountValue,
                    couponCode: active.couponCode,
                    notes: "POS Walk-in Sale",
                }),
            });

            const data = await res.json();

            if (data.success) {
                setLastSale({
                    order: data.order,
                    tendered: changeDue != null ? tenderedValue : null,
                });

                // Close the finished bill; any others stay parked untouched.
                dropTicket(active.id);
                setShowCheckout(false);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [processing, cart, changeDue, tenderedValue, active, cartPayload, fetchProducts, search]);

    actionsRef.current.createOrder = createOrder;
    actionsRef.current.openCheckout = () => {
        if (cart.length > 0) setShowCheckout(true);
    };
    actionsRef.current.addTicket = addTicket;
    actionsRef.current.switchTicket = switchTicket;

    // ---------- keyboard shortcuts ----------
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") {
                setShowReport(false);
                setShowHelp(false);
                setShowScanner(false);
                setEditingLine(null);
                setShowCheckout(false);
                return;
            }

            if (e.key === "?" && e.target.tagName !== "INPUT") {
                e.preventDefault();
                setShowHelp((v) => !v);
                return;
            }

            if (e.ctrlKey && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
                e.preventDefault();
                setTickets((prev) => {
                    const i = prev.findIndex((t) => t.id === activeId);
                    const step = e.key === "ArrowRight" ? 1 : -1;
                    const next = prev[(i + step + prev.length) % prev.length];
                    if (next) actionsRef.current.switchTicket(next.id);
                    return prev;
                });
                return;
            }

            switch (e.key) {
                case "F2":
                    e.preventDefault();
                    actionsRef.current.addTicket();
                    break;
                case "F3":
                    e.preventDefault();
                    searchInputRef.current?.focus();
                    break;
                case "F4":
                    e.preventDefault();
                    scanInputRef.current?.focus();
                    break;
                case "F6":
                    e.preventDefault();
                    updateActive((t) => {
                        const i = PAYMENT_METHOD_KEYS.indexOf(t.paymentMethod);
                        return {
                            paymentMethod:
                                PAYMENT_METHOD_KEYS[(i + 1) % PAYMENT_METHOD_KEYS.length],
                        };
                    });
                    break;
                case "F8":
                    e.preventDefault();
                    setShowReport(true);
                    break;
                case "F9":
                    e.preventDefault();
                    // Opens the checkout step; the dialog handles F9 to confirm
                    actionsRef.current.openCheckout();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [activeId, updateActive]);

    // ---------- render ----------
    return (
        <div className="flex h-[calc(100vh-80px)] gap-4">
            <style>{RECEIPT_PRINT_CSS}</style>

            {/* ============ LEFT: catalogue ============ */}
            <div className="flex-1 flex flex-col bg-card rounded-2xl border border-border overflow-hidden print:hidden">
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
                                placeholder="Scan barcode or type it and press Enter  (F4)"
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
                        <button
                            type="button"
                            onClick={() => setShowReport(true)}
                            title="Day report (F8)"
                            className="px-4 py-3 rounded-xl border border-border hover:bg-muted"
                        >
                            <BarChart3 className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowHelp(true)}
                            title="Shortcuts (?)"
                            className="px-4 py-3 rounded-xl border border-border hover:bg-muted"
                        >
                            <Keyboard className="w-5 h-5" />
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
                            placeholder="Search products by name  (F3)"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    {showScanner && (
                        <div className="p-4 bg-muted rounded-xl">
                            <BarcodeScanner value="" onChange={() => {}} onScanSuccess={handleBarcodeScan} />
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">No products found</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                            {products.map((product) => {
                                const variants = product.variants || [];
                                const needsVariantChoice =
                                    (product.variationTypes?.length || 0) > 0 && variants.length > 1;
                                // Total across all variants — a single variant being out
                                // doesn't mean the product is; the picker sorts out which one.
                                const stock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
                                const out = stock <= 0;

                                return (
                                    <button
                                        key={product._id}
                                        disabled={out}
                                        onClick={() =>
                                            needsVariantChoice
                                                ? setVariantPickerProduct(product)
                                                : addToCart(product, variants[0], 1, 0)
                                        }
                                        className="p-3 bg-background border border-border rounded-xl hover:border-primary/50 hover:bg-muted/50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                                    No Image
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-medium text-sm text-foreground truncate">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center justify-between mt-0.5">
                                            <span className="text-primary font-bold text-sm">
                                                ₹{unitPrice(product).toLocaleString("en-IN")}
                                            </span>
                                            <span
                                                className={`text-xs ${
                                                    out
                                                        ? "text-destructive"
                                                        : stock <= 5
                                                          ? "text-amber-600"
                                                          : "text-muted-foreground"
                                                }`}
                                            >
                                                {out ? "Out" : `${stock} left`}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ============ RIGHT: bills ============ */}
            <div className="w-[440px] flex flex-col bg-card rounded-2xl border border-border overflow-hidden print:hidden">
                {/* Bill tabs */}
                <div className="flex items-center gap-1 p-2 border-b border-border overflow-x-auto">
                    {tickets.map((ticket) => {
                        const count = ticket.cart.reduce((s, i) => s + i.quantity, 0);
                        const isActive = ticket.id === active?.id;

                        return (
                            <div
                                key={ticket.id}
                                onClick={() => switchTicket(ticket.id)}
                                className={`group flex items-center gap-1.5 pl-3 pr-1.5 py-2 rounded-lg cursor-pointer shrink-0 border transition-colors ${
                                    isActive
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "border-border hover:bg-muted"
                                }`}
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
                        title="New bill (F2)"
                        className="shrink-0 p-2 rounded-lg border border-dashed border-border hover:bg-muted"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Cart header */}
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                        <h2 className="font-bold">{active?.label}</h2>
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                            {bill.totalItems}
                        </span>
                    </div>
                    {cart.length > 0 && (
                        <button
                            onClick={clearCart}
                            className="text-xs text-destructive hover:underline flex items-center gap-1"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Clear
                        </button>
                    )}
                </div>

                {/* Lines */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {cart.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10">
                            <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-40" />
                            <p>Bill is empty</p>
                            <p className="text-sm">Scan a barcode or pick a product</p>
                        </div>
                    ) : (
                        cart.map((item, index) => {
                            const line = bill.lines[index] || {};
                            const isEditing = editingLine === index;

                            return (
                                <div
                                    key={index}
                                    className="p-3 bg-background border border-border rounded-xl"
                                >
                                    <div className="flex justify-between items-start gap-2 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-sm truncate">
                                                {item.product.name}
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                {getVariantName(item.variant) || "Default"} ·{" "}
                                                {money(unitPrice(item.product, item.variant))}
                                                {taxConfig.taxEnabled && item.product?.taxRate
                                                    ? ` · GST ${item.product.taxRate}%`
                                                    : ""}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(index)}
                                            className="p-1 text-muted-foreground hover:text-destructive"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center border border-border rounded-lg">
                                            <button
                                                onClick={() => updateQuantity(index, -1)}
                                                className="p-2 hover:bg-muted"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="px-3 py-1 min-w-10 text-center text-sm">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(index, 1)}
                                                className="p-2 hover:bg-muted"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => setEditingLine(isEditing ? null : index)}
                                            title="Discount this line"
                                            className={`p-2 rounded-lg border ${
                                                line.lineDiscount > 0
                                                    ? "border-primary text-primary"
                                                    : "border-border text-muted-foreground hover:bg-muted"
                                            }`}
                                        >
                                            <Percent className="w-4 h-4" />
                                        </button>

                                        <div className="text-right">
                                            {line.lineDiscount > 0 && (
                                                <p className="text-xs text-muted-foreground line-through">
                                                    {money(line.gross)}
                                                </p>
                                            )}
                                            <span className="font-bold text-primary">
                                                {money(line.net ?? 0)}
                                            </span>
                                        </div>
                                    </div>

                                    {isEditing && (
                                        <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                                            <div className="flex rounded-lg border border-border overflow-hidden">
                                                {["flat", "percent"].map((type) => (
                                                    <button
                                                        key={type}
                                                        onClick={() =>
                                                            setLineField(index, "lineDiscountType", type)
                                                        }
                                                        className={`px-3 py-1.5 text-sm ${
                                                            item.lineDiscountType === type
                                                                ? "bg-primary text-primary-foreground"
                                                                : "hover:bg-muted"
                                                        }`}
                                                    >
                                                        {type === "flat" ? "₹" : "%"}
                                                    </button>
                                                ))}
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                autoFocus
                                                value={item.lineDiscountValue}
                                                onChange={(e) =>
                                                    setLineField(index, "lineDiscountValue", e.target.value)
                                                }
                                                placeholder="Line discount"
                                                className="flex-1 px-3 py-1.5 rounded-lg border border-input bg-background text-sm"
                                            />
                                            {line.lineDiscount > 0 && (
                                                <span className="text-sm text-destructive font-medium whitespace-nowrap">
                                                    -{money(line.lineDiscount)}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Totals + checkout */}
                <div className="p-4 border-t border-border bg-muted/30 space-y-1">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Subtotal</span>
                        <span>{money(bill.grossSubtotal)}</span>
                    </div>
                    {bill.totalDiscount > 0 && (
                        <div className="flex justify-between text-sm text-destructive">
                            <span>Discount</span>
                            <span>-{money(bill.totalDiscount)}</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-2 mt-1 border-t border-border">
                        <span className="text-lg font-bold">Total</span>
                        <span className="text-3xl font-bold text-primary">{money(bill.total)}</span>
                    </div>

                    <button
                        onClick={() => setShowCheckout(true)}
                        disabled={cart.length === 0}
                        className="w-full mt-3 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <ReceiptIcon className="w-5 h-5" />
                        Complete Sale
                        <kbd className="ml-1 text-xs opacity-70 font-normal">F9</kbd>
                    </button>
                </div>
            </div>

            {/* ============ overlays ============ */}
            {showCheckout && active && (
                <CheckoutModal
                    ticket={active}
                    updateActive={updateActive}
                    bill={bill}
                    taxConfig={taxConfig}
                    cartPayload={cartPayload}
                    processing={processing}
                    onConfirm={createOrder}
                    onClose={() => setShowCheckout(false)}
                />
            )}
            {showReport && <DayReportModal onClose={() => setShowReport(false)} />}
            {showHelp && <ShortcutsHelp onClose={() => setShowHelp(false)} />}
            {variantPickerProduct && (
                <VariantPickerModal
                    product={variantPickerProduct}
                    onClose={() => setVariantPickerProduct(null)}
                    onConfirm={(variant, quantity) => {
                        addToCart(variantPickerProduct, variant, quantity);
                        setVariantPickerProduct(null);
                    }}
                />
            )}

            {lastSale && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 print:bg-transparent print:p-0 print:block">
                    <div className="bg-card rounded-2xl max-h-[90vh] overflow-y-auto print:overflow-visible print:max-h-none print:rounded-none">
                        <div className="p-4 border-b border-border flex items-center justify-between gap-6 print:hidden">
                            <div>
                                <p className="font-bold text-lg">Sale complete</p>
                                <p className="text-sm text-muted-foreground">
                                    {lastSale.order.billNumber || ""} ·{" "}
                                    {money(lastSale.order.totalAmount)}
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
                                    onClick={() => {
                                        setLastSale(null);
                                        scanInputRef.current?.focus();
                                    }}
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
