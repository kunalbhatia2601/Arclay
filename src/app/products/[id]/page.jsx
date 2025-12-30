"use client";

import { useState, useEffect, use, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export default function ProductDetailPage({ params }) {
    const { id } = use(params);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState({}); // { Color: "Red", Size: "M" }
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            const res = await fetch(`/api/products/${id}`);
            const data = await res.json();

            if (data.success) {
                setProduct(data.product);
                // Initialize selected options with first option of each type
                const initialOptions = {};
                data.product.variationTypes?.forEach((type) => {
                    if (type.options?.length > 0) {
                        initialOptions[type.name] = type.options[0];
                    }
                });
                setSelectedOptions(initialOptions);
            }
        } catch (error) {
            console.error("Failed to fetch product:", error);
        } finally {
            setLoading(false);
        }
    };

    // Find the variant matching selected options
    const selectedVariant = useMemo(() => {
        if (!product?.variants?.length) return null;

        // If no variation types, return first variant
        if (!product.variationTypes?.length) {
            return product.variants[0];
        }

        return product.variants.find(variant => {
            const attrs = variant.attributes instanceof Map
                ? Object.fromEntries(variant.attributes)
                : variant.attributes;

            return Object.entries(selectedOptions).every(([key, value]) => attrs[key] === value);
        });
    }, [product, selectedOptions]);

    // Get price info from selected variant
    const priceInfo = useMemo(() => {
        if (!selectedVariant) return { price: 0, originalPrice: null, hasSale: false, stock: 0, inStock: false };

        const hasSale = selectedVariant.salePrice && selectedVariant.salePrice < selectedVariant.regularPrice;
        const discountPercent = hasSale
            ? Math.round((1 - selectedVariant.salePrice / selectedVariant.regularPrice) * 100)
            : 0;

        return {
            price: hasSale ? selectedVariant.salePrice : selectedVariant.regularPrice,
            originalPrice: hasSale ? selectedVariant.regularPrice : null,
            hasSale,
            discountPercent,
            stock: selectedVariant.stock || 0,
            inStock: (selectedVariant.stock || 0) > 0
        };
    }, [selectedVariant]);

    // Check if an option is available (has stock in at least one variant)
    const isOptionAvailable = (typeName, optionValue) => {
        if (!product?.variants) return false;

        return product.variants.some(variant => {
            const attrs = variant.attributes instanceof Map
                ? Object.fromEntries(variant.attributes)
                : variant.attributes;

            // Check if this option is part of the variant
            if (attrs[typeName] !== optionValue) return false;

            // Check if other selected options match (for inter-dependent availability)
            const otherOptionsMatch = Object.entries(selectedOptions).every(([key, value]) => {
                if (key === typeName) return true; // Skip the current type
                return attrs[key] === value;
            });

            return otherOptionsMatch && variant.stock > 0;
        });
    };

    const handleOptionSelect = (typeName, optionValue) => {
        setSelectedOptions(prev => ({
            ...prev,
            [typeName]: optionValue
        }));
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <main className="min-h-screen bg-background pt-20 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </main>
            </>
        );
    }

    if (!product) {
        return (
            <>
                <Navbar />
                <main className="min-h-screen bg-background pt-20">
                    <div className="container mx-auto px-4 lg:px-8 py-16 text-center">
                        <div className="text-6xl mb-4">🔍</div>
                        <h1 className="font-serif text-3xl font-bold text-foreground mb-4">
                            Product Not Found
                        </h1>
                        <p className="text-muted-foreground mb-6">
                            The product you&apos;re looking for doesn&apos;t exist or has been removed.
                        </p>
                        <Link href="/products">
                            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                                Browse Products
                            </Button>
                        </Link>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-background pt-20">
                <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-12">
                    {/* Breadcrumb */}
                    <nav className="mb-8">
                        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
                            <li>
                                <Link href="/" className="hover:text-primary transition-colors">
                                    Home
                                </Link>
                            </li>
                            <li>/</li>
                            <li>
                                <Link href="/products" className="hover:text-primary transition-colors">
                                    Products
                                </Link>
                            </li>
                            <li>/</li>
                            <li className="text-foreground font-medium truncate max-w-[200px]">
                                {product.name}
                            </li>
                        </ol>
                    </nav>

                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
                        {/* Product Images */}
                        <div className="space-y-4">
                            {/* Main Image */}
                            <div className="aspect-square bg-muted rounded-2xl overflow-hidden relative">
                                {product.images?.[selectedImage] ? (
                                    <img
                                        src={product.images[selectedImage]}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-8xl">
                                        📦
                                    </div>
                                )}
                                {!priceInfo.inStock && (
                                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                        <span className="bg-destructive text-destructive-foreground px-6 py-3 rounded-full font-bold text-lg">
                                            Out of Stock
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Thumbnail Gallery */}
                            {product.images?.length > 1 && (
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                    {product.images.map((img, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImage(index)}
                                            className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === index
                                                ? "border-primary"
                                                : "border-transparent hover:border-border"
                                                }`}
                                        >
                                            <img
                                                src={img}
                                                alt={`${product.name} ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Details */}
                        <div>
                            {product.category && (
                                <Link
                                    href={`/products?category=${product.category._id}`}
                                    className="text-sm text-primary font-medium uppercase tracking-wide hover:underline"
                                >
                                    {product.category.name}
                                </Link>
                            )}

                            <h1 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mt-2 mb-4">
                                {product.name}
                            </h1>

                            {/* Price */}
                            <div className="flex items-center gap-3 mb-6">
                                <span className="font-serif text-3xl font-bold text-foreground">
                                    ₹{priceInfo.price}
                                </span>
                                {priceInfo.hasSale && priceInfo.originalPrice && (
                                    <>
                                        <span className="text-xl text-muted-foreground line-through">
                                            ₹{priceInfo.originalPrice}
                                        </span>
                                        <span className="bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full">
                                            {priceInfo.discountPercent}% OFF
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Stock Status */}
                            <div className="mb-6">
                                {priceInfo.inStock ? (
                                    <p className="text-sm text-muted-foreground">
                                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                        In Stock ({priceInfo.stock} available)
                                    </p>
                                ) : (
                                    <p className="text-sm text-destructive">
                                        <span className="inline-block w-2 h-2 bg-destructive rounded-full mr-2"></span>
                                        Out of Stock
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            {product.description && (
                                <div className="mb-8">
                                    <h2 className="font-medium text-foreground mb-2">Description</h2>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {product.description}
                                    </p>
                                </div>
                            )}

                            {/* Variation Types */}
                            {product.variationTypes?.length > 0 && (
                                <div className="space-y-4 mb-8">
                                    {product.variationTypes.map((variationType) => (
                                        <div key={variationType.name}>
                                            <h3 className="font-medium text-foreground mb-3">
                                                {variationType.name}: <span className="text-primary">{selectedOptions[variationType.name]}</span>
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {variationType.options?.map((option) => {
                                                    const isSelected = selectedOptions[variationType.name] === option;
                                                    const isAvailable = isOptionAvailable(variationType.name, option);

                                                    return (
                                                        <button
                                                            key={option}
                                                            onClick={() => handleOptionSelect(variationType.name, option)}
                                                            disabled={!isAvailable && !isSelected}
                                                            className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${isSelected
                                                                    ? "border-primary bg-primary/10 text-primary"
                                                                    : isAvailable
                                                                        ? "border-border text-foreground hover:border-primary"
                                                                        : "border-border text-muted-foreground line-through opacity-50 cursor-not-allowed"
                                                                }`}
                                                        >
                                                            {option}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Quantity */}
                            <div className="mb-8">
                                <h3 className="font-medium text-foreground mb-3">Quantity</h3>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                                    >
                                        −
                                    </button>
                                    <span className="w-12 text-center font-medium text-foreground">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() => setQuantity(Math.min(priceInfo.stock || 99, quantity + 1))}
                                        disabled={quantity >= priceInfo.stock}
                                        className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Add to Cart */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button
                                    disabled={!priceInfo.inStock}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-6 text-base font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {priceInfo.inStock
                                        ? `Add to Cart — ₹${priceInfo.price * quantity}`
                                        : "Out of Stock"
                                    }
                                </Button>
                                <Button
                                    variant="outline"
                                    className="px-6 py-6 border-2 border-foreground text-foreground hover:bg-foreground hover:text-background rounded-full"
                                >
                                    ❤️
                                </Button>
                            </div>

                            {/* Features */}
                            <div className="mt-8 pt-8 border-t border-border">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                                            🚚
                                        </div>
                                        <span className="text-sm text-muted-foreground">Free Shipping</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                                            🔄
                                        </div>
                                        <span className="text-sm text-muted-foreground">Easy Returns</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                                            🌿
                                        </div>
                                        <span className="text-sm text-muted-foreground">100% Natural</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                                            ✅
                                        </div>
                                        <span className="text-sm text-muted-foreground">Quality Assured</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
