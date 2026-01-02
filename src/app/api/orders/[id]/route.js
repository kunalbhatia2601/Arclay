import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { withAuth } from "@/lib/auth";

// GET order by ID (user must own the order)
async function getHandler(req, { params }) {
    try {
        const { id } = await params;

        await connectDB();

        const order = await Order.findById(id)
            .populate('items.product', 'name images')
            .populate('user', 'name email phone')
            .lean();

        if (!order) {
            return Response.json(
                { success: false, message: "Order not found" },
                { status: 404 }
            );
        }

        // Verify ownership
        if (order.user._id.toString() !== req.user._id.toString()) {
            return Response.json(
                { success: false, message: "Unauthorized" },
                { status: 403 }
            );
        }

        return Response.json({
            success: true,
            order
        });
    } catch (error) {
        console.error("Get order error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAuth(getHandler);
