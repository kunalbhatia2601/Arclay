"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-purple-100 text-purple-800",
    shipped: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800"
};

export default function MyOrdersPage() {
    const { isAuthenticated, loading: userLoading } = useUser();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        if (!userLoading && !isAuthenticated) {
            router.push("/login");
        } else if (isAuthenticated) {
            fetchOrders();
        }
    }, [isAuthenticated, userLoading]);

    const fetchOrders = async () => {
        try {
            const res = await fetch("/api/orders", {
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                setOrders(data.orders);
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (userLoading || loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-12 pt-24">
            <div className="max-w-7xl mx-auto px-4">
                <h1 className="font-serif text-4xl font-bold text-foreground mb-8">
                    My Orders
                </h1>

                {orders.length === 0 ? (
                    <div className="bg-card rounded-2xl p-12 text-center shadow-sm border border-border">
                        <p className="text-xl text-muted-foreground mb-6">No orders yet</p>
                        <Link
                            href="/products"
                            className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-medium transition-all"
                        >
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div
                                key={order._id}
                                className="bg-card rounded-2xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                                    <div>
                                        <h3 className="font-serif text-xl font-bold">
                                            Order #{order._id.slice(-8)}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Placed on {formatDate(order.createdAt)}
                                        </p>
                                    </div>
                                    <div className="mt-4 md:mt-0 flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.orderStatus]}`}>
                                            {order.orderStatus}
                                        </span>
                                        <Link
                                            href={`/orders/${order._id}`}
                                            className="text-primary hover:underline font-medium"
                                        >
                                            View Details →
                                        </Link>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Amount</p>
                                        <p className="font-bold text-lg">₹{order.totalAmount}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Payment Method</p>
                                        <p className="font-medium capitalize">{order.paymentMethod}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Payment Status</p>
                                        <p className="font-medium capitalize">{order.paymentStatus}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {order.items.slice(0, 3).map((item, index) => (
                                        <div key={index} className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg">
                                            {item.product?.images?.[0] && (
                                                <img
                                                    src={item.product.images[0]}
                                                    alt={item.product.name}
                                                    className="w-8 h-8 object-cover rounded"
                                                />
                                            )}
                                            <span className="text-sm">
                                                {item.product?.name} × {item.quantity}
                                            </span>
                                        </div>
                                    ))}
                                    {order.items.length > 3 && (
                                        <div className="flex items-center px-3 py-2">
                                            <span className="text-sm text-muted-foreground">
                                                +{order.items.length - 3} more
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
