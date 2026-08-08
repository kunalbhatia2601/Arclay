"use client";

import { motion } from "framer-motion";
import { Bell, Package, Tag, Star, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function NotificationDropdown({ isOpen, onClose }) {
    const notifications = [
        {
            id: 1,
            title: "Order #1234 Shipped!",
            description: "Your artisanal pickles are on their way.",
            time: "2h ago",
            icon: Package,
            color: "text-blue-500",
            bg: "bg-blue-50",
            href: "/orders"
        },
        {
            id: 2,
            title: "New Festive Offer!",
            description: "Get 20% off on premium Gift Hampers.",
            time: "5h ago",
            icon: Tag,
            color: "text-[var(--c-accent)]",
            bg: "bg-[var(--c-accent)]/10",
            href: "/offers"
        },
        {
            id: 3,
            title: "We Value Your Feedback",
            description: "How was your recent Mango Pickle experience?",
            time: "1d ago",
            icon: Star,
            color: "text-[var(--c-star)]",
            bg: "bg-[var(--c-star)]/10",
            href: "/account"
        }
    ];

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute right-0 top-full mt-4 w-80 sm:w-[420px] bg-white/60 backdrop-blur-2xl border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[2.5rem] z-[100] overflow-hidden"
        >
            {/* Header */}
            <div className="px-8 py-5 border-b border-gray-100/50 flex items-center justify-between bg-white/40">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[var(--c-primary)]/10 flex items-center justify-center">
                        <Bell className="w-4 h-4 text-[var(--c-primary)]" />
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--c-text)] text-base leading-none">Notifications</h3>
                        <p className="text-[10px] text-[var(--c-primary)] font-bold uppercase tracking-widest mt-1">2 New Updates</p>
                    </div>
                </div>
                <button className="text-[10px] font-bold text-[var(--c-primary)] hover:text-[var(--c-primary-dark)] transition-colors uppercase tracking-[0.1em] px-3 py-1.5 rounded-full bg-[var(--c-primary)]/5 border border-[var(--c-primary)]/10">
                    Clear All
                </button>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                {notifications.map((note) => (
                    <Link
                        key={note.id}
                        href={note.href}
                        onClick={onClose}
                        className="flex gap-4 px-6 py-4 hover:bg-[var(--c-surface-alt)]/30 transition-colors border-b border-border/30 last:border-none group"
                    >
                        <div className={`shrink-0 w-10 h-10 rounded-full ${note.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                            <note.icon className={`w-5 h-5 ${note.color}`} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                                <h4 className="font-bold text-[var(--c-text)] text-sm">{note.title}</h4>
                                <span className="text-[10px] text-[var(--c-text-muted)] font-medium">{note.time}</span>
                            </div>
                            <p className="text-xs text-[var(--c-text-muted)] line-clamp-2 leading-relaxed">{note.description}</p>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Footer */}
            <Link 
                href="/account"
                onClick={onClose}
                className="block py-4 text-center text-xs font-bold text-[var(--c-text)] hover:bg-[var(--c-accent-soft)] transition-colors bg-[#FCF9F2] group"
            >
                <span className="flex items-center justify-center gap-1">
                    See All Activities
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </span>
            </Link>
        </motion.div>
    );
}
