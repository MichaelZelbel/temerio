import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, X, Loader2, Inbox } from "lucide-react";

interface ReviewItem {
  id: string;
  type: string;
  status: string;
  notes: string | null;
  event_id: string | null;
  created_at: string;
  event?: {
    headline_en: string;
    date_start: string;
    importance: number;
    confidence_truth: number;
  } | null;
}

const ReviewPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchItems();
  }, [user]);

  const fetchItems = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("review_queue")
      .select("*, events(headline_en, date_start, importance, confidence_truth)")
      .eq("user_id", user.id)
      .eq("status", "open")
      .order("created_at", { ascending: false });

    setItems(
      (data || []).map((item: any) => ({
        ...item,
        event: item.events || null,
      }))
    );
    setLoading(false);
  };

  const handleAction = async (id: string, action: "accepted" | "dismissed") => {
    const { error } = await supabase.from("review_queue").update({ status: action }).eq("id", id);
    if (error) {
      toast({ title: "Action failed", description: error.message, variant: "destructive" });
    } else {
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast({ title: action === "accepted" ? "Accepted" : "Dismissed" });
    }
  };

  const byType = (type: string) => items.filter((i) => i.type === type);

  const renderList = (list: ReviewItem[]) => {
    if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
    if (list.length === 0) return (
      <div className="text-center py-12 text-muted-foreground">
        <Inbox className="mx-auto h-10 w-10 mb-3 opacity-40" />
        <p>No items to review.</p>
      </div>
    );
    return (
      <div className="space-y-3">
        {list.map((item) => (
          <Card key={item.id}>
            <CardContent className="py-3 px-4 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{item.event?.headline_en || "Unknown event"}</p>
                {item.event && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.event.date_start} · Importance {item.event.importance}/10 · Truth {item.event.confidence_truth}/10
                  </p>
                )}
                {item.notes && <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>}
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button size="sm" variant="outline" onClick={() => handleAction(item.id, "accepted")} className="h-8">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Accept
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleAction(item.id, "dismissed")} className="h-8">
                  <X className="h-3.5 w-3.5 mr-1" /> Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3>Review Queue</h3>
        <p className="text-sm text-muted-foreground">{items.length} open item{items.length !== 1 ? "s" : ""}</p>
      </div>
      <Tabs defaultValue="suggestion">
        <TabsList>
          <TabsTrigger value="suggestion">
            Suggestions <Badge variant="secondary" className="ml-1.5 text-[10px]">{byType("suggestion").length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="merge">
            Auto-merges <Badge variant="secondary" className="ml-1.5 text-[10px]">{byType("merge").length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="major">
            Potential Major <Badge variant="secondary" className="ml-1.5 text-[10px]">{byType("major").length}</Badge>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="suggestion">{renderList(byType("suggestion"))}</TabsContent>
        <TabsContent value="merge">{renderList(byType("merge"))}</TabsContent>
        <TabsContent value="major">{renderList(byType("major"))}</TabsContent>
      </Tabs>
    </div>
  );
};

export default ReviewPage;
