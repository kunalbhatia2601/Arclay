import connectDB from "@/lib/mongodb";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import { withProtection } from "@/lib/auth";

// Helper function to safely convert attributes to plain object
function attributesToObject(attrs) {
    if (!attrs) return {};
    if (attrs instanceof Map) return Object.fromEntries(attrs);
    if (typeof attrs === 'object' && attrs.constructor === Object) return attrs;
    // Handle Mongoose Map that's been leaned
    if (attrs._bsontype === 'Map' || (attrs.$__ && attrs.$__)) {
        // It's a Mongoose document, convert to plain object
        return JSON.parse(JSON.stringify(attrs));
    }
    return attrs;
}

// GET user's cart
async function getHandler(req) {
    try {
        await connectDB();

        let cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product')
            .lean();

        if (!cart) {
            cart = { items: [] };
        }

        // Calculate totals and validate stock
        const enhancedItems = cart.items?.map(item => {
            if (!item.product) return null;

            // Find matching variant
            const variant = item.product.variants?.find(v => {
                const vAttrs = attributesToObject(v.attributes);
                const cartAttrs = attributesToObject(item.variantAttributes);
                return JSON.stringify(vAttrs) === JSON.stringify(cartAttrs);
            });

            if (!variant) return null;

            const price = variant.salePrice || variant.regularPrice;
            const subtotal = price * item.quantity;

            return {
                _id: item._id,
                product: {
                    _id: item.product._id,
                    name: item.product.name,
                    images: item.product.images,
                    isActive: item.product.isActive
                },
                variant: {
                    attributes: attributesToObject(item.variantAttributes),
                    price,
                    stock: variant.stock,
                    sku: variant.sku
                },
                quantity: item.quantity,
                subtotal,
                available: variant.stock >= item.quantity && item.product.isActive
            };
        }).filter(Boolean);

        const total = enhancedItems.reduce((sum, item) => sum + item.subtotal, 0);
        const itemCount = enhancedItems.reduce((sum, item) => sum + item.quantity, 0);

        return Response.json({
            success: true,
            cart: {
                items: enhancedItems,
                total,
                itemCount
            }
        });
    } catch (error) {
        console.error("Get cart error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

// POST add to cart or update quantity
async function postHandler(req) {
    try {
        const { productId, variantAttributes, quantity } = await req.json();

        if (!productId || !variantAttributes || !quantity) {
            return Response.json(
                { success: false, message: "Product, variant, and quantity are required" },
                { status: 400 }
            );
        }

        if (quantity < 1) {
            return Response.json(
                { success: false, message: "Quantity must be at least 1" },
                { status: 400 }
            );
        }

        await connectDB();

        // Verify product and variant exist
        const product = await Product.findById(productId);

        if (!product || !product.isActive) {
            return Response.json(
                { success: false, message: "Product not found or inactive" },
                { status: 404 }
            );
        }

        // Find matching variant
        const variant = product.variants.find(v => {
            const vAttrs = attributesToObject(v.attributes);
            return JSON.stringify(vAttrs) === JSON.stringify(variantAttributes);
        });

        if (!variant) {
            return Response.json(
                { success: false, message: "Variant not found" },
                { status: 404 }
            );
        }

        if (variant.stock < quantity) {
            return Response.json(
                { success: false, message: `Only ${variant.stock} items in stock` },
                { status: 400 }
            );
        }

        // Get or create cart
        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            cart = await Cart.create({
                user: req.user._id,
                items: []
            });
        }

        // Check if item already in cart
        const existingItemIndex = cart.items.findIndex(item => {
            return item.product.toString() === productId &&
                JSON.stringify(attributesToObject(item.variantAttributes)) === JSON.stringify(variantAttributes);
        });

        if (existingItemIndex > -1) {
            // Update quantity
            cart.items[existingItemIndex].quantity = quantity;
        } else {
            // Add new item
            cart.items.push({
                product: productId,
                variantAttributes: new Map(Object.entries(variantAttributes)),
                quantity
            });
        }

        await cart.save();

        // Return updated cart
        cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product')
            .lean();

        return Response.json({
            success: true,
            message: "Cart updated",
            cart
        });
    } catch (error) {
        console.error("Add to cart error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withProtection(getHandler);
export const POST = withProtection(postHandler);
