import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Filter, ChevronDown, Calendar, FileText, Users, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Person {
  id: string;
  name: string;
  relationship_label: string | null;
}

interface TimelineEvent {
  id: string;
  date_start: string;
  date_end: string | null;
  headline_en: string;
  description_en: string | null;
  status: string;
  confidence_date: number;
  confidence_truth: number;
  importance: number;
  source: string;
  verified: boolean;
  is_potential_major: boolean;
  participants?: Person[];
  provenance?: {
    id: string;
    snippet_en: string | null;
    page_number: number | null;
    document?: { file_name: string } | null;
  }[];
}

const statusColors: Record<string, string> = {
  past_fact: "bg-success/10 text-success border-success/20",
  future_plan: "bg-info/10 text-info border-info/20",
  ongoing: "bg-warning/10 text-warning border-warning/20",
  unknown: "bg-muted text-muted-foreground border-border",
};

const TimelinePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  // Filters
  const [minImportance, setMinImportance] = useState(8);
  const [minConfTruth, setMinConfTruth] = useState(0);
  const [minConfDate, setMinConfDate] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [personFilter, setPersonFilter] = useState<string[]>([]);

  // New event form
  const [newHeadline, setNewHeadline] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDateStart, setNewDateStart] = useState("");
  const [newStatus, setNewStatus] = useState("unknown");
  const [newImportance, setNewImportance] = useState(5);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [eventsRes, peopleRes] = await Promise.all([
      supabase.from("events").select("*").eq("user_id", user.id).order("date_start", { ascending: false }),
      supabase.from("people").select("*").eq("user_id", user.id),
    ]);
    if (eventsRes.data) setEvents(eventsRes.data);
    if (peopleRes.data) setPeople(peopleRes.data);
    setLoading(false);
  };

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (e.importance < minImportance) return false;
      if (e.confidence_truth < minConfTruth) return false;
      if (e.confidence_date < minConfDate) return false;
      if (statusFilter.length > 0 && !statusFilter.includes(e.status)) return false;
      return true;
    });
  }, [events, minImportance, minConfTruth, minConfDate, statusFilter]);

  const groupedByYear = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    for (const e of filteredEvents) {
      const year = e.date_start.split("-")[0];
      if (!groups[year]) groups[year] = [];
      groups[year].push(e);
    }
    return Object.entries(groups).sort(([a], [b]) => Number(b) - Number(a));
  }, [filteredEvents]);

  const openEventDrawer = async (event: TimelineEvent) => {
    // Fetch participants + provenance
    const [partRes, provRes] = await Promise.all([
      supabase.from("event_participants").select("person_id").eq("event_id", event.id),
      supabase.from("event_provenance").select("id, snippet_en, page_number, document_id").eq("event_id", event.id),
    ]);
    const participantIds = (partRes.data || []).map((p) => p.person_id);
    const participants = people.filter((p) => participantIds.includes(p.id));

    // Fetch doc names for provenance
    const provWithDocs = await Promise.all(
      (provRes.data || []).map(async (prov) => {
        if (prov.document_id) {
          const { data: doc } = await supabase.from("documents").select("file_name").eq("id", prov.document_id).single();
          return { ...prov, document: doc };
        }
        return { ...prov, document: null };
      })
    );

    setSelectedEvent({ ...event, participants, provenance: provWithDocs });
    setDrawerOpen(true);
  };

  const handleAddEvent = async () => {
    if (!user || !newHeadline || !newDateStart) return;
    setSaving(true);
    const { error } = await supabase.from("events").insert({
      user_id: user.id,
      headline_en: newHeadline,
      description_en: newDescription || null,
      date_start: newDateStart,
      status: newStatus,
      importance: newImportance,
      source: "manual",
    });
    if (error) {
      toast({ title: "Failed to create event", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Event created" });
      setAddOpen(false);
      setNewHeadline("");
      setNewDescription("");
      setNewDateStart("");
      setNewStatus("unknown");
      setNewImportance(5);
      fetchData();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3>Timeline</h3>
          <p className="text-sm text-muted-foreground">
            {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""} shown
          </p>
        </div>
        <div className="flex gap-2">
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Manual Event</DialogTitle>
                <DialogDescription>Create a new timeline event manually.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Headline *</Label>
                  <Input value={newHeadline} onChange={(e) => setNewHeadline(e.target.value)} placeholder="What happened?" />
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input type="date" value={newDateStart} onChange={(e) => setNewDateStart(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Optional details..." rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="past_fact">Past Fact</SelectItem>
                      <SelectItem value="future_plan">Future Plan</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Importance: {newImportance}</Label>
                  <Slider value={[newImportance]} onValueChange={([v]) => setNewImportance(v)} min={1} max={10} step={1} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddEvent} disabled={saving || !newHeadline || !newDateStart}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Event
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter panel */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleContent>
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Min Importance: {minImportance}</Label>
                  <Slider value={[minImportance]} onValueChange={([v]) => setMinImportance(v)} min={1} max={10} step={1} />
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
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setMinImportance(8); setMinConfTruth(0); setMinConfDate(0); setStatusFilter([]); }}>
                  Reset to "Major Events"
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setMinImportance(1); setMinConfTruth(0); setMinConfDate(0); setStatusFilter([]); }}>
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
        <div className="text-center py-20 text-muted-foreground">
          <Calendar className="mx-auto h-12 w-12 mb-4 opacity-40" />
          <p className="text-lg font-medium">No events yet</p>
          <p className="text-sm">Upload documents or add events manually to build your timeline.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByYear.map(([year, yearEvents]) => (
            <div key={year}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-display font-bold text-foreground">{year}</span>
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">{yearEvents.length} event{yearEvents.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="relative ml-4 border-l-2 border-border pl-6 space-y-4">
                {yearEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => openEventDrawer(event)}
                    className="block w-full text-left group"
                  >
                    <div className="absolute -left-[9px] h-4 w-4 rounded-full border-2 border-background bg-primary" style={{ marginTop: "4px" }} />
                    <Card className="transition-shadow hover:shadow-md cursor-pointer">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{event.headline_en}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(event.date_start), "MMM d, yyyy")}
                              {event.date_end && ` — ${format(new Date(event.date_end), "MMM d, yyyy")}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge variant="outline" className={`text-[10px] px-1.5 ${statusColors[event.status] || ""}`}>
                              {event.status.replace("_", " ")}
                            </Badge>
                            {event.source === "pdf" && <FileText className="h-3 w-3 text-muted-foreground" />}
                            {event.verified && <CheckCircle2 className="h-3 w-3 text-success" />}
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

      {/* Event detail drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedEvent && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedEvent.headline_en}</SheetTitle>
                <SheetDescription>
                  {format(new Date(selectedEvent.date_start), "MMMM d, yyyy")}
                  {selectedEvent.date_end && ` — ${format(new Date(selectedEvent.date_end), "MMMM d, yyyy")}`}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {selectedEvent.description_en && (
                  <p className="text-sm text-muted-foreground">{selectedEvent.description_en}</p>
                )}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Importance</p>
                    <p className="text-lg font-bold">{selectedEvent.importance}/10</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Conf. Truth</p>
                    <p className="text-lg font-bold">{selectedEvent.confidence_truth}/10</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Conf. Date</p>
                    <p className="text-lg font-bold">{selectedEvent.confidence_date}/10</p>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className={statusColors[selectedEvent.status] || ""}>
                    {selectedEvent.status.replace("_", " ")}
                  </Badge>
                  <Badge variant="outline">Source: {selectedEvent.source}</Badge>
                  {selectedEvent.verified && <Badge className="bg-success text-success-foreground">Verified</Badge>}
                </div>

                {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                  <div>
                    <h6 className="mb-2 flex items-center gap-2"><Users className="h-4 w-4" /> Participants</h6>
                    <div className="flex gap-2 flex-wrap">
                      {selectedEvent.participants.map((p) => (
                        <Badge key={p.id} variant="secondary">{p.name}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEvent.provenance && selectedEvent.provenance.length > 0 && (
                  <div>
                    <h6 className="mb-2 flex items-center gap-2"><FileText className="h-4 w-4" /> Provenance</h6>
                    <div className="space-y-2">
                      {selectedEvent.provenance.map((prov) => (
                        <Card key={prov.id}>
                          <CardContent className="py-2 px-3 text-xs">
                            {prov.document && (
                              <p className="font-medium">{prov.document.file_name}{prov.page_number ? `, p.${prov.page_number}` : ""}</p>
                            )}
                            {prov.snippet_en && (
                              <p className="text-muted-foreground mt-1 italic">"{prov.snippet_en}"</p>
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
    </div>
  );
};

export default TimelinePage;
