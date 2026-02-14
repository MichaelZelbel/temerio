import { useSeo } from "@/hooks/useSeo";

const Features = () => {
  useSeo({ title: "Features", description: "Explore everything Temerio has to offer — AI-powered timelines, team collaboration, and more.", path: "/features" });
  return (
  <div className="container py-16 space-y-6">
    <h1>Features</h1>
    <p className="text-lg text-muted-foreground">Explore everything Temerio has to offer.</p>
  </div>
  );
};

export default Features;
