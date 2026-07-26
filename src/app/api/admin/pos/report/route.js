import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { withAdminProtection } from "@/lib/auth";
import { round2 } from "@/lib/billing";

// GET - counter summary for a single day (the X/Z report used at closing)
async function getHandler(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const dateParam = searchParams.get("date");

        // Local calendar day, so "today" matches what the shop considers today.
        const day = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date();
        const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const orders = await Order.find({
            source: 'pos',
            createdAt: { $gte: start, $lt: end },
        })
            .sort({ createdAt: 1 })
            .lean();

        const byPayment = {};
        const productTally = new Map();

        let grossSales = 0;
        let discounts = 0;
        let tax = 0;
        let refunds = 0;
        let itemsSold = 0;

        for (const order of orders) {
            const method = order.paymentMethod || 'cash';
            if (!byPayment[method]) {
                byPayment[method] = { method, orders: 0, amount: 0, refunded: 0 };
            }

            byPayment[method].orders += 1;
            byPayment[method].amount = round2(byPayment[method].amount + order.totalAmount);
            byPayment[method].refunded = round2(
                byPayment[method].refunded + (order.refundedAmount || 0)
            );

            grossSales = round2(grossSales + order.totalAmount);
            discounts = round2(
                discounts + (order.discountAmount || 0) + (order.lineDiscountTotal || 0)
            );
            tax = round2(tax + (order.taxAmount || 0));
            refunds = round2(refunds + (order.refundedAmount || 0));

            for (const line of order.items || []) {
                const sold = line.quantity - (line.returnedQuantity || 0);
                if (sold <= 0) continue;

                itemsSold += sold;

                const key = line.name || String(line.product);
                const row = productTally.get(key) || { name: key, quantity: 0, amount: 0 };
                row.quantity += sold;
                row.amount = round2(row.amount + line.priceAtOrder * sold);
                productTally.set(key, row);
            }
        }

        const topProducts = [...productTally.values()]
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);

        return Response.json({
            success: true,
            date: start.toISOString().slice(0, 10),
            summary: {
                orderCount: orders.length,
                itemsSold,
                grossSales,
                discounts,
                tax,
                refunds,
                netSales: round2(grossSales - refunds),
                averageBill: orders.length ? round2(grossSales / orders.length) : 0,
            },
            byPayment: Object.values(byPayment),
            topProducts,
        });
    } catch (error) {
        console.error("POS report error:", error);
        return Response.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAdminProtection(getHandler);
