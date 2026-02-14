import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const UploadPage = () => {
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

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

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

  const handleStubExtract = async () => {
    if (!user) return;
    const uploadedDocs = documents.filter((d) => d.status === "uploaded");
    if (uploadedDocs.length === 0) {
      toast({ title: "No uploaded documents to process" });
      return;
    }
    setStubRunning(true);

    for (const doc of uploadedDocs) {
      // Set processing
      await supabase.from("documents").update({ status: "processing" }).eq("id", doc.id);

      // Insert usage ledger row
      await supabase.from("ai_usage_ledger").insert({
        user_id: user.id,
        action: "pdf_extract",
        credits_used: 50,
        document_id: doc.id,
      });

      // Create 1-3 placeholder events
      const numEvents = Math.floor(Math.random() * 3) + 1;
      const headlines = [
        "Contract signed with third party",
        "Medical examination completed",
        "Employment start date recorded",
        "Insurance policy issued",
        "Official registration filed",
      ];
      for (let i = 0; i < numEvents; i++) {
        const randomDate = new Date(2020 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        const { data: event } = await supabase.from("events").insert({
          user_id: user.id,
          headline_en: headlines[Math.floor(Math.random() * headlines.length)],
          description_en: "Automatically extracted from uploaded document (stub data).",
          date_start: randomDate.toISOString().split("T")[0],
          status: "unknown",
          confidence_date: Math.floor(Math.random() * 4) + 2,
          confidence_truth: Math.floor(Math.random() * 4) + 3,
          importance: Math.floor(Math.random() * 5) + 4,
          source: "pdf",
        }).select().single();

        if (event) {
          // Add provenance
          await supabase.from("event_provenance").insert({
            user_id: user.id,
            event_id: event.id,
            document_id: doc.id,
            page_number: Math.floor(Math.random() * 10) + 1,
            snippet_en: "Lorem ipsum snippet from the document representing extracted text.",
          });

          // Link participant if primary person set
          if (doc.primary_person_id) {
            await supabase.from("event_participants").insert({
              event_id: event.id,
              person_id: doc.primary_person_id,
            });
          }

          // Create review item for high-importance events
          if (event.importance >= 7) {
            await supabase.from("review_queue").insert({
              user_id: user.id,
              type: "suggestion",
              event_id: event.id,
              notes: "Auto-extracted event needs review.",
            });
          }
        }
      }

      // Set done
      await supabase.from("documents").update({ status: "done" }).eq("id", doc.id);
    }

    toast({ title: "Stub extraction complete", description: `Processed ${uploadedDocs.length} document(s).` });
    setStubRunning(false);
    fetchData();
  };

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
          <Button size="sm" onClick={handleStubExtract} disabled={stubRunning || documents.filter((d) => d.status === "uploaded").length === 0}>
            {stubRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
            Run Stub Extraction
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
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1">{doc.file_name}</span>
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
