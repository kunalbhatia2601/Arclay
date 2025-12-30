import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ProductHighlight from "./components/ProductHighlight";
import WhyEssvora from "./components/WhyEssvora";
import OurStory from "./components/OurStory";
import SocialProof from "./components/SocialProof";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <ProductHighlight />
        <WhyEssvora />
        <OurStory />
        <SocialProof />
      </main>
      <Footer />
    </div>
  );
}
