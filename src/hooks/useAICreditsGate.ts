import { useAICredits } from "./useAICredits";
import { useToast } from "@/hooks/use-toast";

export function useAICreditsGate() {
  const { credits, isLoading, refetch } = useAICredits();
  const { toast } = useToast();

  const checkCredits = (): boolean => {
    // Fail-open while loading
    if (isLoading) return true;

    // No credits data yet (no allowance period) — allow
    if (!credits) return true;

    // Zero-grant plans (e.g. free with 0 credits) — block
    if (credits.creditsGranted === 0) {
      toast({
        title: "No AI credits available",
        description: "Upgrade to Pro to unlock AI features.",
        variant: "destructive",
      });
      return false;
    }

    if (credits.remainingCredits <= 0) {
      toast({
        title: "Out of AI credits",
        description: "You've used all your credits this period. They'll reset on " +
          new Date(credits.periodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric" }) + ".",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  return { checkCredits, credits, isLoading, refetch };
}
