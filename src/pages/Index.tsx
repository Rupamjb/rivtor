import { Navbar } from "@/components/rivtor/Navbar";
import { Hero } from "@/components/rivtor/Hero";
import { LogoStrip } from "@/components/rivtor/LogoStrip";
import { ProductVideo } from "@/components/rivtor/ProductVideo";
import { FeatureTabs } from "@/components/rivtor/FeatureTabs";
import { LightSection } from "@/components/rivtor/LightSection";
import { Footer } from "@/components/rivtor/Footer";

const Index = () => {
  return (
    <main className="bg-rv text-rv-text">
      <Navbar />
      <Hero />
      <LogoStrip />
      <ProductVideo />
      <FeatureTabs />
      <LightSection />
      <Footer />
    </main>
  );
};

export default Index;
