"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { IndianRupee, Package, Search, ShoppingBag, TrendingUp } from "lucide-react";

const RANGES = [
    { key: "today", label: "Today" },
    { key: "week", label: "This week" },
    { key: "month", label: "This month" },
    { key: "overall", label: "Overall" },
    { key: "custom", label: "Custom" },
];

const money = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

function formatPointLabel(iso, unit) {
    const d = new Date(iso);
    if (unit === "hour") {
        return d.toLocaleString("en-IN", { hour: "numeric", hour12: true, timeZone: "Asia/Kolkata" });
    }
    if (unit === "month") {
        return d.toLocaleString("en-IN", { month: "short", year: "2-digit", timeZone: "Asia/Kolkata" });
    }
    return d.toLocaleString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

export default function AdminDashboard() {
    const [range, setRange] = useState("today");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [demandSearch, setDemandSearch] = useState("");
    const [demandQuery, setDemandQuery] = useState("");
    const [demandPage, setDemandPage] = useState(1);
    const [demand, setDemand] = useState({ products: [], pagination: { page: 1, pages: 1, total: 0 } });
    const [demandLoading, setDemandLoading] = useState(false);

    const [stockSearch, setStockSearch] = useState("");
    const [stockQuery, setStockQuery] = useState("");
    const [stockPage, setStockPage] = useState(1);
    const [stock, setStock] = useState({ products: [], pagination: { page: 1, pages: 1, total: 0 } });
    const [stockLoading, setStockLoading] = useState(false);

    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams({ range });
            if (range === "custom") {
                if (from) params.set("from", from);
                if (to) params.set("to", to);
            }
            const res = await fetch(`/api/admin/dashboard?${params}`, { credentials: "include" });
            const json = await res.json();
            if (json.success) {
                setData(json);
                if (!demandQuery) {
                    setDemand({
                        products: json.demand || [],
                        pagination: { page: 1, pages: 1, total: (json.demand || []).length },
                    });
                }
            }
            else setError(json.message || "Failed to load dashboard");
        } catch (err) {
            console.error(err);
            setError("Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    }, [range, from, to]);

    useEffect(() => {
        if (range === "custom" && (!from || !to)) {
            setLoading(false);
            return;
        }
        fetchDashboard();
    }, [fetchDashboard, range, from, to]);

    useEffect(() => {
        const t = setTimeout(() => {
            setDemandQuery(demandSearch.trim());
            setDemandPage(1);
        }, 350);
        return () => clearTimeout(t);
    }, [demandSearch]);

    useEffect(() => {
        const t = setTimeout(() => {
            setStockQuery(stockSearch.trim());
            setStockPage(1);
        }, 350);
        return () => clearTimeout(t);
    }, [stockSearch]);

    const rangeReady = range !== "custom" || (from && to);

    const fetchDemand = useCallback(async () => {
        if (!rangeReady) return;
        setDemandLoading(true);
        try {
            const params = new URLSearchParams({ range, page: String(demandPage) });
            if (range === "custom") {
                params.set("from", from);
                params.set("to", to);
            }
            if (demandQuery) params.set("search", demandQuery);
            const res = await fetch(`/api/admin/dashboard/demand?${params}`, { credentials: "include" });
            const json = await res.json();
            if (json.success) setDemand(json);
        } catch (err) {
            console.error(err);
        } finally {
            setDemandLoading(false);
        }
    }, [range, from, to, demandQuery, demandPage, rangeReady]);

    useEffect(() => {
        if (!demandQuery && data?.demand) {
            setDemand({
                products: data.demand,
                pagination: { page: 1, pages: 1, total: data.demand.length },
            });
        }
    }, [demandQuery, data]);

    useEffect(() => {
        if (!demandQuery) return;
        fetchDemand();
    }, [fetchDemand, demandQuery, demandPage]);

    const fetchStock = useCallback(async () => {
        setStockLoading(true);
        try {
            const params = new URLSearchParams({ page: String(stockPage) });
            if (stockQuery) params.set("search", stockQuery);
            const res = await fetch(`/api/admin/dashboard/stock?${params}`, { credentials: "include" });
            const json = await res.json();
            if (json.success) setStock(json);
        } catch (err) {
            console.error(err);
        } finally {
            setStockLoading(false);
        }
    }, [stockQuery, stockPage]);

    useEffect(() => {
        fetchStock();
    }, [fetchStock]);

    const maxSales = useMemo(() => {
        const points = data?.trend?.points || [];
        return Math.max(1, ...points.map((p) => Number(p.sales || 0)));
    }, [data]);

    const stats = data?.stats;
    const profitNegative = (stats?.profit || 0) < 0;

    return (
        <div className="space-y-8 pb-16">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="font-serif text-4xl font-black text-[#2A2F25] tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-[#869661] font-bold uppercase tracking-[0.18em] text-[11px] mt-2">
                        {data?.range?.label || "Sales, orders, and profit"}
                    </p>
                </div>

                <div className="flex flex-col items-stretch sm:items-end gap-3">
                    <div className="flex flex-wrap gap-2">
                        {RANGES.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setRange(item.key)}
                                className={`px-4 py-2 rounded-full text-[12px] font-bold tracking-wide transition-colors ${
                                    range === item.key
                                        ? "bg-[#869661] text-white"
                                        : "bg-white border border-[#2A2F25]/10 text-[#2A2F25] hover:bg-[#2A2F25]/5"
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                    {range === "custom" && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="px-3 py-2 rounded-xl border border-[#2A2F25]/10 bg-white text-sm"
                            />
                            <span className="text-[#767B71] text-sm">to</span>
                            <input
                                type="date"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="px-3 py-2 rounded-xl border border-[#2A2F25]/10 bg-white text-sm"
                            />
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-[40vh] gap-4">
                    <div className="w-10 h-10 border-4 border-[#869661] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[#869661] font-bold uppercase tracking-widest text-xs">Loading</p>
                </div>
            ) : error ? (
                <p className="text-rose-600 font-medium">{error}</p>
            ) : range === "custom" && (!from || !to) ? (
                <p className="text-[#767B71]">Pick a start and end date.</p>
            ) : (
                <>
                    <div className="grid sm:grid-cols-3 gap-5">
                        <StatCard
                            title="Sales"
                            value={money(stats?.sales)}
                            subtext="Net of refunds"
                            icon={IndianRupee}
                            color="#D86B4B"
                        />
                        <StatCard
                            title="Orders"
                            value={Number(stats?.orders || 0).toLocaleString("en-IN")}
                            subtext="Excludes failed & cancelled"
                            icon={ShoppingBag}
                            color="#869661"
                        />
                        <StatCard
                            title="P/L"
                            value={money(stats?.profit)}
                            subtext={`${Number(stats?.margin || 0).toFixed(1)}% margin · COGS ${money(stats?.cogs)}`}
                            icon={TrendingUp}
                            color={profitNegative ? "#B45309" : "#4A5D23"}
                            negative={profitNegative}
                        />
                    </div>

                    {stats?.missingCostUnits > 0 && (
                        <p className="text-[13px] text-amber-800 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                            {stats.missingCostUnits.toLocaleString("en-IN")} sold units in this range have no cost price, so profit is overstated for those lines.
                        </p>
                    )}

                    <div className="bg-white/80 rounded-[2rem] p-6 sm:p-8 border border-[#ECE8E0]/80">
                        <div className="flex items-baseline justify-between gap-4 mb-8">
                            <div>
                                <h2 className="font-serif text-2xl font-bold text-[#2A2F25]">
                                    Performance trends
                                </h2>
                                <p className="text-[13px] text-[#767B71] mt-1">
                                    Net sales by {data?.trend?.unit === "hour" ? "hour" : data?.trend?.unit === "month" ? "month" : "day"}
                                </p>
                            </div>
                        </div>

                        {(data?.trend?.points || []).length === 0 ? (
                            <p className="text-[#767B71] py-16 text-center">No orders in this range.</p>
                        ) : (
                            <div className="relative h-64 flex items-end gap-1.5 sm:gap-2.5">
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="w-full h-px bg-[#ECE8E0]" />
                                    ))}
                                </div>
                                {data.trend.points.map((point) => {
                                    const height = `${Math.max(4, (Number(point.sales) / maxSales) * 100)}%`;
                                    return (
                                        <div key={String(point.at)} className="relative flex-1 min-w-0 group h-full flex flex-col justify-end">
                                            <div
                                                className="w-full rounded-t-lg bg-gradient-to-t from-[#869661]/30 to-[#869661] hover:to-[#4A5D23] transition-colors"
                                                style={{ height }}
                                                title={`${formatPointLabel(point.at, data.trend.unit)} · ${money(point.sales)} · ${point.orders} orders`}
                                            />
                                            <p className="text-center mt-2 text-[10px] font-bold text-[#767B71] truncate">
                                                {formatPointLabel(point.at, data.trend.unit)}
                                            </p>
                                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 pointer-events-none bg-[#2A2F25] text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap z-10">
                                                {money(point.sales)} · {point.orders} ord.
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="grid lg:grid-cols-2 gap-5">
                        <ProductPanel
                            title="In demand"
                            subtitle={`Top sellers in ${data?.range?.label || "this period"}`}
                            search={demandSearch}
                            onSearch={setDemandSearch}
                            searchPlaceholder="Search any product"
                            loading={demandLoading}
                            products={demand.products}
                            empty="No sales in this range."
                            pagination={demandQuery ? demand.pagination : null}
                            onPage={setDemandPage}
                            renderMeta={(p) => (
                                <>
                                    <p className="text-[15px] font-black text-[#2A2F25]">{p.units} sold</p>
                                    <p className="text-[11px] text-[#767B71] font-medium">{money(p.sales)}</p>
                                </>
                            )}
                        />
                        <ProductPanel
                            title="Low stock"
                            subtitle="Lowest stock across the catalog"
                            search={stockSearch}
                            onSearch={setStockSearch}
                            searchPlaceholder="Search products"
                            loading={stockLoading}
                            products={stock.products}
                            empty="No products found."
                            pagination={stock.pagination}
                            onPage={setStockPage}
                            renderMeta={(p) => (
                                <p className={`text-[15px] font-black ${p.totalStock <= 0 ? "text-rose-600" : p.totalStock <= 10 ? "text-amber-700" : "text-[#2A2F25]"}`}>
                                    {p.totalStock} left
                                </p>
                            )}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

function StatCard({ title, value, subtext, icon: Icon, color, negative }) {
    return (
        <div className="bg-white/80 rounded-[2rem] p-6 sm:p-7 border border-[#2A2F25]/5">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-3 min-w-0">
                    <p className="text-[#869661] text-[11px] font-bold uppercase tracking-[0.18em]">
                        {title}
                    </p>
                    <h3 className={`font-serif text-[32px] sm:text-[36px] font-black leading-none truncate ${negative ? "text-amber-800" : "text-[#2A2F25]"}`}>
                        {value}
                    </h3>
                    <p className="text-[12px] text-[#767B71] font-medium">{subtext}</p>
                </div>
                <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}18` }}
                >
                    <Icon className="w-6 h-6" style={{ color }} />
                </div>
            </div>
        </div>
    );
}

function ProductPanel({
    title,
    subtitle,
    search,
    onSearch,
    searchPlaceholder,
    loading,
    products,
    empty,
    pagination,
    onPage,
    renderMeta,
}) {
    return (
        <div className="bg-white/80 rounded-[2rem] p-6 sm:p-7 border border-[#ECE8E0]/80">
            <div className="mb-5">
                <h2 className="font-serif text-2xl font-bold text-[#2A2F25]">{title}</h2>
                <p className="text-[13px] text-[#767B71] mt-1">{subtitle}</p>
            </div>
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#767B71]" />
                <input
                    type="search"
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#2A2F25]/10 bg-white text-sm"
                />
            </div>
            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="w-7 h-7 border-4 border-[#869661] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : products.length === 0 ? (
                <p className="text-[#767B71] text-sm py-8 text-center">{empty}</p>
            ) : (
                <ul className="divide-y divide-[#ECE8E0]/80">
                    {products.map((p) => (
                        <li key={p._id}>
                            <Link
                                href={`/admin/products/${p._id}/edit`}
                                className="flex items-center gap-3 py-3 hover:bg-[#869661]/5 rounded-xl px-1 -mx-1"
                            >
                                {p.image ? (
                                    <img src={p.image} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" />
                                ) : (
                                    <div className="w-11 h-11 rounded-xl bg-[#ECE8E0] flex items-center justify-center shrink-0">
                                        <Package className="w-5 h-5 text-[#767B71]" />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-[14px] text-[#2A2F25] truncate">{p.name}</p>
                                </div>
                                <div className="text-right shrink-0">{renderMeta(p)}</div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
            {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#ECE8E0]">
                    <p className="text-[12px] text-[#767B71]">
                        {pagination.total} products
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={pagination.page <= 1}
                            onClick={() => onPage(pagination.page - 1)}
                            className="px-3 py-1.5 text-sm rounded-lg border border-[#2A2F25]/10 disabled:opacity-40"
                        >
                            Prev
                        </button>
                        <span className="text-sm text-[#2A2F25] py-1.5">
                            {pagination.page} / {pagination.pages}
                        </span>
                        <button
                            type="button"
                            disabled={pagination.page >= pagination.pages}
                            onClick={() => onPage(pagination.page + 1)}
                            className="px-3 py-1.5 text-sm rounded-lg border border-[#2A2F25]/10 disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
