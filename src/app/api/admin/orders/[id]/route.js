import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { withAdminProtection } from "@/lib/auth";

// GET order by ID (admin)
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

        return Response.json({
            success: true,
            order
        });
    } catch (error) {
        console.error("Get admin order error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

// PUT update order (admin)
async function putHandler(req, { params }) {
    try {
        const { id } = await params;
        const updates = await req.json();

        await connectDB();

        const order = await Order.findById(id);

        if (!order) {
            return Response.json(
                { success: false, message: "Order not found" },
                { status: 404 }
            );
        }

        // Update allowed fields
        if (updates.orderStatus) {
            const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
            if (validStatuses.includes(updates.orderStatus)) {
                order.orderStatus = updates.orderStatus;
            }
        }

        if (updates.paymentStatus) {
            const validPaymentStatuses = ['pending', 'completed', 'failed', 'refunded'];
            if (validPaymentStatuses.includes(updates.paymentStatus)) {
                order.paymentStatus = updates.paymentStatus;
            }
        }

        if (updates.paymentId) {
            order.paymentId = updates.paymentId;
        }

        if (updates.notes !== undefined) {
            order.notes = updates.notes;
        }

        await order.save();

        const updatedOrder = await Order.findById(id)
            .populate('items.product', 'name images')
            .populate('user', 'name email phone')
            .lean();

        return Response.json({
            success: true,
            message: "Order updated successfully",
            order: updatedOrder
        });
    } catch (error) {
        console.error("Update order error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAdminProtection(getHandler);
export const PUT = withAdminProtection(putHandler);
