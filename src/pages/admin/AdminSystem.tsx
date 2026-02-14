import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, ToggleLeft, Trash2 } from "lucide-react";

export default function AdminSystem() {
  return (
    <div className="space-y-6">
      <div>
        <h3>System Settings</h3>
        <p className="text-muted-foreground">Platform configuration and maintenance.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ToggleLeft className="h-4 w-4" />
            Feature Flags
          </CardTitle>
          <CardDescription>Toggle features across the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "AI Features", desc: "Enable AI-powered features for users", enabled: true },
            { label: "User Registration", desc: "Allow new users to sign up", enabled: true },
            { label: "Premium Trials", desc: "Enable free trial period for new users", enabled: false },
          ].map((flag) => (
            <div key={flag.label} className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label className="font-medium">{flag.label}</Label>
                <p className="text-xs text-muted-foreground">{flag.desc}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={flag.enabled ? "default" : "secondary"} className="text-xs">
                  {flag.enabled ? "On" : "Off"}
                </Badge>
                <Switch checked={flag.enabled} disabled />
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground italic">
            Feature flags are read-only placeholders. Implement backend storage to make them functional.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="font-medium">Maintenance Mode</Label>
              <p className="text-xs text-muted-foreground">Show maintenance page to non-admin users</p>
            </div>
            <Switch disabled />
          </div>
          <Button variant="outline" disabled className="gap-2">
            <Trash2 className="h-4 w-4" />
            Clear Cache
          </Button>
          <p className="text-xs text-muted-foreground italic">
            These controls are placeholders. Wire to backend when ready.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
