import Order from "@/models/Order";
import Product from "@/models/Product";
import { escapeRegex } from "@/lib/utils";

export const QUALIFYING_ORDERS = {
    paymentStatus: { $nin: ["failed"] },
    orderStatus: { $nin: ["cancelled"] },
};

export function orderMatch(bounds) {
    const match = { ...QUALIFYING_ORDERS };
    if (bounds.from && bounds.to) {
        match.createdAt = { $gte: bounds.from, $lt: bounds.to };
    }
    return match;
}

const soldQty = {
    $max: [
        0,
        {
            $subtract: [
                "$items.quantity",
                { $ifNull: ["$items.returnedQuantity", 0] },
            ],
        },
    ],
};

async function salesByProduct(match) {
    return Order.aggregate([
        { $match: match },
        { $unwind: "$items" },
        { $addFields: { sold: soldQty } },
        { $match: { sold: { $gt: 0 } } },
        {
            $group: {
                _id: "$items.product",
                units: { $sum: "$sold" },
                sales: {
                    $sum: {
                        $multiply: ["$sold", { $ifNull: ["$items.priceAtOrder", 0] }],
                    },
                },
            },
        },
    ]);
}

function shape(product, stats) {
    return {
        _id: product._id,
        name: product.name,
        image: product.images?.[0] || "",
        totalStock: product.totalStock ?? 0,
        units: stats?.units || 0,
        sales: stats?.sales || 0,
    };
}

export async function demandProducts({ match, search = "", page = 1, limit = 5 }) {
    const q = String(search || "").trim();
    const stats = await salesByProduct(match);
    const statsById = new Map(stats.map((row) => [String(row._id), row]));

    if (q) {
        const filter = { name: { $regex: escapeRegex(q), $options: "i" } };
        const skip = (page - 1) * limit;
        const [products, total] = await Promise.all([
            Product.find(filter)
                .select("name images totalStock")
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Product.countDocuments(filter),
        ]);

        return {
            products: products.map((p) => shape(p, statsById.get(String(p._id)))),
            pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
        };
    }

    const ranked = [...stats].sort((a, b) => b.units - a.units || b.sales - a.sales);
    const slice = ranked.slice((page - 1) * limit, page * limit);
    const ids = slice.map((row) => row._id).filter(Boolean);
    const products = await Product.find({ _id: { $in: ids } })
        .select("name images totalStock")
        .lean();
    const productById = new Map(products.map((p) => [String(p._id), p]));

    return {
        products: slice
            .map((row) => {
                const product = productById.get(String(row._id));
                if (!product) return null;
                return shape(product, row);
            })
            .filter(Boolean),
        pagination: {
            page,
            limit,
            total: ranked.length,
            pages: Math.max(1, Math.ceil(ranked.length / limit)),
        },
    };
}

export async function lowStockProducts({ search = "", page = 1, limit = 10 }) {
    const q = String(search || "").trim();
    const filter = q ? { name: { $regex: escapeRegex(q), $options: "i" } } : {};
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
        Product.find(filter)
            .select("name images totalStock")
            .sort({ totalStock: 1, name: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Product.countDocuments(filter),
    ]);

    return {
        products: products.map((p) => ({
            _id: p._id,
            name: p.name,
            image: p.images?.[0] || "",
            totalStock: p.totalStock ?? 0,
        })),
        pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    };
}
