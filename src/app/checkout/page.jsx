"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { MapPin, CreditCard, Tag, ChevronDown, ChevronUp, Plus, Truck, ArrowRight, ShieldCheck, FileText, Lock, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CheckoutPage() {
    const { isAuthenticated, user, loading: userLoading } = useUser();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [cart, setCart] = useState(null);
    const [settings, setSettings] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [useNewAddress, setUseNewAddress] = useState(false);
    const [saveAddress, setSaveAddress] = useState(false);
    const [showOrderDetails, setShowOrderDetails] = useState(false);

    // Coupon state
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [couponError, setCouponError] = useState("");
    const [applyingCoupon, setApplyingCoupon] = useState(false);

    // Shipping fee state
    const [shippingFee, setShippingFee] = useState(0);
    const [shippingMessage, setShippingMessage] = useState("");
    const [isFreeShipping, setIsFreeShipping] = useState(false);

    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
        paymentMethod: "cod",
        notes: ""
    });

    useEffect(() => {
        if (!userLoading && !isAuthenticated) {
            router.push("/login");
        } else if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated, userLoading]);

    const fetchData = async () => {
        try {
            const [cartRes, settingsRes, addressesRes, couponsRes] = await Promise.all([
                fetch("/api/cart", { credentials: "include" }),
                fetch("/api/settings", { credentials: "include" }),
                fetch("/api/addresses", { credentials: "include" }),
                fetch("/api/coupons", { credentials: "include" })
            ]);

            const [cartData, settingsData, addressesData, couponsData] = await Promise.all([
                cartRes.json(),
                settingsRes.json(),
                addressesRes.json(),
                couponsRes.json()
            ]);

            if (cartData.success) {
                setCart(cartData.cart);
                if (cartData.cart.items.length === 0) {
                    router.push("/cart");
                }
            }

            if (settingsData.success) {
                setSettings(settingsData._fullSettings);
                if (settingsData._fullSettings.payment.cod.isEnabled) {
                    setFormData(prev => ({ ...prev, paymentMethod: "cod" }));
                } else if (settingsData._fullSettings.payment.razorpay.isEnabled) {
                    setFormData(prev => ({ ...prev, paymentMethod: "razorpay" }));
                } else if (settingsData._fullSettings.payment.stripe.isEnabled) {
                    setFormData(prev => ({ ...prev, paymentMethod: "stripe" }));
                }
            }

            if (addressesData.success && addressesData.addresses.length > 0) {
                setAddresses(addressesData.addresses);
                const defaultAddr = addressesData.addresses.find(a => a.isDefault) || addressesData.addresses[0];
                setSelectedAddressId(defaultAddr._id);
                setFormData(prev => ({
                    ...prev,
                    fullName: defaultAddr.fullName,
                    phone: defaultAddr.phone,
                    addressLine1: defaultAddr.addressLine1,
                    addressLine2: defaultAddr.addressLine2 || "",
                    city: defaultAddr.city,
                    state: defaultAddr.state,
                    pincode: defaultAddr.pincode,
                    country: defaultAddr.country
                }));
            } else {
                setUseNewAddress(true);
                if (user) {
                    setFormData(prev => ({
                        ...prev,
                        fullName: user.name || "",
                        phone: user.phone || ""
                    }));
                }
            }

            if (couponsData.success) {
                setAvailableCoupons(couponsData.coupons || []);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchShippingRates = async (pincode, cartTotal) => {
        if (!pincode || pincode.length !== 6) return;
        try {
            const res = await fetch("/api/shipping/rates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pincode, cartTotal })
            });
            const data = await res.json();
            if (data.success) {
                setShippingFee(data.fee || 0);
                setIsFreeShipping(data.isFree || false);
                setShippingMessage(data.message || "");
            }
        } catch (error) {
            console.error("Failed to fetch shipping rates:", error);
        }
    };

    useEffect(() => {
        if (formData.pincode && cart?.total) {
            const cartTotal = cart.total - discountAmount;
            fetchShippingRates(formData.pincode, cartTotal);
        }
    }, [formData.pincode, cart?.total, discountAmount]);

    const handleAddressSelect = (addressId) => {
        setSelectedAddressId(addressId);
        setUseNewAddress(false);
        const address = addresses.find(a => a._id === addressId);
        if (address) {
            setFormData(prev => ({
                ...prev,
                fullName: address.fullName,
                phone: address.phone,
                addressLine1: address.addressLine1,
                addressLine2: address.addressLine2 || "",
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                country: address.country
            }));
        }
    };

    const handleApplyCoupon = async (code = couponCode) => {
        if (!code.trim()) return;
        setApplyingCoupon(true);
        setCouponError("");
        try {
            const cartItems = cart.items.map(item => ({
                productId: item.product._id,
                product: item.product,
                quantity: item.quantity,
                priceAtOrder: item.variant?.price || (item.subtotal / item.quantity) || 0
            }));

            const res = await fetch("/api/coupons/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    code: code.trim(),
                    cartItems,
                    cartTotal: cart.total
                })
            });

            const data = await res.json();
            if (data.success) {
                setAppliedCoupon(data.coupon);
                setDiscountAmount(data.discountAmount);
                setCouponCode(data.coupon.code);
                setCouponError("");
            } else {
                setCouponError(data.message || "Invalid coupon");
                setAppliedCoupon(null);
                setDiscountAmount(0);
            }
        } catch (error) {
            console.error("Apply coupon error:", error);
            setCouponError("Failed to apply coupon");
        } finally {
            setApplyingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponCode("");
        setCouponError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);

            if (saveAddress && useNewAddress) {
                await fetch("/api/addresses", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        label: "Home",
                        fullName: formData.fullName,
                        phone: formData.phone,
                        addressLine1: formData.addressLine1,
                        addressLine2: formData.addressLine2,
                        city: formData.city,
                        state: formData.state,
                        pincode: formData.pincode,
                        country: formData.country,
                        isDefault: addresses.length === 0
                    })
                });
            }

            const orderRes = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    shippingAddress: {
                        fullName: formData.fullName,
                        phone: formData.phone,
                        addressLine1: formData.addressLine1,
                        addressLine2: formData.addressLine2,
                        city: formData.city,
                        state: formData.state,
                        pincode: formData.pincode,
                        country: formData.country
                    },
                    paymentMethod: formData.paymentMethod,
                    notes: formData.notes,
                    couponCode: appliedCoupon?.code || "",
                    shippingFee: shippingFee
                }),
            });

            const orderData = await orderRes.json();
            if (!orderData.success) {
                toast.error(orderData.message || "Failed to create order");
                setSubmitting(false);
                return;
            }

            const order = orderData.order;

            if (formData.paymentMethod === "cod") {
                toast.success("Order placed successfully!");
                router.push(`/orders/${order._id}`);
            } else if (formData.paymentMethod === "razorpay") {
                await handleRazorpayPayment(order);
            } else if (formData.paymentMethod === "stripe") {
                await handleStripePayment(order);
            }
        } catch (error) {
            console.error("Order error:", error);
            toast.error("Failed to place order");
            setSubmitting(false);
        }
    };

    const handleRazorpayPayment = async (order) => {
        try {
            const res = await fetch("/api/payment/razorpay/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ orderId: order._id })
            });

            const data = await res.json();
            if (!data.success) {
                toast.error(data.message || "Failed to initiate payment");
                setSubmitting(false);
                return;
            }

            if (!window.Razorpay) {
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.async = true;
                document.body.appendChild(script);
                await new Promise((resolve) => { script.onload = resolve; });
            }

            const options = {
                key: data.keyId,
                amount: data.amount * 100,
                currency: data.currency,
                name: data.name,
                description: `Order #${order._id}`,
                order_id: data.razorpayOrderId,
                handler: async function (response) {
                    const verifyRes = await fetch("/api/payment/razorpay/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({
                            orderId: order._id,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature
                        })
                    });
                    const verifyData = await verifyRes.json();
                    if (verifyData.success) {
                        toast.success("Payment successful!");
                        router.push(`/orders/${order._id}`);
                    } else {
                        toast.error("Payment verification failed!");
                        setSubmitting(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        toast.error("Payment cancelled");
                        setSubmitting(false);
                    }
                },
                prefill: {
                    name: formData.fullName,
                    contact: formData.phone,
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error("Razorpay error:", error);
            toast.error("Payment failed");
            setSubmitting(false);
        }
    };

    const handleStripePayment = async () => {
        toast.error("Stripe payment integration is pending. Please use COD or Razorpay for now.");
        setSubmitting(false);
    };

    if (userLoading || loading) {
        return (
            <div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-[var(--c-primary)]/30 border-t-[var(--c-primary)] rounded-full animate-spin"></div>
            </div>
        );
    }

    const availablePayments = [];
    if (settings?.payment.cod.isEnabled) availablePayments.push({ value: "cod", label: "Cash on Delivery", icon: "💵" });
    if (settings?.payment.razorpay.isEnabled) availablePayments.push({ value: "razorpay", label: "Razorpay", icon: "💳" });
    if (settings?.payment.stripe.isEnabled) availablePayments.push({ value: "stripe", label: "Stripe", icon: "💳" });

    const finalTotal = cart?.total - discountAmount;

    // Premium Input Class
    const inputClass = "w-full border border-[var(--c-border)] bg-white px-4 py-3 text-sm focus:border-[var(--c-primary)] focus:outline-none transition-colors rounded-xl placeholder:text-[var(--c-text-muted)]/60 focus:ring-0";
    
    // Label Class
    const labelClass = "block text-[10px] uppercase tracking-widest font-bold text-[var(--c-text)] mb-2 mt-4 ml-1";
    const sectionTitleClass = "font-serif text-[28px] lg:text-[34px] font-bold text-[var(--c-text)] border-b border-[var(--c-border)] pb-6 mb-8 flex items-center justify-between";

    return (
        <main className="min-h-screen bg-[var(--c-bg)] pb-28 lg:pb-12">
            
            {/* Desktop Header */}
            <div className="bg-white border-b border-[var(--c-border)] py-10">
                <div className="container mx-auto px-4 xl:px-8 max-w-7xl text-center">
                    <div className="inline-flex items-center gap-2 mb-3 justify-center">
                        <ShieldCheck className="w-4 h-4 text-[var(--c-primary)]" />
                        <span className="text-[var(--c-text-muted)] text-xs font-semibold">Secure Checkout</span>
                    </div>
                    <h1 className="font-serif text-[32px] font-bold text-[var(--c-text)] mb-1">Complete Your Order</h1>
                    <p className="text-[var(--c-text-muted)] text-sm">
                        {cart?.itemCount || 0} item{(cart?.itemCount || 0) !== 1 ? "s" : ""} in your cart
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 xl:px-8 max-w-7xl py-8 lg:py-12">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    
                    {/* Left Column - Steps */}
                    <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-10">

                        {/* ======================================= */}
                        {/* 1. SHIPPING ADDRESS                     */}
                        {/* ======================================= */}
                        <section>
                            <h2 className={sectionTitleClass}>
                                Delivery Details
                                <span className="text-xs font-serif italic text-[var(--c-primary)] font-normal lowercase tracking-normal">Step 01 of 03</span>
                            </h2>

                            {/* Saved Addresses */}
                            {addresses.length > 0 && !useNewAddress && (
                                <div className="grid grid-cols-1 gap-4 mb-8">
                                    {addresses.map((address) => (
                                        <motion.label
                                            key={address._id}
                                            whileHover={{ y: -2 }}
                                            className={`block p-6 border rounded-3xl transition-all duration-500 cursor-pointer relative overflow-hidden ${
                                                selectedAddressId === address._id
                                                ? 'border-[var(--c-primary)] bg-[var(--c-accent-soft)]/30 shadow-xl shadow-black/5'
                                                : 'border-[var(--c-border)] hover:border-[var(--c-primary)]/40 bg-white'
                                            }`}
                                        >
                                            {selectedAddressId === address._id && (
                                                <motion.div 
                                                    layoutId="activeAddress"
                                                    className="absolute top-0 right-0 w-2 h-full bg-[var(--c-primary)]" 
                                                />
                                            )}
                                            <div className="flex items-start gap-5">
                                                <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                    selectedAddressId === address._id ? 'border-[var(--c-primary)]' : 'border-[var(--c-border)]'
                                                }`}>
                                                    {selectedAddressId === address._id && <div className="w-2.5 h-2.5 rounded-full bg-[var(--c-primary)]" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-4 mb-3">
                                                        <span className="font-serif text-lg font-bold text-[var(--c-text)]">{address.label}</span>
                                                        {address.isDefault && (
                                                            <span className="text-[9px] bg-[var(--c-primary)] text-white uppercase tracking-widest font-bold px-3 py-1 rounded-full">
                                                                Primary
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[14px] font-bold text-[var(--c-text)] mb-1.5">
                                                        {address.fullName} <span className="text-[var(--c-primary)] mx-2">|</span> {address.phone}
                                                    </p>
                                                    <p className="text-[14px] text-[var(--c-text-muted)] leading-relaxed max-w-sm font-medium">
                                                        {address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}, <br/>
                                                        {address.city}, {address.state} — {address.pincode}
                                                    </p>
                                                </div>
                                                {selectedAddressId === address._id && (
                                                    <CheckCircle2 className="w-6 h-6 text-[var(--c-primary)] opacity-40 shrink-0" />
                                                )}
                                            </div>
                                            <input
                                                type="radio"
                                                name="address"
                                                className="hidden"
                                                checked={selectedAddressId === address._id}
                                                onChange={() => handleAddressSelect(address._id)}
                                            />
                                        </motion.label>
                                    ))}
                                    
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUseNewAddress(true);
                                            setSelectedAddressId(null);
                                            setFormData(prev => ({
                                                ...prev,
                                                fullName: user?.name || "",
                                                phone: user?.phone || "",
                                                addressLine1: "", addressLine2: "",
                                                city: "", state: "", pincode: "",
                                                country: "India"
                                            }));
                                        }}
                                        className="text-xs font-semibold text-[var(--c-text)] border border-[var(--c-border)] px-5 py-2.5 rounded-xl hover:border-[var(--c-primary)] hover:bg-[var(--c-accent-soft)] transition-colors w-max flex items-center gap-2"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Add New Address
                                    </button>
                                </div>
                            )}

                            {/* New Address Form */}
                            {(useNewAddress || addresses.length === 0) && (
                                <div className="bg-white p-6 lg:p-8 border border-[var(--c-border)] rounded-2xl">
                                    {addresses.length > 0 && (
                                        <div className="mb-6 pb-6 border-b border-border">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setUseNewAddress(false);
                                                    if (addresses.length > 0) handleAddressSelect(addresses[0]._id);
                                                }}
                                                className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
                                            >
                                                <span>←</span> Cancel
                                            </button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                                        <div className="sm:col-span-2">
                                            <label className={labelClass}>Full Name *</label>
                                            <input type="text" required value={formData.fullName}
                                                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                                className={inputClass} placeholder="John Doe" />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className={labelClass}>Mobile Number *</label>
                                            <input type="tel" required value={formData.phone}
                                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                                className={inputClass} placeholder="10-digit number" />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className={labelClass}>Address Line 1 *</label>
                                            <input type="text" required value={formData.addressLine1}
                                                onChange={(e) => setFormData(prev => ({ ...prev, addressLine1: e.target.value }))}
                                                className={inputClass} placeholder="Flat, House no., Building, Company" />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className={labelClass}>Address Line 2 <span className="text-[10px] normal-case opacity-60">(optional)</span></label>
                                            <input type="text" value={formData.addressLine2}
                                                onChange={(e) => setFormData(prev => ({ ...prev, addressLine2: e.target.value }))}
                                                className={inputClass} placeholder="Area, Colony, Street, Sector, Village" />
                                        </div>
                                        
                                        <div>
                                            <label className={labelClass}>City *</label>
                                            <input type="text" required value={formData.city}
                                                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                                className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>State *</label>
                                            <input type="text" required value={formData.state}
                                                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                                                className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Pincode *</label>
                                            <input type="text" required value={formData.pincode}
                                                onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                                                className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Country *</label>
                                            <input type="text" required value={formData.country} disabled
                                                onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                                                className={`${inputClass} text-muted-foreground bg-transparent`} />
                                        </div>
                                    </div>
                                    
                                    <label className="flex items-center gap-3 cursor-pointer mt-8 pt-6 border-t border-border w-max">
                                        <input type="checkbox" checked={saveAddress}
                                            onChange={(e) => setSaveAddress(e.target.checked)}
                                            className="w-4 h-4 accent-foreground" />
                                        <span className="text-xs uppercase tracking-widest font-semibold text-foreground">Save to Address Book</span>
                                    </label>
                                </div>
                            )}
                        </section>


                        {/* ======================================= */}
                        {/* 2. PAYMENT METHODS                      */}
                        {/* ======================================= */}
                        <section>
                            <h2 className={sectionTitleClass}>
                                Payment Method
                                <span className="text-xs font-serif italic text-[var(--c-primary)] font-normal lowercase tracking-normal">Step 02 of 03</span>
                            </h2>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {availablePayments.map((payment) => (
                                    <motion.label key={payment.value}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`flex flex-col items-center justify-center gap-3 p-8 border rounded-3xl cursor-pointer transition-all duration-500 text-center ${
                                            formData.paymentMethod === payment.value
                                            ? 'border-[var(--c-primary)] bg-[var(--c-accent-soft)]/50 shadow-lg shadow-black/5'
                                            : 'border-[var(--c-border)] hover:border-[var(--c-primary)]/40 bg-white'
                                        }`}
                                    >
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500 ${
                                            formData.paymentMethod === payment.value ? 'bg-[var(--c-primary)] text-white rotate-12' : 'bg-[var(--c-surface-alt)] text-[var(--c-text)] group-hover:rotate-0'
                                        }`}>
                                            {payment.value === "cod" ? <MapPin className="w-7 h-7" /> : <CreditCard className="w-7 h-7" />}
                                        </div>
                                        <div>
                                            <span className="font-serif text-[17px] font-bold text-[var(--c-text)] block mb-1">{payment.label}</span>
                                            <span className="text-[10px] text-[var(--c-text-muted)] uppercase tracking-widest font-bold">
                                                {payment.value === "cod" ? "Pay at Door" : "Instant Secure"}
                                            </span>
                                        </div>
                                        <input type="radio" name="paymentMethod" value={payment.value}
                                            className="hidden"
                                            checked={formData.paymentMethod === payment.value}
                                            onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                        />
                                    </motion.label>
                                ))}
                            </div>

                            {availablePayments.length === 0 && (
                                <div className="border border-destructive/20 bg-destructive/5 text-destructive p-4 text-sm flex items-center gap-2">
                                    Our payment gateways are currently undergoing maintenance. Please contact support.
                                </div>
                            )}
                        </section>


                        {/* ======================================= */}
                        {/* 3. ORDER NOTES (Optional)               */}
                        {/* ======================================= */}
                        <section>
                            <h2 className={sectionTitleClass}>Special Instructions</h2>
                            <textarea value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                rows={2} maxLength={500}
                                placeholder="Any gift wrapping requests or delivery tips..."
                                className={`${inputClass} border border-[var(--c-border)] p-4 bg-white resize-none focus:border-[var(--c-primary)] w-full block rounded-xl`} />
                        </section>

                    </div>


                    {/* ======================================= */}
                    {/* RIGHT COLUMN - ORDER SUMMARY            */}
                    {/* ======================================= */}
                    <div className="lg:col-span-5 xl:col-span-4">
                        
                        {/* Sticky Desktop Panel */}
                        <div className="hidden lg:block bg-white border border-[var(--c-border)] rounded-2xl p-8 sticky top-8 shadow-[0_2px_15px_-5px_rgba(0,0,0,0.04)]">
                            <h3 className="font-serif text-2xl font-bold text-[var(--c-text)] mb-8 pb-4 border-b border-[var(--c-border)]">Order Summary</h3>

                            {/* Products */}
                            <div className="space-y-6 mb-10 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                {cart?.items.map((item) => (
                                    <div key={item._id} className="flex gap-5 group">
                                        <div className="w-20 h-24 bg-[var(--c-surface-alt)] border border-[var(--c-border)] shrink-0 rounded-2xl overflow-hidden relative">
                                            {item.product.images?.[0] && (
                                                <img src={item.product.images[0]} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            )}
                                            <div className="absolute top-1 right-1 bg-white text-[var(--c-text)] text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                                                {item.quantity}
                                            </div>
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center min-w-0">
                                            <p className="font-serif text-lg font-bold truncate text-[var(--c-text)]">{item.product.name}</p>
                                            <p className="text-[11px] uppercase tracking-widest font-bold text-[var(--c-primary)] mt-1">Artisanal Choice</p>
                                            <p className="text-[16px] font-bold mt-2 text-[var(--c-text)]">₹{item.subtotal}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Applied Coupon / Input */}
                            <div className="mb-8 pt-4">
                                {appliedCoupon ? (
                                    <div className="flex items-center justify-between border border-[var(--c-primary)]/30 bg-[var(--c-accent-soft)] p-4 rounded-xl">
                                        <div>
                                            <p className="font-semibold text-[13px] text-[#647345] flex items-center gap-1.5"><Tag className="w-3.5 h-3.5"/> {appliedCoupon.code}</p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">{appliedCoupon.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-sm text-[#647345]">-₹{discountAmount}</p>
                                            <button type="button" onClick={handleRemoveCoupon} className="text-[10px] text-muted-foreground hover:text-foreground tracking-widest uppercase mt-1 transition-colors">Remove</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            placeholder="PROMO CODE" className="w-full border border-[var(--c-border)] bg-white px-4 py-3.5 pr-20 text-sm font-mono rounded-xl focus:border-[var(--c-primary)] outline-none transition-colors" />
                                        <button type="button" onClick={() => handleApplyCoupon()} disabled={applyingCoupon || !couponCode.trim()}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-widest font-semibold px-3 py-1.5 text-foreground hover:bg-secondary transition-colors disabled:opacity-50">
                                            {applyingCoupon ? "Wait" : "Apply"}
                                        </button>
                                    </div>
                                )}
                                {couponError && <p className="text-[11px] text-destructive mt-2 pl-1">{couponError}</p>}
                            </div>

                            {/* Totals Calculation */}
                            <div className="space-y-3 pt-6 border-t border-border font-light text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>₹{cart?.total}</span>
                                </div>
                                
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-accent font-medium">
                                        <span>Discount</span>
                                        <span>-₹{discountAmount}</span>
                                    </div>
                                )}
                                
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Shipping</span>
                                    {isFreeShipping ? (
                                        <span className="uppercase text-[11px] tracking-widest font-semibold text-accent" >Complimentary</span>
                                    ) : shippingFee > 0 ? (
                                        <span>₹{shippingFee}</span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Calculated with Pincode</span>
                                    )}
                                </div>

                                <div className="flex justify-between items-baseline pt-4 mt-4 border-t border-border">
                                    <span className="font-semibold uppercase tracking-widest text-xs">Total</span>
                                    <span className="font-serif text-3xl font-semibold">₹{finalTotal + shippingFee}</span>
                                </div>
                            </div>

                            <button type="submit" disabled={submitting || availablePayments.length === 0}
                                className="w-full bg-[var(--c-text)] hover:bg-black text-white mt-8 py-5 rounded-2xl font-bold transition-all hover:shadow-2xl hover:-translate-y-1 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-black/10">
                                <Lock className="w-4 h-4 text-[var(--c-primary)]" />
                                {submitting ? "Securing Order..." : "Finalize Order"}
                                {!submitting && <ArrowRight className="w-4 h-4 ml-1"/>}
                            </button>
                            
                            <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mt-4">
                                Guaranteed Secure Checkout
                            </p>
                        </div>

                    </div>
                    
                    
                    {/* Mobile Checkout Fixed Strip */}
                    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border shadow-[0_-5px_30px_-15px_rgba(0,0,0,0.1)] pb-safe-bottom">
                        {/* Details drop-up */}
                        <div className={`overflow-hidden transition-all duration-300 border-b border-border bg-secondary/50 ${showOrderDetails ? 'max-h-64 pt-6 pb-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="px-6 space-y-3 max-h-48 overflow-y-auto">
                                {cart?.items.map((item) => (
                                    <div key={item._id} className="flex justify-between items-center text-sm font-light">
                                        <span className="truncate pr-4 leading-tight">{item.product.name} <span className="text-xs opacity-50">× {item.quantity}</span></span>
                                        <span className="font-medium shrink-0">₹{item.subtotal}</span>
                                    </div>
                                ))}
                                <div className="border-t border-border/50 pt-2 space-y-2 mt-2">
                                     {discountAmount > 0 && <div className="flex justify-between text-xs text-accent"><span>Promo Discount</span><span>-₹{discountAmount}</span></div>}
                                     <div className="flex justify-between text-xs"><span className="text-muted-foreground">Shipping</span><span>{isFreeShipping ? "Free" : shippingFee > 0 ? `₹${shippingFee}` : "TBD"}</span></div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Main Strip */}
                        <div className="px-5 py-4 flex items-center justify-between">
                            <div className="flex flex-col cursor-pointer" onClick={() => setShowOrderDetails(!showOrderDetails)}>
                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1">
                                    Total {showOrderDetails ? <ChevronDown className="w-3 h-3"/> : <ChevronUp className="w-3 h-3"/>}
                                </span>
                                <span className="text-xl font-serif text-foreground font-semibold leading-none mt-1">
                                    ₹{finalTotal + shippingFee}
                                </span>
                            </div>
                            <button type="submit" disabled={submitting || availablePayments.length === 0}
                                className="bg-[var(--c-primary)] text-white px-6 py-3.5 rounded-xl text-sm font-semibold hover:bg-[var(--c-primary-dark)] transition-colors disabled:opacity-50 flex items-center gap-2">
                                {submitting ? "..." : "Pay Now"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </main>
    );
}
