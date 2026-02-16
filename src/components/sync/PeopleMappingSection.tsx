import { useEffect, useState, useCallback, useMemo } from "react";
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
  Loader2, RefreshCw, Link2, Unlink, Ban, Sparkles, Merge, Undo2,
  Search, UserPlus, Check, X, AlertTriangle, Info,
} from "lucide-react";

/* ── Types ── */
interface LocalPerson { id: string; name: string; person_uid: string; relationship_label: string | null }
interface RemotePerson { person_uid: string; name: string; relationship_label?: string | null; updated_at?: string }
interface PersonLink {
  id: string; local_person_id: string; remote_person_uid: string;
  link_status: string; link_source: string; is_enabled: boolean;
}
interface Candidate {
  id: string; local_person_id: string; remote_person_uid: string;
  remote_person_name: string | null; confidence: number; reasons: any; status: string;
}
interface MergeLog {
  id: string; primary_id: string; merged_id: string; merge_payload: any; undone_at: string | null; created_at: string;
}

/* ── Name similarity ── */
function nameSimilarity(a: string, b: string): { score: number; reasons: Record<string, boolean | number> } {
  const la = a.toLowerCase().trim();
  const lb = b.toLowerCase().trim();
  if (la === lb) return { score: 0.95, reasons: { name_exact: true } };
  if (la.startsWith(lb) || lb.startsWith(la)) return { score: 0.8, reasons: { name_prefix: true } };
  // Simple character overlap ratio
  const setA = new Set(la.split(""));
  const setB = new Set(lb.split(""));
  const intersection = [...setA].filter((c) => setB.has(c)).length;
  const union = new Set([...setA, ...setB]).size;
  const jaccard = union > 0 ? intersection / union : 0;
  if (jaccard > 0.6) return { score: Math.min(0.75, jaccard), reasons: { name_similarity: Math.round(jaccard * 100) / 100 } };
  return { score: 0, reasons: {} };
}

/* ── Component ── */
export function PeopleMappingSection({ connectionId }: { connectionId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [localPeople, setLocalPeople] = useState<LocalPerson[]>([]);
  const [remotePeople, setRemotePeople] = useState<RemotePerson[]>([]);
  const [links, setLinks] = useState<PersonLink[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [mergeLogs, setMergeLogs] = useState<MergeLog[]>([]);

  const [loading, setLoading] = useState(true);
  const [fetchingRemote, setFetchingRemote] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Merge state
  const [mergeA, setMergeA] = useState("");
  const [mergeB, setMergeB] = useState("");
  const [mergeConfirmOpen, setMergeConfirmOpen] = useState(false);

  /* ── Fetch local data ── */
  const fetchLocalData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [peopleRes, linksRes, candidatesRes, mergeRes] = await Promise.all([
      supabase.from("people").select("id, name, person_uid, relationship_label")
        .eq("user_id", user.id).is("merged_into_person_id" as any, null).is("deleted_at" as any, null).order("name"),
      supabase.from("sync_person_links").select("id, local_person_id, remote_person_uid, link_status, link_source, is_enabled")
        .eq("connection_id", connectionId),
      supabase.from("sync_person_candidates" as any).select("*")
        .eq("connection_id", connectionId).eq("status", "open") as any,
      supabase.from("sync_merge_log" as any).select("*")
        .eq("user_id", user.id).is("undone_at", null).order("created_at", { ascending: false }).limit(10) as any,
    ]);
    setLocalPeople((peopleRes.data || []) as LocalPerson[]);
    setLinks((linksRes.data || []) as PersonLink[]);
    setCandidates((candidatesRes.data || []) as unknown as Candidate[]);
    setMergeLogs((mergeRes.data || []) as unknown as MergeLog[]);
    setLoading(false);
  }, [connectionId, user]);

  useEffect(() => { fetchLocalData(); }, [fetchLocalData]);

  /* ── Fetch remote people ── */
  const fetchRemotePeople = async () => {
    setFetchingRemote(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-list-remote-people", {
        body: { connection_id: connectionId },
      });
      if (error) throw error;
      setRemotePeople(data?.people || []);
      toast({ title: `Fetched ${(data?.people || []).length} people from Cherishly` });
    } catch (err: any) {
      toast({ title: "Failed to fetch remote people", description: err.message, variant: "destructive" });
    } finally {
      setFetchingRemote(false);
    }
  };

  /* ── Link person ── */
  const linkPerson = async (localPersonId: string, remotePersonUid: string) => {
    setActionLoading(localPersonId);
    try {
      const { error } = await supabase.from("sync_person_links").upsert({
        user_id: user!.id,
        connection_id: connectionId,
        local_person_id: localPersonId,
        remote_person_uid: remotePersonUid,
        link_status: "linked",
        link_source: "manual",
        is_enabled: true,
      } as any, { onConflict: "user_id,connection_id,local_person_id" } as any);
      if (error) throw error;
      toast({ title: "Person linked" });
      await fetchLocalData();
    } catch (err: any) {
      toast({ title: "Link failed", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Unlink person ── */
  const unlinkPerson = async (linkId: string) => {
    setActionLoading(linkId);
    try {
      const { error } = await supabase.from("sync_person_links").delete().eq("id", linkId);
      if (error) throw error;
      toast({ title: "Person unlinked" });
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
    } catch (err: any) {
      toast({ title: "Unlink failed", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Exclude person ── */
  const excludePerson = async (localPersonId: string) => {
    setActionLoading(localPersonId);
    try {
      const { error } = await supabase.from("sync_person_links").upsert({
        user_id: user!.id,
        connection_id: connectionId,
        local_person_id: localPersonId,
        remote_person_uid: "00000000-0000-0000-0000-000000000000", // placeholder for excluded
        link_status: "excluded",
        link_source: "manual",
        is_enabled: false,
      } as any, { onConflict: "user_id,connection_id,local_person_id" } as any);
      if (error) throw error;
      toast({ title: "Person excluded from sync" });
      await fetchLocalData();
    } catch (err: any) {
      toast({ title: "Exclude failed", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Include person (remove exclusion) ── */
  const includePerson = async (linkId: string) => {
    setActionLoading(linkId);
    try {
      const { error } = await supabase.from("sync_person_links").delete().eq("id", linkId);
      if (error) throw error;
      toast({ title: "Person included in sync" });
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
    } catch (err: any) {
      toast({ title: "Include failed", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Create in Cherishly ── */
  const createRemote = async (localPersonId: string) => {
    setActionLoading(`create-${localPersonId}`);
    try {
      const { data, error } = await supabase.functions.invoke("sync-create-remote-person", {
        body: { connection_id: connectionId, local_person_id: localPersonId },
      });
      if (error) throw error;
      toast({ title: "Person created in Cherishly and linked" });
      await fetchLocalData();
    } catch (err: any) {
      toast({ title: "Failed to create in Cherishly", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Suggest matches ── */
  const suggestMatches = async () => {
    if (remotePeople.length === 0) {
      toast({ title: "Fetch remote people first", variant: "destructive" });
      return;
    }

    const linkedRemoteUids = new Set(links.filter((l) => l.link_status === "linked").map((l) => l.remote_person_uid));
    const linkedLocalIds = new Set(links.filter((l) => l.link_status === "linked").map((l) => l.local_person_id));
    const excludedLocalIds = new Set(links.filter((l) => l.link_status === "excluded").map((l) => l.local_person_id));

    const newCandidates: any[] = [];

    for (const local of localPeople) {
      if (linkedLocalIds.has(local.id) || excludedLocalIds.has(local.id)) continue;

      for (const remote of remotePeople) {
        if (linkedRemoteUids.has(remote.person_uid)) continue;

        const { score, reasons } = nameSimilarity(local.name, remote.name);
        if (score >= 0.6) {
          newCandidates.push({
            user_id: user!.id,
            connection_id: connectionId,
            local_person_id: local.id,
            remote_person_uid: remote.person_uid,
            remote_person_name: remote.name,
            confidence: score,
            reasons,
            status: "open",
          });
        }
      }
    }

    if (newCandidates.length === 0) {
      toast({ title: "No new matches found" });
      return;
    }

    // Clear old open candidates for this connection, then insert new
    await supabase.from("sync_person_candidates" as any).delete()
      .eq("connection_id", connectionId).eq("status", "open");

    const { error } = await supabase.from("sync_person_candidates" as any).insert(newCandidates);
    if (error) {
      toast({ title: "Failed to save suggestions", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Found ${newCandidates.length} potential matches` });
      await fetchLocalData();
    }
  };

  /* ── Accept / reject candidate ── */
  const acceptCandidate = async (candidate: Candidate) => {
    await linkPerson(candidate.local_person_id, candidate.remote_person_uid);
    await supabase.from("sync_person_candidates" as any).update({ status: "accepted" }).eq("id", candidate.id);
    setCandidates((prev) => prev.filter((c) => c.id !== candidate.id));
  };

  const rejectCandidate = async (candidateId: string) => {
    await supabase.from("sync_person_candidates" as any).update({ status: "rejected" }).eq("id", candidateId);
    setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
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
      setMergeA("");
      setMergeB("");
      await fetchLocalData();
    } catch (err: any) {
      toast({ title: "Merge failed", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Undo merge ── */
  const undoMerge = async (mergeLogId: string) => {
    setActionLoading(`undo-${mergeLogId}`);
    try {
      const { error } = await supabase.functions.invoke("sync-undo-merge", {
        body: { merge_log_id: mergeLogId },
      });
      if (error) throw error;
      toast({ title: "Merge undone" });
      await fetchLocalData();
    } catch (err: any) {
      toast({ title: "Undo failed", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Computed ── */
  const linkMap = useMemo(() => {
    const m = new Map<string, PersonLink>();
    for (const l of links) m.set(l.local_person_id, l);
    return m;
  }, [links]);

  const linkedRemoteUids = useMemo(
    () => new Set(links.filter((l) => l.link_status === "linked").map((l) => l.remote_person_uid)),
    [links],
  );

  const getPersonStatus = (personId: string): "linked" | "excluded" | "unlinked" => {
    const link = linkMap.get(personId);
    if (!link) return "unlinked";
    if (link.link_status === "excluded") return "excluded";
    if (link.link_status === "linked") return "linked";
    return "unlinked";
  };

  const getRemoteName = (remoteUid: string): string => {
    return remotePeople.find((r) => r.person_uid === remoteUid)?.name || remoteUid.slice(0, 8) + "…";
  };

  const filteredPeople = localPeople.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const stats = useMemo(() => {
    let linked = 0, unlinked = 0, excluded = 0;
    for (const p of localPeople) {
      const s = getPersonStatus(p.id);
      if (s === "linked") linked++;
      else if (s === "excluded") excluded++;
      else unlinked++;
    }
    return { linked, unlinked, excluded };
  }, [localPeople, linkMap]);

  const availableRemote = remotePeople.filter((r) => !linkedRemoteUids.has(r.person_uid));

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
            We never auto-merge people. You stay in control.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={fetchRemotePeople} disabled={fetchingRemote}>
              {fetchingRemote ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
              Fetch from Cherishly
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={suggestMatches}
              disabled={remotePeople.length === 0}
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Suggest Matches
            </Button>
          </div>

          {/* Stats */}
          <div className="flex gap-3 text-sm">
            <span className="text-muted-foreground">
              <span className="font-medium text-foreground">{stats.linked}</span> linked
            </span>
            <span className="text-muted-foreground">
              <span className="font-medium text-foreground">{stats.unlinked}</span> unlinked
            </span>
            <span className="text-muted-foreground">
              <span className="font-medium text-foreground">{stats.excluded}</span> excluded
            </span>
            {remotePeople.length > 0 && (
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">{remotePeople.length}</span> remote
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Suggested Matches ── */}
      {candidates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Suggested Matches
            </CardTitle>
            <CardDescription>
              Review these suggested matches. Linking will sync moments both ways.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {candidates.map((c) => {
                const localName = localPeople.find((p) => p.id === c.local_person_id)?.name || "Unknown";
                return (
                  <li key={c.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium">{localName}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-sm">{c.remote_person_name || c.remote_person_uid.slice(0, 8)}</span>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {Math.round(c.confidence * 100)}%
                      </Badge>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button size="sm" variant="default" onClick={() => acceptCandidate(c)} disabled={actionLoading === c.local_person_id}>
                        <Check className="mr-1 h-3 w-3" /> Link
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => rejectCandidate(c.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ── People List ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All People</CardTitle>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPeople.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No people found.</p>
          ) : (
            <ul className="divide-y">
              {filteredPeople.map((person) => {
                const status = getPersonStatus(person.id);
                const link = linkMap.get(person.id);
                const isLoading = actionLoading === person.id || actionLoading === `create-${person.id}`;

                return (
                  <li key={person.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{person.name}</p>
                        {status === "linked" && link && (
                          <p className="text-xs text-muted-foreground">
                            → {getRemoteName(link.remote_person_uid)}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={status === "linked" ? "success" : status === "excluded" ? "outline" : "secondary"}
                        className="text-xs shrink-0"
                      >
                        {status === "linked" && <Check className="mr-1 h-2.5 w-2.5" />}
                        {status === "excluded" && <Ban className="mr-1 h-2.5 w-2.5" />}
                        {status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}

                      {status === "unlinked" && (
                        <>
                          {/* Manual link dropdown */}
                          {availableRemote.length > 0 && (
                            <Select onValueChange={(uid) => linkPerson(person.id, uid)}>
                              <SelectTrigger className="h-8 w-32 text-xs">
                                <SelectValue placeholder="Link to…" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableRemote.map((r) => (
                                  <SelectItem key={r.person_uid} value={r.person_uid} className="text-xs">
                                    {r.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => createRemote(person.id)} disabled={isLoading}>
                            <UserPlus className="mr-1 h-3 w-3" /> Create in Cherishly
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => excludePerson(person.id)} disabled={isLoading}>
                            <Ban className="mr-1 h-3 w-3" /> Exclude
                          </Button>
                        </>
                      )}

                      {status === "linked" && link && (
                        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => unlinkPerson(link.id)} disabled={isLoading}>
                          <Unlink className="mr-1 h-3 w-3" /> Unlink
                        </Button>
                      )}

                      {status === "excluded" && link && (
                        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => includePerson(link.id)} disabled={isLoading}>
                          <Check className="mr-1 h-3 w-3" /> Include
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
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
                <SelectTrigger className="w-44 h-8 text-xs">
                  <SelectValue placeholder="Select person…" />
                </SelectTrigger>
                <SelectContent>
                  {localPeople.filter((p) => p.id !== mergeB).map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Merge into primary</label>
              <Select value={mergeB} onValueChange={setMergeB}>
                <SelectTrigger className="w-44 h-8 text-xs">
                  <SelectValue placeholder="Select person…" />
                </SelectTrigger>
                <SelectContent>
                  {localPeople.filter((p) => p.id !== mergeA).map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              variant="destructive"
              disabled={!mergeA || !mergeB || mergeA === mergeB || actionLoading === "merge"}
              onClick={() => setMergeConfirmOpen(true)}
            >
              {actionLoading === "merge" && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              <Merge className="mr-1.5 h-3.5 w-3.5" /> Merge
            </Button>
          </div>

          {/* Recent merges with undo */}
          {mergeLogs.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground font-medium">Recent merges</p>
              {mergeLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-xs">
                  <span>
                    <span className="font-medium">{log.merge_payload?.merged_name}</span>
                    {" → "}
                    <span className="font-medium">{log.merge_payload?.primary_name}</span>
                    <span className="text-muted-foreground ml-2">
                      ({log.merge_payload?.moments_moved} moments)
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs"
                    onClick={() => undoMerge(log.id)}
                    disabled={actionLoading === `undo-${log.id}`}
                  >
                    {actionLoading === `undo-${log.id}` ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Undo2 className="mr-1 h-3 w-3" />
                    )}
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
              <strong>{localPeople.find((p) => p.id === mergeB)?.name}</strong> will be merged into{" "}
              <strong>{localPeople.find((p) => p.id === mergeA)?.name}</strong>.
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
