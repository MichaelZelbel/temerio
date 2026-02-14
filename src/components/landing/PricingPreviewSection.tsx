import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const tiers = [
  {
    name: "Free",
    price: "$0",
    description: "For individuals and small projects",
    features: ["Up to 3 projects", "Basic analytics", "Community support"],
    highlighted: false,
    cta: "Get Started",
  },
  {
    name: "Pro",
    price: "$29",
    description: "For growing teams that need more",
    features: [
      "Unlimited projects",
      "AI-powered insights",
      "Priority support",
      "Advanced integrations",
    ],
    highlighted: true,
    cta: "Start Free Trial",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For organizations at scale",
    features: [
      "Everything in Pro",
      "SSO & SAML",
      "Dedicated account manager",
      "Custom SLA",
    ],
    highlighted: false,
    cta: "Contact Sales",
  },
];

export function PricingPreviewSection() {
  return (
    <section className="py-24">
      <div className="container space-y-12">
        <motion.div
          className="text-center max-w-2xl mx-auto space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2>Simple, transparent pricing</h2>
          <p className="text-lg text-muted-foreground">
            Start free and scale as you grow. No hidden fees, no surprises.
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl border p-6 space-y-6 flex flex-col ${
                tier.highlighted
                  ? "border-primary bg-card shadow-lg ring-1 ring-primary/20 relative"
                  : "bg-card"
              }`}
            >
              {tier.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <div className="space-y-2">
                <h4>{tier.name}</h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-display">
                    {tier.price}
                  </span>
                  {tier.price !== "Custom" && (
                    <span className="text-muted-foreground text-sm">/month</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {tier.description}
                </p>
              </div>
              <ul className="space-y-3 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={tier.highlighted ? "default" : "outline"}
                className="w-full"
                asChild
              >
                <Link to={tier.name === "Enterprise" ? "/docs" : "/auth"}>
                  {tier.cta}
                </Link>
              </Button>
            </div>
          ))}
        </motion.div>

        <div className="text-center">
          <Button variant="link" asChild>
            <Link to="/pricing">See full pricing details →</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
