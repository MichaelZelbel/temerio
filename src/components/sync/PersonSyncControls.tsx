import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Users } from "lucide-react";

interface PersonLink {
  id: string;
  local_person_id: string;
  remote_person_uid: string;
  is_enabled: boolean;
  person_name?: string;
}

export function PersonSyncControls({ connectionId }: { connectionId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [links, setLinks] = useState<PersonLink[]>([]);
  const [people, setPeople] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [linksRes, peopleRes] = await Promise.all([
      supabase
        .from("sync_person_links")
        .select("id, local_person_id, remote_person_uid, is_enabled")
        .eq("connection_id", connectionId),
      supabase
        .from("people")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name"),
    ]);

    const linksData = (linksRes.data || []) as PersonLink[];
    const peopleData = (peopleRes.data || []) as { id: string; name: string }[];

    // Enrich links with person names
    const enriched = linksData.map((l) => ({
      ...l,
      person_name: peopleData.find((p) => p.id === l.local_person_id)?.name ?? "Unknown",
    }));

    setLinks(enriched);
    setPeople(peopleData);
    setLoading(false);
  }, [connectionId, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = async (linkId: string, enabled: boolean) => {
    const { error } = await supabase
      .from("sync_person_links")
      .update({ is_enabled: enabled })
      .eq("id", linkId);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      setLinks((prev) => prev.map((l) => (l.id === linkId ? { ...l, is_enabled: enabled } : l)));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading person links…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" /> Per-Person Sync
        </CardTitle>
        <CardDescription>
          Choose which people to sync with this connection. Only linked people will have their moments shared.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No person links exist for this connection yet. They are created during the first sync exchange.
          </p>
        ) : (
          <ul className="space-y-3">
            {links.map((link) => (
              <li key={link.id} className="flex items-center justify-between">
                <Label htmlFor={`sync-${link.id}`} className="text-sm cursor-pointer">
                  {link.person_name}
                  <span className="text-xs text-muted-foreground ml-2">
                    → {link.remote_person_uid.slice(0, 8)}…
                  </span>
                </Label>
                <Switch
                  id={`sync-${link.id}`}
                  checked={link.is_enabled}
                  onCheckedChange={(checked) => handleToggle(link.id, checked)}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
