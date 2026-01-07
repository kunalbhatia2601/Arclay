"use client";

import { useState, useEffect, use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export default function ProductDetailPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const { isAuthenticated } = useUser();
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addingToCart, setAddingToCart] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [quantity, setQuantity] = useState(1);

    // Review form state
    const [canReview, setCanReview] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewStars, setReviewStars] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        fetchProduct();
    }, [id]);

    useEffect(() => {
        if (isAuthenticated && id) {
            checkReviewEligibility();
        }
    }, [isAuthenticated, id]);

    const fetchProduct = async () => {
        try {
            const res = await fetch(`/api/products/${id}`);
            const data = await res.json();

            if (data.success) {
                setProduct(data.product);
                setReviews(data.reviews || []);
                setRelatedProducts(data.relatedProducts || []);
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

    const checkReviewEligibility = async () => {
        try {
            const res = await fetch(`/api/reviews?productId=${id}`, {
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                setCanReview(data.canReview);
            }
        } catch (error) {
            console.error("Failed to check review eligibility:", error);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!reviewComment.trim()) return;

        setSubmittingReview(true);
        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    productId: id,
                    stars: reviewStars,
                    comment: reviewComment.trim()
                })
            });
            const data = await res.json();
            if (data.success) {
                alert("Review submitted! It will be visible after admin approval.");
                setShowReviewForm(false);
                setReviewComment("");
                setCanReview(false);
            } else {
                alert(data.message || "Failed to submit review");
            }
        } catch (error) {
            console.error("Submit review error:", error);
            alert("Failed to submit review");
        } finally {
            setSubmittingReview(false);
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

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }

        if (!selectedVariant) {
            alert("Please select all options");
            return;
        }

        try {
            setAddingToCart(true);

            // Convert variant attributes to plain object
            const variantAttributes = selectedVariant.attributes instanceof Map
                ? Object.fromEntries(selectedVariant.attributes)
                : selectedVariant.attributes;

            const res = await fetch("/api/cart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    productId: product._id,
                    variantAttributes,
                    quantity
                }),
            });

            const data = await res.json();

            if (data.success) {
                alert("Added to cart!");
                router.push("/cart");
            } else {
                alert(data.message || "Failed to add to cart");
            }
        } catch (error) {
            console.error("Add to cart error:", error);
            alert("Failed to add to cart");
        } finally {
            setAddingToCart(false);
        }
    };

    const getRelatedProductPrice = (p) => {
        const firstVariant = p.variants?.[0];
        if (!firstVariant) return 0;
        return firstVariant.salePrice && firstVariant.salePrice < firstVariant.regularPrice
            ? firstVariant.salePrice
            : firstVariant.regularPrice;
    };

    const renderStars = (count) => {
        return Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={i < count ? "text-amber-500" : "text-border"}>★</span>
        ));
    };

    if (loading) {
        return (
            <>
                <main className="min-h-screen bg-background pt-20 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </main>
            </>
        );
    }

    if (!product) {
        return (
            <>
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
            </>
        );
    }

    return (
        <>
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
                                    onClick={handleAddToCart}
                                    disabled={!priceInfo.inStock || addingToCart}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-6 text-base font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {addingToCart
                                        ? "Adding..."
                                        : priceInfo.inStock
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

                    {/* Reviews Section */}
                    <section className="mt-16 pt-12 border-t border-border">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="font-serif text-2xl font-bold text-foreground">
                                {/* Show average of stars of all reviews/total reviews */}
                                Customer Reviews ({reviews.length > 0 ? (reviews.reduce((total, review) => total + review.stars, 0) / reviews.length).toFixed(2) : 0}⭐ • {reviews.length} reviews)
                            </h2>
                            {canReview && !showReviewForm && (
                                <Button
                                    onClick={() => setShowReviewForm(true)}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                                >
                                    Write a Review
                                </Button>
                            )}
                        </div>

                        {/* Review Form */}
                        {showReviewForm && (
                            <form onSubmit={handleSubmitReview} className="bg-muted/50 rounded-2xl p-6 mb-8">
                                <h3 className="font-semibold text-foreground mb-4">Write Your Review</h3>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-foreground mb-2">Rating</label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setReviewStars(star)}
                                                className={`text-2xl transition-colors ${star <= reviewStars ? 'text-amber-500' : 'text-border'}`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-foreground mb-2">Comment</label>
                                    <textarea
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                        placeholder="Share your experience with this product..."
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                        required
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        type="submit"
                                        disabled={submittingReview || !reviewComment.trim()}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                                    >
                                        {submittingReview ? "Submitting..." : "Submit Review"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowReviewForm(false)}
                                        className="rounded-full"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        )}

                        {/* Reviews List */}
                        {reviews.length > 0 ? (
                            <div className="space-y-6">
                                {reviews.slice(0, 5).map(review => (
                                    <div key={review._id} className="bg-card rounded-xl p-6 border border-border">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                                    {review.user?.name?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">{review.user?.name || 'Anonymous'}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(review.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex text-lg">{renderStars(review.stars)}</div>
                                        </div>
                                        <p className="text-muted-foreground">{review.comment}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-muted/30 rounded-2xl">
                                <p className="text-4xl mb-3">⭐</p>
                                <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                            </div>
                        )}
                    </section>

                    {/* Related Products Section */}
                    {relatedProducts.length > 0 && (
                        <section className="mt-16 pt-12 border-t border-border">
                            <h2 className="font-serif text-2xl font-bold text-foreground mb-8">
                                Related Products
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                                {relatedProducts.map(p => (
                                    <Link
                                        key={p._id}
                                        href={`/products/${p._id}`}
                                        className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                                    >
                                        <div className="aspect-square bg-muted overflow-hidden">
                                            {p.images?.[0] ? (
                                                <img
                                                    src={p.images[0]}
                                                    alt={p.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            {p.category && (
                                                <p className="text-xs text-primary font-medium uppercase tracking-wide mb-1 hidden sm:block">
                                                    {p.category.name}
                                                </p>
                                            )}
                                            <h3 className="font-serif text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                                {p.name}
                                            </h3>
                                            <p className="font-bold text-foreground mt-2">₹{getRelatedProductPrice(p)}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </>
    );
}

