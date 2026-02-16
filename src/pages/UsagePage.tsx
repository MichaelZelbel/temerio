import { useState, useEffect, useMemo } from "react";
import { useSeo } from "@/hooks/useSeo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Zap, TrendingUp } from "lucide-react";
import { format, subDays, startOfDay, startOfMonth, endOfMonth } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const DEFAULT_CREDITS = 10000;

const UsagePage = () => {
  useSeo({ title: "Usage", path: "/usage", noIndex: true });
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<{ id: string; period_start: string; period_end: string; credits_total: number } | null>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [totalUsed, setTotalUsed] = useState(0);

  useEffect(() => {
    if (!user) return;
    init();
  }, [user]);

  const init = async () => {
    if (!user) return;
    setLoading(true);

    const now = new Date();
    const monthStart = startOfMonth(now).toISOString();
    const monthEnd = endOfMonth(now).toISOString();

    // Check for existing allowance period in ai_allowance_periods
    let { data: existingPeriod } = await supabase
      .from("ai_allowance_periods")
      .select("*")
      .eq("user_id", user.id)
      .gte("period_end", now.toISOString())
      .lte("period_start", now.toISOString())
      .limit(1)
      .maybeSingle();

    if (!existingPeriod) {
      // Auto-create current month period
      const { data: newPeriod } = await supabase
        .from("ai_allowance_periods")
        .insert({
          user_id: user.id,
          period_start: monthStart,
          period_end: monthEnd,
          tokens_granted: DEFAULT_CREDITS,
          tokens_used: 0,
          source: "free_tier",
        })
        .select()
        .single();
      existingPeriod = newPeriod;
    }

    if (existingPeriod) {
      setPeriod({
        id: existingPeriod.id,
        period_start: existingPeriod.period_start,
        period_end: existingPeriod.period_end,
        credits_total: existingPeriod.tokens_granted,
      });
    }

    // Fetch ledger
    const { data: ledgerData } = await supabase
      .from("ai_usage_ledger")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    setLedger(ledgerData || []);

    const total = (ledgerData || []).reduce((sum: number, row: any) => sum + (row.credits_used || 0), 0);
    setTotalUsed(total);
    setLoading(false);
  };

  const remaining = Math.max(0, (period?.credits_total || 0) - totalUsed);
  const usagePercent = period?.credits_total ? Math.min(100, (totalUsed / period.credits_total) * 100) : 0;

  // Daily chart data (last 14 days)
  const chartData = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      days[d] = 0;
    }
    for (const row of ledger) {
      const d = format(new Date(row.created_at), "yyyy-MM-dd");
      if (d in days) days[d] += row.credits_used || 0;
    }
    return Object.entries(days).map(([date, credits]) => ({
      date: format(new Date(date), "MMM d"),
      credits,
    }));
  }, [ledger]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3>AI Usage</h3>
        <p className="text-sm text-muted-foreground">Monitor your AI credit consumption.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Credits Total</p>
            <p className="text-2xl font-bold">{(period?.credits_total || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Credits Used</p>
            <p className="text-2xl font-bold">{totalUsed.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Remaining</p>
            <p className="text-2xl font-bold text-success">{remaining.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-4 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              Period: {period ? format(new Date(period.period_start), "MMM d") : "—"} – {period ? format(new Date(period.period_end), "MMM d, yyyy") : "—"}
            </span>
            <span>{usagePercent.toFixed(0)}% used</span>
          </div>
          <Progress value={usagePercent} className="h-2" />
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Daily Usage (14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="credits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent actions table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4" /> Recent AI Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {ledger.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No AI actions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4">Time</th>
                    <th className="pb-2 pr-4">Action</th>
                    <th className="pb-2 pr-4 text-right">Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.slice(0, 20).map((row) => (
                    <tr key={row.id} className="border-b border-border/50">
                      <td className="py-2 pr-4 text-xs text-muted-foreground whitespace-nowrap">{format(new Date(row.created_at), "MMM d, HH:mm")}</td>
                      <td className="py-2 pr-4"><Badge variant="outline" className="text-[10px]">{row.action}</Badge></td>
                      <td className="py-2 text-right font-medium">{row.credits_used}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsagePage;
