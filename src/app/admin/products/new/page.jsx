"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [categories, setCategories] = useState([]);

    const [formData, setFormData] = useState({
        name: "",
        images: [""],
        regularPrice: "",
        salePrice: "",
        description: "",
        variations: [],
        category: "",
        isActive: true,
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/admin/categories?limit=100", {
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                setCategories(data.categories);
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    const handleImageChange = (index, value) => {
        const newImages = [...formData.images];
        newImages[index] = value;
        setFormData({ ...formData, images: newImages });
    };

    const addImageField = () => {
        setFormData({ ...formData, images: [...formData.images, ""] });
    };

    const removeImageField = (index) => {
        const newImages = formData.images.filter((_, i) => i !== index);
        setFormData({ ...formData, images: newImages.length ? newImages : [""] });
    };

    const addVariation = () => {
        setFormData({
            ...formData,
            variations: [...formData.variations, { name: "", options: [{ value: "", priceModifier: 0 }] }],
        });
    };

    const removeVariation = (index) => {
        setFormData({
            ...formData,
            variations: formData.variations.filter((_, i) => i !== index),
        });
    };

    const handleVariationChange = (varIndex, field, value) => {
        const newVariations = [...formData.variations];
        newVariations[varIndex][field] = value;
        setFormData({ ...formData, variations: newVariations });
    };

    const addVariationOption = (varIndex) => {
        const newVariations = [...formData.variations];
        newVariations[varIndex].options.push({ value: "", priceModifier: 0 });
        setFormData({ ...formData, variations: newVariations });
    };

    const removeVariationOption = (varIndex, optIndex) => {
        const newVariations = [...formData.variations];
        newVariations[varIndex].options = newVariations[varIndex].options.filter((_, i) => i !== optIndex);
        if (newVariations[varIndex].options.length === 0) {
            newVariations[varIndex].options = [{ value: "", priceModifier: 0 }];
        }
        setFormData({ ...formData, variations: newVariations });
    };

    const handleOptionChange = (varIndex, optIndex, field, value) => {
        const newVariations = [...formData.variations];
        newVariations[varIndex].options[optIndex][field] = field === "priceModifier" ? parseFloat(value) || 0 : value;
        setFormData({ ...formData, variations: newVariations });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const submitData = {
                ...formData,
                images: formData.images.filter((img) => img.trim()),
                regularPrice: parseFloat(formData.regularPrice),
                salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
                variations: formData.variations.filter((v) => v.name.trim()),
            };

            const res = await fetch("/api/admin/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(submitData),
            });

            const data = await res.json();

            if (data.success) {
                router.push("/admin/products");
            } else {
                setError(data.message || "Failed to create product");
            }
        } catch (error) {
            console.error("Create product error:", error);
            setError("Failed to create product");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl">
            {/* Page Header */}
            <div className="mb-8">
                <Link
                    href="/admin/products"
                    className="text-muted-foreground hover:text-primary transition-colors text-sm mb-4 inline-block"
                >
                    ← Back to Products
                </Link>
                <h1 className="font-serif text-3xl font-bold text-foreground">
                    New Product
                </h1>
                <p className="text-muted-foreground mt-1">
                    Add a new product to your catalog
                </p>
            </div>

            {/* Form */}
            <div className="bg-card rounded-2xl p-6 border border-border">
                {error && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Product Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="e.g., Premium Mango Pickle"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Category *
                        </label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">Select a category</option>
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Regular Price (₹) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.regularPrice}
                                onChange={(e) => setFormData({ ...formData, regularPrice: e.target.value })}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="299"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Sale Price (₹)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.salePrice}
                                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="199 (optional)"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            placeholder="Describe your product..."
                        />
                    </div>

                    {/* Images */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Image URLs
                        </label>
                        <div className="space-y-2">
                            {formData.images.map((img, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="url"
                                        value={img}
                                        onChange={(e) => handleImageChange(index, e.target.value)}
                                        className="flex-1 px-4 py-2 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImageField(index)}
                                        className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={addImageField}
                            className="mt-2 text-sm text-primary hover:underline"
                        >
                            + Add another image
                        </button>
                    </div>

                    {/* Variations */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Variations
                        </label>
                        <div className="space-y-4">
                            {formData.variations.map((variation, varIndex) => (
                                <div key={varIndex} className="p-4 bg-muted rounded-xl">
                                    <div className="flex items-center gap-2 mb-3">
                                        <input
                                            type="text"
                                            value={variation.name}
                                            onChange={(e) => handleVariationChange(varIndex, "name", e.target.value)}
                                            className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                            placeholder="e.g., Size, Weight"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeVariation(varIndex)}
                                            className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div className="space-y-2 pl-4">
                                        {variation.options.map((opt, optIndex) => (
                                            <div key={optIndex} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={opt.value}
                                                    onChange={(e) => handleOptionChange(varIndex, optIndex, "value", e.target.value)}
                                                    className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                    placeholder="e.g., 250g"
                                                />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={opt.priceModifier}
                                                    onChange={(e) => handleOptionChange(varIndex, optIndex, "priceModifier", e.target.value)}
                                                    className="w-24 px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                    placeholder="±₹"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeVariationOption(varIndex, optIndex)}
                                                    className="px-2 py-1 text-muted-foreground hover:text-destructive transition-colors"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => addVariationOption(varIndex)}
                                            className="text-sm text-primary hover:underline"
                                        >
                                            + Add option
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={addVariation}
                            className="mt-2 text-sm text-primary hover:underline"
                        >
                            + Add variation
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-5 h-5 rounded border-input text-primary focus:ring-primary"
                        />
                        <label htmlFor="isActive" className="text-foreground">
                            Active (visible on store)
                        </label>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 disabled:opacity-50"
                        >
                            {loading ? "Creating..." : "Create Product"}
                        </Button>
                        <Link href="/admin/products">
                            <Button
                                type="button"
                                variant="outline"
                                className="border-2 border-foreground text-foreground hover:bg-foreground hover:text-background rounded-full px-8"
                            >
                                Cancel
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
