import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { PricingPreviewSection } from "@/components/landing/PricingPreviewSection";
import { FinalCTASection } from "@/components/landing/FinalCTASection";

const Index = () => {
  return (
    <div className="bg-background">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SocialProofSection />
      <PricingPreviewSection />
      <FinalCTASection />
    </div>
  );
};

export default Index;
