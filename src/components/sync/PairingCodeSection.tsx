import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, Link2 } from "lucide-react";

export function PairingCodeSection({ onPaired }: { onPaired?: () => void }) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const [pairCode, setPairCode] = useState("");
  const [accepting, setAccepting] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-pairing-code");
      if (error) throw error;
      setCode(data.code);
      setExpiresAt(data.expires_at);
      toast({ title: "Pairing code generated" });
    } catch (err: any) {
      toast({ title: "Failed to generate code", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      toast({ title: "Copied to clipboard" });
    }
  };

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairCode) return;
    setAccepting(true);
    try {
      const { data, error } = await supabase.functions.invoke("accept-pairing-code", {
        body: { code: pairCode },
      });
      if (error) throw error;
      toast({ title: "Connected!", description: `Connection ${data.connection_id} established.` });
      setPairCode("");
      onPaired?.();
    } catch (err: any) {
      toast({ title: "Pairing failed", description: err.message, variant: "destructive" });
    } finally {
      setAccepting(false);
    }
  };

  const expiresLabel = expiresAt
    ? `Expires ${new Date(expiresAt).toLocaleTimeString()}`
    : null;

  return (
    <div className="space-y-6">
      {/* Generate code (for Cherishly to enter) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generate Cherishly Pairing Code</CardTitle>
          <CardDescription>
            Create a one-time code to share with Cherishly so it can connect to your Temerio account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {code ? (
            <div className="flex items-center gap-3">
              <code className="rounded-md border bg-muted px-4 py-2 text-2xl font-mono tracking-widest">
                {code}
              </code>
              <Button variant="ghost" size="icon" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
              </Button>
              {expiresLabel && (
                <span className="text-xs text-muted-foreground">{expiresLabel}</span>
              )}
            </div>
          ) : (
            <Button onClick={handleGenerate} disabled={generating}>
              {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Code
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Accept a code from remote */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Connect to Cherishly
          </CardTitle>
          <CardDescription>
            Enter the pairing code shown in Cherishly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAccept} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="pair-code">Pairing Code</Label>
              <Input
                id="pair-code"
                placeholder="A1B2C3"
                value={pairCode}
                onChange={(e) => setPairCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="font-mono tracking-widest uppercase"
                required
              />
            </div>
            <Button type="submit" disabled={accepting || pairCode.length < 6}>
              {accepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Connect
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
