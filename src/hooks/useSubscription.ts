import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isProProduct } from "@/config/stripe";

interface SubscriptionState {
  isSubscribed: boolean;
  isLoading: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  tier: "free" | "pro" | "admin" | "premium_gift";
}

export function useSubscription() {
  const { user, role } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    isSubscribed: false,
    isLoading: true,
    productId: null,
    subscriptionEnd: null,
    tier: "free",
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState({ isSubscribed: false, isLoading: false, productId: null, subscriptionEnd: null, tier: "free" });
      return;
    }

    // Admin / premium_gift bypass
    if (role === "admin" || role === "premium_gift") {
      setState({
        isSubscribed: true,
        isLoading: false,
        productId: null,
        subscriptionEnd: null,
        tier: role as "admin" | "premium_gift",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      const subscribed = data?.subscribed ?? false;
      const productId = data?.product_id ?? null;

      setState({
        isSubscribed: subscribed,
        isLoading: false,
        productId,
        subscriptionEnd: data?.subscription_end ?? null,
        tier: subscribed && isProProduct(productId) ? "pro" : "free",
      });
    } catch (err) {
      console.error("Failed to check subscription:", err);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [user, role]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh every 60s
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkSubscription, 60_000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  return { ...state, checkSubscription };
}
