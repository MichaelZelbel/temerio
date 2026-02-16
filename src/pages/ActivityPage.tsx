import { useEffect, useState, useCallback } from "react";
import { useSeo } from "@/hooks/useSeo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Activity, Plus, Pencil, Trash2, LogIn, CreditCard, User, FileText,
} from "lucide-react";
import { Loader2, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityEvent {
  id: string;
  action: string;
  item_type: string;
  item_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
  login: LogIn,
  subscription_change: CreditCard,
  profile_update: User,
};

function actionLabel(action: string, itemType: string): string {
  switch (action) {
    case "create": return `Created ${itemType}`;
    case "update": return `Updated ${itemType}`;
    case "delete": return `Deleted ${itemType}`;
    case "login": return "Signed in";
    case "profile_update": return "Updated profile";
    case "subscription_change": return "Subscription changed";
    default: return `${action} ${itemType}`;
  }
}

const PAGE_SIZE = 20;

export default function ActivityPage() {
  useSeo({ title: "Activity", path: "/activity", noIndex: true });
  const { user } = useAuth();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  const fetchEvents = useCallback(
    async (offset: number, append = false) => {
      if (!user) return;
      if (!append) setLoading(true);
      else setLoadingMore(true);

      let query = supabase
        .from("activity_events")
        .select("id, action, item_type, item_id, metadata, created_at")
        .eq("actor_id", user.id)
        .order("created_at", { ascending: false });

      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      if (dateRange !== "all") {
        const now = new Date();
        let since: Date;
        switch (dateRange) {
          case "7d": since = new Date(now.getTime() - 7 * 86400000); break;
          case "30d": since = new Date(now.getTime() - 30 * 86400000); break;
          case "90d": since = new Date(now.getTime() - 90 * 86400000); break;
          default: since = new Date(0);
        }
        query = query.gte("created_at", since.toISOString());
      }

      const { data } = await query.range(offset, offset + PAGE_SIZE - 1);
      const rows = (data as ActivityEvent[]) || [];

      if (append) {
        setEvents((prev) => [...prev, ...rows]);
      } else {
        setEvents(rows);
      }
      setHasMore(rows.length === PAGE_SIZE);
      setLoading(false);
      setLoadingMore(false);
    },
    [user, actionFilter, dateRange]
  );

  useEffect(() => {
    fetchEvents(0);
  }, [fetchEvents]);

  const loadMore = () => fetchEvents(events.length, true);

  return (
    <div className="space-y-6">
      <div>
        <h3>Activity History</h3>
        <p className="text-muted-foreground">Your complete activity log.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={actionFilter} onValueChange={(v) => setActionFilter(v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="profile_update">Profile Update</SelectItem>
            <SelectItem value="subscription_change">Subscription</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Event list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Activity className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No activity found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((ev) => {
            const Icon = ACTION_ICONS[ev.action] || FileText;
            return (
              <div
                key={ev.id}
                className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="mt-0.5 rounded-full bg-muted p-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{actionLabel(ev.action, ev.item_type)}</p>
                  {ev.item_id && (
                    <p className="text-xs text-muted-foreground truncate">
                      ID: {ev.item_id}
                    </p>
                  )}
                  {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">
                      {JSON.stringify(ev.metadata)}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(ev.created_at), { addSuffix: true })}
                </span>
              </div>
            );
          })}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
