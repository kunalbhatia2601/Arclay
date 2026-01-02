import connectDB from "@/lib/mongodb";
import Cart from "@/models/Cart";
import { withProtection } from "@/lib/auth";

// PUT update cart item quantity
async function putHandler(req, { params }) {
    try {
        const { id } = await params;
        const { quantity } = await req.json();

        if (!quantity || quantity < 1) {
            return Response.json(
                { success: false, message: "Invalid quantity" },
                { status: 400 }
            );
        }

        await connectDB();

        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return Response.json(
                { success: false, message: "Cart not found" },
                { status: 404 }
            );
        }

        const item = cart.items.id(id);

        if (!item) {
            return Response.json(
                { success: false, message: "Item not found in cart" },
                { status: 404 }
            );
        }

        item.quantity = quantity;
        await cart.save();

        return Response.json({
            success: true,
            message: "Cart item updated"
        });
    } catch (error) {
        console.error("Update cart item error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

// DELETE remove item from cart
async function deleteHandler(req, { params }) {
    try {
        const { id } = await params;

        await connectDB();

        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return Response.json(
                { success: false, message: "Cart not found" },
                { status: 404 }
            );
        }

        cart.items = cart.items.filter(item => item._id.toString() !== id);
        await cart.save();

        return Response.json({
            success: true,
            message: "Item removed from cart"
        });
    } catch (error) {
        console.error("Remove cart item error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const PUT = withProtection(putHandler);
export const DELETE = withProtection(deleteHandler);
