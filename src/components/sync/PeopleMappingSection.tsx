import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Loader2, RefreshCw, Link2, Sparkles, Merge, Undo2,
  Search, Check, Info, ChevronDown, Settings2,
} from "lucide-react";

/* ── Types ── */
interface LocalPerson { id: string; name: string; person_uid: string; relationship_label: string | null }
interface RemotePerson { person_uid: string; name: string; relationship_label?: string | null; updated_at?: string }
interface PersonLink {
  id: string; local_person_id: string; remote_person_uid: string;
  link_status: string; link_source: string; is_enabled: boolean;
}
interface MergeLog {
  id: string; primary_id: string; merged_id: string; merge_payload: any; undone_at: string | null; created_at: string;
}

type MappingAction = "linked" | "create" | "do_not_sync";
interface LocalMapping { action: MappingAction; remoteUid?: string; suggested?: boolean }
interface RemoteMapping { action: MappingAction; localId?: string; suggested?: boolean }

/* ── Name similarity ── */
function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

function nameSimilarity(a: string, b: string): { score: number; reason: string } {
  const la = normalize(a);
  const lb = normalize(b);
  if (la === lb) return { score: 0.95, reason: "Exact match" };
  const tokA = la.split(" ").sort().join(" ");
  const tokB = lb.split(" ").sort().join(" ");
  if (tokA === tokB) return { score: 0.9, reason: "Name reordered" };
  if (la.startsWith(lb) || lb.startsWith(la)) return { score: 0.8, reason: "Prefix match" };
  const setA = new Set(la.split(""));
  const setB = new Set(lb.split(""));
  const intersection = [...setA].filter((c) => setB.has(c)).length;
  const union = new Set([...setA, ...setB]).size;
  const jaccard = union > 0 ? intersection / union : 0;
  if (jaccard > 0.65) return { score: Math.min(0.75, jaccard), reason: `${Math.round(jaccard * 100)}% similar` };
  return { score: 0, reason: "" };
}

/* ── Component ── */
export function PeopleMappingSection({ connectionId }: { connectionId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const autoRanRef = useRef(false);

  const [localPeople, setLocalPeople] = useState<LocalPerson[]>([]);
  const [remotePeople, setRemotePeople] = useState<RemotePerson[]>([]);
  const [links, setLinks] = useState<PersonLink[]>([]);
  const [mergeLogs, setMergeLogs] = useState<MergeLog[]>([]);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const [loading, setLoading] = useState(true);
  const [fetchingRemote, setFetchingRemote] = useState(false);
  const [activating, setActivating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Table filters
  const [localSearch, setLocalSearch] = useState("");
  const [localFilter, setLocalFilter] = useState<"all" | "linked" | "create" | "do_not_sync">("all");
  const [remoteSearch, setRemoteSearch] = useState("");
  const [remoteFilter, setRemoteFilter] = useState<"all" | "linked" | "create" | "do_not_sync">("all");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Staged mapping state
  const [localMappings, setLocalMappings] = useState<Map<string, LocalMapping>>(new Map());
  const [remoteMappings, setRemoteMappings] = useState<Map<string, RemoteMapping>>(new Map());
  const [hasChanges, setHasChanges] = useState(false);

  // Merge state
  const [mergeA, setMergeA] = useState("");
  const [mergeB, setMergeB] = useState("");
  const [mergeConfirmOpen, setMergeConfirmOpen] = useState(false);

  /* ── Fetch local data ── */
  const fetchLocalData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [peopleRes, linksRes, mergeRes, cacheRes] = await Promise.all([
      supabase.from("people").select("id, name, person_uid, relationship_label")
        .eq("user_id", user.id).is("merged_into_person_id" as any, null).is("deleted_at" as any, null).order("name"),
      supabase.from("sync_person_links").select("id, local_person_id, remote_person_uid, link_status, link_source, is_enabled")
        .eq("connection_id", connectionId),
      supabase.from("sync_merge_log" as any).select("*")
        .eq("user_id", user.id).is("undone_at", null).order("created_at", { ascending: false }).limit(10) as any,
      supabase.from("sync_remote_people_cache" as any).select("remote_person_uid, name, relationship_label, fetched_at")
        .eq("connection_id", connectionId) as any,
    ]);
    const lp = (peopleRes.data || []) as LocalPerson[];
    const lk = (linksRes.data || []) as PersonLink[];
    setLocalPeople(lp);
    setLinks(lk);
    setMergeLogs((mergeRes.data || []) as unknown as MergeLog[]);

    const cachedRemote = (cacheRes.data || []) as any[];
    let rp: RemotePerson[] = [];
    if (cachedRemote.length > 0) {
      rp = cachedRemote.map((r: any) => ({
        person_uid: r.remote_person_uid,
        name: r.name,
        relationship_label: r.relationship_label,
      }));
      setRemotePeople(rp);
      const newest = cachedRemote.reduce((a: any, b: any) =>
        new Date(a.fetched_at) > new Date(b.fetched_at) ? a : b
      );
      setLastFetched(new Date(newest.fetched_at));
    }

    setLoading(false);
    return { localPeople: lp, links: lk, remotePeople: rp };
  }, [connectionId, user]);

  useEffect(() => { fetchLocalData(); }, [fetchLocalData]);

  /* ── Build initial mapping from DB state + suggestions ── */
  const buildMappingState = useCallback((lp: LocalPerson[], rp: RemotePerson[], lk: PersonLink[]) => {
    const lm = new Map<string, LocalMapping>();
    const rm = new Map<string, RemoteMapping>();

    // First: apply existing DB links
    for (const link of lk) {
      if (link.link_status === "linked") {
        lm.set(link.local_person_id, { action: "linked", remoteUid: link.remote_person_uid });
        rm.set(link.remote_person_uid, { action: "linked", localId: link.local_person_id });
      } else if (link.link_status === "excluded") {
        lm.set(link.local_person_id, { action: "do_not_sync" });
      }
    }

    // Track which remote UIDs are already mapped
    const mappedRemoteUids = new Set<string>();
    const mappedLocalIds = new Set<string>();
    for (const [localId, m] of lm) {
      if (m.action === "linked" && m.remoteUid) {
        mappedRemoteUids.add(m.remoteUid);
        mappedLocalIds.add(localId);
      }
    }

    // Suggest matches for unmapped local people
    for (const local of lp) {
      if (lm.has(local.id)) continue;
      let bestMatch: { remote: RemotePerson; score: number } | null = null;
      for (const remote of rp) {
        if (mappedRemoteUids.has(remote.person_uid)) continue;
        const { score } = nameSimilarity(local.name, remote.name);
        if (score >= 0.6 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { remote, score };
        }
      }
      if (bestMatch) {
        lm.set(local.id, { action: "linked", remoteUid: bestMatch.remote.person_uid, suggested: true });
        rm.set(bestMatch.remote.person_uid, { action: "linked", localId: local.id, suggested: true });
        mappedRemoteUids.add(bestMatch.remote.person_uid);
        mappedLocalIds.add(local.id);
      } else {
        // Default: create in Cherishly
        lm.set(local.id, { action: "create" });
      }
    }

    // Handle unmapped remote people
    for (const remote of rp) {
      if (rm.has(remote.person_uid)) continue;
      rm.set(remote.person_uid, { action: "create" }); // create in Temerio
    }

    setLocalMappings(lm);
    setRemoteMappings(rm);
    setHasChanges(false);
  }, []);

  /* ── Fetch remote people ── */
  const fetchRemotePeople = useCallback(async () => {
    if (!user) return null;
    setFetchingRemote(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-list-remote-people", {
        body: { connection_id: connectionId },
      });
      if (error) throw error;
      const people = (data?.people || []) as RemotePerson[];
      setRemotePeople(people);
      setLastFetched(new Date());

      if (people.length > 0) {
        await supabase.from("sync_remote_people_cache" as any).delete().eq("connection_id", connectionId);
        const rows = people.map((p) => ({
          user_id: user.id,
          connection_id: connectionId,
          remote_person_uid: p.person_uid,
          name: p.name,
          relationship_label: p.relationship_label || null,
        }));
        await supabase.from("sync_remote_people_cache" as any).insert(rows);
      }
      return people;
    } catch (err: any) {
      toast({ title: "Failed to fetch remote people", description: err.message, variant: "destructive" });
      return null;
    } finally {
      setFetchingRemote(false);
    }
  }, [connectionId, user, toast]);

  /* ── Auto-run on page load ── */
  useEffect(() => {
    if (loading || autoRanRef.current || !user) return;
    const run = async () => {
      autoRanRef.current = true;
      const isStale = !lastFetched || (Date.now() - lastFetched.getTime() > 600_000); // 10 min
      let rp = remotePeople;
      if (isStale || rp.length === 0) {
        const fetched = await fetchRemotePeople();
        if (fetched) rp = fetched;
      }
      buildMappingState(localPeople, rp, links);
    };
    run();
  }, [loading, user, localPeople, remotePeople, links, lastFetched, fetchRemotePeople, buildMappingState]);

  /* ── Update local mapping (with 1-to-1 enforcement) ── */
  const updateLocalMapping = useCallback((localId: string, action: MappingAction, remoteUid?: string) => {
    setLocalMappings(prev => {
      const next = new Map(prev);
      const old = prev.get(localId);

      // If was linked, free the old remote
      if (old?.action === "linked" && old.remoteUid) {
        setRemoteMappings(rm => {
          const rmNext = new Map(rm);
          rmNext.set(old.remoteUid!, { action: "create" });
          return rmNext;
        });
      }

      if (action === "linked" && remoteUid) {
        // Check if this remote is already linked to another local person
        setRemoteMappings(rm => {
          const rmNext = new Map(rm);
          const currentRemoteMapping = rm.get(remoteUid);
          if (currentRemoteMapping?.action === "linked" && currentRemoteMapping.localId && currentRemoteMapping.localId !== localId) {
            // Unlink the previous local person
            const prevLocalId = currentRemoteMapping.localId;
            next.set(prevLocalId, { action: "create" });
            toast({ title: "Reassigned mapping", description: "Previous mapping was updated.", variant: "default" });
          }
          rmNext.set(remoteUid, { action: "linked", localId });
          return rmNext;
        });
        next.set(localId, { action: "linked", remoteUid });
      } else {
        next.set(localId, { action });
      }

      return next;
    });
    setHasChanges(true);
  }, [toast]);

  /* ── Update remote mapping (with 1-to-1 enforcement) ── */
  const updateRemoteMapping = useCallback((remoteUid: string, action: MappingAction, localId?: string) => {
    setRemoteMappings(prev => {
      const next = new Map(prev);
      const old = prev.get(remoteUid);

      // If was linked, free the old local
      if (old?.action === "linked" && old.localId) {
        setLocalMappings(lm => {
          const lmNext = new Map(lm);
          lmNext.set(old.localId!, { action: "create" });
          return lmNext;
        });
      }

      if (action === "linked" && localId) {
        // Check if this local is already linked to another remote person
        setLocalMappings(lm => {
          const lmNext = new Map(lm);
          const currentLocalMapping = lm.get(localId);
          if (currentLocalMapping?.action === "linked" && currentLocalMapping.remoteUid && currentLocalMapping.remoteUid !== remoteUid) {
            const prevRemoteUid = currentLocalMapping.remoteUid;
            next.set(prevRemoteUid, { action: "create" });
            toast({ title: "Reassigned mapping", description: "Previous mapping was updated.", variant: "default" });
          }
          lmNext.set(localId, { action: "linked", remoteUid });
          return lmNext;
        });
        next.set(remoteUid, { action: "linked", localId });
      } else {
        next.set(remoteUid, { action });
      }

      return next;
    });
    setHasChanges(true);
  }, [toast]);

  /* ── Computed stats ── */
  const stats = useMemo(() => {
    let linked = 0, createInCherishly = 0, createInTemerio = 0, doNotSync = 0;
    for (const [, m] of localMappings) {
      if (m.action === "linked") linked++;
      else if (m.action === "create") createInCherishly++;
      else if (m.action === "do_not_sync") doNotSync++;
    }
    for (const [, m] of remoteMappings) {
      if (m.action === "create") createInTemerio++;
      else if (m.action === "do_not_sync") doNotSync++;
    }
    return { linked, createInCherishly, createInTemerio, doNotSync };
  }, [localMappings, remoteMappings]);

  /* ── Filter helpers ── */
  const filteredLocal = useMemo(() => {
    return localPeople.filter(p => {
      if (localSearch && !p.name.toLowerCase().includes(localSearch.toLowerCase())) return false;
      if (localFilter === "all") return true;
      const m = localMappings.get(p.id);
      if (localFilter === "linked") return m?.action === "linked";
      if (localFilter === "create") return m?.action === "create";
      if (localFilter === "do_not_sync") return m?.action === "do_not_sync";
      return true;
    });
  }, [localPeople, localSearch, localFilter, localMappings]);

  const filteredRemote = useMemo(() => {
    return remotePeople.filter(p => {
      if (remoteSearch && !p.name.toLowerCase().includes(remoteSearch.toLowerCase())) return false;
      if (remoteFilter === "all") return true;
      const m = remoteMappings.get(p.person_uid);
      if (remoteFilter === "linked") return m?.action === "linked";
      if (remoteFilter === "create") return m?.action === "create";
      if (remoteFilter === "do_not_sync") return m?.action === "do_not_sync";
      return true;
    });
  }, [remotePeople, remoteSearch, remoteFilter, remoteMappings]);

  /* ── Get dropdown value for local table ── */
  const getLocalDropdownValue = (localId: string): string => {
    const m = localMappings.get(localId);
    if (!m) return "__create";
    if (m.action === "linked" && m.remoteUid) return `sync:${m.remoteUid}`;
    if (m.action === "do_not_sync") return "__do_not_sync";
    return "__create";
  };

  const getRemoteDropdownValue = (remoteUid: string): string => {
    const m = remoteMappings.get(remoteUid);
    if (!m) return "__create";
    if (m.action === "linked" && m.localId) return `sync:${m.localId}`;
    if (m.action === "do_not_sync") return "__do_not_sync";
    return "__create";
  };

  /* ── Badge for status ── */
  const StatusBadge = ({ action, suggested }: { action: MappingAction; suggested?: boolean }) => {
    const variant = action === "linked" ? "success" : action === "create" ? "warning" : "outline";
    const label = action === "linked" ? "Linked" : action === "create" ? "Create" : "Do Not Sync";
    return (
      <div className="flex items-center gap-1">
        <Badge variant={variant} className="text-[10px] px-1.5 py-0">{label}</Badge>
        {suggested && <span className="text-[10px] text-muted-foreground italic">suggested</span>}
      </div>
    );
  };

  /* ── Activate Mapping ── */
  const activateMapping = async () => {
    if (!user) return;
    setActivating(true);
    try {
      // Build batch payload
      const operations: any[] = [];

      for (const [localId, m] of localMappings) {
        if (m.action === "linked" && m.remoteUid) {
          operations.push({ type: "link", localId, remoteUid: m.remoteUid });
        } else if (m.action === "create") {
          operations.push({ type: "create_remote", localId });
        } else if (m.action === "do_not_sync") {
          operations.push({ type: "exclude", localId });
        }
      }

      for (const [remoteUid, m] of remoteMappings) {
        if (m.action === "create") {
          // Only create locally if not already linked from local side
          const alreadyLinked = [...localMappings.values()].some(
            lm => lm.action === "linked" && lm.remoteUid === remoteUid
          );
          if (!alreadyLinked) {
            const rp = remotePeople.find(r => r.person_uid === remoteUid);
            if (rp) operations.push({ type: "create_local", remoteUid, name: rp.name, relationship_label: rp.relationship_label });
          }
        }
      }

      // Execute operations
      for (const op of operations) {
        if (op.type === "link") {
          await supabase.from("sync_person_links").upsert({
            user_id: user.id,
            connection_id: connectionId,
            local_person_id: op.localId,
            remote_person_uid: op.remoteUid,
            link_status: "linked",
            link_source: "manual",
            is_enabled: true,
          } as any, { onConflict: "user_id,connection_id,local_person_id" } as any);
        } else if (op.type === "exclude") {
          await supabase.from("sync_person_links").upsert({
            user_id: user.id,
            connection_id: connectionId,
            local_person_id: op.localId,
            remote_person_uid: "00000000-0000-0000-0000-000000000000",
            link_status: "excluded",
            link_source: "manual",
            is_enabled: false,
          } as any, { onConflict: "user_id,connection_id,local_person_id" } as any);
        } else if (op.type === "create_remote") {
          await supabase.functions.invoke("sync-create-remote-person", {
            body: { connection_id: connectionId, local_person_id: op.localId },
          });
        } else if (op.type === "create_local") {
          await supabase.functions.invoke("sync-create-local-person", {
            body: {
              connection_id: connectionId,
              remote_person_uid: op.remoteUid,
              name: op.name,
              relationship_label: op.relationship_label,
            },
          });
        }
      }

      // Delete links for people no longer mapped that were previously linked
      const existingLinkedIds = new Set(links.filter(l => l.link_status === "linked").map(l => l.local_person_id));
      for (const oldId of existingLinkedIds) {
        const m = localMappings.get(oldId);
        if (!m || m.action !== "linked") {
          // Remove old link
          const link = links.find(l => l.local_person_id === oldId && l.link_status === "linked");
          if (link) {
            await supabase.from("sync_person_links").delete().eq("id", link.id);
          }
        }
      }

      toast({ title: "Mapping activated", description: `${operations.length} operations applied.` });

      // Reload
      autoRanRef.current = false;
      const result = await fetchLocalData();
      if (result) {
        const fetched = await fetchRemotePeople();
        buildMappingState(result.localPeople, fetched || result.remotePeople, result.links);
      }
    } catch (err: any) {
      toast({ title: "Activation failed", description: err.message, variant: "destructive" });
    } finally {
      setActivating(false);
    }
  };

  /* ── Reset changes ── */
  const resetChanges = () => {
    buildMappingState(localPeople, remotePeople, links);
    toast({ title: "Changes reset" });
  };

  /* ── Merge ── */
  const handleMerge = async () => {
    if (!mergeA || !mergeB || mergeA === mergeB) return;
    setMergeConfirmOpen(false);
    setActionLoading("merge");
    try {
      const { data, error } = await supabase.functions.invoke("sync-merge-local-people", {
        body: { primary_person_id: mergeA, merged_person_id: mergeB },
      });
      if (error) throw error;
      toast({ title: `Merge complete — ${data.moments_moved} moments moved` });
      setMergeA(""); setMergeB("");
      autoRanRef.current = false;
      await fetchLocalData();
    } catch (err: any) {
      toast({ title: "Merge failed", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const undoMerge = async (mergeLogId: string) => {
    setActionLoading(`undo-${mergeLogId}`);
    try {
      const { error } = await supabase.functions.invoke("sync-undo-merge", { body: { merge_log_id: mergeLogId } });
      if (error) throw error;
      toast({ title: "Merge undone" });
      autoRanRef.current = false;
      await fetchLocalData();
    } catch (err: any) {
      toast({ title: "Undo failed", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const isAutoRunning = fetchingRemote;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading people mapping…
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" /> People Mapping
          </CardTitle>
          <CardDescription className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 shrink-0" />
            Review how people are connected between Temerio and Cherishly. You stay in control.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Summary panel */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Badge variant="success" className="text-[10px] px-1.5 py-0">Linked</Badge>
              <span className="font-medium">{stats.linked}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="warning" className="text-[10px] px-1.5 py-0">Create in Cherishly</Badge>
              <span className="font-medium">{stats.createInCherishly}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="warning" className="text-[10px] px-1.5 py-0">Create in Temerio</Badge>
              <span className="font-medium">{stats.createInTemerio}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">Do Not Sync</Badge>
              <span className="font-medium">{stats.doNotSync}</span>
            </div>
          </div>

          {/* Auto-running indicator */}
          {isAutoRunning && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Fetching people from Cherishly…
            </div>
          )}

          {lastFetched && !isAutoRunning && (
            <p className="text-xs text-muted-foreground">
              Last refreshed: {lastFetched.toLocaleString()}
            </p>
          )}

          {/* Advanced actions */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground">
                <Settings2 className="h-3 w-3" />
                Advanced
                <ChevronDown className={`h-3 w-3 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={fetchRemotePeople} disabled={fetchingRemote}>
                  {fetchingRemote ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
                  Refresh from Cherishly
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  buildMappingState(localPeople, remotePeople, links);
                  toast({ title: "Suggestions rebuilt" });
                }}>
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Rebuild Suggestions
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* ── Table A: Temerio People ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Temerio People</CardTitle>
          <div className="flex items-center gap-2 pt-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search…" value={localSearch} onChange={e => setLocalSearch(e.target.value)} className="pl-8 h-8 text-sm" />
            </div>
            <Select value={localFilter} onValueChange={(v: any) => setLocalFilter(v)}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All</SelectItem>
                <SelectItem value="linked" className="text-xs">Linked</SelectItem>
                <SelectItem value="create" className="text-xs">Create</SelectItem>
                <SelectItem value="do_not_sync" className="text-xs">Do Not Sync</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {filteredLocal.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No people found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Name in Temerio</TableHead>
                  <TableHead>Mapping</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocal.map(person => {
                  const mapping = localMappings.get(person.id);
                  const value = getLocalDropdownValue(person.id);
                  return (
                    <TableRow key={person.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{person.name}</span>
                          {mapping && <StatusBadge action={mapping.action} suggested={mapping.suggested} />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={value}
                          onValueChange={(v) => {
                            if (v === "__create") updateLocalMapping(person.id, "create");
                            else if (v === "__do_not_sync") updateLocalMapping(person.id, "do_not_sync");
                            else if (v.startsWith("sync:")) updateLocalMapping(person.id, "linked", v.slice(5));
                          }}
                        >
                          <SelectTrigger className="h-8 w-full max-w-xs text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {remotePeople.map(r => (
                              <SelectItem key={r.person_uid} value={`sync:${r.person_uid}`} className="text-xs">
                                Sync with {r.name}
                              </SelectItem>
                            ))}
                            <SelectItem value="__create" className="text-xs">Create in Cherishly</SelectItem>
                            <SelectItem value="__do_not_sync" className="text-xs">Do Not Sync</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Table B: Cherishly People ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cherishly People</CardTitle>
          <div className="flex items-center gap-2 pt-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search…" value={remoteSearch} onChange={e => setRemoteSearch(e.target.value)} className="pl-8 h-8 text-sm" />
            </div>
            <Select value={remoteFilter} onValueChange={(v: any) => setRemoteFilter(v)}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All</SelectItem>
                <SelectItem value="linked" className="text-xs">Linked</SelectItem>
                <SelectItem value="create" className="text-xs">Create</SelectItem>
                <SelectItem value="do_not_sync" className="text-xs">Do Not Sync</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {filteredRemote.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No remote people found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Name in Cherishly</TableHead>
                  <TableHead>Mapping</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRemote.map(person => {
                  const mapping = remoteMappings.get(person.person_uid);
                  const value = getRemoteDropdownValue(person.person_uid);
                  return (
                    <TableRow key={person.person_uid}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{person.name}</span>
                          {mapping && <StatusBadge action={mapping.action} suggested={mapping.suggested} />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={value}
                          onValueChange={(v) => {
                            if (v === "__create") updateRemoteMapping(person.person_uid, "create");
                            else if (v === "__do_not_sync") updateRemoteMapping(person.person_uid, "do_not_sync");
                            else if (v.startsWith("sync:")) updateRemoteMapping(person.person_uid, "linked", v.slice(5));
                          }}
                        >
                          <SelectTrigger className="h-8 w-full max-w-xs text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {localPeople.map(p => (
                              <SelectItem key={p.id} value={`sync:${p.id}`} className="text-xs">
                                Sync with {p.name}
                              </SelectItem>
                            ))}
                            <SelectItem value="__create" className="text-xs">Create in Temerio</SelectItem>
                            <SelectItem value="__do_not_sync" className="text-xs">Do Not Sync</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Activate Mapping ── */}
      <Card>
        <CardContent className="py-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Changes are applied when you click Activate Mapping.
          </p>
          <div className="flex gap-3">
            <Button onClick={activateMapping} disabled={activating || !hasChanges}>
              {activating && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              <Check className="mr-1.5 h-4 w-4" />
              Activate Mapping
            </Button>
            <Button variant="outline" onClick={resetChanges} disabled={activating || !hasChanges}>
              Reset Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Merge Duplicates ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Merge className="h-4 w-4" /> Merge Duplicates
          </CardTitle>
          <CardDescription>
            Combine two local people into one. All moments will be moved to the primary person.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Keep (primary)</label>
              <Select value={mergeA} onValueChange={setMergeA}>
                <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="Select person…" /></SelectTrigger>
                <SelectContent>
                  {localPeople.filter(p => p.id !== mergeB).map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Merge into primary</label>
              <Select value={mergeB} onValueChange={setMergeB}>
                <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="Select person…" /></SelectTrigger>
                <SelectContent>
                  {localPeople.filter(p => p.id !== mergeA).map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm" variant="destructive"
              disabled={!mergeA || !mergeB || mergeA === mergeB || actionLoading === "merge"}
              onClick={() => setMergeConfirmOpen(true)}
            >
              {actionLoading === "merge" && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              <Merge className="mr-1.5 h-3.5 w-3.5" /> Merge
            </Button>
          </div>

          {mergeLogs.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground font-medium">Recent merges</p>
              {mergeLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between text-xs">
                  <span>
                    <span className="font-medium">{log.merge_payload?.merged_name}</span>
                    {" → "}
                    <span className="font-medium">{log.merge_payload?.primary_name}</span>
                    <span className="text-muted-foreground ml-2">({log.merge_payload?.moments_moved} moments)</span>
                  </span>
                  <Button
                    size="sm" variant="ghost" className="h-6 text-xs"
                    onClick={() => undoMerge(log.id)}
                    disabled={actionLoading === `undo-${log.id}`}
                  >
                    {actionLoading === `undo-${log.id}` ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Undo2 className="mr-1 h-3 w-3" />}
                    Undo
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Merge confirm dialog ── */}
      <AlertDialog open={mergeConfirmOpen} onOpenChange={setMergeConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Merge people?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{localPeople.find(p => p.id === mergeB)?.name}</strong> will be merged into{" "}
              <strong>{localPeople.find(p => p.id === mergeA)?.name}</strong>.
              All moments and participant links will be moved. This can be undone (best-effort).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMerge}>Merge</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
