"use client";

import { useState, useEffect } from "react";
import ImagePicker from "@/app/components/ImagePicker";
import { toast } from "react-toastify";

export default function ProductAdModal({ isOpen, onClose, onSuccess, editingAd = null }) {
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [linkMode, setLinkMode] = useState("product"); // 'product' or 'custom'
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        mediaUrl: "",
        mediaType: "image",
        linkUrl: "",
        position: "banner",
        order: 0,
        isActive: true,
        startDate: "",
        endDate: ""
    });

    useEffect(() => {
        if (isOpen) {
            fetchProducts();
        }
    }, [isOpen]);

    useEffect(() => {
        if (editingAd) {
            const isProductLink = editingAd.linkUrl?.startsWith("/products/");
            setLinkMode(isProductLink ? "product" : "custom");
            setFormData({
                title: editingAd.title || "",
                description: editingAd.description || "",
                mediaUrl: editingAd.mediaUrl || "",
                mediaType: editingAd.mediaType || "image",
                linkUrl: editingAd.linkUrl || "",
                position: editingAd.position || "banner",
                order: editingAd.order || 0,
                isActive: editingAd.isActive !== false,
                startDate: editingAd.startDate ? new Date(editingAd.startDate).toISOString().split('T')[0] : "",
                endDate: editingAd.endDate ? new Date(editingAd.endDate).toISOString().split('T')[0] : ""
            });
        } else {
            setLinkMode("product");
            setFormData({
                title: "",
                description: "",
                mediaUrl: "",
                mediaType: "image",
                linkUrl: "",
                position: "banner",
                order: 0,
                isActive: true,
                startDate: "",
                endDate: ""
            });
        }
    }, [editingAd, isOpen]);

    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            const res = await fetch("/api/products?limit=100", {
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                setProducts(data.products);
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleProductSelect = (productId) => {
        if (productId) {
            setFormData({ ...formData, linkUrl: `/products/${productId}` });
        } else {
            setFormData({ ...formData, linkUrl: "" });
        }
    };

    const getSelectedProductId = () => {
        if (formData.linkUrl?.startsWith("/products/")) {
            return formData.linkUrl.replace("/products/", "");
        }
        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                startDate: formData.startDate ? new Date(formData.startDate) : null,
                endDate: formData.endDate ? new Date(formData.endDate) : null
            };

            const url = editingAd
                ? `/api/admin/product-ads/${editingAd._id}`
                : "/api/admin/product-ads";

            const res = await fetch(url, {
                method: editingAd ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.success) {
                onSuccess();
                onClose();
            } else {
                toast.error(data.message || "Failed to save product ad");
            }
        } catch (error) {
            console.error("Failed to save product ad:", error);
            toast.error("Failed to save product ad");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 border border-border">
                {/* Header */}
                <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <h2 className="font-serif text-xl font-bold text-foreground">
                        {editingAd ? "Edit Product Ad" : "Create Product Ad"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Title <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Enter ad title"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Optional description text"
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        />
                    </div>

                    {/* Media Type */}
                    {/* <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Media Type
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="mediaType"
                                    value="image"
                                    checked={formData.mediaType === "image"}
                                    onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
                                    className="w-4 h-4 text-primary"
                                />
                                <span>🖼️ Image</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="mediaType"
                                    value="video"
                                    checked={formData.mediaType === "video"}
                                    onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
                                    className="w-4 h-4 text-primary"
                                />
                                <span>🎬 Video</span>
                            </label>
                        </div>
                    </div> */}

                    {/* Media Selection */}
                    <div>
                        <ImagePicker
                            key={formData.mediaType}
                            value={formData.mediaUrl}
                            onChange={(url) => {
                                const isVideo = url.match(/\.(mp4|webm|mov)|video/i);
                                setFormData({
                                    ...formData,
                                    mediaUrl: url,
                                    mediaType: isVideo ? "video" : "image"
                                });
                            }}
                            label={"Ad Image/Video"}
                            type="all"
                        />
                        {formData.mediaType === "video" && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Supports .mp4, .webm files or direct URLs
                            </p>
                        )}
                    </div>

                    {/* Link URL - Product Selector or Custom URL */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Click Destination
                        </label>

                        {/* Mode Tabs */}
                        <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit mb-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setLinkMode("product");
                                    setFormData({ ...formData, linkUrl: "" });
                                }}
                                className={`px-3 py-1.5 rounded text-sm transition-colors ${linkMode === 'product' ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
                            >
                                📦 Select Product
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setLinkMode("custom");
                                    setFormData({ ...formData, linkUrl: "" });
                                }}
                                className={`px-3 py-1.5 rounded text-sm transition-colors ${linkMode === 'custom' ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}
                            >
                                🔗 Custom URL
                            </button>
                        </div>

                        {linkMode === "product" ? (
                            <div>
                                {loadingProducts ? (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        Loading products...
                                    </div>
                                ) : (
                                    <select
                                        value={getSelectedProductId()}
                                        onChange={(e) => handleProductSelect(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="">Select a product (optional)</option>
                                        {products.map((product) => (
                                            <option key={product._id} value={product._id}>
                                                {product.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                    Link to a product page when user taps the ad
                                </p>
                            </div>
                        ) : (
                            <div>
                                <input
                                    type="url"
                                    value={formData.linkUrl}
                                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                                    placeholder="https://example.com/page"
                                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Enter any URL for the ad destination
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Position & Order */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Position
                            </label>
                            <select
                                value={formData.position}
                                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="hero">Application</option>
                                <option value="banner">Banner</option>
                                {/* <option value="popup">Popup</option> */}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Display Order
                            </label>
                            <input
                                type="number"
                                value={formData.order}
                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                min="0"
                                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Start Date (Optional)
                            </label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                End Date (Optional)
                            </label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                        </label>
                        <span className="text-sm font-medium text-foreground">Active</span>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-border rounded-xl text-foreground hover:bg-muted transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.title || !formData.mediaUrl}
                            className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Saving..." : editingAd ? "Update Ad" : "Create Ad"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
