import HomeHero from "./components/HomeHero";
import CategoryGrid from "./components/CategoryGrid";
import ProductRail from "./components/ProductRail";
import OurStory from "./components/OurStory";
import SocialProof from "./components/SocialProof";
import MobileProductSections from "./components/MobileProductSections";
import HomeBlog from "./components/HomeBlog";
import SectionRenderer from "./components/blocks/SectionRenderer";
import { getSlotSections } from "@/lib/layout";
import { Flame, Sparkles } from "lucide-react";

// Read per request so publishing a layout goes live without a rebuild.
export const dynamic = "force-dynamic";

export default async function Home() {
  const sections = await getSlotSections("home", "body");

  return (
    <div className="min-h-screen bg-[var(--c-bg)] text-[var(--c-text)]">
      <main>
        {sections.length > 0 ? (
          /* Admin-defined layout: order, content and visibility all come from
             the published page. */
          <SectionRenderer sections={sections} />
        ) : (
          /* Nothing published yet — keep the original page so the site is
             never blank before the builder has been used. */
          <DefaultHome />
        )}
      </main>
    </div>
  );
}

function DefaultHome() {
  return (
    <>
      {/* Full Width Hero Slider */}
      <HomeHero />

      {/* Mobile: Category pills + Product grids */}
      <MobileProductSections />

      {/* Explore Categories */}
      <CategoryGrid />

      {/* Best Sellers */}
      <ProductRail
        title="Best Sellers"
        subtitle="Most Popular"
        icon={<Flame className="w-5 h-5 text-[var(--c-accent)]" />}
        endpoint="/api/products?isFeatured=true&limit=8"
        viewAllLink="/products?filter=bestseller"
        bgWhite={true}
      />

      {/* Our Story */}
      <OurStory />

      {/* New Arrivals */}
      <ProductRail
        title="New Arrivals"
        subtitle="Just Launched"
        icon={<Sparkles className="w-5 h-5 text-[var(--c-primary)]" />}
        endpoint="/api/products?sort=newest&limit=8"
        viewAllLink="/products?filter=new"
        bgWhite={false}
      />

      {/* Blog Section (Image 1 Style) */}
      <HomeBlog />

      {/* Social Proof / Reviews */}
      <SocialProof />
    </>
  );
}
