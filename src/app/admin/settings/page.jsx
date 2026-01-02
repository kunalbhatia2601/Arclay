"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState(null);
    const [showSecrets, setShowSecrets] = useState({
        razorpaySecret: false,
        stripeSecret: false
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
                alert("Settings saved successfully!");
            } else {
                alert(data.message || "Failed to save settings");
            }
        } catch (error) {
            console.error("Save error:", error);
            alert("Failed to save settings");
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
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
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
            </div>

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
