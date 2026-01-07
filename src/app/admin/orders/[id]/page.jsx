"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-purple-100 text-purple-800",
    shipped: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800"
};

const paymentStatusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800"
};

export default function AdminOrderDetail() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [order, setOrder] = useState(null);

    useEffect(() => {
        if (params.id) {
            fetchOrder();
        }
    }, [params.id]);

    const fetchOrder = async () => {
        try {
            const res = await fetch(`/api/admin/orders/${params.id}`, {
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                setOrder(data.order);
            }
        } catch (error) {
            console.error("Failed to fetch order:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const res = await fetch(`/api/admin/orders/${params.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    orderStatus: order.orderStatus,
                    paymentStatus: order.paymentStatus,
                    notes: order.notes
                }),
            });

            const data = await res.json();

            if (data.success) {
                alert("Order updated successfully!");
                fetchOrder();
            } else {
                alert(data.message || "Failed to update order");
            }
        } catch (error) {
            console.error("Save error:", error);
            alert("Failed to update order");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Order not found</p>
                <Link href="/admin/orders" className="text-primary hover:underline mt-4 inline-block">
                    Back to Orders
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-serif text-3xl font-bold text-foreground">
                        Order #{order._id.slice(-8)}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
                    </p>
                </div>
                <Link
                    href="/admin/orders"
                    className="text-primary hover:underline"
                >
                    ← Back to Orders
                </Link>
            </div>

            {/* Customer Info */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <h2 className="font-serif text-xl font-bold mb-4">Customer Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{order.user?.name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{order.user?.email}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{order.user?.phone || 'N/A'}</p>
                    </div>
                </div>
            </div>

            {/* Order Items */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <h2 className="font-serif text-xl font-bold mb-4">Order Items</h2>
                <div className="space-y-4">
                    {order.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 bg-muted rounded-xl">
                            {item.product?.images?.[0] && (
                                <img
                                    src={item.product.images[0]}
                                    alt={item.product.name}
                                    className="w-16 h-16 object-cover rounded-lg"
                                />
                            )}
                            <div className="flex-1">
                                <h3 className="font-medium">{item.product?.name || 'Product N/A'}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {Object.entries(item.variant.attributes || {}).map(([key, value]) => (
                                        <span key={key}>{key}: {value} </span>
                                    ))}
                                </p>
                                <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-medium">₹{item.priceAtOrder * item.quantity}</p>
                                <p className="text-sm text-muted-foreground">₹{item.priceAtOrder} each</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-6 pt-6 border-t border-border space-y-2">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{order.subtotal || order.totalAmount}</span>
                    </div>
                    {order.couponCode && (
                        <div className="flex justify-between text-primary">
                            <span>Discount ({order.couponCode})</span>
                            <span>-₹{order.discountAmount || 0}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
                        <span>Total Amount</span>
                        <span>₹{order.totalAmount}</span>
                    </div>
                </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <h2 className="font-serif text-xl font-bold mb-4">Shipping Address</h2>
                <div className="space-y-2">
                    <p className="font-medium">{order.shippingAddress.fullName}</p>
                    <p>{order.shippingAddress.addressLine1}</p>
                    {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                    <p>{order.shippingAddress.country}</p>
                    <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
                </div>
            </div>

            {/* Payment & Status */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <h2 className="font-serif text-xl font-bold mb-4">Payment & Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">Order Status</label>
                        <select
                            value={order.orderStatus}
                            onChange={(e) => setOrder({ ...order, orderStatus: e.target.value })}
                            className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Payment Status</label>
                        <select
                            value={order.paymentStatus}
                            onChange={(e) => setOrder({ ...order, paymentStatus: e.target.value })}
                            className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                        </select>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Payment Method</p>
                        <p className="font-medium capitalize">{order.paymentMethod}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Payment ID</p>
                        <p className="font-medium font-mono">{order.paymentId || 'N/A'}</p>
                    </div>
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Notes</label>
                    <textarea
                        value={order.notes || ''}
                        onChange={(e) => setOrder({ ...order, notes: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Add notes about this order..."
                    />
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-medium transition-all disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}
