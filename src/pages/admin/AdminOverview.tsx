import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserPlus, DollarSign } from "lucide-react";
import { Loader2 } from "lucide-react";

interface Stats {
  totalUsers: number;
  premiumUsers: number;
  newThisWeek: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [profilesRes, premiumRes, newRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).in("role", ["premium", "premium_gift", "admin"]),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", weekAgo.toISOString()),
      ]);

      setStats({
        totalUsers: profilesRes.count ?? 0,
        premiumUsers: premiumRes.count ?? 0,
        newThisWeek: newRes.count ?? 0,
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const cards = [
    { title: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, desc: "All registered users" },
    { title: "Premium Users", value: stats?.premiumUsers ?? 0, icon: UserCheck, desc: "Active premium subscriptions" },
    { title: "New This Week", value: stats?.newThisWeek ?? 0, icon: UserPlus, desc: "Signed up in last 7 days" },
    { title: "Revenue", value: "—", icon: DollarSign, desc: "Coming soon" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3>Admin Overview</h3>
        <p className="text-muted-foreground">Platform statistics and metrics.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.value}</div>
              <p className="text-xs text-muted-foreground">{c.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">User Growth</CardTitle></CardHeader>
          <CardContent className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            Chart placeholder — integrate Recharts here
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Revenue Trend</CardTitle></CardHeader>
          <CardContent className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            Chart placeholder — integrate Recharts here
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
