import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Loader2, Sparkles, Send, RotateCcw } from "lucide-react";
import ImportanceSlider from "@/components/timeline/ImportanceSlider";
import { format } from "date-fns";

interface Person {
  id: string;
  name: string;
  relationship_label: string | null;
}

interface EventDraft {
  date_start: string;
  date_end?: string | null;
  headline_en: string;
  description_en?: string | null;
  status: string;
  importance: number;
  confidence_date: number;
  confidence_truth: number;
  participants?: string[];
}

interface AddEventDialogProps {
  people: Person[];
  onCreated: () => void;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

const AddEventDialog = ({ people, onCreated }: AddEventDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  // Form fields
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [status, setStatus] = useState("unknown");
  const [importance, setImportance] = useState(5);
  const [confDate, setConfDate] = useState(5);
  const [confTruth, setConfTruth] = useState(5);
  const [saving, setSaving] = useState(false);

  // AI mode
  const [aiMode, setAiMode] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [draftApplied, setDraftApplied] = useState(false);
  const [matchedPeople, setMatchedPeople] = useState<string[]>([]);
  const [suggestedNewPeople, setSuggestedNewPeople] = useState<string[]>([]);

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    if (open) {
      setDateStart(today);
      setDateEnd("");
      setHeadline("");
      setDescription("");
      setStatus("unknown");
      setImportance(5);
      setConfDate(5);
      setConfTruth(5);
      setAiMode(false);
      setAiInput("");
      setChatHistory([]);
      setDraftApplied(false);
      setMatchedPeople([]);
      setSuggestedNewPeople([]);
    }
  }, [open, today]);

  const applyDraft = (draft: EventDraft) => {
    setHeadline(draft.headline_en);
    setDescription(draft.description_en || "");
    setDateStart(draft.date_start);
    setDateEnd(draft.date_end || "");
    setStatus(draft.status);
    setImportance(Math.max(1, Math.min(10, draft.importance)));
    setConfDate(Math.max(0, Math.min(10, draft.confidence_date)));
    setConfTruth(Math.max(0, Math.min(10, draft.confidence_truth)));

    // Match participants
    const names = draft.participants || [];
    const matched: string[] = [];
    const unmatched: string[] = [];
    for (const name of names) {
      const found = people.find(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );
      if (found) matched.push(found.id);
      else unmatched.push(name);
    }
    setMatchedPeople(matched);
    setSuggestedNewPeople(unmatched);
    setDraftApplied(true);
  };

  const handleAiGenerate = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);

    const userMsg: ChatMessage = { role: "user", content: aiInput.trim() };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setAiInput("");

    try {
      const { data, error } = await supabase.functions.invoke("draft-event", {
        body: {
          messages: newHistory,
          today,
          people: people.map((p) => ({ name: p.name })),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const draft = data.draft as EventDraft;
      applyDraft(draft);

      setChatHistory([
        ...newHistory,
        {
          role: "assistant",
          content: `Draft applied: "${draft.headline_en}" (importance ${draft.importance}/10)`,
        },
      ]);
    } catch (err: any) {
      const msg = err?.message || "AI request failed";
      toast({ title: "AI error", description: msg, variant: "destructive" });
      setChatHistory([
        ...newHistory,
        { role: "assistant", content: `Error: ${msg}` },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleRefine = () => {
    setAiInput(
      `Please refine the draft. Current values:\nHeadline: ${headline}\nDescription: ${description}\nDate: ${dateStart}\nStatus: ${status}\nImportance: ${importance}\n\nPlease improve it.`
    );
  };

  const handleSave = async () => {
    if (!user || !headline || !dateStart) return;
    setSaving(true);

    const { data: eventData, error } = await supabase
      .from("events")
      .insert({
        user_id: user.id,
        headline_en: headline,
        description_en: description || null,
        date_start: dateStart,
        date_end: dateEnd || null,
        status,
        importance,
        confidence_date: confDate,
        confidence_truth: confTruth,
        source: "manual",
      })
      .select("id")
      .single();

    if (error) {
      toast({ title: "Failed to create event", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    // Link matched participants
    if (matchedPeople.length > 0 && eventData) {
      await supabase.from("event_participants").insert(
        matchedPeople.map((pid) => ({ event_id: eventData.id, person_id: pid }))
      );
    }

    toast({ title: "Event created" });
    setOpen(false);
    onCreated();
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Manual Event</DialogTitle>
          <DialogDescription>Create a new timeline event manually or with AI assistance.</DialogDescription>
        </DialogHeader>

        {/* AI toggle */}
        {!aiMode ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={() => setAiMode(true)}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Use AI to fill this
          </Button>
        ) : (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> AI Assistant
              </span>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setAiMode(false)}>
                Close
              </Button>
            </div>

            {/* Chat messages */}
            {chatHistory.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-2 text-xs">
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`rounded px-2 py-1.5 ${
                      msg.role === "user"
                        ? "bg-primary/10 text-foreground"
                        : "bg-background text-muted-foreground"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Describe your event…"
                className="text-sm"
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAiGenerate()}
                disabled={aiLoading}
              />
              <Button size="sm" onClick={handleAiGenerate} disabled={aiLoading || !aiInput.trim()}>
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>

            {draftApplied && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">Draft applied</Badge>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={handleRefine}>
                  <RotateCcw className="mr-1 h-3 w-3" /> Refine with AI
                </Button>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Form fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Headline *</Label>
            <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="What happened?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details…" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
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
              <Label>Confidence (Date): {confDate}</Label>
              <div className="pt-2">
                <input type="range" min={0} max={10} value={confDate} onChange={(e) => setConfDate(Number(e.target.value))} className="w-full" />
              </div>
            </div>
          </div>

          <ImportanceSlider value={importance} onChange={setImportance} />

          <div className="space-y-2">
            <Label>Confidence (Truth): {confTruth}</Label>
            <input type="range" min={0} max={10} value={confTruth} onChange={(e) => setConfTruth(Number(e.target.value))} className="w-full" />
          </div>

          {/* Matched participants */}
          {matchedPeople.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs">Linked People</Label>
              <div className="flex flex-wrap gap-1.5">
                {matchedPeople.map((pid) => {
                  const person = people.find((p) => p.id === pid);
                  return person ? (
                    <Badge key={pid} variant="secondary" className="text-xs">
                      {person.name}
                      <button
                        className="ml-1 hover:text-destructive"
                        onClick={() => setMatchedPeople((prev) => prev.filter((id) => id !== pid))}
                      >
                        ×
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Suggested new people */}
          {suggestedNewPeople.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Suggested new people (not yet in your list)</Label>
              <div className="flex flex-wrap gap-1.5">
                {suggestedNewPeople.map((name) => (
                  <Badge key={name} variant="outline" className="text-xs text-muted-foreground">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={saving || !headline || !dateStart}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddEventDialog;
