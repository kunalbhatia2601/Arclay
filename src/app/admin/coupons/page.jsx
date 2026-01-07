"use client";

import { useState, useEffect, useCallback } from "react";

// Debounce hook
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);

    // Search states
    const [categorySearch, setCategorySearch] = useState("");
    const [productSearch, setProductSearch] = useState("");
    const [userSearch, setUserSearch] = useState("");

    // Search results
    const [categoryResults, setCategoryResults] = useState([]);
    const [productResults, setProductResults] = useState([]);
    const [userResults, setUserResults] = useState([]);

    // Selected items (with full data for display)
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);

    // Debounced search values
    const debouncedCategorySearch = useDebounce(categorySearch, 300);
    const debouncedProductSearch = useDebounce(productSearch, 300);
    const debouncedUserSearch = useDebounce(userSearch, 300);

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: 10,
        minPurchase: 0,
        maxDiscount: '',
        maxUsage: '',
        perUserLimit: 1,
        validFrom: '',
        validUntil: '',
        firstPurchaseOnly: false,
        isActive: true,
        showToUser: false
    });

    const fetchCoupons = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/coupons", { credentials: "include" });
            const data = await res.json();
            if (data.success) {
                setCoupons(data.coupons);
            }
        } catch (error) {
            console.error("Failed to fetch coupons:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    // Fetch all categories once for filtering
    const [allCategories, setAllCategories] = useState([]);
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/products?limit=1');
                const data = await res.json();
                if (data.success && data.categories) {
                    setAllCategories(data.categories);
                }
            } catch (error) {
                console.error("Categories fetch error:", error);
            }
        };
        fetchCategories();
    }, []);

    // Search categories (local filter)
    useEffect(() => {
        if (!debouncedCategorySearch.trim()) {
            setCategoryResults([]);
            return;
        }
        const search = debouncedCategorySearch.toLowerCase();
        const filtered = allCategories.filter(cat =>
            cat.name.toLowerCase().includes(search)
        );
        setCategoryResults(filtered);
    }, [debouncedCategorySearch, allCategories]);

    // Search products
    useEffect(() => {
        const searchProducts = async () => {
            if (!debouncedProductSearch.trim()) {
                setProductResults([]);
                return;
            }
            try {
                const res = await fetch(`/api/admin/products?search=${encodeURIComponent(debouncedProductSearch)}&limit=10`);
                const data = await res.json();
                if (data.success) {
                    setProductResults(data.products || []);
                }
            } catch (error) {
                console.error("Product search error:", error);
            }
        };
        searchProducts();
    }, [debouncedProductSearch]);

    // Search users
    useEffect(() => {
        const searchUsers = async () => {
            if (!debouncedUserSearch.trim()) {
                setUserResults([]);
                return;
            }
            try {
                const res = await fetch(`/api/admin/users?search=${encodeURIComponent(debouncedUserSearch)}&limit=10`, {
                    credentials: "include"
                });
                const data = await res.json();
                if (data.success) {
                    setUserResults(data.users || []);
                }
            } catch (error) {
                console.error("User search error:", error);
            }
        };
        searchUsers();
    }, [debouncedUserSearch]);

    const openModal = (coupon = null) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setFormData({
                code: coupon.code,
                description: coupon.description || '',
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                minPurchase: coupon.minPurchase || 0,
                maxDiscount: coupon.maxDiscount || '',
                maxUsage: coupon.maxUsage || '',
                perUserLimit: coupon.perUserLimit || 1,
                validFrom: coupon.validFrom ? coupon.validFrom.split('T')[0] : '',
                validUntil: coupon.validUntil ? coupon.validUntil.split('T')[0] : '',
                firstPurchaseOnly: coupon.firstPurchaseOnly || false,
                isActive: coupon.isActive,
                showToUser: coupon.showToUser || false
            });
            // Set selected items from coupon
            setSelectedCategories(coupon.applicableCategories?.map(c => ({ _id: c._id || c, name: c.name || 'Category' })) || []);
            setSelectedProducts(coupon.applicableProducts?.map(p => ({ _id: p._id || p, name: p.name || 'Product' })) || []);
            setSelectedUsers(coupon.applicableUsers?.map(u => ({ _id: u._id || u, name: u.name || 'User', email: u.email || '' })) || []);
        } else {
            setEditingCoupon(null);
            setFormData({
                code: '',
                description: '',
                discountType: 'percentage',
                discountValue: 10,
                minPurchase: 0,
                maxDiscount: '',
                maxUsage: '',
                perUserLimit: 1,
                validFrom: '',
                validUntil: '',
                firstPurchaseOnly: false,
                isActive: true,
                showToUser: false
            });
            setSelectedCategories([]);
            setSelectedProducts([]);
            setSelectedUsers([]);
        }
        setCategorySearch("");
        setProductSearch("");
        setUserSearch("");
        setCategoryResults([]);
        setProductResults([]);
        setUserResults([]);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCoupon(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                maxDiscount: formData.maxDiscount || null,
                maxUsage: formData.maxUsage || null,
                validFrom: formData.validFrom || null,
                validUntil: formData.validUntil || null,
                applicableCategories: selectedCategories.map(c => c._id),
                applicableProducts: selectedProducts.map(p => p._id),
                applicableUsers: selectedUsers.map(u => u._id)
            };

            const url = editingCoupon
                ? `/api/admin/coupons/${editingCoupon._id}`
                : "/api/admin/coupons";
            const method = editingCoupon ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                closeModal();
                fetchCoupons();
            } else {
                alert(data.message || "Failed to save coupon");
            }
        } catch (error) {
            console.error("Save coupon error:", error);
            alert("Failed to save coupon");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this coupon?")) return;
        try {
            const res = await fetch(`/api/admin/coupons/${id}`, {
                method: "DELETE",
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                fetchCoupons();
            } else {
                alert(data.message || "Failed to delete coupon");
            }
        } catch (error) {
            console.error("Delete coupon error:", error);
        }
    };

    const toggleActive = async (coupon) => {
        try {
            const res = await fetch(`/api/admin/coupons/${coupon._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ isActive: !coupon.isActive })
            });
            const data = await res.json();
            if (data.success) {
                setCoupons(prev => prev.map(c =>
                    c._id === coupon._id ? { ...c, isActive: !coupon.isActive } : c
                ));
            }
        } catch (error) {
            console.error("Toggle active error:", error);
        }
    };

    // Selection handlers
    const addCategory = (cat) => {
        if (!selectedCategories.find(c => c._id === cat._id)) {
            setSelectedCategories([...selectedCategories, cat]);
        }
        setCategorySearch("");
        setCategoryResults([]);
    };

    const removeCategory = (id) => {
        setSelectedCategories(selectedCategories.filter(c => c._id !== id));
    };

    const addProduct = (prod) => {
        if (!selectedProducts.find(p => p._id === prod._id)) {
            setSelectedProducts([...selectedProducts, prod]);
        }
        setProductSearch("");
        setProductResults([]);
    };

    const removeProduct = (id) => {
        setSelectedProducts(selectedProducts.filter(p => p._id !== id));
    };

    const addUser = (user) => {
        if (!selectedUsers.find(u => u._id === user._id)) {
            setSelectedUsers([...selectedUsers, user]);
        }
        setUserSearch("");
        setUserResults([]);
    };

    const removeUser = (id) => {
        setSelectedUsers(selectedUsers.filter(u => u._id !== id));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-3xl font-bold text-foreground">Coupons</h1>
                    <p className="text-muted-foreground mt-1">Manage discount codes and promotions</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
                >
                    + Create Coupon
                </button>
            </div>

            {/* Coupons Table */}
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : coupons.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-5xl mb-4">🎟️</p>
                        <p className="text-muted-foreground">No coupons yet</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Code</th>
                                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Discount</th>
                                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Min Purchase</th>
                                    <th className="text-center py-4 px-6 font-medium text-muted-foreground">Usage</th>
                                    <th className="text-center py-4 px-6 font-medium text-muted-foreground">Visible</th>
                                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Status</th>
                                    <th className="text-right py-4 px-6 font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {coupons.map(coupon => (
                                    <tr key={coupon._id} className="hover:bg-muted/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className="font-mono font-bold text-primary">{coupon.code}</p>
                                                {coupon.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-1">{coupon.description}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="font-semibold">
                                                {coupon.discountType === 'percentage'
                                                    ? `${coupon.discountValue}%`
                                                    : `₹${coupon.discountValue}`}
                                            </span>
                                            {coupon.maxDiscount && (
                                                <span className="text-xs text-muted-foreground ml-1">(max ₹{coupon.maxDiscount})</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            {coupon.minPurchase > 0 ? `₹${coupon.minPurchase}` : '-'}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={coupon.maxUsage && coupon.usageCount >= coupon.maxUsage ? "text-destructive" : ""}>
                                                {coupon.usageCount}{coupon.maxUsage ? `/${coupon.maxUsage}` : ''}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {coupon.showToUser ? '👁️' : '-'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <button
                                                onClick={() => toggleActive(coupon)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${coupon.isActive
                                                    ? "bg-primary/10 text-primary"
                                                    : "bg-muted text-muted-foreground"
                                                    }`}
                                            >
                                                {coupon.isActive ? "Active" : "Inactive"}
                                            </button>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openModal(coupon)}
                                                    className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(coupon._id)}
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-border">
                            <h2 className="font-serif text-xl font-bold text-foreground">
                                {editingCoupon ? "Edit Coupon" : "Create Coupon"}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Code *</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-2 bg-muted border border-border rounded-lg font-mono"
                                        placeholder="SAVE20"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Discount Type *</label>
                                    <select
                                        value={formData.discountType}
                                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                                        className="w-full px-4 py-2 bg-muted border border-border rounded-lg"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 bg-muted border border-border rounded-lg"
                                    placeholder="Save 20% on your order"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Value *</label>
                                    <input
                                        type="number"
                                        value={formData.discountValue}
                                        onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 bg-muted border border-border rounded-lg"
                                        min="0"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Min Purchase (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.minPurchase}
                                        onChange={(e) => setFormData({ ...formData, minPurchase: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 bg-muted border border-border rounded-lg"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Max Discount (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.maxDiscount}
                                        onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                                        className="w-full px-4 py-2 bg-muted border border-border rounded-lg"
                                        placeholder="No limit"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Max Total Usage</label>
                                    <input
                                        type="number"
                                        value={formData.maxUsage}
                                        onChange={(e) => setFormData({ ...formData, maxUsage: e.target.value })}
                                        className="w-full px-4 py-2 bg-muted border border-border rounded-lg"
                                        placeholder="Unlimited"
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Per User Limit</label>
                                    <input
                                        type="number"
                                        value={formData.perUserLimit}
                                        onChange={(e) => setFormData({ ...formData, perUserLimit: parseInt(e.target.value) || 1 })}
                                        className="w-full px-4 py-2 bg-muted border border-border rounded-lg"
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Valid From</label>
                                    <input
                                        type="date"
                                        value={formData.validFrom}
                                        onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                                        className="w-full px-4 py-2 bg-muted border border-border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Valid Until</label>
                                    <input
                                        type="date"
                                        value={formData.validUntil}
                                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                        className="w-full px-4 py-2 bg-muted border border-border rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* Restrictions Section */}
                            <div className="space-y-4 pt-4 border-t border-border">
                                <p className="text-sm font-medium text-foreground">Restrictions (leave empty for all)</p>

                                {/* Categories Search */}
                                {/* <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Applicable Categories
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={categorySearch}
                                            onChange={(e) => setCategorySearch(e.target.value)}
                                            className="w-full px-4 py-2 bg-muted border border-border rounded-lg"
                                            placeholder="Search categories..."
                                        />
                                        {categoryResults.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                                {categoryResults.map(cat => (
                                                    <button
                                                        key={cat._id}
                                                        type="button"
                                                        onClick={() => addCategory(cat)}
                                                        className="w-full text-left px-4 py-2 hover:bg-muted transition-colors"
                                                    >
                                                        {cat.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {selectedCategories.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {selectedCategories.map(cat => (
                                                <span key={cat._id} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                                                    {cat.name}
                                                    <button type="button" onClick={() => removeCategory(cat._id)} className="hover:text-destructive">×</button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div> */}

                                {/* Products Search */}
                                {/* <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Applicable Products
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                            className="w-full px-4 py-2 bg-muted border border-border rounded-lg"
                                            placeholder="Search products..."
                                        />
                                        {productResults.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                                {productResults.map(prod => (
                                                    <button
                                                        key={prod._id}
                                                        type="button"
                                                        onClick={() => addProduct(prod)}
                                                        className="w-full text-left px-4 py-2 hover:bg-muted transition-colors"
                                                    >
                                                        {prod.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {selectedProducts.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {selectedProducts.map(prod => (
                                                <span key={prod._id} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                                                    {prod.name}
                                                    <button type="button" onClick={() => removeProduct(prod._id)} className="hover:text-destructive">×</button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div> */}

                                {/* Users Search */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Applicable Users
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            className="w-full px-4 py-2 bg-muted border border-border rounded-lg"
                                            placeholder="Search users by name or email..."
                                        />
                                        {userResults.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                                {userResults.map(user => (
                                                    <button
                                                        key={user._id}
                                                        type="button"
                                                        onClick={() => addUser(user)}
                                                        className="w-full text-left px-4 py-2 hover:bg-muted transition-colors"
                                                    >
                                                        {user.name} <span className="text-muted-foreground">({user.email})</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {selectedUsers.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {selectedUsers.map(user => (
                                                <span key={user._id} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                                                    {user.name}
                                                    <button type="button" onClick={() => removeUser(user._id)} className="hover:text-destructive">×</button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.firstPurchaseOnly}
                                        onChange={(e) => setFormData({ ...formData, firstPurchaseOnly: e.target.checked })}
                                        className="w-4 h-4 rounded"
                                    />
                                    <span className="text-sm">First purchase only</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 rounded"
                                    />
                                    <span className="text-sm">Active</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.showToUser}
                                        onChange={(e) => setFormData({ ...formData, showToUser: e.target.checked })}
                                        className="w-4 h-4 rounded"
                                    />
                                    <span className="text-sm">Show on checkout</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-6 py-2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
                                >
                                    {editingCoupon ? "Update" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
