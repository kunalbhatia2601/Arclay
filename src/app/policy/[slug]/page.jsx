"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";

export default function PolicyDetailPage({ params }) {
    const { slug } = use(params);
    const [policy, setPolicy] = useState(null);
    const [allPolicies, setAllPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        async function fetchPolicy() {
            try {
                const res = await fetch("/api/app-config");
                const data = await res.json();
                const list = data?.config?.legalPolicies || [];
                setAllPolicies(list);
                const found = list.find(p => p.slug === slug);
                if (found) setPolicy(found);
                else setNotFound(true);
            } catch {
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        }
        fetchPolicy();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[var(--c-primary)] animate-spin" />
            </div>
        );
    }

    if (notFound) {
        return (
            <main className="min-h-screen bg-[var(--c-bg)] flex flex-col items-center justify-center gap-4 px-4 text-center">
                <FileText className="w-12 h-12 text-[var(--c-primary)]/40" strokeWidth={1.5} />
                <h1 className="font-serif text-3xl font-bold text-[var(--c-text)]">Policy Not Found</h1>
                <p className="text-[var(--c-text-muted)] max-w-sm">The policy you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                <Link
                    href="/policy"
                    className="inline-flex items-center gap-2 mt-2 bg-[var(--c-primary)] hover:bg-[var(--c-primary-dark)] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> View All Policies
                </Link>
            </main>
        );
    }

    const otherPolicies = allPolicies.filter(p => p.slug !== slug);
    const hasContent = policy.content && policy.content.trim().length > 0;

    return (
        <main className="min-h-screen bg-[var(--c-bg)]">
            {/* Hero strip */}
            <section className="bg-[var(--c-text)] text-white pt-24 lg:pt-28 pb-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-[var(--c-primary)]/10 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
                <div className="container mx-auto px-6 max-w-4xl relative z-10">
                    <Link
                        href="/policy"
                        className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-medium mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> All Policies
                    </Link>
                    <h1 className="font-serif text-[36px] lg:text-[52px] font-bold leading-tight">
                        {policy.title}
                    </h1>
                </div>
            </section>

            {/* Content */}
            <section className="container mx-auto px-4 lg:px-8 max-w-4xl py-12 lg:py-16">
                {hasContent ? (
                    <div
                        className="policy-content text-[var(--c-text)]/80 leading-relaxed text-[15px]
                            [&_h1]:font-serif [&_h1]:text-[26px] [&_h1]:font-bold [&_h1]:text-[var(--c-text)] [&_h1]:mt-10 [&_h1]:mb-4
                            [&_h2]:font-serif [&_h2]:text-[22px] [&_h2]:font-bold [&_h2]:text-[var(--c-text)] [&_h2]:mt-8 [&_h2]:mb-3
                            [&_h3]:font-serif [&_h3]:text-[18px] [&_h3]:font-semibold [&_h3]:text-[var(--c-text)] [&_h3]:mt-6 [&_h3]:mb-2
                            [&_p]:mb-4 [&_p]:leading-relaxed
                            [&_a]:text-[#647345] [&_a]:underline hover:[&_a]:text-[var(--c-primary)]
                            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1
                            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1
                            [&_li]:leading-relaxed
                            [&_strong]:text-[var(--c-text)] [&_strong]:font-semibold
                            [&_table]:w-full [&_table]:border-collapse [&_table]:mb-4
                            [&_th]:border [&_th]:border-[var(--c-border)] [&_th]:px-4 [&_th]:py-2 [&_th]:bg-[var(--c-surface-alt)] [&_th]:text-[var(--c-text)] [&_th]:font-semibold [&_th]:text-left
                            [&_td]:border [&_td]:border-[var(--c-border)] [&_td]:px-4 [&_td]:py-2
                            [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--c-primary)] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4 [&_blockquote]:text-[var(--c-text-muted)]"
                        dangerouslySetInnerHTML={{ __html: policy.content }}
                    />
                ) : (
                    <div className="bg-white border border-[var(--c-border)] rounded-2xl p-10 lg:p-14 text-center">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-[var(--c-primary)]/40" strokeWidth={1.5} />
                        <h2 className="font-serif text-xl font-bold text-[var(--c-text)] mb-2">Content Coming Soon</h2>
                        <p className="text-[var(--c-text-muted)] text-sm max-w-md mx-auto">
                            We&apos;re finalising the {policy.title.toLowerCase()}. Please check back shortly, or contact us for specific questions.
                        </p>
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 mt-6 bg-[var(--c-primary)] hover:bg-[var(--c-primary-dark)] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
                        >
                            Contact Us
                        </Link>
                    </div>
                )}

                {/* Other policies */}
                {otherPolicies.length > 0 && (
                    <div className="mt-16 pt-10 border-t border-[var(--c-border)]">
                        <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[var(--c-text-muted)] mb-5">
                            Other Policies
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {otherPolicies.map(p => (
                                <Link
                                    key={p._id || p.slug}
                                    href={`/policy/${p.slug}`}
                                    className="px-5 py-2.5 rounded-full bg-white border border-[var(--c-border)] text-sm font-medium text-[var(--c-text)] hover:bg-[var(--c-accent-soft)] hover:border-[var(--c-primary)]/30 transition-all"
                                >
                                    {p.title}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}
