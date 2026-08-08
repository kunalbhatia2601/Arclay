"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, LayoutTemplate, Loader2, Package, ShoppingBag } from "lucide-react";

const PAGES = [
    {
        key: "home",
        label: "Home page",
        description: "Hero, product sections, story, promos — anything, in any order",
        icon: Home,
    },
    {
        key: "products",
        label: "Products page",
        description: "Blocks around the product grid and filters",
        icon: ShoppingBag,
    },
    {
        key: "product-detail",
        label: "Product detail page",
        description: "Blocks around the buy box and tabs",
        icon: Package,
    },
];

export default function PagesIndex() {
    const [status, setStatus] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const entries = await Promise.all(
                    PAGES.map(async (page) => {
                        const res = await fetch(`/api/admin/layouts/${page.key}`, { credentials: "include" });
                        const data = await res.json();
                        if (!data.success) return [page.key, null];

                        const count = Object.values(data.published || {})
                            .reduce((sum, list) => sum + (list?.length || 0), 0);

                        return [page.key, {
                            blocks: count,
                            hasUnpublishedChanges: data.hasUnpublishedChanges,
                            publishedAt: data.publishedAt,
                        }];
                    })
                );
                setStatus(Object.fromEntries(entries));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <LayoutTemplate className="w-6 h-6 text-blue-600" />
                    Pages
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Build each storefront page from blocks. Changes stay in draft until you publish.
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
            ) : (
                <div className="space-y-3">
                    {PAGES.map((page) => {
                        const info = status[page.key];
                        const Icon = page.icon;

                        return (
                            <Link
                                key={page.key}
                                href={`/admin/pages/${page.key}`}
                                className="flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all"
                            >
                                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                    <Icon className="w-5 h-5 text-blue-600" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h2 className="font-semibold text-gray-900">{page.label}</h2>
                                        {info?.hasUnpublishedChanges && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                                                Draft changes
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500">{page.description}</p>
                                </div>

                                <div className="text-right shrink-0">
                                    <p className="text-sm font-semibold text-gray-900">
                                        {info?.blocks || 0}
                                    </p>
                                    <p className="text-[11px] text-gray-400">
                                        {info?.blocks ? "blocks live" : "using default"}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
