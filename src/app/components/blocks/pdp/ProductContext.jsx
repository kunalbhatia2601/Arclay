"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { initialSelection, findVariant, optionExists, snapSelection } from "@/lib/variantSelection";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useUser } from "@/context/UserContext";

/**
 * Shared state for every product-detail block.
 *
 * The page is assembled from independent blocks that still have to agree on
 * one thing: the selected variant. Picking a size in the variants block has to
 * move the price block, the stock label and the add-to-cart button, so that
 * selection lives here rather than inside any one block.
 */
const ProductContext = createContext(null);

export function useProduct() {
    const context = useContext(ProductContext);
    if (!context) {
        throw new Error("Product blocks must be rendered inside <ProductProvider>");
    }
    return context;
}

export default function ProductProvider({ product, reviews = [], relatedProducts = [], meta, children }) {
    const router = useRouter();
    const { isAuthenticated } = useUser();

    const [selectedOptions, setSelectedOptions] = useState(() => initialSelection(product));

    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [busy, setBusy] = useState(false);

    const selectedVariant = useMemo(() => findVariant(product, selectedOptions), [product, selectedOptions]);

    const price = useMemo(() => {
        if (!selectedVariant) {
            return { price: 0, originalPrice: null, hasSale: false, stock: 0, inStock: false, discountPercent: 0, saving: 0 };
        }

        const hasSale =
            selectedVariant.salePrice != null &&
            selectedVariant.salePrice < selectedVariant.regularPrice;

        return {
            price: hasSale ? selectedVariant.salePrice : selectedVariant.regularPrice,
            originalPrice: hasSale ? selectedVariant.regularPrice : null,
            hasSale,
            stock: selectedVariant.stock || 0,
            inStock: (selectedVariant.stock || 0) > 0,
            saving: hasSale ? selectedVariant.regularPrice - selectedVariant.salePrice : 0,
            discountPercent: hasSale
                ? Math.round((1 - selectedVariant.salePrice / selectedVariant.regularPrice) * 100)
                : 0,
        };
    }, [selectedVariant]);

    const averageRating = useMemo(() => {
        if (!reviews.length) return 0;
        return Number((reviews.reduce((total, r) => total + (r.stars || 0), 0) / reviews.length).toFixed(1));
    }, [reviews]);

    // An option is offered whenever any variant carries it; picking one that
    // doesn't fit the current combo snaps the other dimensions (see setOption)
    // instead of greying it out.
    const isOptionAvailable = (typeName, option) => optionExists(product, typeName, option);

    const addToCart = async ({ thenCheckout = false } = {}) => {
        if (!isAuthenticated) return router.push("/login");
        if (!selectedVariant) return toast.error("Please select all options");
        if (!price.inStock) return toast.error("This option is out of stock");

        setBusy(true);
        try {
            const res = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    productId: product._id,
                    variantAttributes: selectedVariant.attributes || {},
                    quantity,
                }),
            });
            const data = await res.json();

            if (!data.success) return toast.error(data.message || "Failed to add to cart");
            if (thenCheckout) router.push("/checkout");
            else toast.success("Added to cart!");
        } catch {
            toast.error("Failed to add to cart");
        } finally {
            setBusy(false);
        }
    };

    const value = {
        product,
        reviews,
        relatedProducts,
        meta,
        selectedOptions,
        setOption: (name, option) => setSelectedOptions(o => snapSelection(product, o, name, option)),
        isOptionAvailable,
        selectedVariant,
        price,
        quantity,
        setQuantity,
        selectedImage,
        setSelectedImage,
        averageRating,
        busy,
        addToCart,
    };

    return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}
