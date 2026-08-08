import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Customer from "@/models/Customer";
import { withAdminProtection } from "@/lib/auth";
import { findVariantIndex, releaseStock } from "@/lib/stock";
import { recordSales } from "@/lib/sales";
import { round2 } from "@/lib/billing";

// POST - return items from an order and refund the money
async function postHandler(req, { params }) {
    try {
        const { id } = await params;
        const { items, reason = "", restock = true } = await req.json();

        if (!Array.isArray(items) || items.length === 0) {
            return Response.json(
                { success: false, message: "Select at least one item to return" },
                { status: 400 }
            );
        }

        await connectDB();

        const order = await Order.findById(id);
        if (!order) {
            return Response.json({ success: false, message: "Order not found" }, { status: 404 });
        }

        if (order.paymentStatus !== 'completed' && order.paymentStatus !== 'partially_refunded') {
            return Response.json(
                { success: false, message: "Only a paid order can be refunded" },
                { status: 400 }
            );
        }

        // Validate the requested quantities against what is still returnable,
        // and work out the refund from the price actually charged per unit.
        const accepted = [];
        let refundAmount = 0;

        for (const entry of items) {
            const index = parseInt(entry.itemIndex, 10);
            const quantity = parseInt(entry.quantity, 10);
            const line = order.items[index];

            if (!line) {
                return Response.json(
                    { success: false, message: "Unknown item in the return" },
                    { status: 400 }
                );
            }

            if (!(quantity > 0)) continue;

            const remaining = line.quantity - (line.returnedQuantity || 0);
            if (quantity > remaining) {
                return Response.json(
                    {
                        success: false,
                        message: `Only ${remaining} of ${line.name || 'that item'} can still be returned`,
                    },
                    { status: 400 }
                );
            }

            // Refund what the customer actually paid for this line, discounts
            // and tax included, pro-rated per unit.
            const lineNet = round2(
                line.priceAtOrder * line.quantity - (line.lineDiscount || 0)
            );
            const perUnit = line.quantity > 0 ? round2(lineNet / line.quantity) : 0;

            refundAmount = round2(refundAmount + perUnit * quantity);
            accepted.push({ index, quantity, line });
        }

        if (accepted.length === 0) {
            return Response.json(
                { success: false, message: "Nothing to return" },
                { status: 400 }
            );
        }

        // Never refund more than is left on the bill.
        const refundable = round2(order.totalAmount - (order.refundedAmount || 0));
        refundAmount = Math.min(refundAmount, refundable);

        if (refundAmount <= 0) {
            return Response.json(
                { success: false, message: "This order has already been fully refunded" },
                { status: 400 }
            );
        }

        // Put stock back. releaseStock is an atomic $inc, the same primitive the
        // sale used to take it out.
        if (restock) {
            for (const { line, quantity } of accepted) {
                const product = await Product.findById(line.product);
                if (!product) continue;

                const variantIndex = findVariantIndex(product, line.variant?.attributes);
                if (variantIndex >= 0) {
                    await releaseStock(product._id, variantIndex, quantity);
                }
            }
        }

        // Returned units stop counting as sales, so bestseller ranking reflects
        // what customers actually kept.
        await recordSales(
            accepted.map(({ line, quantity }) => ({ productId: line.product, quantity })),
            { reverse: true }
        );

        for (const { index, quantity } of accepted) {
            order.items[index].returnedQuantity =
                (order.items[index].returnedQuantity || 0) + quantity;
        }

        order.refunds.push({
            amount: refundAmount,
            reason,
            items: accepted.map(({ index, quantity }) => ({ itemIndex: index, quantity })),
            restocked: !!restock,
            processedBy: req.user._id,
        });

        order.refundedAmount = round2((order.refundedAmount || 0) + refundAmount);

        const fullyReturned = order.items.every(
            (line) => (line.returnedQuantity || 0) >= line.quantity
        );

        order.paymentStatus = order.refundedAmount >= order.totalAmount ? 'refunded' : 'partially_refunded';
        order.orderStatus = fullyReturned ? 'returned' : 'partially_returned';

        await order.save();

        // Keep the customer's lifetime spend honest.
        if (order.customer) {
            try {
                await Customer.updateOne(
                    { _id: order.customer },
                    { $inc: { totalSpent: -refundAmount } }
                );
            } catch (customerError) {
                console.error("Failed to adjust customer totals:", customerError);
            }
        }

        const updated = await Order.findById(order._id)
            .populate('items.product', 'name images')
            .lean();

        return Response.json({
            success: true,
            message: `Refunded ₹${refundAmount}`,
            refundAmount,
            order: updated,
        });
    } catch (error) {
        console.error("Refund error:", error);
        return Response.json(
            { success: false, message: error.message || "Server error" },
            { status: 500 }
        );
    }
}

export const POST = withAdminProtection(postHandler);
