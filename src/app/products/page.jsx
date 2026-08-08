import { Suspense } from "react";
import ProductsClient from "./ProductsClient";
import SectionRenderer from "../components/blocks/SectionRenderer";
import { getSlotSections } from "@/lib/layout";

// Layout is read per request so publishing goes live without a rebuild.
export const dynamic = "force-dynamic";

export default async function ProductsPage() {
    const sections = await getSlotSections("products", "body");

    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-[var(--c-primary)] border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            {sections.length > 0 ? (
                /* Fully admin-built page — the catalogue itself is a block, so
                   its filters, columns and header are all editable. */
                <main className="min-h-screen bg-[var(--c-bg)]">
                    <SectionRenderer sections={sections} />
                </main>
            ) : (
                /* Nothing published yet: keep the original page so the
                   storefront is never blank before the builder is used.
                   ProductsClient renders its own <main>. */
                <ProductsClient />
            )}
        </Suspense>
    );
}
