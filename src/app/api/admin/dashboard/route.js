import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { withAdmin } from "@/lib/auth";
import { resolveDashboardRange, trendUnit, TZ } from "@/lib/dashboardRange";
import { demandProducts, orderMatch } from "@/lib/dashboardProducts";

const lineCogs = {
    $reduce: {
        input: { $ifNull: ["$items", []] },
        initialValue: 0,
        in: {
            $add: [
                "$$value",
                {
                    $multiply: [
                        {
                            $max: [
                                0,
                                {
                                    $subtract: [
                                        "$$this.quantity",
                                        { $ifNull: ["$$this.returnedQuantity", 0] },
                                    ],
                                },
                            ],
                        },
                        { $ifNull: ["$$this.costAtOrder", 0] },
                    ],
                },
            ],
        },
    },
};

const missingCostUnits = {
    $reduce: {
        input: { $ifNull: ["$items", []] },
        initialValue: 0,
        in: {
            $add: [
                "$$value",
                {
                    $cond: [
                        {
                            $or: [
                                { $eq: ["$$this.costAtOrder", null] },
                                { $eq: [{ $type: "$$this.costAtOrder" }, "missing"] },
                            ],
                        },
                        {
                            $max: [
                                0,
                                {
                                    $subtract: [
                                        "$$this.quantity",
                                        { $ifNull: ["$$this.returnedQuantity", 0] },
                                    ],
                                },
                            ],
                        },
                        0,
                    ],
                },
            ],
        },
    },
};

function fillTrend(points, unit, from, to) {
    if (!from || !to || unit === "month") return points;

    const step = unit === "hour" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const byMs = new Map(points.map((p) => [new Date(p.at).getTime(), p]));
    const out = [];

    for (let t = from.getTime(); t < to.getTime(); t += step) {
        out.push(byMs.get(t) || { at: new Date(t), orders: 0, sales: 0, profit: 0 });
    }

    return out;
}

async function handler(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const bounds = resolveDashboardRange(
            searchParams.get("range"),
            searchParams.get("from"),
            searchParams.get("to")
        );

        const match = orderMatch(bounds);

        const unit = trendUnit(bounds.key, bounds.from, bounds.to);

        const [totals] = await Order.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    orders: { $sum: 1 },
                    sales: {
                        $sum: {
                            $subtract: [
                                { $ifNull: ["$totalAmount", 0] },
                                { $ifNull: ["$refundedAmount", 0] },
                            ],
                        },
                    },
                    cogs: { $sum: lineCogs },
                    missingCostUnits: { $sum: missingCostUnits },
                },
            },
        ]);

        const trendRows = await Order.aggregate([
            { $match: match },
            {
                $group: {
                    _id: {
                        $dateTrunc: {
                            date: "$createdAt",
                            unit,
                            timezone: TZ,
                        },
                    },
                    orders: { $sum: 1 },
                    sales: {
                        $sum: {
                            $subtract: [
                                { $ifNull: ["$totalAmount", 0] },
                                { $ifNull: ["$refundedAmount", 0] },
                            ],
                        },
                    },
                    cogs: { $sum: lineCogs },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const mapped = trendRows.map((row) => ({
            at: row._id,
            orders: row.orders,
            sales: row.sales,
            profit: Number(row.sales || 0) - Number(row.cogs || 0),
        }));

        const points = fillTrend(mapped, unit, bounds.from, bounds.to);

        const demand = await demandProducts({ match, search: "", page: 1, limit: 5 });
        const sales = Number(totals?.sales || 0);
        const cogs = Number(totals?.cogs || 0);
        const profit = sales - cogs;
        const orders = Number(totals?.orders || 0);
        const missingCostUnitsCount = Number(totals?.missingCostUnits || 0);

        return Response.json({
            success: true,
            range: {
                key: bounds.key,
                label: bounds.label,
                from: bounds.from ? bounds.from.toISOString() : null,
                to: bounds.to ? bounds.to.toISOString() : null,
            },
            stats: {
                sales,
                orders,
                cogs,
                profit,
                margin: sales > 0 ? (profit / sales) * 100 : 0,
                missingCostUnits: missingCostUnitsCount,
            },
            trend: {
                unit,
                points,
            },
            demand: demand.products,
        });
    } catch (error) {
        console.error("Dashboard error:", error);
        return Response.json(
            { success: false, message: error.message || "Server error" },
            { status: 500 }
        );
    }
}

export const GET = withAdmin(handler);
