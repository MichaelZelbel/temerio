import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity, Plus, Pencil, Trash2, LogIn, CreditCard, User, FileText,
} from "lucide-react";
import { Loader2 } from "lucide-react";
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

interface ActivityFeedProps {
  limit?: number;
  showViewAll?: boolean;
}

export function ActivityFeed({ limit = 8, showViewAll = true }: ActivityFeedProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("activity_events")
      .select("id, action, item_type, item_id, metadata, created_at")
      .eq("actor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        setEvents((data as ActivityEvent[]) || []);
        setLoading(false);
      });
  }, [user, limit]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Recent Activity
        </CardTitle>
        {showViewAll && (
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/activity">View all</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No activity yet.</p>
        ) : (
          <div className="space-y-3">
            {events.map((ev) => {
              const Icon = ACTION_ICONS[ev.action] || FileText;
              return (
                <div key={ev.id} className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-muted p-1.5">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{actionLabel(ev.action, ev.item_type)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(ev.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
