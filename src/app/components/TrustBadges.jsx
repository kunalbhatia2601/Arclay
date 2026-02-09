"use client";

import { motion } from "framer-motion";
import { Award, Leaf, Shield, Truck } from "lucide-react";

export default function TrustBadges() {
    const badges = [
        { icon: Leaf, title: '100% Natural', desc: 'No preservatives' },
        { icon: Award, title: 'Premium Quality', desc: 'Handcrafted with care' },
        { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹500' },
        { icon: Shield, title: 'Secure Payment', desc: '100% secure checkout' },
    ];

    return (
        <section className="py-12 bg-background border-b border-border">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {badges.map((badge, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-4"
                        >
                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0 text-primary">
                                <badge.icon className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="font-bold text-foreground">{badge.title}</p>
                                <p className="text-sm text-muted-foreground">{badge.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
