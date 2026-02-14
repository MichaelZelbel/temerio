import { useAICredits } from "@/hooks/useAICredits";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Sparkles, RefreshCw, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface CreditsDisplayProps {
  /** Compact mode for sidebar widget */
  compact?: boolean;
}

export function CreditsDisplay({ compact = false }: CreditsDisplayProps) {
  const { credits, isLoading, error, refetch } = useAICredits();

  if (isLoading) {
    return compact ? (
      <div className="flex items-center gap-2 text-muted-foreground text-xs px-3 py-2">
        <Loader2 className="h-3 w-3 animate-spin" /> Loading credits…
      </div>
    ) : (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !credits) {
    return compact ? null : (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          {error ? "Failed to load credits" : "No credits data available"}
        </CardContent>
      </Card>
    );
  }

  const percentage = credits.creditsGranted > 0
    ? Math.round((credits.remainingCredits / credits.creditsGranted) * 100)
    : 0;
  const rolloverPercentage = credits.creditsGranted > 0
    ? Math.round((credits.rolloverTokens / credits.tokensPerCredit / credits.creditsGranted) * 100)
    : 0;
  const resetDate = new Date(credits.periodEnd).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  const isLow = percentage < 15 && credits.creditsGranted > 0;

  // Compact sidebar widget
  if (compact) {
    return (
      <div className="px-3 py-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> AI Credits
          </span>
          <span className="text-xs font-semibold">
            {credits.remainingCredits}
            <span className="text-muted-foreground font-normal">/{credits.creditsGranted}</span>
          </span>
        </div>
        <div className="relative">
          <Progress
            value={credits.creditsGranted > 0 ? ((credits.creditsGranted - credits.remainingCredits) / credits.creditsGranted) * 100 : 0}
            className="h-1.5"
          />
        </div>
        {isLow && (
          <p className="text-2xs text-destructive">Credits running low • Resets {resetDate}</p>
        )}
      </div>
    );
  }

  // Full display for settings
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI Credits</CardTitle>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={refetch}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>Your AI usage for the current billing period.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Credits counter */}
        <div className="text-center space-y-1">
          <p className="text-4xl font-display font-bold">
            {credits.remainingCredits}
          </p>
          <p className="text-sm text-muted-foreground">
            of {credits.creditsGranted} credits remaining
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="relative">
            <Progress
              value={credits.creditsGranted > 0 ? ((credits.creditsGranted - credits.remainingCredits) / credits.creditsGranted) * 100 : 0}
              className="h-3"
            />
            {/* Rollover indicator */}
            {rolloverPercentage > 0 && (
              <div
                className="absolute top-0 right-0 h-3 rounded-r-full bg-primary/30"
                style={{ width: `${rolloverPercentage}%` }}
                title={`${Math.round(credits.rolloverTokens / credits.tokensPerCredit)} rollover credits`}
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{credits.creditsUsed} used</span>
            <span>{credits.remainingCredits} remaining</span>
          </div>
        </div>

        {isLow && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            Your credits are running low. They will reset on {resetDate}.
          </div>
        )}

        <Separator />

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Base Credits</p>
            <p className="font-medium">{Math.round(credits.baseTokens / credits.tokensPerCredit)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Rollover Credits</p>
            <p className="font-medium flex items-center gap-1">
              {Math.round(credits.rolloverTokens / credits.tokensPerCredit)}
              {credits.rolloverTokens > 0 && <Badge variant="success" className="text-2xs">Bonus</Badge>}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Period Start</p>
            <p className="font-medium">
              {new Date(credits.periodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Resets On</p>
            <p className="font-medium">{resetDate}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tokens Per Credit</p>
            <p className="font-medium">{credits.tokensPerCredit}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Tokens</p>
            <p className="font-medium">{credits.tokensGranted.toLocaleString()}</p>
          </div>
        </div>

        {credits.creditsGranted === 0 && (
          <>
            <Separator />
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Upgrade to Pro to unlock AI credits every month.
              </p>
              <Button asChild>
                <Link to="/pricing">
                  <ArrowUpRight className="mr-2 h-4 w-4" /> Upgrade to Pro
                </Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
