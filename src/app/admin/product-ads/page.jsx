"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ProductAdModal from "./ProductAdModal";

export default function ProductAdsPage() {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAd, setEditingAd] = useState(null);

    useEffect(() => {
        fetchAds();
    }, []);

    const fetchAds = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/product-ads", {
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                setAds(data.ads);
            }
        } catch (error) {
            console.error("Failed to fetch ads:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this ad?")) return;

        try {
            const res = await fetch(`/api/admin/product-ads/${id}`, {
                method: "DELETE",
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                fetchAds();
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Failed to delete ad");
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            const res = await fetch(`/api/admin/product-ads/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ isActive: !currentStatus })
            });
            const data = await res.json();
            if (data.success) {
                setAds(prev => prev.map(ad =>
                    ad._id === id ? { ...ad, isActive: !currentStatus } : ad
                ));
            }
        } catch (error) {
            console.error("Toggle status failed:", error);
        }
    };

    const openEditModal = (ad) => {
        setEditingAd(ad);
        setShowModal(true);
    };

    const openCreateModal = () => {
        setEditingAd(null);
        setShowModal(true);
    };

    const getPositionBadge = (position) => {
        const colors = {
            hero: "bg-purple-100 text-purple-700",
            banner: "bg-blue-100 text-blue-700",
            popup: "bg-orange-100 text-orange-700"
        };
        return colors[position] || colors.banner;
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl font-bold text-foreground">
                        Product Ads
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage promotional banners and videos
                    </p>
                </div>
                <Button
                    onClick={openCreateModal}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
                >
                    + Create Ad
                </Button>
            </div>

            {/* Ads Grid/List */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : ads.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-5xl mb-4">📢</div>
                        <p className="text-muted-foreground mb-4">No product ads yet</p>
                        <Button
                            onClick={openCreateModal}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                        >
                            Create your first ad
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                                        Preview
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                                        Title
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground hidden md:table-cell">
                                        Position
                                    </th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground hidden lg:table-cell">
                                        Schedule
                                    </th>
                                    <th className="text-center px-6 py-4 text-sm font-semibold text-foreground">
                                        Status
                                    </th>
                                    <th className="text-right px-6 py-4 text-sm font-semibold text-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {ads.map((ad) => (
                                    <tr key={ad._id} className="hover:bg-muted/50 transition-colors">
                                        {/* Preview */}
                                        <td className="px-6 py-4">
                                            <div className="w-20 h-12 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                                                {ad.mediaType === "video" ? (
                                                    <span className="text-2xl">🎬</span>
                                                ) : ad.mediaUrl ? (
                                                    <img
                                                        src={ad.mediaUrl}
                                                        alt={ad.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-2xl">🖼️</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Title & Type */}
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-foreground line-clamp-1">
                                                {ad.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {ad.mediaType === "video" ? "🎬 Video" : "🖼️ Image"} • Order: {ad.order}
                                            </p>
                                        </td>

                                        {/* Position */}
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPositionBadge(ad.position)}`}>
                                                {ad.position.charAt(0).toUpperCase() + ad.position.slice(1)}
                                            </span>
                                        </td>

                                        {/* Schedule */}
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <div className="text-sm text-muted-foreground">
                                                {ad.startDate || ad.endDate ? (
                                                    <>
                                                        {ad.startDate && (
                                                            <p>From: {new Date(ad.startDate).toLocaleDateString()}</p>
                                                        )}
                                                        {ad.endDate && (
                                                            <p>Until: {new Date(ad.endDate).toLocaleDateString()}</p>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-muted-foreground/50">Always</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => toggleStatus(ad._id, ad.isActive)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${ad.isActive
                                                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                                                    : "bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20"
                                                    }`}
                                            >
                                                {ad.isActive ? "Active" : "Inactive"}
                                            </button>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(ad)}
                                                    className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(ad._id)}
                                                    className="px-3 py-1 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            <ProductAdModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setEditingAd(null);
                }}
                onSuccess={fetchAds}
                editingAd={editingAd}
            />
        </div>
    );
}
