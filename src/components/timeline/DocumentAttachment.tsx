import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Upload, X, Search, Loader2, Plus } from "lucide-react";

export interface DocOption {
  id: string;
  file_name: string;
}

interface DocumentAttachmentProps {
  documents: DocOption[];
  selectedDocIds: string[];
  onSelectedChange: (ids: string[]) => void;
  onDocumentsChanged: () => void;
}

const DocumentAttachment = ({
  documents,
  selectedDocIds,
  onSelectedChange,
  onDocumentsChanged,
}: DocumentAttachmentProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const selectedDocs = useMemo(
    () => documents.filter((d) => selectedDocIds.includes(d.id)),
    [documents, selectedDocIds]
  );

  const filteredDocs = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return documents
      .filter((d) => !selectedDocIds.includes(d.id))
      .filter((d) => !q || d.file_name.toLowerCase().includes(q));
  }, [documents, selectedDocIds, searchQuery]);

  const addDoc = (id: string) => {
    onSelectedChange([...selectedDocIds, id]);
  };

  const removeDoc = (id: string) => {
    onSelectedChange(selectedDocIds.filter((did) => did !== id));
  };

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || !user) return;
      setUploading(true);

      const newIds: string[] = [];
      for (const file of Array.from(files)) {
        const storagePath = `${user.id}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("documents")
          .upload(storagePath, file);
        if (uploadErr) {
          toast({
            title: `Upload failed: ${file.name}`,
            description: uploadErr.message,
            variant: "destructive",
          });
          continue;
        }
        const { data: docRow, error: insertErr } = await supabase
          .from("documents")
          .insert({
            user_id: user.id,
            storage_path: storagePath,
            file_name: file.name,
            mime_type: file.type || "application/octet-stream",
            status: "uploaded",
          })
          .select("id")
          .single();
        if (insertErr) {
          toast({
            title: `DB insert failed: ${file.name}`,
            description: insertErr.message,
            variant: "destructive",
          });
        } else if (docRow) {
          newIds.push(docRow.id);
        }
      }

      if (newIds.length > 0) {
        onDocumentsChanged();
        onSelectedChange([...selectedDocIds, ...newIds]);
        toast({ title: `${newIds.length} file(s) uploaded & attached` });
      }
      setUploading(false);
      e.target.value = "";
    },
    [user, selectedDocIds, onSelectedChange, onDocumentsChanged, toast]
  );

  return (
    <div className="space-y-2">
      <Label className="text-xs flex items-center gap-1.5">
        <FileText className="h-3.5 w-3.5" /> Documents
      </Label>

      {/* Selected documents as badges */}
      {selectedDocs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedDocs.map((doc) => (
            <Badge
              key={doc.id}
              variant="secondary"
              className="gap-1 pr-1 text-xs font-normal"
            >
              <FileText className="h-3 w-3 shrink-0" />
              <span className="max-w-[160px] truncate">{doc.file_name}</span>
              <button
                type="button"
                onClick={() => removeDoc(doc.id)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {/* Search & pick existing docs */}
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Search className="mr-1.5 h-3.5 w-3.5" />
              Attach existing
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <div className="p-2 border-b">
              <Input
                placeholder="Search documents…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-sm"
                autoFocus
              />
            </div>
            <ScrollArea className="max-h-48">
              {filteredDocs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {documents.length === 0
                    ? "No documents yet. Upload one below."
                    : "No matching documents."}
                </p>
              ) : (
                <div className="p-1">
                  {filteredDocs.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => {
                        addDoc(doc.id);
                        setSearchQuery("");
                      }}
                      className="flex items-center gap-2 w-full rounded px-2 py-1.5 text-sm text-left hover:bg-accent transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{doc.file_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Upload new file */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs"
          disabled={uploading}
          asChild
        >
          <label className="cursor-pointer">
            {uploading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="mr-1.5 h-3.5 w-3.5" />
            )}
            Upload file
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </Button>
      </div>
    </div>
  );
};

export default DocumentAttachment;
