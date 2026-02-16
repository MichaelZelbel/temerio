import { useState, useEffect } from "react";
import { useSeo } from "@/hooks/useSeo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Users, Loader2 } from "lucide-react";

interface Person {
  id: string;
  name: string;
  relationship_label: string | null;
  moment_count?: number;
}

const PeoplePage = () => {
  useSeo({ title: "People", path: "/people", noIndex: true });
  const { user } = useAuth();
  const { toast } = useToast();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchPeople();
  }, [user]);

  const fetchPeople = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("people").select("*").eq("user_id", user.id).order("name");
    if (data) {
      const counts: Record<string, number> = {};
      const { data: parts } = await supabase.from("moment_participants").select("person_id");
      for (const p of (parts || []) as any[]) {
        counts[p.person_id] = (counts[p.person_id] || 0) + 1;
      }
      setPeople(data.map((p) => ({ ...p, moment_count: counts[p.id] || 0 })));
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("people").insert({ user_id: user.id, name: name.trim(), relationship_label: label.trim() || null });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Person added" }); setName(""); setLabel(""); setAddOpen(false); fetchPeople(); }
    setSaving(false);
  };

  const handleEdit = async () => {
    if (!editPerson || !name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("people").update({ name: name.trim(), relationship_label: label.trim() || null }).eq("id", editPerson.id);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Updated" }); setEditOpen(false); fetchPeople(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("people").delete().eq("id", id);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); fetchPeople(); }
  };

  const openEdit = (person: Person) => {
    setEditPerson(person);
    setName(person.name);
    setLabel(person.relationship_label || "");
    setEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3>People</h3>
          <p className="text-sm text-muted-foreground">{people.length} person(s)</p>
        </div>
        <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (o) { setName(""); setLabel(""); } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Person</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Person</DialogTitle>
              <DialogDescription>Add someone to your records.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" /></div>
              <div className="space-y-2"><Label>Relationship</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Father, Client" /></div>
            </div>
            <DialogFooter><Button onClick={handleAdd} disabled={saving || !name.trim()}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Person</DialogTitle>
            <DialogDescription>Update person details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Relationship</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={handleEdit} disabled={saving || !name.trim()}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : people.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-3">
          <Users className="mx-auto h-12 w-12 mb-4 opacity-40" />
          <p className="text-lg font-medium">No people yet</p>
          <p className="text-sm">Your default person will be created automatically when you sign in.</p>
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add a person manually
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {people.map((person) => (
            <Card key={person.id}>
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{person.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {person.relationship_label || "No label"} · {person.moment_count} moment{person.moment_count !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(person)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {person.name}?</AlertDialogTitle>
                        <AlertDialogDescription>This will remove this person and unlink them from moments.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(person.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PeoplePage;
