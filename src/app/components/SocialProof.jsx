"use client";

import { useState, useEffect, useCallback } from "react";
import { getBrandContent, getSiteName } from "@/config/brandContent";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { motion } from "framer-motion";

const siteName = getSiteName();
const content = getBrandContent(siteName);
const socialContent = content.socialProof;

export default function SocialProof() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false); // Silent fetch
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await fetch("/api/reviews/social-proof");
                if (!res.ok) return; // Fallback happens automatically as reviews will be []
                const data = await res.json();
                if (data.success && data.reviews?.length > 0) {
                    setReviews(data.reviews);
                }
            } catch (error) {
                console.error("Failed to fetch reviews:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, []);

    const displayReviews = reviews.length > 0
        ? reviews.map(r => ({
            id: r._id,
            rating: r.stars,
            text: r.comment,
            author: r.userName || "Customer",
        }))
        : socialContent.reviews;

    const total = displayReviews.length;

    const goNext = useCallback(() => {
        setCurrent((prev) => (prev + 1) % total);
    }, [total]);

    const goPrev = useCallback(() => {
        setCurrent((prev) => (prev - 1 + total) % total);
    }, [total]);

    // Auto-advance every 5s
    useEffect(() => {
        if (total <= 1) return;
        const timer = setInterval(goNext, 5000);
        return () => clearInterval(timer);
    }, [goNext, total]);

    const review = displayReviews[current];

    return (
        <motion.section 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="py-20 lg:py-28 bg-[#FEFBF6] overflow-hidden"
        >
            <div className="container mx-auto px-4 lg:px-8">
                {/* Heading */}
                <div className="text-center mb-12 lg:mb-16">
                    <h2 className="font-serif text-[32px] md:text-4xl lg:text-[44px] font-bold text-[#2A2F25]">
                        What Our Customers Say
                    </h2>
                    <p className="text-[#767B71] mt-3 text-sm lg:text-base max-w-lg mx-auto">
                        Don&apos;t just take our word for it - hear from our satisfied customers
                    </p>
                </div>

                {/* Testimonial Card */}
                <div className="max-w-4xl mx-auto mb-20 lg:mb-28">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-4 border-[#869661] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : review ? (
                        <div className="bg-white rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-[#ECE8E0] px-6 py-12 md:px-16 md:py-20 text-center transition-all duration-500 relative overflow-hidden group">
                           
                            {/* Quote Icon */}
                            <div className="flex justify-center mb-10">
                                <div className="w-20 h-20 rounded-full bg-[#F0F4EC]/50 flex items-center justify-center border border-[#869661]/10">
                                    <Quote className="w-8 h-8 text-[#869661] opacity-30" />
                                </div>
                            </div>

                            {/* Quote Text */}
                            <p className="font-serif text-[20px] md:text-[24px] text-[#2A2F25] leading-relaxed max-w-2xl mx-auto">
                                &quot;{review.text}&quot;
                            </p>

                            {/* Author */}
                            <div className="flex flex-col items-center justify-center gap-3 mt-10">
                                <div className="w-12 h-12 rounded-full bg-[#E8F0E3] flex items-center justify-center text-[#647345] font-serif font-bold text-lg">
                                    {review.author[0]}
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-[#2A2F25] text-[15px]">{review.author}</p>
                                    {/* Stars */}
                                    <div className="flex justify-center gap-0.5 mt-2">
                                        {Array.from({ length: 5 }, (_, i) => (
                                            <svg
                                                key={i}
                                                className={`w-3.5 h-3.5 ${i < (review.rating || 5) ? "text-[#E6B147] fill-[#E6B147]" : "text-[#ECE8E0] fill-[#ECE8E0]"}`}
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                            </svg>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* Navigation */}
                    {total > 1 && !loading && (
                        <div className="flex items-center justify-center gap-4 mt-8">
                            {/* Prev */}
                            <button
                                onClick={goPrev}
                                className="w-10 h-10 rounded-full bg-white border border-[#ECE8E0] flex items-center justify-center text-[#2A2F25] hover:shadow-md transition-all sm:translate-x-[-100%]"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {/* Dots */}
                            <div className="flex items-center gap-2">
                                {displayReviews.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrent(i)}
                                        className={`rounded-full transition-all duration-500 ${
                                            i === current
                                                ? "w-6 h-1.5 bg-[#869661]"
                                                : "w-1.5 h-1.5 bg-[#ECE8E0]"
                                        }`}
                                    />
                                ))}
                            </div>

                            {/* Next */}
                            <button
                                onClick={goNext}
                                className="w-10 h-10 rounded-full bg-white border border-[#ECE8E0] flex items-center justify-center text-[#2A2F25] hover:shadow-md transition-all sm:translate-x-[100%]"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Instagram Grid Section */}
                <div className="border-[#ECE8E0]">
                    <div className="text-center mb-10">
                         <div className="flex items-center justify-center gap-2 mb-3">
                             <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center">
                                 <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                     <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                     <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                                     <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                 </svg>
                             </div>
                             <p className="text-[#D86B4B] font-bold text-sm tracking-wide">@{siteName.toLowerCase().replace(/\s+/g, '')}</p>
                         </div>
                        <h2 className="font-serif text-[32px] md:text-4xl font-bold text-[#2A2F25]">
                            Follow Our Journey
                        </h2>
                        <p className="text-[#767B71] text-sm mt-3">Tag us in your photos for a chance to be featured</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {[
                            'https://images.unsplash.com/photo-1590439471364-192aa70c0b53?q=80&w=800&auto=format&fit=crop',
                            'https://images.unsplash.com/photo-1596431940173-67c2688753fc?q=80&w=800&auto=format&fit=crop',
                            'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=800&auto=format&fit=crop',
                            'https://images.unsplash.com/photo-1542841791-efa6ebba5121?q=80&w=800&auto=format&fit=crop',
                            'https://images.unsplash.com/photo-1605372551532-61c0e3eb4aae?q=80&w=800&auto=format&fit=crop',
                            'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop'
                        ].map((url, i) => (
                            <div key={i} className="aspect-square rounded-2xl md:rounded-3xl overflow-hidden relative group cursor-pointer bg-[#FEF9F3]">
                                <img 
                                    src={url} 
                                    alt={`Instagram ${i+1}`} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" 
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
