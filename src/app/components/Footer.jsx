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
        <footer className="bg-background text-foreground pt-24 pb-8 border-t border-border">
            <div className="container mx-auto px-4 lg:px-8">

                <div className="grid lg:grid-cols-12 gap-16 pb-16 border-b border-border">

                    {/* Brand & Newsletter Column */}
                    <div className="lg:col-span-12 xl:col-span-5 space-y-8">
                        <div>
                            <Link href="/" className="inline-block group">
                                <span className="text-3xl font-black text-foreground tracking-tighter">
                                    {siteName}<span className="text-primary">.</span>
                                </span>
                            </Link>
                            <p className="mt-4 text-muted-foreground max-w-sm leading-relaxed font-medium">
                                Experience the finest culinary journey.
                                Fresh ingredients, expert chefs, and an atmosphere like no other.
                            </p>
                        </div>

                        {/* High Contrast Newsletter */}
                        <div className="bg-card p-6 rounded-2xl border border-border max-w-md">
                            <h4 className="text-lg font-bold text-foreground mb-2">Join our Newsletter</h4>
                            <p className="text-sm text-muted-foreground mb-4">Get 10% off your first order!</p>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="flex-1 bg-muted border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                                />
                                <Button className="bg-primary hover:bg-foreground hover:text-background text-primary-foreground font-bold rounded-lg px-4 shadow-lg hover:shadow-primary/20">
                                    Subscribe
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Links Grid */}
                    <div className="lg:col-span-12 xl:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-12">

                        {/* Column 1 */}
                        <div className="space-y-6">
                            <h4 className="text-lg font-bold text-foreground">Company</h4>
                            <ul className="space-y-4">
                                {['About Us', 'Our Team', 'Careers', 'Blog'].map(item => (
                                    <li key={item}>
                                        <Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-6">
                            <h4 className="text-lg font-bold text-foreground">Contact</h4>
                            <ul className="space-y-4">
                                <li className="text-muted-foreground text-sm font-medium">
                                    Chitkara University, <br /> Rajpura, Punjab 140401
                                </li>
                                <li className="text-muted-foreground text-sm font-medium hover:text-primary cursor-pointer">
                                    +91 82848-34841
                                </li>
                                <li className="text-muted-foreground text-sm font-medium hover:text-primary cursor-pointer">
                                    mails.kunalbhatia@gmail.com
                                </li>
                            </ul>
                        </div>

                        {/* Column 3 - Socials */}
                        <div className="space-y-6">
                            <h4 className="text-lg font-bold text-foreground">Follow Us</h4>
                            <div className="flex gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full bg-card border border-border hover:bg-primary hover:text-background text-muted-foreground flex items-center justify-center transition-all cursor-pointer shadow-sm hover:shadow-primary/30">
                                        <div className="w-4 h-4 bg-current rounded-sm"></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground font-medium">
                    <p>© {new Date().getFullYear()} {siteName}. All Rights Reserved.</p>
                    <div className="flex gap-8">
                        <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
                        <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
                    </div>
                </div>

            </div>
        </footer>
    );
}
