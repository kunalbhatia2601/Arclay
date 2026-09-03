"use client";

import { useEffect, useRef, useState } from "react";
import {
    X,
    Tag,
    UserCheck,
    Banknote,
    CreditCard,
    Smartphone,
    Receipt as ReceiptIcon,
} from "lucide-react";
import { toast } from "react-toastify";
import UpiQr from "@/app/components/pos/UpiQr";

const PAYMENT_METHODS = [
    { key: "cash", label: "Cash", Icon: Banknote },
    { key: "card", label: "Card", Icon: CreditCard },
    { key: "upi", label: "UPI", Icon: Smartphone },
];
const QUICK_TENDER = [100, 200, 500, 2000];

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

/**
 * Everything that is not the cart: who is buying, what comes off the price, how
 * they are paying. Opened from Complete Sale so the till screen itself stays a
 * clean list of items.
 */
export default function CheckoutModal({
    ticket,
    updateActive,
    bill,
    taxConfig,
    cartPayload,
    onConfirm,
    onClose,
    processing,
    storeInfo = {},
}) {
    const [couponInput, setCouponInput] = useState("");
    const [applyingCoupon, setApplyingCoupon] = useState(false);

    const [matches, setMatches] = useState([]);
    const [showList, setShowList] = useState(false);
    const [highlighted, setHighlighted] = useState(0);
    const [picked, setPicked] = useState(false);
    const [knownCustomer, setKnownCustomer] = useState(null);
    const [lookingUp, setLookingUp] = useState(false);

    const phoneRef = useRef(null);

    useEffect(() => {
        phoneRef.current?.focus();
    }, []);

    const tenderedValue = parseFloat(ticket.tendered);
    const changeDue =
        ticket.paymentMethod === "cash" && ticket.tendered !== "" && !Number.isNaN(tenderedValue)
            ? tenderedValue - bill.total
            : null;

    const canConfirm = !processing && !(changeDue != null && changeDue < 0);

    // F9 confirms from anywhere in the dialog; Esc backs out.
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "F9") {
                e.preventDefault();
                e.stopPropagation();
                if (canConfirm) onConfirm();
            } else if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", onKey, true);
        return () => window.removeEventListener("keydown", onKey, true);
    }, [canConfirm, onConfirm, onClose]);

    // ---------- customer typeahead ----------
    // From 4 characters on, match customers whose number contains what was
    // typed. Debounced so it is one request per pause, not per keystroke.
    useEffect(() => {
        const phone = (ticket.customerInfo.phone || "").trim();

        if (phone.length < 4 || picked) {
            setMatches([]);
            setShowList(false);
            return;
        }

        let cancelled = false;
        setLookingUp(true);

        const timer = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/api/admin/customers?phoneSearch=${encodeURIComponent(phone)}`,
                    { credentials: "include" }
                );
                const data = await res.json();
                if (cancelled) return;

                const found = data.success ? data.customers || [] : [];
                setMatches(found);
                setShowList(found.length > 0);
                setHighlighted(0);
                setKnownCustomer(found.find((c) => c.phone === phone) || null);
            } catch (err) {
                console.error("Customer lookup failed:", err);
            } finally {
                if (!cancelled) setLookingUp(false);
            }
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [ticket.customerInfo.phone, picked]);

    const selectCustomer = (customer) => {
        setPicked(true);
        updateActive({ customerInfo: { name: customer.name || "", phone: customer.phone } });
        setKnownCustomer(customer);
        setShowList(false);
        setMatches([]);
    };

    const onPhoneKeyDown = (e) => {
        if (!showList || matches.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlighted((i) => (i + 1) % matches.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlighted((i) => (i - 1 + matches.length) % matches.length);
        } else if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            selectCustomer(matches[highlighted]);
        } else if (e.key === "Escape") {
            e.stopPropagation();
            setShowList(false);
        }
    };

    // ---------- coupon ----------
    const applyCoupon = async () => {
        const code = couponInput.trim().toUpperCase();
        if (!code) return;

        setApplyingCoupon(true);
        try {
            const res = await fetch("/api/admin/pos/coupon", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    code,
                    items: cartPayload(),
                    phone: ticket.customerInfo.phone || "",
                }),
            });
            const data = await res.json();

            if (data.success) {
                updateActive({ couponCode: code, couponDiscount: data.discountAmount });
                toast.success(`${code} applied — ${money(data.discountAmount)} off`);
            } else {
                toast.error(data.message || "Coupon could not be applied");
            }
        } catch (err) {
            console.error("Coupon error:", err);
            toast.error("Coupon check failed");
        } finally {
            setApplyingCoupon(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <div>
                        <h2 className="font-serif text-2xl font-bold">Complete Sale</h2>
                        <p className="text-sm text-muted-foreground">
                            {ticket.label} · {bill.totalItems} item
                            {bill.totalItems === 1 ? "" : "s"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg border border-border hover:bg-muted"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Customer */}
                    <section className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Customer
                        </h3>

                        <div className="relative">
                            <input
                                ref={phoneRef}
                                type="tel"
                                value={ticket.customerInfo.phone || ""}
                                onChange={(e) => {
                                    setPicked(false);
                                    updateActive((t) => ({
                                        customerInfo: { ...t.customerInfo, phone: e.target.value },
                                    }));
                                }}
                                onKeyDown={onPhoneKeyDown}
                                onFocus={() => {
                                    if (matches.length > 0) setShowList(true);
                                }}
                                // Delayed so a click on a suggestion lands before the list closes
                                onBlur={() => setTimeout(() => setShowList(false), 150)}
                                placeholder="Phone number (optional)"
                                autoComplete="off"
                                className="w-full px-4 py-3 rounded-xl border border-input bg-background"
                            />
                            {lookingUp && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            )}

                            {showList && matches.length > 0 && (
                                <ul className="absolute z-20 top-full mt-1 w-full max-h-52 overflow-y-auto bg-card border border-border rounded-xl shadow-lg py-1">
                                    {matches.map((customer, index) => (
                                        <li key={customer._id}>
                                            <button
                                                type="button"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => selectCustomer(customer)}
                                                onMouseEnter={() => setHighlighted(index)}
                                                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-3 ${
                                                    index === highlighted ? "bg-muted" : ""
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
                            value={ticket.customerInfo.name || ""}
                            onChange={(e) =>
                                updateActive((t) => ({
                                    customerInfo: { ...t.customerInfo, name: e.target.value },
                                }))
                            }
                            placeholder="Customer name (optional)"
                            className="w-full px-4 py-3 rounded-xl border border-input bg-background"
                        />

                        {knownCustomer && (
                            <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                                <UserCheck className="w-4 h-4 shrink-0" />
                                <span>
                                    Returning · {knownCustomer.totalOrders} order
                                    {knownCustomer.totalOrders === 1 ? "" : "s"} · ₹
                                    {Number(knownCustomer.totalSpent || 0).toLocaleString("en-IN")} spent
                                </span>
                            </div>
                        )}
                    </section>

                    {/* Discounts */}
                    <section className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Discounts
                        </h3>

                        {ticket.couponCode ? (
                            <div className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-primary/10 border border-primary/30">
                                <span className="flex items-center gap-2 font-medium text-primary">
                                    <Tag className="w-4 h-4" />
                                    {ticket.couponCode}
                                </span>
                                <span className="font-medium text-primary">
                                    -{money(bill.couponDiscount)}
                                </span>
                                <button
                                    onClick={() => {
                                        updateActive({ couponCode: "", couponDiscount: 0 });
                                        setCouponInput("");
                                    }}
                                    className="p-1 text-muted-foreground hover:text-destructive"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={couponInput}
                                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            applyCoupon();
                                        }
                                    }}
                                    placeholder="Coupon code"
                                    className="flex-1 px-4 py-3 rounded-xl border border-input bg-background font-mono"
                                />
                                <button
                                    onClick={applyCoupon}
                                    disabled={applyingCoupon || !couponInput.trim()}
                                    className="px-5 rounded-xl border border-border hover:bg-muted font-medium disabled:opacity-50"
                                >
                                    {applyingCoupon ? "…" : "Apply"}
                                </button>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <div className="flex rounded-xl border border-border overflow-hidden">
                                {["flat", "percent"].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => updateActive({ discountType: type })}
                                        className={`px-4 ${
                                            ticket.discountType === type
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
                                value={ticket.discountValue || ""}
                                onChange={(e) => updateActive({ discountValue: e.target.value })}
                                placeholder="Bill discount"
                                className="flex-1 px-4 py-3 rounded-xl border border-input bg-background"
                            />
                            {bill.billDiscount > 0 && (
                                <span className="self-center text-destructive font-medium whitespace-nowrap">
                                    -{money(bill.billDiscount)}
                                </span>
                            )}
                        </div>
                    </section>

                    {/* Payment */}
                    <section className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Payment
                        </h3>

                        <div className="flex gap-2">
                            {PAYMENT_METHODS.map(({ key, label, Icon }) => (
                                <button
                                    key={key}
                                    onClick={() => updateActive({ paymentMethod: key })}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-colors ${
                                        ticket.paymentMethod === key
                                            ? "border-primary bg-primary/10 text-primary font-medium"
                                            : "border-border text-muted-foreground hover:bg-muted"
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </button>
                            ))}
                        </div>

                        {ticket.paymentMethod === "upi" && (
                            <div className="pt-1">
                                <UpiQr
                                    upiId={storeInfo.upiId}
                                    payeeName={storeInfo.upiName || storeInfo.legalName || storeInfo.name}
                                    amount={bill.total}
                                    note={ticket.label || "POS sale"}
                                />
                            </div>
                        )}

                        {ticket.paymentMethod === "cash" && (
                            <div className="space-y-2 pt-1">
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        value={ticket.tendered || ""}
                                        onChange={(e) => updateActive({ tendered: e.target.value })}
                                        placeholder="Cash received"
                                        className="flex-1 px-4 py-3 rounded-xl border border-input bg-background"
                                    />
                                    <button
                                        onClick={() => updateActive({ tendered: String(bill.total) })}
                                        className="px-4 rounded-xl border border-border hover:bg-muted text-sm font-medium"
                                    >
                                        Exact
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    {QUICK_TENDER.map((note) => (
                                        <button
                                            key={note}
                                            onClick={() =>
                                                updateActive((t) => ({
                                                    tendered: String((parseFloat(t.tendered) || 0) + note),
                                                }))
                                            }
                                            className="flex-1 py-2 rounded-lg border border-border hover:bg-muted text-sm"
                                        >
                                            +{note}
                                        </button>
                                    ))}
                                </div>
                                {changeDue != null && (
                                    <div
                                        className={`px-4 py-3 rounded-xl font-bold flex justify-between ${
                                            changeDue < 0
                                                ? "bg-destructive/10 text-destructive"
                                                : "bg-emerald-50 text-emerald-700"
                                        }`}
                                    >
                                        <span>{changeDue < 0 ? "Short by" : "Change due"}</span>
                                        <span>{money(Math.abs(changeDue))}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </div>

                {/* Totals + confirm */}
                <div className="px-5 py-4 border-t border-border bg-muted/30 space-y-1">
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
                    {taxConfig.taxEnabled &&
                        bill.taxBreakup.map((slab) => (
                            <div
                                key={slab.rate}
                                className="flex justify-between text-xs text-muted-foreground"
                            >
                                <span>
                                    GST {slab.rate}% {taxConfig.priceIncludesTax ? "(incl.)" : ""}
                                </span>
                                <span>{money(slab.tax)}</span>
                            </div>
                        ))}

                    <div className="flex justify-between items-center pt-2 mt-1 border-t border-border">
                        <span className="text-lg font-bold">Total</span>
                        <span className="text-3xl font-bold text-primary">{money(bill.total)}</span>
                    </div>

                    <button
                        onClick={onConfirm}
                        disabled={!canConfirm}
                        className="w-full mt-3 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {processing ? (
                            <>
                                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <ReceiptIcon className="w-5 h-5" />
                                Confirm &amp; Pay {money(bill.total)}
                                <kbd className="ml-1 text-xs opacity-70 font-normal">F9</kbd>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
