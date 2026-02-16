import { useState, useEffect } from "react";
import { useSeo } from "@/hooks/useSeo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, X, Loader2, Inbox, FileText } from "lucide-react";

interface ReviewItem {
  id: string;
  type: string;
  status: string;
  notes: string | null;
  moment_id: string | null;
  created_at: string;
  moment?: {
    id: string;
    title: string;
    happened_at: string;
    impact_level: number;
    confidence_truth: number;
    confidence_date: number;
    status: string;
  } | null;
  provenance?: {
    snippet_en: string | null;
    page_number: number | null;
    file_name: string | null;
  } | null;
}

const typeBadgeColors: Record<string, string> = {
  suggestion: "bg-primary/10 text-primary border-primary/20",
  merge: "bg-warning/10 text-warning border-warning/20",
  major: "bg-destructive/10 text-destructive border-destructive/20",
};

const ReviewPage = () => {
  useSeo({ title: "Review", path: "/review", noIndex: true });
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
      .select("*, moments(id, title, happened_at, impact_level, confidence_truth, confidence_date, status)")
      .eq("user_id", user.id)
      .eq("status", "open")
      .order("created_at", { ascending: false });

    const rawItems = (data || []).map((item: any) => ({
      ...item,
      moment: item.moments || null,
    }));

    // Batch fetch provenance for all moment_ids
    const momentIds = rawItems.map((i: any) => i.moment_id).filter(Boolean) as string[];
    let provMap: Record<string, { snippet_en: string | null; page_number: number | null; document_id: string | null }> = {};
    if (momentIds.length > 0) {
      const { data: provData } = await supabase
        .from("moment_provenance")
        .select("moment_id, snippet_en, page_number, document_id")
        .in("moment_id", momentIds);
      for (const p of (provData || []) as any[]) {
        if (!provMap[p.moment_id]) provMap[p.moment_id] = p;
      }
    }

    // Batch fetch doc names
    const docIds = [...new Set(Object.values(provMap).map((p) => p.document_id).filter(Boolean))] as string[];
    let docMap: Record<string, string> = {};
    if (docIds.length > 0) {
      const { data: docs } = await supabase.from("documents").select("id, file_name").in("id", docIds);
      for (const d of docs || []) docMap[d.id] = d.file_name;
    }

    setItems(
      rawItems.map((item: any) => {
        const prov = item.moment_id ? provMap[item.moment_id] : null;
        return {
          ...item,
          provenance: prov ? {
            snippet_en: prov.snippet_en,
            page_number: prov.page_number,
            file_name: prov.document_id ? docMap[prov.document_id] || null : null,
          } : null,
        };
      })
    );
    setLoading(false);
  };

  const handleAction = async (item: ReviewItem, action: "accepted" | "dismissed") => {
    const { error } = await supabase.from("review_queue").update({ status: action }).eq("id", item.id);
    if (error) {
      toast({ title: "Action failed", description: error.message, variant: "destructive" });
      return;
    }

    // If accepted, mark moment as verified
    if (action === "accepted" && item.moment_id) {
      await supabase.from("moments").update({ verified: true }).eq("id", item.moment_id);
    }

    setItems((prev) => prev.filter((i) => i.id !== item.id));
    toast({ title: action === "accepted" ? "Accepted & verified" : "Dismissed" });
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
            <CardContent className="py-3 px-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant="outline" className={`text-[10px] ${typeBadgeColors[item.type] || ""}`}>
                      {item.type}
                    </Badge>
                    {item.moment?.status && (
                      <span className="text-[10px] text-muted-foreground capitalize">{item.moment.status.replace("_", " ")}</span>
                    )}
                  </div>
                  <p className="font-medium text-sm">{item.moment?.title || "Unknown moment"}</p>
                  {item.moment && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.moment.happened_at.split("T")[0]} · Impact {item.moment.impact_level}/4 · Truth {item.moment.confidence_truth}/10 · Date {item.moment.confidence_date}/10
                    </p>
                  )}
                  {item.notes && <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => handleAction(item, "accepted")} className="h-8">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Accept
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleAction(item, "dismissed")} className="h-8">
                    <X className="h-3.5 w-3.5 mr-1" /> Dismiss
                  </Button>
                </div>
              </div>

              {item.provenance && item.provenance.snippet_en && (
                <div className="bg-muted/50 rounded-md p-2 text-xs flex items-start gap-2">
                  <FileText className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    {item.provenance.file_name && (
                      <span className="font-medium">{item.provenance.file_name}{item.provenance.page_number ? `, p.${item.provenance.page_number}` : ""}: </span>
                    )}
                    <span className="text-muted-foreground italic">"{item.provenance.snippet_en}"</span>
                  </div>
                </div>
              )}
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
