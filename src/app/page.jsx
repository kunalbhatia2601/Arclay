import HomeHero from "./components/HomeHero";
import TrustBadges from "./components/TrustBadges";
import CategoryGrid from "./components/CategoryGrid";
import ProductRail from "./components/ProductRail";
import PromoBanner from "./components/PromoBanner";
import OurStory from "./components/OurStory";
import SocialProof from "./components/SocialProof";
import { Flame, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        {/* Full Width Hero Slider */}
        <HomeHero />

        {/* Global Trust Badges */}
        <TrustBadges />

        {/* Categories Grid */}
        <CategoryGrid />

        {/* Best Sellers Rail */}
        <ProductRail
          title="Best Sellers"
          icon={<Flame className="w-6 h-6 text-terracotta-500" />}
          endpoint="/api/products?isFeatured=true&limit=8"
          viewAllLink="/shop?filter=bestseller"
          bgWhite={true}
        />

        {/* Festive Promo Banner */}
        <PromoBanner />

        {/* New Arrivals Rail */}
        <ProductRail
          title="New Arrivals"
          icon={<Sparkles className="w-6 h-6 text-olive-500" />}
          endpoint="/api/products?sort=newest&limit=8"
          viewAllLink="/shop?filter=new"
          bgWhite={false}
        />

        {/* Brand Story Section */}
        <OurStory />

        {/* Social Proof / Reviews */}
        <SocialProof />
      </main>
    </div>
  );
}

