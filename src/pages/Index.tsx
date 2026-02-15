import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FinalCTASection } from "@/components/landing/FinalCTASection";
import { useSeo } from "@/hooks/useSeo";

const Index = () => {
  useSeo({
    title: undefined,
    description: "Temerio turns your documents into a structured life timeline — clear, searchable, and built for perspective.",
    path: "/",
  });
  return (
    <div className="bg-background">
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <FinalCTASection />
    </div>
  );
};

export default Index;
