"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function AdminSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState(null);
    const [showSecrets, setShowSecrets] = useState({
        razorpaySecret: false,
        stripeSecret: false,
        mailPassword: false,
        geminiApiKey: false,
        shiprocketPassword: false
    });
    const router = useRouter();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/admin/settings", {
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                setSettings(data._fullSettings);
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const res = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(settings),
            });

            const data = await res.json();

            if (data.success) {
                toast.success("Settings saved successfully!");
            } else {
                toast.error(data.message || "Failed to save settings");
            }
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const updateSetting = (path, value) => {
        setSettings(prev => {
            const newSettings = { ...prev };
            const parts = path.split('.');
            let current = newSettings;

            for (let i = 0; i < parts.length - 1; i++) {
                // Create the nested object if it doesn't exist
                if (!current[parts[i]]) {
                    current[parts[i]] = {};
                }
                // Spread the existing object to maintain immutability
                current[parts[i]] = { ...current[parts[i]] };
                current = current[parts[i]];
            }

            current[parts[parts.length - 1]] = value;
            return newSettings;
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="font-serif text-3xl font-bold text-foreground">
                    Settings
                </h1>
                <p className="text-muted-foreground mt-1">
                    Manage site settings and payment gateways
                </p>
            </div>

            {/* General Settings */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <h2 className="font-serif text-xl font-bold mb-4">General Settings</h2>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                        <div>
                            <h3 className="font-medium">Demo Mode</h3>
                            <p className="text-sm text-muted-foreground">
                                When enabled, only GET requests are allowed (read-only mode)
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings?.isDemo || false}
                                onChange={(e) => updateSetting('isDemo', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                        <div>
                            <h3 className="font-medium">Maintenance Mode</h3>
                            <p className="text-sm text-muted-foreground">
                                Site will be unavailable to non-admin users
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings?.isMaintenance || false}
                                onChange={(e) => updateSetting('isMaintenance', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Razorpay Settings */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-serif text-xl font-bold">Razorpay</h2>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings?.payment?.razorpay?.isEnabled || false}
                            onChange={(e) => updateSetting('payment.razorpay.isEnabled', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Key ID</label>
                        <input
                            type="text"
                            value={settings?.payment?.razorpay?.keyId || ''}
                            onChange={(e) => updateSetting('payment.razorpay.keyId', e.target.value)}
                            className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="rzp_test_xxxxx"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Key Secret</label>
                        <div className="relative">
                            <input
                                type={showSecrets.razorpaySecret ? "text" : "password"}
                                value={settings?.payment?.razorpay?.keySecret || ''}
                                onChange={(e) => updateSetting('payment.razorpay.keySecret', e.target.value)}
                                className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Key Secret"
                            />
                            <button
                                type="button"
                                onClick={() => setShowSecrets(prev => ({ ...prev, razorpaySecret: !prev.razorpaySecret }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-primary hover:underline"
                            >
                                {showSecrets.razorpaySecret ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stripe Settings */}
            {/* <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-serif text-xl font-bold">Stripe</h2>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings?.payment?.stripe?.isEnabled || false}
                            onChange={(e) => updateSetting('payment.stripe.isEnabled', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Publishable Key</label>
                        <input
                            type="text"
                            value={settings?.payment?.stripe?.publishableKey || ''}
                            onChange={(e) => updateSetting('payment.stripe.publishableKey', e.target.value)}
                            className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="pk_test_xxxxx"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Secret Key</label>
                        <div className="relative">
                            <input
                                type={showSecrets.stripeSecret ? "text" : "password"}
                                value={settings?.payment?.stripe?.secretKey || ''}
                                onChange={(e) => updateSetting('payment.stripe.secretKey', e.target.value)}
                                className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="sk_test_xxxxx"
                            />
                            <button
                                type="button"
                                onClick={() => setShowSecrets(prev => ({ ...prev, stripeSecret: !prev.stripeSecret }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-primary hover:underline"
                            >
                                {showSecrets.stripeSecret ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>
                </div>
            </div> */}

            {/* COD Settings */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-serif text-xl font-bold">Cash on Delivery (COD)</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Allow customers to pay when they receive their order
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings?.payment?.cod?.isEnabled || false}
                            onChange={(e) => updateSetting('payment.cod.isEnabled', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
            </div>

            {/* Mail Settings */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="font-serif text-xl font-bold">Email Settings</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Configure SMTP for email verification & notifications
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings?.mail?.isEnabled || false}
                            onChange={(e) => updateSetting('mail.isEnabled', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">SMTP Host</label>
                            <input
                                type="text"
                                value={settings?.mail?.host || ''}
                                onChange={(e) => updateSetting('mail.host', e.target.value)}
                                className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="smtp.gmail.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">SMTP Port</label>
                            <input
                                type="number"
                                value={settings?.mail?.port || 587}
                                onChange={(e) => updateSetting('mail.port', parseInt(e.target.value) || 587)}
                                className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="587"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Email Address</label>
                        <input
                            type="email"
                            value={settings?.mail?.email || ''}
                            onChange={(e) => updateSetting('mail.email', e.target.value)}
                            className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="noreply@yourstore.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Email Password / App Password</label>
                        <div className="relative">
                            <input
                                type={showSecrets.mailPassword ? "text" : "password"}
                                value={settings?.mail?.password || ''}
                                onChange={(e) => updateSetting('mail.password', e.target.value)}
                                className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="App password for Gmail or SMTP password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowSecrets(prev => ({ ...prev, mailPassword: !prev.mailPassword }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-primary hover:underline"
                            >
                                {showSecrets.mailPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            For Gmail, use an App Password (not your regular password)
                        </p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                        <div>
                            <h3 className="font-medium">Use SSL/TLS</h3>
                            <p className="text-sm text-muted-foreground">
                                Enable for secure connection (port 465). Disable for STARTTLS (port 587)
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings?.mail?.isSSL || false}
                                onChange={(e) => updateSetting('mail.isSSL', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Gemini AI Settings */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <h2 className="font-serif text-xl font-semibold text-foreground mb-6">
                    ✨ Gemini AI (Image Generation)
                </h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                        <div>
                            <h3 className="font-medium">Enable AI Image Generation</h3>
                            <p className="text-sm text-muted-foreground">
                                Allow generating images using Google Gemini AI (Google Cloud Account Required)
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings?.gemini_ai?.isEnabled || false}
                                onChange={(e) => updateSetting('gemini_ai.isEnabled', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Gemini API Key</label>
                        <div className="flex gap-2">
                            <input
                                type={showSecrets.geminiApiKey ? "text" : "password"}
                                value={settings?.gemini_ai?.apiKey || ''}
                                onChange={(e) => updateSetting('gemini_ai.apiKey', e.target.value)}
                                className="flex-1 px-4 py-3 rounded-xl border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="AIzaSy..."
                            />
                            <button
                                type="button"
                                onClick={() => setShowSecrets(prev => ({ ...prev, geminiApiKey: !prev.geminiApiKey }))}
                                className="px-4 py-2 text-sm bg-muted rounded-xl hover:bg-muted/70"
                            >
                                {showSecrets.geminiApiKey ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Get your API key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>
                        </p>
                    </div>
                </div>
            </div>

            {/* Shipping Settings */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <h2 className="font-serif text-xl font-semibold text-foreground mb-6">
                    📦 Shipping (Shiprocket)
                </h2>
                <div className="space-y-6">
                    {/* Enable Shiprocket */}
                    <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                        <div>
                            <h3 className="font-medium">Enable Shiprocket</h3>
                            <p className="text-sm text-muted-foreground">
                                Use Shiprocket for automated shipping
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings?.shipping?.shiprocket?.isEnabled || false}
                                onChange={(e) => updateSetting('shipping.shiprocket.isEnabled', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    {/* Shiprocket Credentials */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <input
                                type="email"
                                value={settings?.shipping?.shiprocket?.email || ''}
                                onChange={(e) => updateSetting('shipping.shiprocket.email', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="shiprocket@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Password</label>
                            <div className="flex gap-2">
                                <input
                                    type={showSecrets.shiprocketPassword ? "text" : "password"}
                                    value={settings?.shipping?.shiprocket?.password || ''}
                                    onChange={(e) => updateSetting('shipping.shiprocket.password', e.target.value)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSecrets(prev => ({ ...prev, shiprocketPassword: !prev.shiprocketPassword }))}
                                    className="px-4 py-2 text-sm bg-muted rounded-xl hover:bg-muted/70"
                                >
                                    {showSecrets.shiprocketPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mode Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Shipping Mode</label>
                        <div className="grid grid-cols-2 gap-4">
                            <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${settings?.shipping?.shiprocket?.mode === 'manual' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                <input
                                    type="radio"
                                    name="shippingMode"
                                    checked={settings?.shipping?.shiprocket?.mode === 'manual'}
                                    onChange={() => updateSetting('shipping.shiprocket.mode', 'manual')}
                                    className="sr-only"
                                />
                                <div>
                                    <p className="font-medium">Manual</p>
                                    <p className="text-xs text-muted-foreground">Create shipments when marking orders as Processing</p>
                                </div>
                            </label>
                            <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${settings?.shipping?.shiprocket?.mode === 'automatic' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                <input
                                    type="radio"
                                    name="shippingMode"
                                    checked={settings?.shipping?.shiprocket?.mode === 'automatic'}
                                    onChange={() => updateSetting('shipping.shiprocket.mode', 'automatic')}
                                    className="sr-only"
                                />
                                <div>
                                    <p className="font-medium">Automatic</p>
                                    <p className="text-xs text-muted-foreground">Auto-create shipments on payment success</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Warehouse Address */}
                    <div className="border-t border-border pt-6">
                        <h3 className="font-medium mb-4">Warehouse / Pickup Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Location Name</label>
                                <input
                                    type="text"
                                    value={settings?.shipping?.warehouse?.name || ''}
                                    onChange={(e) => updateSetting('shipping.warehouse.name', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Main Warehouse"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Phone</label>
                                <input
                                    type="tel"
                                    value={settings?.shipping?.warehouse?.phone || ''}
                                    onChange={(e) => updateSetting('shipping.warehouse.phone', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="9876543210"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">Address</label>
                                <input
                                    type="text"
                                    value={settings?.shipping?.warehouse?.address || ''}
                                    onChange={(e) => updateSetting('shipping.warehouse.address', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="123 Street, Area"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">City</label>
                                <input
                                    type="text"
                                    value={settings?.shipping?.warehouse?.city || ''}
                                    onChange={(e) => updateSetting('shipping.warehouse.city', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Mumbai"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">State</label>
                                <input
                                    type="text"
                                    value={settings?.shipping?.warehouse?.state || ''}
                                    onChange={(e) => updateSetting('shipping.warehouse.state', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Maharashtra"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Pincode</label>
                                <input
                                    type="text"
                                    value={settings?.shipping?.warehouse?.pincode || ''}
                                    onChange={(e) => updateSetting('shipping.warehouse.pincode', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="400001"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Rate Calculation */}
                    <div className="border-t border-border pt-6">
                        <h3 className="font-medium mb-4">Shipping Rate Calculation</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${settings?.shipping?.rateCalculation === 'free_threshold' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                <input
                                    type="radio"
                                    name="rateCalculation"
                                    checked={settings?.shipping?.rateCalculation === 'free_threshold'}
                                    onChange={() => updateSetting('shipping.rateCalculation', 'free_threshold')}
                                    className="sr-only"
                                />
                                <div>
                                    <p className="font-medium">Free Above Threshold</p>
                                    <p className="text-xs text-muted-foreground">Free shipping above a certain amount</p>
                                </div>
                            </label>
                            <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${settings?.shipping?.rateCalculation === 'flat' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                <input
                                    type="radio"
                                    name="rateCalculation"
                                    checked={settings?.shipping?.rateCalculation === 'flat'}
                                    onChange={() => updateSetting('shipping.rateCalculation', 'flat')}
                                    className="sr-only"
                                />
                                <div>
                                    <p className="font-medium">Flat Rate</p>
                                    <p className="text-xs text-muted-foreground">Fixed shipping fee for all orders</p>
                                </div>
                            </label>
                            <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${settings?.shipping?.rateCalculation === 'realtime' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                <input
                                    type="radio"
                                    name="rateCalculation"
                                    checked={settings?.shipping?.rateCalculation === 'realtime'}
                                    onChange={() => updateSetting('shipping.rateCalculation', 'realtime')}
                                    className="sr-only"
                                />
                                <div>
                                    <p className="font-medium">Real-time Rates</p>
                                    <p className="text-xs text-muted-foreground">Fetch rates from Shiprocket</p>
                                </div>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Free Shipping Threshold (₹)</label>
                                <input
                                    type="number"
                                    value={settings?.shipping?.freeShippingThreshold || 499}
                                    onChange={(e) => updateSetting('shipping.freeShippingThreshold', Number(e.target.value))}
                                    className="w-full px-4 py-3 rounded-xl border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="499"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Flat Rate (₹)</label>
                                <input
                                    type="number"
                                    value={settings?.shipping?.flatRate || 50}
                                    onChange={(e) => updateSetting('shipping.flatRate', Number(e.target.value))}
                                    className="w-full px-4 py-3 rounded-xl border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Default Weight (kg)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={settings?.shipping?.defaultWeight || 0.5}
                                    onChange={(e) => updateSetting('shipping.defaultWeight', Number(e.target.value))}
                                    className="w-full px-4 py-3 rounded-xl border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="0.5"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-medium transition-all disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
}
