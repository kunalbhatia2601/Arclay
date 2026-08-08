"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
    Package, 
    Clock, 
    ShoppingBag, 
    MapPin, 
    User, 
    ShoppingCart, 
    ChevronRight,
    ArrowLeft,
    Settings,
    Bell
} from "lucide-react";

export default function MyAccountPage() {
    const { isAuthenticated, user, loading: userLoading } = useUser();
    const router = useRouter();
    const [stats, setStats] = useState({ totalOrders: 0, pendingOrders: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userLoading && !isAuthenticated) {
            router.push("/login");
        } else if (isAuthenticated) {
            fetchStats();
        }
    }, [isAuthenticated, userLoading]);

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/orders", {
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                const totalOrders = data.orders.length;
                const pendingOrders = data.orders.filter(o => o.orderStatus === 'pending' || o.orderStatus === 'processing').length;
                setStats({ totalOrders, pendingOrders });
            }
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        } finally {
            setLoading(false);
        }
    };

    if (userLoading || loading) {
        return (
            <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[var(--c-primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCFB] pb-20 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--c-primary)]/5 rounded-full blur-[100px] -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--c-accent)]/5 rounded-full blur-[80px] -ml-48 -mb-48" />

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                {/* ═══ Header ═══ */}
                <div className="pt-12 pb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <nav className="flex items-center gap-2 text-[13px] text-[var(--c-text-muted)] mb-4 uppercase tracking-widest font-bold">
                            <Link href="/" className="hover:text-[var(--c-primary)] transition-colors">Home</Link>
                            <span>/</span>
                            <span className="text-[var(--c-primary)]">Account</span>
                        </nav>
                        <h1 className="font-serif text-[42px] lg:text-[52px] font-bold text-[var(--c-text)] leading-tight">
                            My Account
                        </h1>
                        <p className="text-[17px] text-[var(--c-text-muted)] mt-2 max-w-lg">
                            Welcome back, <span className="font-bold text-[#4A5D23]">{user?.name}</span>! Manage your orders and preferences below.
                        </p>
                    </motion.div>
                </div>

                {/* ═══ Stats Grid ═══ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/70 backdrop-blur-md rounded-[2rem] p-8 shadow-sm border border-[var(--c-border)]/60 flex items-center gap-6 group hover:border-[var(--c-primary)]/30 transition-all cursor-default"
                    >
                        <div className="w-16 h-16 bg-[var(--c-primary)]/10 rounded-2xl flex items-center justify-center text-[var(--c-primary)] group-hover:scale-110 transition-transform duration-500">
                            <Package className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-[32px] font-black text-[var(--c-text)] leading-none mb-1">{stats.totalOrders}</h3>
                            <p className="text-[13px] font-bold text-[var(--c-text-muted)] uppercase tracking-wider">Total Orders</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/70 backdrop-blur-md rounded-[2rem] p-8 shadow-sm border border-[var(--c-border)]/60 flex items-center gap-6 group hover:border-[var(--c-primary)]/30 transition-all cursor-default"
                    >
                        <div className="w-16 h-16 bg-[var(--c-star)]/10 rounded-2xl flex items-center justify-center text-[var(--c-star)] group-hover:scale-110 transition-transform duration-500">
                            <Clock className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-[32px] font-black text-[var(--c-text)] leading-none mb-1">{stats.pendingOrders}</h3>
                            <p className="text-[13px] font-bold text-[var(--c-text-muted)] uppercase tracking-wider">Pending Orders</p>
                        </div>
                    </motion.div>
                </div>

                {/* ═══ Main Cards Grid ═══ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Quick Actions */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AccountCard 
                            href="/orders" 
                            icon={ShoppingBag} 
                            color="var(--c-primary)"
                            title="My Orders"
                            description="Track your active shipments, view history, or request a return."
                        />
                        <AccountCard 
                            href="/account/addresses" 
                            icon={MapPin} 
                            color="var(--c-accent)"
                            title="Saved Addresses"
                            description="Add or edit your default shipping and billing addresses."
                        />
                        <AccountCard 
                            href="/cart" 
                            icon={ShoppingCart} 
                            color="#4A5D23"
                            title="Shopping Cart"
                            description="Review items you've added and proceed to a secure checkout."
                        />
                        <AccountCard 
                            href="/account/settings" 
                            icon={Settings} 
                            color="#64748b"
                            title="Preferences"
                            description="Update your notification settings and display modes."
                        />
                    </div>

                    {/* Right Column: Profile Summary */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[var(--c-text)] rounded-[2.5rem] p-10 text-white shadow-xl relative overflow-hidden flex flex-col justify-between"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                        
                        <div>
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8">
                                <User className="w-8 h-8 text-[var(--c-primary)]" />
                            </div>
                            <h2 className="font-serif text-[28px] font-bold mb-6">Account Profile</h2>
                            
                            <div className="space-y-6">
                                <div className="group">
                                    <p className="text-[11px] font-bold text-[var(--c-primary)] uppercase tracking-[0.2em] mb-1">Full Name</p>
                                    <p className="text-[18px] font-medium text-white/90 group-hover:text-white transition-colors">{user?.name}</p>
                                </div>
                                <div className="group">
                                    <p className="text-[11px] font-bold text-[var(--c-primary)] uppercase tracking-[0.2em] mb-1">Email Address</p>
                                    <p className="text-[18px] font-medium text-white/90 group-hover:text-white transition-colors break-all">{user?.email}</p>
                                </div>
                                {user?.phone && (
                                    <div className="group">
                                        <p className="text-[11px] font-bold text-[var(--c-primary)] uppercase tracking-[0.2em] mb-1">Contact Number</p>
                                        <p className="text-[18px] font-medium text-white/90 group-hover:text-white transition-colors">{user?.phone}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button 
                            onClick={() => router.push('/account/edit')}
                            className="mt-12 w-full py-4 bg-[var(--c-primary)] hover:bg-[#97a872] text-white rounded-2xl font-bold uppercase tracking-widest text-[13px] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[var(--c-primary)]/20"
                        >
                            Edit Profile
                        </button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

function AccountCard({ href, icon: Icon, title, description, color }) {
    return (
        <motion.div 
            whileHover={{ y: -5, scale: 1.01 }}
            className="group"
        >
            <Link href={href} className="block h-full bg-white/60 backdrop-blur-sm p-8 rounded-[2.5rem] border border-[var(--c-border)]/60 shadow-sm hover:shadow-xl hover:border-[var(--c-primary)]/40 transition-all duration-300">
                <div className="flex items-start justify-between mb-8">
                    <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-[10deg]"
                        style={{ backgroundColor: `${color}15`, color: color }}
                    >
                        <Icon className="w-7 h-7" />
                    </div>
                    <div className="w-10 h-10 rounded-full border border-[var(--c-border)] flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-[var(--c-primary)] group-hover:border-[var(--c-primary)] transition-all transform translate-x-4 group-hover:translate-x-0">
                        <ChevronRight className="w-5 h-5 text-white" />
                    </div>
                </div>
                <h2 className="font-serif text-[22px] font-bold text-[var(--c-text)] mb-2 group-hover:text-[var(--c-primary)] transition-colors font-serif">
                    {title}
                </h2>
                <p className="text-[14px] text-[var(--c-text-muted)] leading-relaxed">
                    {description}
                </p>
            </Link>
        </motion.div>
    );
}
