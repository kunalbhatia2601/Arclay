"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
            const [cartRes, settingsRes, addressesRes] = await Promise.all([
                fetch("/api/cart", { credentials: "include" }),
                fetch("/api/settings", { credentials: "include" }),
                fetch("/api/addresses", { credentials: "include" })
            ]);

            const [cartData, settingsData, addressesData] = await Promise.all([
                cartRes.json(),
                settingsRes.json(),
                addressesRes.json()
            ]);

            if (cartData.success) {
                setCart(cartData.cart);
                if (cartData.cart.items.length === 0) {
                    router.push("/cart");
                }
            }

            if (settingsData.success) {
                setSettings(settingsData._fullSettings);
                // Set default payment method to first available
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
                // Auto-select default address or first address
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
                // No saved addresses, use new address mode
                setUseNewAddress(true);
                // Pre-fill user data
                if (user) {
                    setFormData(prev => ({
                        ...prev,
                        fullName: user.name || "",
                        phone: user.phone || ""
                    }));
                }
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSubmitting(true);

            // Save address if checkbox is checked and using new address
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

            // Create order
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
                    notes: formData.notes
                }),
            });

            const orderData = await orderRes.json();

            if (!orderData.success) {
                alert(orderData.message || "Failed to create order");
                setSubmitting(false);
                return;
            }

            const order = orderData.order;

            // Handle different payment methods
            if (formData.paymentMethod === "cod") {
                // COD - order is already placed
                alert("Order placed successfully!");
                router.push(`/orders/${order._id}`);
            } else if (formData.paymentMethod === "razorpay") {
                // Razorpay payment flow
                await handleRazorpayPayment(order);
            } else if (formData.paymentMethod === "stripe") {
                // Stripe payment flow
                await handleStripePayment(order);
            }
        } catch (error) {
            console.error("Order error:", error);
            alert("Failed to place order");
            setSubmitting(false);
        }
    };

    const handleRazorpayPayment = async (order) => {
        try {
            // Create Razorpay order
            const res = await fetch("/api/payment/razorpay/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ orderId: order._id })
            });

            const data = await res.json();

            if (!data.success) {
                alert(data.message || "Failed to initiate payment");
                setSubmitting(false);
                return;
            }

            // Load Razorpay SDK if not loaded
            if (!window.Razorpay) {
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.async = true;
                document.body.appendChild(script);
                await new Promise((resolve) => {
                    script.onload = resolve;
                });
            }

            // Initialize Razorpay
            const options = {
                key: data.keyId,
                amount: data.amount * 100,
                currency: data.currency,
                name: data.name,
                description: `Order #${order._id}`,
                order_id: data.razorpayOrderId,
                handler: async function (response) {
                    // Verify payment
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
                        alert("Payment successful!");
                        router.push(`/orders/${order._id}`);
                    } else {
                        alert("Payment verification failed!");
                        setSubmitting(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        alert("Payment cancelled");
                        setSubmitting(false);
                    }
                },
                prefill: {
                    name: formData.fullName,
                    contact: formData.phone
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error("Razorpay error:", error);
            alert("Payment failed");
            setSubmitting(false);
        }
    };

    const handleStripePayment = async (order) => {
        try {
            // For now, just alert that Stripe integration is pending
            // Full Stripe Elements integration requires more setup
            alert("Stripe payment integration is pending. Please use COD or Razorpay for now.");
            setSubmitting(false);

            // TODO: Implement Stripe Payment Elements
            // 1. Create payment intent
            // 2. Load Stripe.js
            // 3. Show Stripe Elements form
            // 4. Confirm payment
            // 5. Navigate to order page
        } catch (error) {
            console.error("Stripe error:", error);
            alert("Payment failed");
            setSubmitting(false);
        }
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (userLoading || loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Get available payment methods
    const availablePayments = [];
    if (settings?.payment.cod.isEnabled) availablePayments.push({ value: "cod", label: "Cash on Delivery" });
    if (settings?.payment.razorpay.isEnabled) availablePayments.push({ value: "razorpay", label: "Razorpay" });
    if (settings?.payment.stripe.isEnabled) availablePayments.push({ value: "stripe", label: "Stripe" });

    return (
        <div className="min-h-screen bg-background py-12 pt-24">
            <div className="max-w-7xl mx-auto px-4">
                <h1 className="font-serif text-4xl font-bold text-foreground mb-8">
                    Checkout
                </h1>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Checkout Form */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Shipping Address */}
                            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="font-serif text-2xl font-bold">Shipping Address</h2>
                                    {addresses.length > 0 && (
                                        <Link href="/account/addresses" className="text-primary text-sm hover:underline">
                                            Manage Addresses
                                        </Link>
                                    )}
                                </div>

                                {/* Saved Addresses Selection */}
                                {addresses.length > 0 && !useNewAddress && (
                                    <div className="space-y-3 mb-4">
                                        {addresses.map((address) => (
                                            <label
                                                key={address._id}
                                                className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedAddressId === address._id
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:border-primary/50'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <input
                                                        type="radio"
                                                        name="address"
                                                        checked={selectedAddressId === address._id}
                                                        onChange={() => handleAddressSelect(address._id)}
                                                        className="mt-1"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-bold">{address.label}</span>
                                                            {address.isDefault && (
                                                                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                                                    Default
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-foreground">{address.fullName} - {address.phone}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {address.addressLine1}, {address.city}, {address.state} - {address.pincode}
                                                        </p>
                                                    </div>
                                                </div>
                                            </label>
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
                                                    addressLine1: "",
                                                    addressLine2: "",
                                                    city: "",
                                                    state: "",
                                                    pincode: "",
                                                    country: "India"
                                                }));
                                            }}
                                            className="w-full p-4 rounded-lg border-2 border-dashed border-border hover:border-primary text-primary font-medium transition-all"
                                        >
                                            + Add New Address
                                        </button>
                                    </div>
                                )}

                                {/* New Address Form */}
                                {(useNewAddress || addresses.length === 0) && (
                                    <>
                                        {addresses.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setUseNewAddress(false);
                                                    if (addresses.length > 0) {
                                                        handleAddressSelect(addresses[0]._id);
                                                    }
                                                }}
                                                className="mb-4 text-primary text-sm hover:underline"
                                            >
                                                ← Use Saved Address
                                            </button>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium mb-2">Full Name *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.fullName}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium mb-2">Phone Number *</label>
                                                <input
                                                    type="tel"
                                                    required
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium mb-2">Address Line 1 *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.addressLine1}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, addressLine1: e.target.value }))}
                                                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium mb-2">Address Line 2</label>
                                                <input
                                                    type="text"
                                                    value={formData.addressLine2}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, addressLine2: e.target.value }))}
                                                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">City *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.city}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">State *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.state}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                                                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Pincode *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.pincode}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                                                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Country *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.country}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                                                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={saveAddress}
                                                    onChange={(e) => setSaveAddress(e.target.checked)}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-sm">Save this address for future orders</span>
                                            </label>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Payment Method */}
                            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                                <h2 className="font-serif text-2xl font-bold mb-6">Payment Method</h2>

                                <div className="space-y-3">
                                    {availablePayments.map((payment) => (
                                        <label
                                            key={payment.value}
                                            className="flex items-center gap-3 p-4 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                                        >
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value={payment.value}
                                                checked={formData.paymentMethod === payment.value}
                                                onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                                className="w-4 h-4"
                                            />
                                            <span className="font-medium">{payment.label}</span>
                                        </label>
                                    ))}
                                </div>

                                {availablePayments.length === 0 && (
                                    <p className="text-destructive">No payment methods available. Please contact support.</p>
                                )}
                            </div>

                            {/* Order Notes */}
                            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                                <h2 className="font-serif text-2xl font-bold mb-4">Order Notes (Optional)</h2>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    rows={3}
                                    maxLength={500}
                                    placeholder="Add any special instructions for your order..."
                                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border sticky top-24">
                                <h2 className="font-serif text-2xl font-bold mb-6">Order Summary</h2>

                                <div className="space-y-3 mb-4">
                                    {cart?.items.map((item) => (
                                        <div key={item._id} className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                {item.product.name} × {item.quantity}
                                            </span>
                                            <span className="font-medium">₹{item.subtotal}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-border pt-4 mb-6">
                                    <div className="flex justify-between text-xl font-bold">
                                        <span>Total</span>
                                        <span>₹{cart?.total}</span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting || availablePayments.length === 0}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? "Placing Order..." : "Place Order"}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
