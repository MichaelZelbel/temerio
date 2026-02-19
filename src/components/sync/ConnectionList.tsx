import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatabaseBackup, Loader2, RefreshCw, RotateCw, Trash2, Wifi, WifiOff } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Connection {
  id: string;
  remote_app: string;
  status: string;
  created_at: string;
}

export function ConnectionList({ onSelect, onLoaded }: { onSelect?: (id: string) => void; onLoaded?: (connections: Connection[]) => void }) {
  const { toast } = useToast();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sync_connections")
      .select("id, remote_app, status, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load connections", description: error.message, variant: "destructive" });
    } else {
      const conns = data || [];
      setConnections(conns);
      onLoaded?.(conns);
    }
    setLoading(false);
  }, [toast, onLoaded]);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  // Realtime: auto-refresh when remote side changes connection status
  useEffect(() => {
    const channel = supabase
      .channel("sync-connections-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sync_connections" },
        () => { fetchConnections(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchConnections]);

  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [backfilling, setBackfilling] = useState<string | null>(null);

  const handleSyncNow = async (c: Connection) => {
    setSyncing(c.id);
    try {
      const { data, error } = await supabase.functions.invoke("sync-run", {
        body: { connection_id: c.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const result = data as { pulled: number; applied: number; conflicts: number };
      toast({
        title: "Sync complete",
        description: `Pulled ${result.pulled} events, applied ${result.applied}${result.conflicts > 0 ? `, ${result.conflicts} conflict${result.conflicts !== 1 ? "s" : ""}` : ""}`,
      });
    } catch (err: any) {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    } finally {
      setSyncing(null);
    }
  };

  const handleBackfill = async (c: Connection) => {
    setBackfilling(c.id);
    try {
      // Step 1: backfill — queue all historical events into outbox
      const { data: bfData, error: bfError } = await supabase.functions.invoke("sync-backfill", {
        body: { connection_id: c.id },
      });
      if (bfError) throw bfError;
      if (bfData?.error) throw new Error(bfData.error);
      const { queued_people, queued_moments } = bfData as { queued_people: number; queued_moments: number };

      // Step 2: sync-run — push queued events and pull remote changes
      setSyncing(c.id);
      const { data: runData, error: runError } = await supabase.functions.invoke("sync-run", {
        body: { connection_id: c.id },
      });
      if (runError) throw runError;
      if (runData?.error) throw new Error(runData.error);
      const result = runData as { pulled: number; applied: number; conflicts: number };

      toast({
        title: "Sync history complete",
        description: `Queued ${queued_people} people + ${queued_moments} moments. Pulled ${result.pulled}, applied ${result.applied}${result.conflicts > 0 ? `, ${result.conflicts} conflict${result.conflicts !== 1 ? "s" : ""}` : ""}.`,
      });
    } catch (err: any) {
      toast({ title: "Backfill failed", description: err.message, variant: "destructive" });
    } finally {
      setBackfilling(null);
      setSyncing(null);
    }
  };

  const handleDisconnect = async (id: string) => {
    setDisconnecting(id);
    try {
      const { data, error } = await supabase.functions.invoke("sync-disconnect", {
        body: { connection_id: id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: "Disconnected",
        description: data?.remote_notified
          ? "Cherishly has been notified."
          : "Disconnected locally. Cherishly will be notified on next sync.",
      });
      fetchConnections();
    } catch (err: any) {
      toast({ title: "Disconnect failed", description: err.message, variant: "destructive" });
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Cherishly Connection</CardTitle>
            <CardDescription>Your link between Temerio and Cherishly.</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchConnections} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : connections.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Not connected to Cherishly yet. Generate or enter a pairing code above.</p>
        ) : (
          <ul className="divide-y">
            {connections.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3 gap-3">
                <button
                  type="button"
                  className="flex items-center gap-3 min-w-0 text-left hover:underline"
                  onClick={() => onSelect?.(c.id)}
                >
                  {c.status === "active" ? (
                    <Wifi className="h-4 w-4 text-success shrink-0" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate capitalize">{c.remote_app}</p>
                    <p className="text-xs text-muted-foreground">Connected {new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={c.status === "active" ? "success" : "secondary"} className="text-xs">
                    {c.status}
                  </Badge>
                  {c.status === "active" && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleBackfill(c)}
                        disabled={!!backfilling || !!syncing}
                        title="Sync History (backfill all past events)"
                      >
                        {backfilling === c.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <DatabaseBackup className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSyncNow(c)}
                        disabled={!!syncing || !!backfilling}
                        title="Sync Now"
                      >
                        {syncing === c.id && !backfilling
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <RotateCw className="h-4 w-4" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={disconnecting === c.id}>
                            {disconnecting === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Disconnect from Cherishly?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will stop syncing with <strong>{c.remote_app}</strong> and notify them. You can re-pair later.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDisconnect(c.id)}>Disconnect</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
