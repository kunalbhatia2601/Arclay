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

    // Shipping state
    const [couriers, setCouriers] = useState([]);
    const [selectedCourier, setSelectedCourier] = useState(null);
    const [loadingCouriers, setLoadingCouriers] = useState(false);
    const [creatingShipment, setCreatingShipment] = useState(false);

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

    // Fetch available couriers
    const fetchCouriers = async () => {
        try {
            setLoadingCouriers(true);
            const res = await fetch("/api/admin/shipping/couriers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ orderId: order._id })
            });
            const data = await res.json();
            if (data.success) {
                setCouriers(data.couriers || []);
            } else {
                alert(data.message || "Failed to fetch couriers");
            }
        } catch (error) {
            console.error("Fetch couriers error:", error);
        } finally {
            setLoadingCouriers(false);
        }
    };

    // Create shipment
    const handleCreateShipment = async () => {
        try {
            setCreatingShipment(true);
            const res = await fetch("/api/admin/shipping/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    orderId: order._id,
                    courierId: selectedCourier?.courierId
                })
            });
            const data = await res.json();
            if (data.success) {
                alert("Shipment created successfully!");
                fetchOrder();
            } else {
                alert(data.message || "Failed to create shipment");
            }
        } catch (error) {
            console.error("Create shipment error:", error);
            alert("Failed to create shipment");
        } finally {
            setCreatingShipment(false);
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
                    {order.shippingFee > 0 && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Shipping</span>
                            <span>₹{order.shippingFee}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
                        <span>Total Amount</span>
                        <span>₹{order.totalAmount}</span>
                    </div>
                </div>
            </div>

            {/* Shipping Management */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <h2 className="font-serif text-xl font-bold mb-4">📦 Shipping</h2>
                
                {order.shipping?.awbCode ? (
                    // Shipment exists - show tracking info
                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                            <p className="font-medium text-green-800">✅ Shipment Created</p>
                            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground">AWB Number</p>
                                    <p className="font-mono font-medium">{order.shipping.awbCode}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Courier</p>
                                    <p className="font-medium">{order.shipping.courierName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Status</p>
                                    <p className="font-medium">{order.shipping.status || 'N/A'}</p>
                                </div>
                                {order.shipping.estimatedDelivery && (
                                    <div>
                                        <p className="text-muted-foreground">Est. Delivery</p>
                                        <p className="font-medium">{new Date(order.shipping.estimatedDelivery).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {order.shipping.label && (
                                <a
                                    href={order.shipping.label}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
                                >
                                    🏷️ Print Label
                                </a>
                            )}
                            {order.shipping.trackingUrl && (
                                <a
                                    href={order.shipping.trackingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/70 transition"
                                >
                                    📡 Track Shipment
                                </a>
                            )}
                        </div>
                    </div>
                ) : (
                    // No shipment - show courier selection
                    <div className="space-y-4">
                        <p className="text-muted-foreground">No shipment created yet.</p>
                        
                        {couriers.length === 0 ? (
                            <button
                                onClick={fetchCouriers}
                                disabled={loadingCouriers}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                            >
                                {loadingCouriers ? 'Loading...' : '🚚 Get Available Couriers'}
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {couriers.map((courier) => (
                                        <label
                                            key={courier.courierId}
                                            className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                selectedCourier?.courierId === courier.courierId
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:border-primary/50'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="courier"
                                                checked={selectedCourier?.courierId === courier.courierId}
                                                onChange={() => setSelectedCourier(courier)}
                                                className="sr-only"
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium">{courier.courierName}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {courier.estimatedDays} days • ₹{courier.rate}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-primary">₹{courier.rate}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                <button
                                    onClick={handleCreateShipment}
                                    disabled={!selectedCourier || creatingShipment}
                                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                                >
                                    {creatingShipment ? 'Creating...' : '✅ Create Shipment'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
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
