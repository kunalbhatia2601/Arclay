"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
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

export default function OrderDetailPage() {
    const { isAuthenticated, loading: userLoading } = useUser();
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(null);

    useEffect(() => {
        if (!userLoading && !isAuthenticated) {
            router.push("/login");
        } else if (isAuthenticated && params.id) {
            fetchOrder();
        }
    }, [isAuthenticated, userLoading, params.id]);

    const fetchOrder = async () => {
        try {
            const res = await fetch(`/api/orders/${params.id}`, {
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

    if (userLoading || loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-muted-foreground mb-4">Order not found</p>
                    <Link href="/orders" className="text-primary hover:underline">
                        Back to Orders
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-12 pt-24">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="font-serif text-4xl font-bold text-foreground">
                            Order #{order._id.slice(-8)}
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
                        </p>
                    </div>
                    <Link
                        href="/orders"
                        className="text-primary hover:underline"
                    >
                        ← Back to Orders
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Order Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status */}
                        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                            <h2 className="font-serif text-2xl font-bold mb-4">Order Status</h2>
                            <div className="flex flex-wrap gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Order Status</p>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.orderStatus]}`}>
                                        {order.orderStatus}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">Payment Status</p>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${paymentStatusColors[order.paymentStatus]}`}>
                                        {order.paymentStatus}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                            <h2 className="font-serif text-2xl font-bold mb-4">Order Items</h2>
                            <div className="space-y-4">
                                {order.items.map((item, index) => (
                                    <div key={index} className="flex items-center gap-4 p-4 bg-muted rounded-xl">
                                        {item.product?.images?.[0] && (
                                            <img
                                                src={item.product.images[0]}
                                                alt={item.product.name}
                                                className="w-20 h-20 object-cover rounded-lg"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <h3 className="font-medium text-lg">{item.product?.name || 'Product'}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {Object.entries(item.variant.attributes || {}).map(([key, value]) => (
                                                    <span key={key}>{key}: {value} </span>
                                                ))}
                                            </p>
                                            <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg">₹{item.priceAtOrder * item.quantity}</p>
                                            <p className="text-sm text-muted-foreground">₹{item.priceAtOrder} each</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                            <h2 className="font-serif text-2xl font-bold mb-4">Shipping Address</h2>
                            <div className="space-y-1">
                                <p className="font-medium">{order.shippingAddress.fullName}</p>
                                <p>{order.shippingAddress.addressLine1}</p>
                                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                                <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                                <p>{order.shippingAddress.country}</p>
                                <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
                            </div>
                        </div>

                        {order.notes && (
                            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                                <h2 className="font-serif text-2xl font-bold mb-4">Order Notes</h2>
                                <p className="text-muted-foreground">{order.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border sticky top-24">
                            <h2 className="font-serif text-2xl font-bold mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <p className="text-sm text-muted-foreground">Order ID</p>
                                    <p className="font-mono text-sm">{order._id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Payment Method</p>
                                    <p className="font-medium capitalize">{order.paymentMethod}</p>
                                </div>
                                {order.paymentId && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Payment ID</p>
                                        <p className="font-mono text-sm">{order.paymentId}</p>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-border pt-4">
                                <div className="flex justify-between text-2xl font-bold">
                                    <span>Total</span>
                                    <span>₹{order.totalAmount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
