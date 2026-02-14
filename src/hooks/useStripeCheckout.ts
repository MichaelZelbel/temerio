import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPriceId, type BillingCycle } from "@/config/stripe";
import { useToast } from "@/hooks/use-toast";

export function useStripeCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createCheckoutSession = async (billingCycle: BillingCycle) => {
    setIsLoading(true);
    try {
      const priceId = getPriceId(billingCycle);
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      toast({
        title: "Checkout failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { createCheckoutSession, isLoading };
}
