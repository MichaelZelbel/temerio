import { useState, useRef, useMemo, useCallback } from "react";
import { useSeo } from "@/hooks/useSeo";
import { useLogActivity } from "@/hooks/useLogActivity";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Camera, Eye, EyeOff, AlertTriangle, CreditCard, ArrowUpRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { CreditsDisplay } from "@/components/settings/CreditsDisplay";
import { SyncSettingsTab } from "@/components/sync/SyncSettingsTab";

function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: "bg-destructive" };
  if (score <= 3) return { score, label: "Medium", color: "bg-warning" };
  return { score, label: "Strong", color: "bg-success" };
}

const Settings = () => {
  useSeo({ title: "Settings", path: "/settings", noIndex: true });
  return (
    <div className="space-y-6">
      <div>
        <h3>Settings</h3>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </div>
      <Tabs defaultValue="profile" className="space-y-6">
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="w-max min-w-full sm:w-auto">
            <TabsTrigger value="profile" className="min-h-[44px] sm:min-h-0">Profile</TabsTrigger>
            <TabsTrigger value="subscription" className="min-h-[44px] sm:min-h-0">Subscription</TabsTrigger>
            <TabsTrigger value="ai-credits" className="min-h-[44px] sm:min-h-0">AI Credits</TabsTrigger>
            <TabsTrigger value="sync" className="min-h-[44px] sm:min-h-0">Sync</TabsTrigger>
            <TabsTrigger value="account" className="min-h-[44px] sm:min-h-0">Account</TabsTrigger>
            <TabsTrigger value="danger" className="min-h-[44px] sm:min-h-0">Danger Zone</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="profile"><ProfileTab /></TabsContent>
        <TabsContent value="subscription"><SubscriptionTab /></TabsContent>
        <TabsContent value="ai-credits"><AICreditsTab /></TabsContent>
        <TabsContent value="sync"><SyncSettingsTab /></TabsContent>
        <TabsContent value="account"><AccountTab /></TabsContent>
        <TabsContent value="danger"><DangerTab /></TabsContent>
      </Tabs>
    </div>
  );
};

/* ─── AI Credits Tab ─── */
function AICreditsTab() {
  return <CreditsDisplay />;
}

/* ─── Subscription Tab ─── */
function SubscriptionTab() {
  const { isSubscribed, tier, subscriptionEnd, isLoading, checkSubscription } = useSubscription();
  const { toast } = useToast();
  const [portalLoading, setPortalLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Failed to open portal", description: err.message, variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkSubscription();
    setRefreshing(false);
    toast({ title: "Subscription status refreshed" });
  };

  const planLabel = tier === "admin" ? "Admin" : tier === "premium_gift" ? "Gift" : tier === "pro" ? "Pro" : "Free";
  const formattedEnd = subscriptionEnd
    ? new Date(subscriptionEnd).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>Your subscription details and billing information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Badge variant={isSubscribed ? "success" : "secondary"} className="text-sm px-3 py-1">
                  {planLabel}
                </Badge>
                {isSubscribed && formattedEnd && (
                  <span className="text-sm text-muted-foreground">
                    Renews {formattedEnd}
                  </span>
                )}
              </div>

              <Separator />

              {isSubscribed ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Manage your subscription, update payment method, or cancel anytime via the Stripe Customer Portal.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={handleManageSubscription} disabled={portalLoading} variant="outline">
                      {portalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                      Manage Subscription
                    </Button>
                    <Button onClick={handleRefresh} disabled={refreshing} variant="ghost" size="sm">
                      {refreshing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Refresh
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You're on the free plan. Upgrade to Pro to unlock unlimited items, advanced AI, team features, and more.
                  </p>
                  <Button asChild>
                    <Link to="/pricing">
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      Upgrade to Pro
                    </Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Profile Tab ─── */
function ProfileTab() {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useLogActivity();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [website, setWebsite] = useState(profile?.website || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");

  const initials = (displayName || user?.email?.split("@")[0] || "U")
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a JPG, PNG, GIF, or WebP image.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 2MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;
      if (avatarUrl) {
        const oldPath = avatarUrl.split("/avatars/")[1];
        if (oldPath) await supabase.storage.from("avatars").remove([oldPath]);
      }
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const newUrl = `${publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: newUrl } as any).eq("id", user.id);
      setAvatarUrl(newUrl);
      toast({ title: "Avatar updated" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [user, avatarUrl, toast]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        display_name: displayName.trim().slice(0, 100),
        bio: bio.trim().slice(0, 160) || null,
        website: website.trim().slice(0, 255) || null,
      } as any).eq("id", user.id);
      if (error) throw error;
      logActivity("profile_update", "profile", user.id, { fields: ["display_name", "bio", "website"] });
      toast({ title: "Profile saved" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your public profile information.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            <Avatar className="h-20 w-20">
              {avatarUrl && <AvatarImage src={avatarUrl} />}
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-foreground/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploading ? <Loader2 className="h-6 w-6 animate-spin text-background" /> : <Camera className="h-6 w-6 text-background" />}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <p className="text-sm font-medium">Profile picture</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, GIF or WebP. Max 2MB.</p>
          </div>
        </div>
        <Separator />
        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={100} placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} placeholder="A short bio about yourself" rows={3} />
            <p className="text-xs text-muted-foreground text-right">{bio.length}/160</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} maxLength={255} placeholder="https://example.com" type="url" />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Account Tab ─── */
function AccountTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const strength = useMemo(() => passwordStrength(newPw), [newPw]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPw || newPw.length < 8) {
      toast({ title: "Password too short", description: "At least 8 characters required.", variant: "destructive" });
      return;
    }
    if (newPw !== confirmPw) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user?.email || "", password: currentPw });
      if (signInErr) {
        toast({ title: "Current password is incorrect", variant: "destructive" });
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      toast({ title: "Password updated" });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err: any) {
      toast({ title: "Failed to update password", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Email</CardTitle><CardDescription>Your account email address.</CardDescription></CardHeader>
        <CardContent><Input value={user?.email || ""} disabled className="max-w-md" /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Change Password</CardTitle><CardDescription>Update your account password.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="current-pw">Current Password</Label>
              <Input id="current-pw" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} autoComplete="current-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pw">New Password</Label>
              <div className="relative">
                <Input id="new-pw" type={showPw ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPw && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i < strength.score ? strength.color : "bg-border")} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{strength.label}</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-pw">Confirm New Password</Label>
              <Input id="confirm-new-pw" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} autoComplete="new-password" />
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Danger Zone ─── */
function DangerTab() {
  const { user, session, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    if (confirmation !== "DELETE MY ACCOUNT") {
      toast({ title: "Please type the confirmation text exactly", variant: "destructive" });
      return;
    }
    if (!password) {
      toast({ title: "Password is required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("delete-my-account", { body: { password } });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message || "Failed to delete account");
      toast({ title: "Account deleted", description: "Your account has been permanently deleted." });
      await signOut();
      navigate("/");
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Danger Zone</CardTitle>
        <CardDescription>Irreversible and destructive actions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-3">
          <h5 className="text-destructive">Delete Account</h5>
          <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data. This action cannot be undone.</p>
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild><Button variant="destructive">Delete My Account</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>This will permanently delete:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Your profile and personal information</li>
                    <li>Your uploaded avatar and files</li>
                    <li>Your account roles and permissions</li>
                    <li>Your authentication credentials</li>
                  </ul>
                  <p className="font-medium text-foreground">This action cannot be reversed.</p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="delete-pw">Enter your password</Label>
                  <Input id="delete-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delete-confirm">Type <span className="font-mono font-bold text-destructive">DELETE MY ACCOUNT</span> to confirm</Label>
                  <Input id="delete-confirm" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="DELETE MY ACCOUNT" />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { setPassword(""); setConfirmation(""); }}>Cancel</AlertDialogCancel>
                <Button variant="destructive" disabled={loading || confirmation !== "DELETE MY ACCOUNT" || !password} onClick={handleDelete}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Permanently Delete Account
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

export default Settings;
