"use client";

import { Button } from "@/components/ui/button";
import { getBrandContent, getSiteName } from "@/config/brandContent";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const siteName = getSiteName();
const content = getBrandContent(siteName);

export default function Footer() {
    const pathname = usePathname();
    const [showFooter, setShowFooter] = useState(true);

    useEffect(() => {
        pathname.includes("login") || pathname.includes("signup") || pathname.includes("admin") ? setShowFooter(false) : setShowFooter(true);
    }, [pathname]);

    if (!showFooter) return null;

    return (
        <footer className="bg-[#0A0A0A] text-white pt-24 pb-8 border-t border-white/5">
            <div className="container mx-auto px-4 lg:px-8">

                <div className="grid lg:grid-cols-12 gap-16 pb-16 border-b border-white/5">

                    {/* Brand & Newsletter Column */}
                    <div className="lg:col-span-12 xl:col-span-5 space-y-8">
                        <div>
                            <Link href="/" className="inline-block group">
                                <span className="text-3xl font-black text-white tracking-tighter">
                                    {siteName}<span className="text-primary">.</span>
                                </span>
                            </Link>
                            <p className="mt-4 text-white/50 max-w-sm leading-relaxed font-medium">
                                Experience the finest culinary journey.
                                Fresh ingredients, expert chefs, and an atmosphere like no other.
                            </p>
                        </div>

                        {/* High Contrast Newsletter */}
                        <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-white/5 max-w-md">
                            <h4 className="text-lg font-bold text-white mb-2">Join our Newsletter</h4>
                            <p className="text-sm text-white/50 mb-4">Get 10% off your first order!</p>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                                />
                                <Button className="bg-primary hover:bg-primary/90 text-black font-bold rounded-lg px-4">
                                    Subscribe
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Links Grid */}
                    <div className="lg:col-span-12 xl:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-12">

                        {/* Column 1 */}
                        <div className="space-y-6">
                            <h4 className="text-lg font-bold text-white">Company</h4>
                            <ul className="space-y-4">
                                {['About Us', 'Our Team', 'Careers', 'Blog'].map(item => (
                                    <li key={item}>
                                        <Link href="#" className="text-white/60 hover:text-primary transition-colors text-sm font-medium">
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-6">
                            <h4 className="text-lg font-bold text-white">Contact</h4>
                            <ul className="space-y-4">
                                <li className="text-white/60 text-sm font-medium">
                                    123 Culinary Avenue, <br /> Foodie City, FC 90210
                                </li>
                                <li className="text-white/60 text-sm font-medium hover:text-primary cursor-pointer">
                                    +1 (555) 123-4567
                                </li>
                                <li className="text-white/60 text-sm font-medium hover:text-primary cursor-pointer">
                                    hello@{siteName.toLowerCase()}.com
                                </li>
                            </ul>
                        </div>

                        {/* Column 3 - Socials */}
                        <div className="space-y-6">
                            <h4 className="text-lg font-bold text-white">Follow Us</h4>
                            <div className="flex gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full bg-[#1E1E1E] hover:bg-primary hover:text-black text-white flex items-center justify-center transition-all cursor-pointer">
                                        <div className="w-4 h-4 bg-current rounded-sm"></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/40 font-medium">
                    <p>© {new Date().getFullYear()} {siteName}. All Rights Reserved.</p>
                    <div className="flex gap-8">
                        <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
                    </div>
                </div>

            </div>
        </footer>
    );
}
