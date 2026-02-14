import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface TokenModalProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AllowanceData {
  id: string;
  tokens_granted: number;
  tokens_used: number;
  period_start: string;
  period_end: string;
  source: string;
}

export function TokenModal({ userId, userName, open, onOpenChange }: TokenModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allowance, setAllowance] = useState<AllowanceData | null>(null);
  const [granted, setGranted] = useState(0);
  const [used, setUsed] = useState(0);
  const [tokensPerCredit, setTokensPerCredit] = useState(200);

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    Promise.all([
      supabase
        .from("ai_allowance_periods")
        .select("id, tokens_granted, tokens_used, period_start, period_end, source")
        .eq("user_id", userId)
        .gte("period_end", new Date().toISOString())
        .order("period_start", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("ai_credit_settings")
        .select("value_int")
        .eq("key", "tokens_per_credit")
        .single(),
    ]).then(([allowanceRes, settingRes]) => {
      if (allowanceRes.data) {
        setAllowance(allowanceRes.data as AllowanceData);
        setGranted(allowanceRes.data.tokens_granted);
        setUsed(allowanceRes.data.tokens_used);
      } else {
        setAllowance(null);
      }
      if (settingRes.data) {
        setTokensPerCredit(settingRes.data.value_int);
      }
      setLoading(false);
    });
  }, [open, userId]);

  const remaining = Math.max(0, granted - used);
  const creditsGranted = Math.floor(granted / tokensPerCredit);
  const creditsUsed = Math.floor(used / tokensPerCredit);
  const creditsRemaining = Math.floor(remaining / tokensPerCredit);

  const handleSave = async () => {
    if (!allowance) return;
    setSaving(true);

    const { error } = await supabase
      .from("ai_allowance_periods")
      .update({ tokens_granted: granted, tokens_used: used } as any)
      .eq("id", allowance.id);

    if (error) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Allowance updated" });
      onOpenChange(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI Credits — {userName}</DialogTitle>
          <DialogDescription>Current period token allowance management.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !allowance ? (
          <p className="text-sm text-muted-foreground py-4">No active allowance period found for this user.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Period</span>
                <p className="font-medium">
                  {new Date(allowance.period_start).toLocaleDateString()} — {new Date(allowance.period_end).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Source</span>
                <p className="font-medium">{allowance.source}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="tokens-granted">Tokens Granted</Label>
                <Input id="tokens-granted" type="number" value={granted} onChange={(e) => setGranted(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tokens-used">Tokens Used</Label>
                <Input id="tokens-used" type="number" value={used} onChange={(e) => setUsed(Number(e.target.value))} />
              </div>
            </div>

            <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining tokens</span>
                <span className="font-medium">{remaining.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Credits granted</span>
                <span className="font-medium">{creditsGranted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Credits used</span>
                <span className="font-medium">{creditsUsed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Credits remaining</span>
                <span className="font-bold">{creditsRemaining}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !allowance}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
