import { useState, useEffect, useMemo } from "react";
import { useSeo } from "@/hooks/useSeo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, ChevronDown, Calendar, FileText, Users, CheckCircle2, Loader2, Upload, Plus, Pencil, Download, Eye } from "lucide-react";
import { format } from "date-fns";
import AddEventDialog from "@/components/timeline/AddEventDialog";

interface Person {
  id: string;
  name: string;
  relationship_label: string | null;
}

interface TimelineMoment {
  id: string;
  happened_at: string;
  happened_end: string | null;
  title: string;
  description: string | null;
  status: string;
  confidence_date: number;
  confidence_truth: number;
  impact_level: number;
  source: string;
  verified: boolean;
  is_potential_major: boolean;
  participants?: Person[];
  provenance?: {
    id: string;
    snippet_en: string | null;
    page_number: number | null;
    document?: { file_name: string; storage_path: string; mime_type: string } | null;
  }[];
}

const statusColors: Record<string, string> = {
  past_fact: "bg-success/10 text-success border-success/20",
  future_plan: "bg-info/10 text-info border-info/20",
  ongoing: "bg-warning/10 text-warning border-warning/20",
  unknown: "bg-muted text-muted-foreground border-border",
};

const TimelinePage = () => {
  useSeo({ title: "Timeline", path: "/timeline", noIndex: true });
  const { user } = useAuth();
  const [moments, setMoments] = useState<TimelineMoment[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [documents, setDocuments] = useState<{ id: string; file_name: string }[]>([]);
  const [participantMap, setParticipantMap] = useState<Record<string, string[]>>({});
  const [provenanceMap, setProvenanceMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedMoment, setSelectedMoment] = useState<TimelineMoment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editMomentData, setEditMomentData] = useState<{
    id: string;
    title: string;
    description: string | null;
    happened_at: string;
    happened_end: string | null;
    status: string;
    impact_level: number;
    confidence_date: number;
    confidence_truth: number;
    participantIds?: string[];
    documentIds?: string[];
  } | null>(null);

  // Filters
  const [minImpact, setMinImpact] = useState(1);
  const [minConfTruth, setMinConfTruth] = useState(0);
  const [minConfDate, setMinConfDate] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [personFilter, setPersonFilter] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [momentsRes, peopleRes, partsRes, docsRes, provRes] = await Promise.all([
      supabase.from("moments").select("*").eq("user_id", user.id).order("happened_at", { ascending: false }),
      supabase.from("people").select("*").eq("user_id", user.id),
      supabase.from("moment_participants").select("moment_id, person_id"),
      supabase.from("documents").select("id, file_name").eq("user_id", user.id).order("file_name"),
      supabase.from("moment_provenance").select("moment_id, document_id").eq("user_id", user.id),
    ]);
    if (momentsRes.data) setMoments(momentsRes.data as any);
    if (peopleRes.data) setPeople(peopleRes.data);
    if (docsRes.data) setDocuments(docsRes.data);

    const map: Record<string, string[]> = {};
    for (const row of (partsRes.data || []) as any[]) {
      if (!map[row.moment_id]) map[row.moment_id] = [];
      map[row.moment_id].push(row.person_id);
    }
    setParticipantMap(map);

    const pMap: Record<string, string[]> = {};
    for (const row of (provRes.data || []) as any[]) {
      if (!pMap[row.moment_id]) pMap[row.moment_id] = [];
      pMap[row.moment_id].push(row.document_id);
    }
    setProvenanceMap(pMap);
    setLoading(false);
  };

  const filteredMoments = useMemo(() => {
    return moments.filter((m) => {
      if (m.impact_level < minImpact) return false;
      if (m.confidence_truth < minConfTruth) return false;
      if (m.confidence_date < minConfDate) return false;
      if (statusFilter.length > 0 && !statusFilter.includes(m.status)) return false;
      if (personFilter.length > 0) {
        const momentPersonIds = participantMap[m.id] || [];
        if (!personFilter.some((pid) => momentPersonIds.includes(pid))) return false;
      }
      return true;
    });
  }, [moments, minImpact, minConfTruth, minConfDate, statusFilter, personFilter, participantMap]);

  const groupedByYear = useMemo(() => {
    const groups: Record<string, TimelineMoment[]> = {};
    for (const m of filteredMoments) {
      const year = m.happened_at.split("-")[0];
      if (!groups[year]) groups[year] = [];
      groups[year].push(m);
    }
    return Object.entries(groups).sort(([a], [b]) => Number(b) - Number(a));
  }, [filteredMoments]);

  const openMomentDrawer = async (moment: TimelineMoment) => {
    const [partRes, provRes] = await Promise.all([
      supabase.from("moment_participants").select("person_id").eq("moment_id", moment.id),
      supabase.from("moment_provenance").select("id, snippet_en, page_number, document_id").eq("moment_id", moment.id),
    ]);
    const participantIds = ((partRes.data || []) as any[]).map((p) => p.person_id);
    const participants = people.filter((p) => participantIds.includes(p.id));

    const docIds = [...new Set(((provRes.data || []) as any[]).map((p) => p.document_id).filter(Boolean))] as string[];
    let docMap: Record<string, { file_name: string; storage_path: string; mime_type: string }> = {};
    if (docIds.length > 0) {
      const { data: docs } = await supabase.from("documents").select("id, file_name, storage_path, mime_type").in("id", docIds);
      for (const d of docs || []) docMap[d.id] = { file_name: d.file_name, storage_path: d.storage_path, mime_type: d.mime_type };
    }

    const provWithDocs = ((provRes.data || []) as any[]).map((prov) => ({
      ...prov,
      document: prov.document_id ? (docMap[prov.document_id] || { file_name: "Unknown", storage_path: "", mime_type: "" }) : null,
    }));

    setSelectedMoment({ ...moment, participants, provenance: provWithDocs });
    setDrawerOpen(true);
  };

  const togglePersonFilter = (id: string) => {
    setPersonFilter((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  const openEditDialog = (moment: TimelineMoment) => {
    const participantIds = (moment.participants || []).map((p) => p.id);
    const documentIds = provenanceMap[moment.id] || [];
    setEditMomentData({
      id: moment.id,
      title: moment.title,
      description: moment.description,
      happened_at: moment.happened_at,
      happened_end: moment.happened_end,
      status: moment.status,
      impact_level: moment.impact_level,
      confidence_date: moment.confidence_date,
      confidence_truth: moment.confidence_truth,
      participantIds,
      documentIds,
    });
    setDrawerOpen(false);
    setEditDialogOpen(true);
  };

  const impactLabels: Record<number, string> = {
    1: "Minor",
    2: "Noticeable",
    3: "Strong Impact",
    4: "Life-Shaping",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3>Timeline</h3>
          <p className="text-sm text-muted-foreground">
            {filteredMoments.length} moment{filteredMoments.length !== 1 ? "s" : ""} shown
          </p>
        </div>
        <div className="flex gap-2">
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {personFilter.length > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px]">{personFilter.length}</Badge>}
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
          <AddEventDialog people={people} documents={documents} onCreated={fetchData} onDocumentsChanged={fetchData} />
        </div>
      </div>

      {/* Filter panel */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleContent>
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Min Impact: {minImpact} — {impactLabels[minImpact]}</Label>
                  <Slider value={[minImpact]} onValueChange={([v]) => setMinImpact(v)} min={1} max={4} step={1} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Min Confidence (Truth): {minConfTruth}</Label>
                  <Slider value={[minConfTruth]} onValueChange={([v]) => setMinConfTruth(v)} min={0} max={10} step={1} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Min Confidence (Date): {minConfDate}</Label>
                  <Slider value={[minConfDate]} onValueChange={([v]) => setMinConfDate(v)} min={0} max={10} step={1} />
                </div>
              </div>

              {people.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs">People</Label>
                  <div className="flex flex-wrap gap-2">
                    {people.map((p) => (
                      <label key={p.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <Checkbox
                          checked={personFilter.includes(p.id)}
                          onCheckedChange={() => togglePersonFilter(p.id)}
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setMinImpact(1); setMinConfTruth(0); setMinConfDate(0); setStatusFilter([]); setPersonFilter([]); }}>
                  Show All
                </Button>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : groupedByYear.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground space-y-4">
          <Calendar className="mx-auto h-12 w-12 mb-4 opacity-40" />
          <p className="text-lg font-medium">No moments yet</p>
          <p className="text-sm">Upload documents or add moments manually to build your timeline.</p>
          <div className="flex justify-center gap-3 pt-2">
            <AddEventDialog people={people} documents={documents} onCreated={fetchData} onDocumentsChanged={fetchData} />
            <Button size="sm" variant="outline" asChild>
              <a href="/upload"><Upload className="mr-2 h-4 w-4" /> Upload documents</a>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByYear.map(([year, yearMoments]) => (
            <div key={year}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-bold text-foreground">{year}</span>
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">{yearMoments.length} moment{yearMoments.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="relative ml-4 border-l-2 border-border pl-6 space-y-4">
                {yearMoments.map((moment) => (
                  <button key={moment.id} onClick={() => openMomentDrawer(moment)} className="block w-full text-left group">
                    <div className="absolute -left-[9px] h-4 w-4 rounded-full border-2 border-background bg-primary" style={{ marginTop: "4px" }} />
                    <Card className="transition-shadow hover:shadow-md cursor-pointer">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{moment.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(moment.happened_at), "MMM d, yyyy")}
                              {moment.happened_end && ` — ${format(new Date(moment.happened_end), "MMM d, yyyy")}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge variant="outline" className={`text-[10px] px-1.5 ${statusColors[moment.status] || ""}`}>
                              {moment.status.replace("_", " ")}
                            </Badge>
                            {moment.source === "pdf" && <FileText className="h-3 w-3 text-muted-foreground" />}
                            {moment.verified && <CheckCircle2 className="h-3 w-3 text-success" />}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Moment detail drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedMoment && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedMoment.title}</SheetTitle>
                <SheetDescription>
                  {format(new Date(selectedMoment.happened_at), "MMMM d, yyyy")}
                  {selectedMoment.happened_end && ` — ${format(new Date(selectedMoment.happened_end), "MMMM d, yyyy")}`}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(selectedMoment)}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit Moment
                </Button>

                {selectedMoment.description && (
                  <p className="text-sm text-muted-foreground">{selectedMoment.description}</p>
                )}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Impact</p>
                    <p className="text-lg font-bold">{selectedMoment.impact_level}/4</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Conf. Truth</p>
                    <p className="text-lg font-bold">{selectedMoment.confidence_truth}/10</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Conf. Date</p>
                    <p className="text-lg font-bold">{selectedMoment.confidence_date}/10</p>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className={statusColors[selectedMoment.status] || ""}>
                    {selectedMoment.status.replace("_", " ")}
                  </Badge>
                  <Badge variant="outline">Source: {selectedMoment.source}</Badge>
                  {selectedMoment.verified && <Badge className="bg-success text-success-foreground">Verified</Badge>}
                </div>

                {selectedMoment.participants && selectedMoment.participants.length > 0 && (
                  <div>
                    <h6 className="mb-2 flex items-center gap-2"><Users className="h-4 w-4" /> Participants</h6>
                    <div className="flex gap-2 flex-wrap">
                      {selectedMoment.participants.map((p) => (
                        <Badge key={p.id} variant="secondary">{p.name}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMoment.provenance && selectedMoment.provenance.length > 0 && (
                  <div>
                    <h6 className="mb-2 flex items-center gap-2"><FileText className="h-4 w-4" /> Documents</h6>
                    <div className="space-y-2">
                      {selectedMoment.provenance.map((prov) => (
                        <Card key={prov.id}>
                          <CardContent className="py-3 px-3 text-sm space-y-2">
                            {prov.document && (
                              <>
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                  <span className="font-medium truncate">{prov.document.file_name}</span>
                                  {prov.page_number && <span className="text-xs text-muted-foreground shrink-0">p.{prov.page_number}</span>}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      const { data } = await supabase.storage.from("documents").createSignedUrl(prov.document!.storage_path, 300);
                                      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                                    }}
                                  >
                                    <Eye className="mr-1.5 h-3.5 w-3.5" /> View
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      const { data } = await supabase.storage.from("documents").createSignedUrl(prov.document!.storage_path, 300, { download: prov.document!.file_name });
                                      if (data?.signedUrl) {
                                        const a = document.createElement("a");
                                        a.href = data.signedUrl;
                                        a.download = prov.document!.file_name;
                                        a.click();
                                      }
                                    }}
                                  >
                                    <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                                  </Button>
                                </div>
                              </>
                            )}
                            {prov.snippet_en && (
                              <p className="text-muted-foreground text-xs italic">"{prov.snippet_en}"</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit moment dialog */}
      <AddEventDialog
        people={people}
        documents={documents}
        onCreated={fetchData}
        onDocumentsChanged={fetchData}
        editEvent={editMomentData}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  );
};

export default TimelinePage;
