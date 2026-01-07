"use client";

import { useState, useEffect, useCallback } from "react";

export default function AdminBundlesPage() {
    const [bundles, setBundles] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBundle, setEditingBundle] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        btnTxt: "View Bundle",
        products: []
    });
    const [productSearch, setProductSearch] = useState("");

    // Fetch bundles
    const fetchBundles = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/bundles", { credentials: "include" });
            const data = await res.json();
            if (data.success) {
                setBundles(data.bundles);
            }
        } catch (error) {
            console.error("Failed to fetch bundles:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch products for selector
    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/admin/products?limit=100", { credentials: "include" });
            const data = await res.json();
            if (data.success) {
                setProducts(data.products);
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
        }
    };

    useEffect(() => {
        fetchBundles();
        fetchProducts();
    }, [fetchBundles]);

    const openModal = (bundle = null) => {
        if (bundle) {
            setEditingBundle(bundle);
            setFormData({
                title: bundle.title,
                btnTxt: bundle.btnTxt || "View Bundle",
                products: bundle.products.map(p => p._id)
            });
        } else {
            setEditingBundle(null);
            setFormData({ title: "", btnTxt: "View Bundle", products: [] });
        }
        setProductSearch("");
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingBundle(null);
        setFormData({ title: "", btnTxt: "View Bundle", products: [] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingBundle
                ? `/api/admin/bundles/${editingBundle._id}`
                : "/api/admin/bundles";
            const method = editingBundle ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                fetchBundles();
                closeModal();
            } else {
                alert(data.message || "Failed to save bundle");
            }
        } catch (error) {
            console.error("Save bundle error:", error);
            alert("Failed to save bundle");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this bundle?")) return;
        try {
            const res = await fetch(`/api/admin/bundles/${id}`, {
                method: "DELETE",
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                fetchBundles();
            } else {
                alert(data.message || "Failed to delete bundle");
            }
        } catch (error) {
            console.error("Delete bundle error:", error);
            alert("Failed to delete bundle");
        }
    };

    const toggleActive = async (bundle) => {
        try {
            const res = await fetch(`/api/admin/bundles/${bundle._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ isActive: !bundle.isActive })
            });
            const data = await res.json();
            if (data.success) {
                setBundles(prev => prev.map(b =>
                    b._id === bundle._id ? { ...b, isActive: !bundle.isActive } : b
                ));
            }
        } catch (error) {
            console.error("Toggle active error:", error);
        }
    };

    const toggleProduct = (productId) => {
        setFormData(prev => ({
            ...prev,
            products: prev.products.includes(productId)
                ? prev.products.filter(id => id !== productId)
                : [...prev.products, productId]
        }));
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="font-serif text-3xl font-bold text-foreground">Bundles</h1>
                    <p className="text-muted-foreground mt-1">Manage product bundles for homepage display</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                    + Create Bundle
                </button>
            </div>

            {/* Bundles List */}
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : bundles.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-5xl mb-4">🎁</p>
                        <p className="text-muted-foreground">No bundles yet. Create your first bundle!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Bundle</th>
                                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Slug</th>
                                    <th className="text-center py-4 px-6 font-medium text-muted-foreground">Products</th>
                                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Status</th>
                                    <th className="text-right py-4 px-6 font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {bundles.map(bundle => (
                                    <tr key={bundle._id} className="hover:bg-muted/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className="font-medium">{bundle.title}</p>
                                                <p className="text-sm text-muted-foreground">{bundle.btnTxt}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <code className="text-sm bg-muted px-2 py-1 rounded">{bundle.slug}</code>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                {bundle.products.slice(0, 3).map((p, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-8 h-8 rounded-lg bg-muted overflow-hidden"
                                                        title={p.name}
                                                    >
                                                        {p.images?.[0] ? (
                                                            <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs">📦</div>
                                                        )}
                                                    </div>
                                                ))}
                                                {bundle.products.length > 3 && (
                                                    <span className="text-sm text-muted-foreground">
                                                        +{bundle.products.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <button
                                                onClick={() => toggleActive(bundle)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${bundle.isActive
                                                        ? "bg-primary/10 text-primary"
                                                        : "bg-muted-foreground/10 text-muted-foreground"
                                                    }`}
                                            >
                                                {bundle.isActive ? "Active" : "Inactive"}
                                            </button>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openModal(bundle)}
                                                    className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(bundle._id)}
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
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl">
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 border-b border-border">
                                <h2 className="font-serif text-xl font-bold">
                                    {editingBundle ? "Edit Bundle" : "Create Bundle"}
                                </h2>
                            </div>
                            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Title *</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="e.g., Skincare Essentials"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Button Text</label>
                                    <input
                                        type="text"
                                        value={formData.btnTxt}
                                        onChange={(e) => setFormData(prev => ({ ...prev, btnTxt: e.target.value }))}
                                        className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="View Bundle"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Products ({formData.products.length} selected)
                                    </label>
                                    <input
                                        type="text"
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-2"
                                        placeholder="Search products..."
                                    />
                                    <div className="border border-border rounded-lg max-h-48 overflow-y-auto">
                                        {filteredProducts.map(product => (
                                            <label
                                                key={product._id}
                                                className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b border-border last:border-0"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.products.includes(product._id)}
                                                    onChange={() => toggleProduct(product._id)}
                                                    className="w-4 h-4 rounded border-border"
                                                />
                                                <div className="w-10 h-10 bg-muted rounded overflow-hidden">
                                                    {product.images?.[0] ? (
                                                        <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">📦</div>
                                                    )}
                                                </div>
                                                <span className="font-medium">{product.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-border flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-6 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/70 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    {editingBundle ? "Save Changes" : "Create Bundle"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
