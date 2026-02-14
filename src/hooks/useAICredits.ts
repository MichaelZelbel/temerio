import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface AICredits {
  tokensGranted: number;
  tokensUsed: number;
  remainingTokens: number;
  creditsGranted: number;
  creditsUsed: number;
  remainingCredits: number;
  periodStart: string;
  periodEnd: string;
  rolloverTokens: number;
  baseTokens: number;
  tokensPerCredit: number;
}

interface UseAICreditsReturn {
  credits: AICredits | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const LOW_CREDIT_KEY = "ai-credits-low-warning-shown";

export function useAICredits(): UseAICreditsReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [credits, setCredits] = useState<AICredits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lowWarningShown = useRef(false);

  const fetchCredits = useCallback(async () => {
    if (!user) {
      setCredits(null);
      setIsLoading(false);
      return;
    }

    try {
      // Ensure allowance period exists
      await supabase.functions.invoke("ensure-token-allowance");

      // Fetch from view
      const { data, error: fetchError } = await supabase
        .from("v_ai_allowance_current" as any)
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (fetchError) throw new Error(fetchError.message);

      if (data) {
        const meta = (data as any).metadata || {};
        const mapped: AICredits = {
          tokensGranted: Number((data as any).tokens_granted) || 0,
          tokensUsed: Number((data as any).tokens_used) || 0,
          remainingTokens: Number((data as any).remaining_tokens) || 0,
          creditsGranted: Number((data as any).credits_granted) || 0,
          creditsUsed: Number((data as any).credits_used) || 0,
          remainingCredits: Number((data as any).remaining_credits) || 0,
          periodStart: (data as any).period_start,
          periodEnd: (data as any).period_end,
          rolloverTokens: Number(meta.rollover_tokens) || 0,
          baseTokens: Number(meta.base_tokens) || 0,
          tokensPerCredit: Number(meta.tokens_per_credit) || 200,
        };
        setCredits(mapped);

        // Low credit warning (once per session)
        if (
          !lowWarningShown.current &&
          mapped.creditsGranted > 0 &&
          mapped.remainingCredits / mapped.creditsGranted < 0.15
        ) {
          lowWarningShown.current = true;
          toast({
            title: "AI credits running low",
            description: `You have ${mapped.remainingCredits} credits remaining this period.`,
            variant: "destructive",
          });
        }
      } else {
        setCredits(null);
      }

      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Failed to fetch AI credits:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return { credits, isLoading, error, refetch: fetchCredits };
}
