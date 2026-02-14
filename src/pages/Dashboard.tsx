import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Package, Sparkles, Activity, ArrowUpRight, Plus, Import,
  FolderOpen, CheckCircle2, Circle, X, Rocket,
} from "lucide-react";

const CHECKLIST_KEY = "dashboard-checklist-dismissed";

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  premiumOnly?: boolean;
}

const defaultChecklist: ChecklistItem[] = [
  { id: "profile", label: "Complete your profile", done: false },
  { id: "first-item", label: "Create your first item", done: false },
  { id: "explore", label: "Explore features", done: false },
  { id: "invite", label: "Invite your team", done: false, premiumOnly: true },
];

function useIsPremium() {
  const { role } = useAuth();
  return role === "premium" || role === "premium_gift" || role === "admin";
}

const Dashboard = () => {
  const { user, profile, role } = useAuth();
  const isPremium = useIsPremium();
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "there";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3>Welcome back, {displayName}</h3>
          <p className="text-muted-foreground">Here's what's happening today.</p>
        </div>
        <div className="flex gap-2 mt-3 sm:mt-0">
          <Button size="sm" asChild>
            <Link to="/dashboard"><Plus className="h-4 w-4" /> New Item</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsRow isPremium={isPremium} />

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <RecentActivity />
          <QuickActions />
        </div>
        <div className="space-y-6">
          <GettingStarted isPremium={isPremium} />
          {!isPremium && <UpgradeCard />}
        </div>
      </div>
    </div>
  );
};

/* ─── Stats Row ─── */
function StatsRow({ isPremium }: { isPremium: boolean }) {
  const stats = [
    { label: "Total Items", value: "0", icon: Package, change: null },
    { label: "AI Credits", value: isPremium ? "Unlimited" : "50 / 100", icon: Sparkles, change: null },
    { label: "Recent Activity", value: "0", icon: Activity, change: null },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-sm font-medium">{s.label}</CardDescription>
            <s.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-display font-bold">{s.value}</p>
          </CardContent>
        </Card>
      ))}

      {!isPremium && (
        <Card className="border-primary/20 bg-primary/[0.03] sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardDescription className="text-sm font-medium">Your Plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Free</Badge>
            </div>
            <Button variant="default" size="sm" className="w-full" asChild>
              <Link to="/pricing">
                Upgrade <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─── Recent Activity ─── */
function RecentActivity() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Your latest actions</CardDescription>
        </div>
        <Button variant="ghost" size="sm" disabled>View All</Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Activity className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium">No activity yet</p>
          <p className="text-sm text-muted-foreground mt-1">Your recent actions will appear here.</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Quick Actions ─── */
function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
        <CardDescription>Common tasks to get you started</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button variant="outline" className="h-auto flex-col gap-2 py-4">
            <Plus className="h-5 w-5" />
            <span>Create New Item</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-4">
            <Import className="h-5 w-5" />
            <span>Import</span>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
            <Link to="/dashboard/analytics">
              <FolderOpen className="h-5 w-5" />
              <span>View Library</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Getting Started Checklist ─── */
function GettingStarted({ isPremium }: { isPremium: boolean }) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(CHECKLIST_KEY) === "1");
  const [items, setItems] = useState<ChecklistItem[]>(defaultChecklist);

  if (dismissed) return null;

  const visible = items.filter((i) => !i.premiumOnly || isPremium);
  const doneCount = visible.filter((i) => i.done).length;
  const progress = visible.length ? Math.round((doneCount / visible.length) * 100) : 0;

  const toggle = (id: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));

  const dismiss = () => {
    localStorage.setItem(CHECKLIST_KEY, "1");
    setDismissed(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-lg">Getting Started</CardTitle>
          <CardDescription>{doneCount}/{visible.length} completed</CardDescription>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 -mt-1 -mr-1" onClick={dismiss}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />
        <ul className="space-y-2">
          {visible.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => toggle(item.id)}
                className="flex items-center gap-2 w-full text-left text-sm hover:bg-muted/50 rounded-md px-2 py-1.5 transition-colors"
              >
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className={item.done ? "line-through text-muted-foreground" : ""}>{item.label}</span>
                {item.premiumOnly && <Badge variant="info" className="ml-auto text-2xs">Pro</Badge>}
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/* ─── Upgrade Card ─── */
function UpgradeCard() {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/[0.02]">
      <CardContent className="pt-6 text-center space-y-3">
        <div className="mx-auto rounded-full bg-primary/10 p-3 w-fit">
          <Rocket className="h-5 w-5 text-primary" />
        </div>
        <h5>Unlock Pro Features</h5>
        <p className="text-sm text-muted-foreground">
          Get unlimited items, advanced AI, and team collaboration.
        </p>
        <Button className="w-full" asChild>
          <Link to="/pricing">View Plans</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default Dashboard;
