import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Check } from "lucide-react";

interface Conflict {
  id: string;
  entity_type: string;
  entity_uid: string;
  local_payload: Record<string, unknown>;
  remote_payload: Record<string, unknown>;
  resolution: string | null;
  created_at: string;
}

export function ConflictResolution({ connectionId }: { connectionId: string }) {
  const { toast } = useToast();
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  const fetchConflicts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sync_conflicts")
      .select("*")
      .eq("connection_id", connectionId)
      .is("resolved_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Failed to load conflicts", description: error.message, variant: "destructive" });
    } else {
      setConflicts((data || []) as Conflict[]);
    }
    setLoading(false);
  }, [connectionId, toast]);

  useEffect(() => { fetchConflicts(); }, [fetchConflicts]);

  const resolve = async (conflictId: string, resolution: "keep_local" | "accept_remote") => {
    setResolving(conflictId);
    const conflict = conflicts.find((c) => c.id === conflictId);
    if (!conflict) return;

    try {
      if (resolution === "accept_remote") {
        // Apply remote payload
        const { error: upsertErr } = await supabase
          .from("moments")
          .update(conflict.remote_payload as any)
          .eq("moment_uid", conflict.entity_uid);
        if (upsertErr) throw upsertErr;
      }

      // Mark resolved
      const { error } = await supabase
        .from("sync_conflicts")
        .update({ resolution, resolved_at: new Date().toISOString() })
        .eq("id", conflictId);
      if (error) throw error;

      setConflicts((prev) => prev.filter((c) => c.id !== conflictId));
      toast({ title: `Conflict resolved — ${resolution === "keep_local" ? "kept local" : "accepted remote"}` });
    } catch (err: any) {
      toast({ title: "Resolution failed", description: err.message, variant: "destructive" });
    } finally {
      setResolving(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading conflicts…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Sync Conflicts
        </CardTitle>
        <CardDescription>
          When local and remote changes collide, resolve them here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {conflicts.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Check className="h-4 w-4 text-success" /> No unresolved conflicts.
          </div>
        ) : (
          <ul className="space-y-4">
            {conflicts.map((c) => (
              <li key={c.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{c.entity_type}</Badge>
                  <span className="text-xs text-muted-foreground font-mono">{c.entity_uid.slice(0, 8)}…</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded border bg-muted/50 p-3 space-y-1">
                    <p className="font-medium text-foreground">Local</p>
                    <pre className="whitespace-pre-wrap break-all text-muted-foreground max-h-32 overflow-auto">
                      {JSON.stringify(c.local_payload, null, 2)}
                    </pre>
                  </div>
                  <div className="rounded border bg-muted/50 p-3 space-y-1">
                    <p className="font-medium text-foreground">Remote</p>
                    <pre className="whitespace-pre-wrap break-all text-muted-foreground max-h-32 overflow-auto">
                      {JSON.stringify(c.remote_payload, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={resolving === c.id}
                    onClick={() => resolve(c.id, "keep_local")}
                  >
                    {resolving === c.id && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                    Keep Local
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    disabled={resolving === c.id}
                    onClick={() => resolve(c.id, "accept_remote")}
                  >
                    {resolving === c.id && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                    Accept Remote
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
