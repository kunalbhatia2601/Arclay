import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";
import PdpRenderer from "../../components/blocks/pdp/PdpRenderer";
import { getSlotSections } from "@/lib/layout";
import { getProductDetail } from "@/lib/productDetail";

// Layout is read per request so publishing goes live without a rebuild.
export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }) {
    const { id } = await params;

    const [sections, detail] = await Promise.all([
        getSlotSections("product-detail", "body"),
        getProductDetail(id),
    ]);

    // Nothing published yet — keep the original page so the storefront is
    // never blank before the builder has been used.
    if (sections.length === 0) {
        return <ProductDetailClient params={params} />;
    }

    if (!detail) notFound();

    return (
        <main className="min-h-screen bg-[var(--c-bg)] pb-24 lg:pb-0 overflow-x-hidden">
            <div className="container mx-auto px-4 xl:px-8 max-w-[var(--container-w)] py-8">
                <PdpRenderer
                    sections={sections}
                    product={detail.product}
                    reviews={detail.reviews}
                    relatedProducts={detail.relatedProducts}
                    meta={detail.meta}
                />
            </div>
        </main>
    );
}
