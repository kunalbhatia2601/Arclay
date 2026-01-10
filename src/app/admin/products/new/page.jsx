"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ImagePicker from "@/app/components/ImagePicker";

export default function NewProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [categories, setCategories] = useState([]);

    const [formData, setFormData] = useState({
        name: "",
        images: [],
        description: "",
        variationTypes: [], // e.g., [{ name: "Color", options: ["Red", "Blue"] }, { name: "Size", options: ["S", "M"] }]
        variants: [], // e.g., [{ attributes: { Color: "Red", Size: "S" }, regularPrice: 100, salePrice: null, stock: 10 }]
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



    // Variation Type handlers
    const addVariationType = () => {
        setFormData({
            ...formData,
            variationTypes: [...formData.variationTypes, { name: "", options: [""] }],
        });
    };

    const removeVariationType = (index) => {
        const newTypes = formData.variationTypes.filter((_, i) => i !== index);
        setFormData({ ...formData, variationTypes: newTypes, variants: [] });
    };

    const handleVariationTypeName = (index, value) => {
        const newTypes = [...formData.variationTypes];
        newTypes[index].name = value;
        setFormData({ ...formData, variationTypes: newTypes });
    };

    const addVariationOption = (typeIndex) => {
        const newTypes = [...formData.variationTypes];
        newTypes[typeIndex].options.push("");
        setFormData({ ...formData, variationTypes: newTypes });
    };

    const removeVariationOption = (typeIndex, optIndex) => {
        const newTypes = [...formData.variationTypes];
        newTypes[typeIndex].options = newTypes[typeIndex].options.filter((_, i) => i !== optIndex);
        if (newTypes[typeIndex].options.length === 0) {
            newTypes[typeIndex].options = [""];
        }
        setFormData({ ...formData, variationTypes: newTypes, variants: [] });
    };

    const handleVariationOption = (typeIndex, optIndex, value) => {
        const newTypes = [...formData.variationTypes];
        newTypes[typeIndex].options[optIndex] = value;
        setFormData({ ...formData, variationTypes: newTypes });
    };

    // Generate all possible variant combinations
    const generateCombinations = () => {
        const validTypes = formData.variationTypes.filter(t =>
            t.name.trim() && t.options.some(o => o.trim())
        );

        if (validTypes.length === 0) {
            return [];
        }

        const generateHelper = (types, index, current) => {
            if (index === types.length) {
                return [{ ...current }];
            }

            const results = [];
            const type = types[index];
            const validOptions = type.options.filter(o => o.trim());

            for (const option of validOptions) {
                results.push(...generateHelper(types, index + 1, {
                    ...current,
                    [type.name]: option
                }));
            }

            return results;
        };

        return generateHelper(validTypes, 0, {});
    };

    const possibleCombinations = useMemo(() => generateCombinations(), [formData.variationTypes]);

    // Generate variants button handler
    const generateVariants = () => {
        const combinations = generateCombinations();
        const newVariants = combinations.map(attrs => {
            // Check if variant already exists
            const existing = formData.variants.find(v => {
                const vAttrs = v.attributes;
                return Object.keys(attrs).every(k => vAttrs[k] === attrs[k]);
            });

            if (existing) return existing;

            return {
                attributes: attrs,
                regularPrice: "",
                salePrice: "",
                stock: "",
                sku: ""
            };
        });

        setFormData({ ...formData, variants: newVariants });
    };

    // Variant handlers
    const handleVariantChange = (index, field, value) => {
        const newVariants = [...formData.variants];
        newVariants[index][field] = value;
        setFormData({ ...formData, variants: newVariants });
    };

    const removeVariant = (index) => {
        const newVariants = formData.variants.filter((_, i) => i !== index);
        setFormData({ ...formData, variants: newVariants });
    };

    // Get variant label from attributes
    const getVariantLabel = (attributes) => {
        return Object.entries(attributes).map(([key, val]) => `${key}: ${val}`).join(", ");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Validate variants
        const validVariants = formData.variants.filter(v =>
            v.regularPrice && parseFloat(v.regularPrice) >= 0
        );

        if (validVariants.length === 0) {
            setError("Product must have at least one variant with a price");
            return;
        }

        setLoading(true);

        try {
            const submitData = {
                ...formData,
                images: formData.images.filter((img) => img.trim()),
                variationTypes: formData.variationTypes
                    .filter(t => t.name.trim() && t.options.some(o => o.trim()))
                    .map(t => ({
                        name: t.name.trim(),
                        options: t.options.filter(o => o.trim())
                    })),
                variants: validVariants.map(v => ({
                    attributes: v.attributes,
                    regularPrice: parseFloat(v.regularPrice),
                    salePrice: v.salePrice ? parseFloat(v.salePrice) : null,
                    stock: parseInt(v.stock) || 0,
                    sku: v.sku || ""
                })),
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
        <div className="w-full">
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

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h2 className="font-serif text-xl font-bold text-foreground border-b border-border pb-2">
                            Basic Information
                        </h2>
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
                    </div>

                    {/* Images */}
                    <div className="space-y-4">
                        <h2 className="font-serif text-xl font-bold text-foreground border-b border-border pb-2">
                            Images
                        </h2>
                        <ImagePicker
                            value={formData.images}
                            onChange={(images) => setFormData({ ...formData, images })}
                            multiple={true}
                            label="Product Images"
                        />
                    </div>

                    {/* Variation Types */}
                    <div className="space-y-4">
                        <h2 className="font-serif text-xl font-bold text-foreground border-b border-border pb-2">
                            Variation Types
                            <span className="font-normal text-sm text-muted-foreground ml-2">
                                (e.g., Color, Size, Weight)
                            </span>
                        </h2>

                        {formData.variationTypes.map((type, typeIndex) => (
                            <div key={typeIndex} className="p-4 bg-muted rounded-xl">
                                <div className="flex items-center gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={type.name}
                                        onChange={(e) => handleVariationTypeName(typeIndex, e.target.value)}
                                        className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="Variation name (e.g., Color)"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeVariationType(typeIndex)}
                                        className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="pl-4 border-l-2 border-border space-y-2">
                                    <p className="text-xs text-muted-foreground">Options:</p>
                                    {type.options.map((opt, optIndex) => (
                                        <div key={optIndex} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={(e) => handleVariationOption(typeIndex, optIndex, e.target.value)}
                                                className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                placeholder={`Option ${optIndex + 1} (e.g., Red, Blue)`}
                                            />
                                            {type.options.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeVariationOption(typeIndex, optIndex)}
                                                    className="px-2 py-1 text-muted-foreground hover:text-destructive transition-colors"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => addVariationOption(typeIndex)}
                                        className="text-sm text-primary hover:underline"
                                    >
                                        + Add option
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addVariationType}
                            className="text-sm text-primary hover:underline"
                        >
                            + Add variation type
                        </button>

                        {formData.variationTypes.length > 0 && (
                            <div className="pt-2">
                                <Button
                                    type="button"
                                    onClick={generateVariants}
                                    variant="outline"
                                    className="border-primary text-primary hover:bg-primary/10"
                                >
                                    Generate {possibleCombinations.length} Variant Combinations
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Variants */}
                    <div className="space-y-4">
                        <h2 className="font-serif text-xl font-bold text-foreground border-b border-border pb-2">
                            Variants
                            <span className="font-normal text-sm text-muted-foreground ml-2">
                                (Price & Stock for each combination)
                            </span>
                        </h2>

                        {formData.variants.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {formData.variationTypes.length === 0 ? (
                                    <p>Add variation types above, or add a single variant below</p>
                                ) : (
                                    <p>Click &quot;Generate Variant Combinations&quot; to create variants</p>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setFormData({
                                        ...formData,
                                        variants: [{ attributes: {}, regularPrice: "", salePrice: "", stock: "", sku: "" }]
                                    })}
                                    className="mt-3 text-sm text-primary hover:underline"
                                >
                                    + Add single variant (no variations)
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {formData.variants.map((variant, index) => (
                                    <div key={index} className="p-4 bg-muted rounded-xl">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-medium text-foreground">
                                                {Object.keys(variant.attributes).length > 0
                                                    ? getVariantLabel(variant.attributes)
                                                    : "Default Variant"
                                                }
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeVariant(index)}
                                                className="px-2 py-1 text-destructive hover:bg-destructive/10 rounded transition-colors text-sm"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <div>
                                                <label className="block text-xs text-muted-foreground mb-1">Regular Price (₹) *</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={variant.regularPrice}
                                                    onChange={(e) => handleVariantChange(index, "regularPrice", e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                                    placeholder="299"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-muted-foreground mb-1">Sale Price (₹)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={variant.salePrice}
                                                    onChange={(e) => handleVariantChange(index, "salePrice", e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                                    placeholder="199"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-muted-foreground mb-1">Stock *</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={variant.stock}
                                                    onChange={(e) => handleVariantChange(index, "stock", e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                                    placeholder="100"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-muted-foreground mb-1">SKU</label>
                                                <input
                                                    type="text"
                                                    value={variant.sku}
                                                    onChange={(e) => handleVariantChange(index, "sku", e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                                    placeholder="PRD-001"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Status */}
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
