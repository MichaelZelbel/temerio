import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";

interface Setting {
  key: string;
  value_int: number;
  description: string | null;
}

const SETTING_LABELS: Record<string, string> = {
  tokens_per_credit: "How many tokens equal 1 credit. Used for display and calculations.",
  credits_free_per_month: "Monthly credits granted to free-tier users.",
  credits_premium_per_month: "Monthly credits granted to premium users.",
};

export default function AdminCreditSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edits, setEdits] = useState<Record<string, number>>({});

  useEffect(() => {
    supabase.from("ai_credit_settings").select("*").then(({ data, error }) => {
      if (data) {
        setSettings(data as Setting[]);
        const initial: Record<string, number> = {};
        data.forEach((s: any) => { initial[s.key] = s.value_int; });
        setEdits(initial);
      }
      if (error) toast({ title: "Failed to load settings", description: error.message, variant: "destructive" });
      setLoading(false);
    });
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    const promises = Object.entries(edits).map(([key, value_int]) =>
      supabase.from("ai_credit_settings").update({ value_int } as any).eq("key", key)
    );
    const results = await Promise.all(promises);
    const failed = results.find((r) => r.error);
    if (failed?.error) {
      toast({ title: "Save failed", description: failed.error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings saved" });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3>AI Credit Settings</h3>
        <p className="text-muted-foreground">Configure credit allocation and token ratios.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Global Settings</CardTitle>
          <CardDescription>Changes apply to new allowance periods only.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {settings.map((s) => (
            <div key={s.key} className="space-y-1.5 max-w-sm">
              <Label htmlFor={s.key} className="font-medium">{s.key}</Label>
              <Input
                id={s.key}
                type="number"
                value={edits[s.key] ?? s.value_int}
                onChange={(e) => setEdits((prev) => ({ ...prev, [s.key]: Number(e.target.value) }))}
              />
              <p className="text-xs text-muted-foreground">
                {SETTING_LABELS[s.key] || s.description || ""}
              </p>
            </div>
          ))}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
