"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AddressesPage() {
    const { isAuthenticated, loading: userLoading } = useUser();
    const router = useRouter();
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        label: 'Home',
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        isDefault: false
    });

    useEffect(() => {
        if (!userLoading && !isAuthenticated) {
            router.push("/login");
        } else if (isAuthenticated) {
            fetchAddresses();
        }
    }, [isAuthenticated, userLoading]);

    const fetchAddresses = async () => {
        try {
            const res = await fetch("/api/addresses", {
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                setAddresses(data.addresses);
            }
        } catch (error) {
            console.error("Failed to fetch addresses:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const url = editingId ? `/api/addresses/${editingId}` : '/api/addresses';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (data.success) {
                alert(editingId ? 'Address updated!' : 'Address added!');
                setShowForm(false);
                setEditingId(null);
                resetForm();
                fetchAddresses();
            } else {
                alert(data.message || 'Failed to save address');
            }
        } catch (error) {
            console.error('Save address error:', error);
            alert('Failed to save address');
        }
    };

    const handleEdit = (address) => {
        setFormData({
            label: address.label,
            fullName: address.fullName,
            phone: address.phone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2 || '',
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            country: address.country,
            isDefault: address.isDefault
        });
        setEditingId(address._id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this address?')) return;

        try {
            const res = await fetch(`/api/addresses/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const data = await res.json();

            if (data.success) {
                alert('Address deleted!');
                fetchAddresses();
            } else {
                alert(data.message || 'Failed to delete address');
            }
        } catch (error) {
            console.error('Delete address error:', error);
            alert('Failed to delete address');
        }
    };

    const resetForm = () => {
        setFormData({
            label: 'Home',
            fullName: '',
            phone: '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India',
            isDefault: false
        });
    };

    if (userLoading || loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center pt-24">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-12 pt-24">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="font-serif text-4xl font-bold text-foreground">
                        Saved Addresses
                    </h1>
                    <Button
                        onClick={() => {
                            resetForm();
                            setEditingId(null);
                            setShowForm(!showForm);
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                    >
                        {showForm ? 'Cancel' : '+ Add Address'}
                    </Button>
                </div>

                {/* Add/Edit Form */}
                {showForm && (
                    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border mb-8">
                        <h2 className="font-serif text-2xl font-bold mb-6">
                            {editingId ? 'Edit Address' : 'Add New Address'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Label</label>
                                    <select
                                        value={formData.label}
                                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                                        required
                                    >
                                        <option value="Home">Home</option>
                                        <option value="Office">Office</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Pincode</label>
                                    <input
                                        type="text"
                                        value={formData.pincode}
                                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Address Line 1</label>
                                <input
                                    type="text"
                                    value={formData.addressLine1}
                                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Address Line 2 (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.addressLine2}
                                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">City</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">State</label>
                                    <input
                                        type="text"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Country</label>
                                    <input
                                        type="text"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isDefault"
                                    checked={formData.isDefault}
                                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="isDefault" className="text-sm">Set as default address</label>
                            </div>
                            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                {editingId ? 'Update Address' : 'Save Address'}
                            </Button>
                        </form>
                    </div>
                )}

                {/* Address List */}
                {addresses.length === 0 ? (
                    <div className="bg-card rounded-2xl p-12 text-center shadow-sm border border-border">
                        <div className="text-6xl mb-4">📍</div>
                        <p className="text-xl text-muted-foreground mb-6">No saved addresses yet</p>
                        <Button
                            onClick={() => setShowForm(true)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                        >
                            Add Your First Address
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {addresses.map((address) => (
                            <div
                                key={address._id}
                                className={`bg-card rounded-2xl p-6 shadow-sm border-2 ${address.isDefault ? 'border-primary' : 'border-border'
                                    } relative`}
                            >
                                {address.isDefault && (
                                    <span className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                                        Default
                                    </span>
                                )}
                                <div className="mb-4">
                                    <h3 className="font-bold text-lg">{address.label}</h3>
                                    <p className="text-muted-foreground text-sm mt-1">{address.fullName}</p>
                                </div>
                                <div className="text-sm text-foreground space-y-1 mb-4">
                                    <p>{address.addressLine1}</p>
                                    {address.addressLine2 && <p>{address.addressLine2}</p>}
                                    <p>{address.city}, {address.state} - {address.pincode}</p>
                                    <p>{address.country}</p>
                                    <p className="mt-2">📞 {address.phone}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleEdit(address)}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        onClick={() => handleDelete(address._id)}
                                        variant="outline"
                                        className="flex-1 text-destructive hover:bg-destructive/10"
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
