"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export default function ProductDetailPage({ params }) {
    const { id } = use(params);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedVariations, setSelectedVariations] = useState({});
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
                // Initialize selected variations
                const initialVariations = {};
                data.product.variations?.forEach((v) => {
                    if (v.options?.length > 0) {
                        initialVariations[v.name] = v.options[0];
                    }
                });
                setSelectedVariations(initialVariations);
            }
        } catch (error) {
            console.error("Failed to fetch product:", error);
        } finally {
            setLoading(false);
        }
    };

    const getCalculatedPrice = () => {
        if (!product) return 0;
        let basePrice = product.salePrice || product.regularPrice;

        // Add price modifiers from selected variations
        Object.values(selectedVariations).forEach((option) => {
            if (option?.priceModifier) {
                basePrice += option.priceModifier;
            }
        });

        return basePrice;
    };

    const handleVariationSelect = (variationName, option) => {
        setSelectedVariations((prev) => ({
            ...prev,
            [variationName]: option,
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
                            <div className="aspect-square bg-muted rounded-2xl overflow-hidden">
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
                                    ₹{getCalculatedPrice()}
                                </span>
                                {product.salePrice && (
                                    <>
                                        <span className="text-xl text-muted-foreground line-through">
                                            ₹{product.regularPrice}
                                        </span>
                                        <span className="bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full">
                                            {Math.round((1 - product.salePrice / product.regularPrice) * 100)}% OFF
                                        </span>
                                    </>
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

                            {/* Variations */}
                            {product.variations?.length > 0 && (
                                <div className="space-y-4 mb-8">
                                    {product.variations.map((variation) => (
                                        <div key={variation.name}>
                                            <h3 className="font-medium text-foreground mb-3">
                                                {variation.name}
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {variation.options?.map((option) => (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => handleVariationSelect(variation.name, option)}
                                                        className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${selectedVariations[variation.name]?.value === option.value
                                                                ? "border-primary bg-primary/10 text-primary"
                                                                : "border-border text-foreground hover:border-primary"
                                                            }`}
                                                    >
                                                        {option.value}
                                                        {option.priceModifier !== 0 && (
                                                            <span className="ml-1 text-xs text-muted-foreground">
                                                                ({option.priceModifier > 0 ? "+" : ""}₹{option.priceModifier})
                                                            </span>
                                                        )}
                                                    </button>
                                                ))}
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
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-10 h-10 rounded-lg border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Add to Cart */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-6 text-base font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                                    Add to Cart — ₹{getCalculatedPrice() * quantity}
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
