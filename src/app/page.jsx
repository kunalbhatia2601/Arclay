import Hero from "./components/Hero";
import ProductHighlight from "./components/ProductHighlight";
import WhyEssvora from "./components/WhyEssvora";
import OurStory from "./components/OurStory";
import SocialProof from "./components/SocialProof";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <Hero />
        <ProductHighlight />
        <WhyEssvora />
        <OurStory />
        <SocialProof />
      </main>
    </div>
  );
}
