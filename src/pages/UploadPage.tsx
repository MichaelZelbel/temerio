import { useState, useEffect, useCallback } from "react";
import { useSeo } from "@/hooks/useSeo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Upload, FileText, Loader2, Plus, PlayCircle, CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface Person {
  id: string;
  name: string;
}

interface Document {
  id: string;
  file_name: string;
  status: string;
  created_at: string;
  primary_person_id: string | null;
}

const statusIcon: Record<string, React.ReactNode> = {
  uploaded: <Clock className="h-4 w-4 text-muted-foreground" />,
  processing: <Loader2 className="h-4 w-4 animate-spin text-warning" />,
  done: <CheckCircle2 className="h-4 w-4 text-success" />,
  failed: <AlertCircle className="h-4 w-4 text-destructive" />,
};

const stubHeadlines: [string, string][] = [
  ["Contract signed with third party", "past_fact"],
  ["Medical examination completed", "past_fact"],
  ["Employment start date recorded", "past_fact"],
  ["Upcoming appointment scheduled", "future_plan"],
  ["Insurance policy issued", "past_fact"],
  ["Official registration filed", "unknown"],
  ["Court hearing date set", "future_plan"],
  ["Document notarisation completed", "past_fact"],
];

const stubSnippets = [
  "The undersigned parties agree to the terms set forth herein.",
  "Results of the examination were found to be within normal parameters.",
  "Effective commencement date as stated in section 3.1 of the agreement.",
  "Appointment confirmed for the date referenced above.",
  "Policy number issued and coverage effective immediately.",
];

const UploadPage = () => {
  useSeo({ title: "Upload", path: "/upload", noIndex: true });
  const { user } = useAuth();
  const { toast } = useToast();
  const [people, setPeople] = useState<Person[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [stubRunning, setStubRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  // Auto-select person if there's exactly one
  useEffect(() => {
    if (!selectedPerson && people.length === 1) {
      setSelectedPerson(people[0].id);
    }
  }, [people, selectedPerson]);

  // Auto-select uploaded docs when documents change
  useEffect(() => {
    setSelectedDocs(new Set(documents.filter((d) => d.status === "uploaded").map((d) => d.id)));
  }, [documents]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [pRes, dRes] = await Promise.all([
      supabase.from("people").select("id, name").eq("user_id", user.id).order("name"),
      supabase.from("documents").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    if (pRes.data) setPeople(pRes.data);
    if (dRes.data) setDocuments(dRes.data);
    setLoading(false);
  };

  const handleAddPerson = async () => {
    if (!user || !newPersonName.trim()) return;
    const { data, error } = await supabase.from("people").insert({ user_id: user.id, name: newPersonName.trim() }).select().single();
    if (error) {
      toast({ title: "Failed to add person", description: error.message, variant: "destructive" });
    } else {
      setPeople((prev) => [...prev, data]);
      setSelectedPerson(data.id);
      setNewPersonName("");
      setAddPersonOpen(false);
      toast({ title: "Person added" });
    }
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      if (file.type !== "application/pdf") {
        toast({ title: `Skipped ${file.name}`, description: "Only PDFs are accepted.", variant: "destructive" });
        continue;
      }
      const storagePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("documents").upload(storagePath, file);
      if (uploadErr) {
        toast({ title: `Upload failed: ${file.name}`, description: uploadErr.message, variant: "destructive" });
        continue;
      }
      const { error: insertErr } = await supabase.from("documents").insert({
        user_id: user.id,
        storage_path: storagePath,
        file_name: file.name,
        mime_type: "application/pdf",
        status: "uploaded",
        primary_person_id: selectedPerson || null,
      });
      if (insertErr) {
        toast({ title: `DB insert failed: ${file.name}`, description: insertErr.message, variant: "destructive" });
      }
    }
    toast({ title: "Upload complete" });
    setUploading(false);
    e.target.value = "";
    fetchData();
  }, [user, selectedPerson, toast]);

  const toggleDoc = (id: string) => {
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStubExtract = async () => {
    if (!user) return;
    const docsToProcess = documents.filter((d) => selectedDocs.has(d.id) && d.status === "uploaded");
    if (docsToProcess.length === 0) {
      toast({ title: "No uploaded documents selected" });
      return;
    }
    setStubRunning(true);

    for (const doc of docsToProcess) {
      // Set processing
      await supabase.from("documents").update({ status: "processing" }).eq("id", doc.id);
      setDocuments((prev) => prev.map((d) => d.id === doc.id ? { ...d, status: "processing" } : d));

      // Insert usage ledger row
      await supabase.from("ai_usage_ledger").insert({
        user_id: user.id,
        action: "pdf_extract",
        credits_used: 50,
        document_id: doc.id,
      });

      // Create 2-3 placeholder events
      const numEvents = Math.floor(Math.random() * 2) + 2;
      for (let i = 0; i < numEvents; i++) {
        const pick = stubHeadlines[Math.floor(Math.random() * stubHeadlines.length)];
        const headline = pick[0];
        const status = pick[1];
        const randomDate = new Date(2020 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        const impactLevel = Math.floor(Math.random() * 3) + 1; // 1-3
        const confTruth = Math.floor(Math.random() * 5) + 2;
        const confDate = Math.floor(Math.random() * 5) + 2;
        const isPotentialMajor = impactLevel >= 3;
        const mergeAuto = Math.random() > 0.8;

        const { data: moment } = await supabase.from("moments").insert({
          user_id: user.id,
          title: headline,
          description: "Automatically extracted from uploaded document (stub data).",
          happened_at: randomDate.toISOString().split("T")[0],
          status,
          confidence_date: confDate,
          confidence_truth: confTruth,
          impact_level: impactLevel,
          is_potential_major: isPotentialMajor,
          merge_auto: mergeAuto,
          source: "pdf",
        }).select().single();

        if (moment) {
          // Add provenance
          await supabase.from("moment_provenance").insert({
            user_id: user.id,
            moment_id: moment.id,
            document_id: doc.id,
            page_number: Math.floor(Math.random() * 10) + 1,
            snippet_en: stubSnippets[Math.floor(Math.random() * stubSnippets.length)],
          });

          // Link participant if primary person set
          if (doc.primary_person_id) {
            await supabase.from("moment_participants").insert({
              moment_id: moment.id,
              person_id: doc.primary_person_id,
            });
          }

          // Create review item based on type logic
          let reviewType = "suggestion";
          if (impactLevel >= 4 || isPotentialMajor) reviewType = "major";
          else if (mergeAuto) reviewType = "merge";

          await supabase.from("review_queue").insert({
            user_id: user.id,
            type: reviewType,
            moment_id: moment.id,
            notes: `Auto-extracted moment from "${doc.file_name}" needs review.`,
          });
        }
      }

      // Set done
      await supabase.from("documents").update({ status: "done" }).eq("id", doc.id);
      setDocuments((prev) => prev.map((d) => d.id === doc.id ? { ...d, status: "done" } : d));
    }

    toast({ title: "Stub extraction complete", description: `Processed ${docsToProcess.length} document(s).` });
    setStubRunning(false);
    fetchData();
  };

  const personName = (id: string | null) => people.find((p) => p.id === id)?.name || "—";
  const uploadedSelected = documents.filter((d) => selectedDocs.has(d.id) && d.status === "uploaded").length;

  return (
    <div className="space-y-6">
      <div>
        <h3>Upload Documents</h3>
        <p className="text-sm text-muted-foreground">Upload PDFs to extract timeline events.</p>
      </div>

      {/* Step 1: Select person */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 1: Select Primary Person</CardTitle>
          <CardDescription>Choose the person this batch of documents relates to.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2 items-end">
          <div className="flex-1 max-w-xs">
            <Select value={selectedPerson} onValueChange={setSelectedPerson}>
              <SelectTrigger>
                <SelectValue placeholder="Select a person..." />
              </SelectTrigger>
              <SelectContent>
                {people.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={addPersonOpen} onOpenChange={setAddPersonOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Plus className="mr-1 h-4 w-4" /> New</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Person</DialogTitle>
                <DialogDescription>Add a new person to your records.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={newPersonName} onChange={(e) => setNewPersonName(e.target.value)} placeholder="Full name" />
              </div>
              <DialogFooter>
                <Button onClick={handleAddPerson} disabled={!newPersonName.trim()}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Step 2: Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 2: Upload PDFs</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-primary/50 transition-colors">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click to select PDF files</span>
              </>
            )}
            <input type="file" accept=".pdf" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
          </label>
        </CardContent>
      </Card>

      {/* Document list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Ingestion Queue</CardTitle>
            <CardDescription>{documents.length} document(s)</CardDescription>
          </div>
          <Button size="sm" onClick={handleStubExtract} disabled={stubRunning || uploadedSelected === 0}>
            {stubRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
            Run Stub Extraction ({uploadedSelected})
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 py-2 px-3 rounded-md bg-muted/50">
                  {doc.status === "uploaded" && (
                    <Checkbox
                      checked={selectedDocs.has(doc.id)}
                      onCheckedChange={() => toggleDoc(doc.id)}
                    />
                  )}
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm truncate block">{doc.file_name}</span>
                    <span className="text-[10px] text-muted-foreground">{personName(doc.primary_person_id)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {statusIcon[doc.status]}
                    <Badge variant="outline" className="text-[10px]">{doc.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadPage;
