import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, Minus, ShieldCheck, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  pricingTiers,
  comparisonFeatures,
  pricingFAQs,
} from "@/config/pricing";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useToast } from "@/hooks/use-toast";
import { type BillingCycle } from "@/config/stripe";

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="h-4 w-4 text-success mx-auto" />;
  if (value === false) return <Minus className="h-4 w-4 text-muted-foreground/40 mx-auto" />;
  if (value === "Coming soon")
    return <Badge variant="outline" className="text-2xs">Coming soon</Badge>;
  return <span className="text-sm">{value}</span>;
}

const Pricing = () => {
  const [yearly, setYearly] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { isSubscribed, tier, isLoading: subLoading, checkSubscription } = useSubscription();
  const { createCheckoutSession, isLoading: checkoutLoading } = useStripeCheckout();
  const { toast } = useToast();

  // Handle checkout callback query params
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "cancelled") {
      toast({ title: "Checkout cancelled", description: "You can try again anytime." });
      searchParams.delete("checkout");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, toast]);

  const handleUpgrade = () => {
    if (!user) {
      window.location.href = "/auth?tab=signup&redirect=/pricing";
      return;
    }
    const cycle: BillingCycle = yearly ? "yearly" : "monthly";
    createCheckoutSession(cycle);
  };

  const getCtaForTier = (tierName: string) => {
    if (tierName === "Free") {
      if (isSubscribed) return { label: "Free Plan", disabled: true, action: undefined };
      return { label: "Get Started", disabled: false, action: () => { window.location.href = "/auth"; } };
    }
    if (tierName === "Pro") {
      if (isSubscribed && (tier === "pro" || tier === "admin" || tier === "premium_gift")) {
        return { label: "Current Plan", disabled: true, action: undefined };
      }
      return { label: "Start Free Trial", disabled: false, action: handleUpgrade };
    }
    // Enterprise
    return { label: "Contact Sales", disabled: false, action: () => { window.location.href = "/docs"; } };
  };

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="py-20 text-center">
        <div className="container max-w-3xl space-y-6">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            Simple, Transparent Pricing
          </motion.h1>
          <motion.p className="text-lg text-muted-foreground" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            Start free, upgrade when you need more.
          </motion.p>

          {/* Toggle */}
          <motion.div className="inline-flex items-center gap-3 rounded-full border bg-muted/50 p-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <button onClick={() => setYearly(false)} className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${!yearly ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
              Monthly
            </button>
            <button onClick={() => setYearly(true)} className={`rounded-full px-5 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${yearly ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
              Yearly
              <Badge variant="success" className="text-2xs">Save 20%</Badge>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24">
        <div className="container">
          <motion.div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            {pricingTiers.map((t) => {
              const price = yearly ? t.yearlyPrice : t.monthlyPrice;
              const cta = getCtaForTier(t.name);
              const isCurrent = isSubscribed && t.name === "Pro" && (tier === "pro" || tier === "admin" || tier === "premium_gift");

              return (
                <div
                  key={t.name}
                  className={`relative rounded-2xl border p-8 flex flex-col space-y-6 ${
                    t.highlighted
                      ? "border-primary bg-card shadow-xl ring-1 ring-primary/20"
                      : "bg-card"
                  } ${isCurrent ? "ring-2 ring-success/40" : ""}`}
                >
                  {isCurrent && (
                    <Badge variant="success" className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Your Plan
                    </Badge>
                  )}
                  {!isCurrent && t.badge && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      {t.badge}
                    </Badge>
                  )}
                  <div className="space-y-2">
                    <h4>{t.name}</h4>
                    <p className="text-sm text-muted-foreground">{t.description}</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    {price !== null ? (
                      <>
                        <span className="text-5xl font-bold font-display">${price}</span>
                        <span className="text-muted-foreground text-sm">/month</span>
                      </>
                    ) : (
                      <span className="text-5xl font-bold font-display">Custom</span>
                    )}
                  </div>
                  {yearly && t.monthlyPrice !== null && t.monthlyPrice > 0 && (
                    <p className="text-xs text-muted-foreground -mt-4">
                      Billed as ${(t.yearlyPrice ?? 0) * 12}/year
                    </p>
                  )}
                  <Separator />
                  <ul className="space-y-3 flex-1">
                    {t.name !== "Free" && (
                      <li className="text-xs font-medium text-muted-foreground uppercase tracking-wider pb-1">
                        Everything in {t.name === "Pro" ? "Free" : "Pro"}, plus:
                      </li>
                    )}
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={t.highlighted ? "default" : "outline"}
                    size="lg"
                    className="w-full"
                    disabled={cta.disabled || (t.name === "Pro" && checkoutLoading)}
                    onClick={cta.action}
                  >
                    {t.name === "Pro" && checkoutLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {cta.label}
                  </Button>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-24 bg-muted/30">
        <div className="container max-w-5xl space-y-10">
          <motion.div className="text-center space-y-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.5 }}>
            <h2>Compare plans in detail</h2>
            <p className="text-muted-foreground">See exactly what's included in each plan.</p>
          </motion.div>

          <motion.div className="rounded-2xl border bg-card overflow-hidden" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.5, delay: 0.1 }}>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium text-sm text-muted-foreground w-2/5">Feature</th>
                    <th className="p-4 font-semibold text-sm text-center">Free</th>
                    <th className="p-4 font-semibold text-sm text-center bg-primary/5">Pro</th>
                    <th className="p-4 font-semibold text-sm text-center">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((f, i) => (
                    <tr key={f.name} className={i < comparisonFeatures.length - 1 ? "border-b" : ""}>
                      <td className="p-4 text-sm">{f.name}</td>
                      <td className="p-4 text-center"><CellValue value={f.free} /></td>
                      <td className="p-4 text-center bg-primary/5"><CellValue value={f.pro} /></td>
                      <td className="p-4 text-center"><CellValue value={f.enterprise} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile accordion */}
            <div className="md:hidden">
              <Accordion type="single" collapsible>
                {comparisonFeatures.map((f) => (
                  <AccordionItem key={f.name} value={f.name}>
                    <AccordionTrigger className="px-4 text-sm">{f.name}</AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div><p className="text-xs text-muted-foreground mb-1">Free</p><CellValue value={f.free} /></div>
                        <div><p className="text-xs text-muted-foreground mb-1">Pro</p><CellValue value={f.pro} /></div>
                        <div><p className="text-xs text-muted-foreground mb-1">Enterprise</p><CellValue value={f.enterprise} /></div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="container max-w-3xl space-y-10">
          <motion.div className="text-center space-y-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.5 }}>
            <h2>Frequently asked questions</h2>
            <p className="text-muted-foreground">Can't find what you're looking for? Reach out to our support team.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.5, delay: 0.1 }}>
            <Accordion type="single" collapsible className="space-y-3">
              {pricingFAQs.map((faq) => (
                <AccordionItem key={faq.question} value={faq.question} className="rounded-xl border bg-card px-6">
                  <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Money-back guarantee */}
      <section className="pb-24">
        <div className="container">
          <motion.div className="flex items-center justify-center gap-3 rounded-2xl border bg-success/5 border-success/20 p-6 max-w-lg mx-auto" initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4 }}>
            <ShieldCheck className="h-8 w-8 text-success shrink-0" />
            <div>
              <p className="font-semibold text-sm">30-Day Money-Back Guarantee</p>
              <p className="text-xs text-muted-foreground">Try any paid plan risk-free. Not satisfied? Get a full refund, no questions asked.</p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
