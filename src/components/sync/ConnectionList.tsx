import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Trash2, Wifi, WifiOff } from "lucide-react";
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
        () => {
          fetchConnections();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConnections]);

  const [disconnecting, setDisconnecting] = useState<string | null>(null);

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
