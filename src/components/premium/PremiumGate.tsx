import { type ReactNode, useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { UpsellModal } from "./UpsellModal";
import { Lock } from "lucide-react";

interface PremiumGateProps {
  children: ReactNode;
  /** Show a blurred preview of the content */
  showTeaser?: boolean;
  /** Feature name for the upsell modal */
  featureName?: string;
}

export function PremiumGate({ children, showTeaser = true, featureName = "This feature" }: PremiumGateProps) {
  const { isSubscribed, isLoading } = useSubscription();
  const [upsellOpen, setUpsellOpen] = useState(false);

  if (isLoading) return null;
  if (isSubscribed) return <>{children}</>;

  return (
    <>
      <div className="relative">
        {showTeaser && (
          <div className="blur-sm pointer-events-none select-none" aria-hidden>
            {children}
          </div>
        )}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-xl cursor-pointer"
          onClick={() => setUpsellOpen(true)}
        >
          <div className="rounded-full bg-primary/10 p-3 mb-3">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <p className="font-semibold text-sm">Pro Feature</p>
          <p className="text-xs text-muted-foreground mt-1">Click to learn more</p>
        </div>
      </div>
      <UpsellModal
        open={upsellOpen}
        onOpenChange={setUpsellOpen}
        featureName={featureName}
      />
    </>
  );
}
