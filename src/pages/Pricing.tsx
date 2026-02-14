import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useSeo } from "@/hooks/useSeo";
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
import { Check, Minus, Loader2 } from "lucide-react";
import {
  pricingTiers,
  comparisonFeatures,
  pricingFAQs,
} from "@/config/pricing";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useToast } from "@/hooks/use-toast";

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="h-4 w-4 text-success mx-auto" />;
  if (value === false) return <Minus className="h-4 w-4 text-muted-foreground/40 mx-auto" />;
  return <span className="text-sm">{value}</span>;
}

const Pricing = () => {
  useSeo({
    title: "Pricing",
    description: "Two simple plans. Start free, upgrade when you need AI extraction.",
    path: "/pricing",
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { isSubscribed, tier, isLoading: subLoading } = useSubscription();
  const { createCheckoutSession, isLoading: checkoutLoading } = useStripeCheckout();
  const { toast } = useToast();

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
    createCheckoutSession("monthly");
  };

  const isPro = isSubscribed && (tier === "pro" || tier === "admin" || tier === "premium_gift");

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="py-20 text-center">
        <div className="container max-w-2xl space-y-4">
          <motion.h1
            className="font-display"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            See your life's structure clearly.
          </motion.h1>
          <motion.p
            className="text-lg text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Two plans. No surprises. Start free, upgrade when you need document extraction.
          </motion.p>
        </div>
      </section>

      {/* Cards */}
      <section className="pb-24">
        <div className="container">
          <motion.div
            className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {pricingTiers.map((t) => {
              const isFree = t.name === "Free";
              const isCurrentPro = !isFree && isPro;
              const isCurrentFree = isFree && !isPro && !!user;

              return (
                <div
                  key={t.name}
                  className={`relative rounded-2xl border p-8 flex flex-col space-y-6 ${
                    t.highlighted
                      ? "border-primary bg-card shadow-lg ring-1 ring-primary/20"
                      : "bg-card"
                  } ${isCurrentPro || isCurrentFree ? "ring-2 ring-success/40" : ""}`}
                >
                  {(isCurrentPro || isCurrentFree) && (
                    <Badge variant="success" className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Your Plan
                    </Badge>
                  )}
                  {!isCurrentPro && !isCurrentFree && t.badge && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      {t.badge}
                    </Badge>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-display text-xl">{t.name}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold font-display">${t.price}</span>
                    {t.price > 0 && <span className="text-muted-foreground text-sm">/month</span>}
                  </div>

                  {t.price > 0 && (
                    <p className="text-xs text-muted-foreground -mt-4">
                      AI credits renew monthly.
                    </p>
                  )}

                  <Separator />

                  {/* Included features */}
                  <ul className="space-y-3 flex-1">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                    {t.excluded?.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground/60">
                        <Minus className="h-4 w-4 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={t.highlighted ? "default" : "outline"}
                    size="lg"
                    className="w-full"
                    disabled={isCurrentPro || isCurrentFree || (!isFree && checkoutLoading)}
                    onClick={
                      isCurrentPro || isCurrentFree
                        ? undefined
                        : isFree
                          ? () => { window.location.href = "/auth"; }
                          : handleUpgrade
                    }
                  >
                    {!isFree && checkoutLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isCurrentPro || isCurrentFree ? "Current Plan" : t.cta}
                  </Button>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 bg-muted/30">
        <div className="container max-w-3xl space-y-10">
          <motion.div
            className="text-center space-y-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <h2>Compare plans in detail</h2>
            <p className="text-muted-foreground">What's included at each level.</p>
          </motion.div>

          <motion.div
            className="rounded-2xl border bg-card overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Desktop */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium text-sm text-muted-foreground w-1/2">Feature</th>
                    <th className="p-4 font-semibold text-sm text-center w-1/4">Free</th>
                    <th className="p-4 font-semibold text-sm text-center w-1/4 bg-primary/5">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((f, i) => (
                    <tr key={f.name} className={i < comparisonFeatures.length - 1 ? "border-b" : ""}>
                      <td className="p-4 text-sm">{f.name}</td>
                      <td className="p-4 text-center"><CellValue value={f.free} /></td>
                      <td className="p-4 text-center bg-primary/5"><CellValue value={f.pro} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden">
              <Accordion type="single" collapsible>
                {comparisonFeatures.map((f) => (
                  <AccordionItem key={f.name} value={f.name}>
                    <AccordionTrigger className="px-4 text-sm">{f.name}</AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Free</p>
                          <CellValue value={f.free} />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Pro</p>
                          <CellValue value={f.pro} />
                        </div>
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
        <div className="container max-w-2xl space-y-10">
          <motion.div
            className="text-center space-y-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <h2>Common questions</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Accordion type="single" collapsible className="space-y-3">
              {pricingFAQs.map((faq) => (
                <AccordionItem
                  key={faq.question}
                  value={faq.question}
                  className="rounded-xl border bg-card px-6"
                >
                  <AccordionTrigger className="text-left font-medium">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
