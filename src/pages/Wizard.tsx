import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Sparkles, ArrowRight, ArrowLeft, Camera, Loader2,
  LayoutDashboard, Zap, Users, BarChart3, Rocket,
  BookOpen, MessageCircle, PartyPopper, Check,
} from "lucide-react";

const WIZARD_KEY = "onboarding-wizard-completed";
const FOCUS_KEY = "onboarding-focus";

const STEPS = ["Welcome", "Profile", "Focus", "Tour", "Ready"];

const FOCUS_OPTIONS = [
  { id: "personal", label: "Personal Projects", icon: Rocket, desc: "Organize your own work and ideas" },
  { id: "team", label: "Team Collaboration", icon: Users, desc: "Work together with your team" },
  { id: "analytics", label: "Data & Analytics", icon: BarChart3, desc: "Track metrics and insights" },
  { id: "automation", label: "AI & Automation", icon: Zap, desc: "Automate workflows with AI" },
];

const TOUR_FEATURES = [
  { icon: LayoutDashboard, title: "Dashboard", desc: "Your command center with stats, activity, and quick actions." },
  { icon: Zap, title: "AI-Powered", desc: "Smart features that help you work faster and smarter." },
  { icon: Users, title: "Collaboration", desc: "Invite your team and work together in real-time." },
  { icon: BarChart3, title: "Analytics", desc: "Track your progress with beautiful charts and insights." },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

export default function Wizard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  // Profile state
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Focus state
  const [focus, setFocus] = useState<string[]>([]);

  // Saving
  const [saving, setSaving] = useState(false);

  const displayNameVal = displayName || user?.email?.split("@")[0] || "there";
  const initials = displayNameVal.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const goTo = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const next = () => goTo(Math.min(step + 1, STEPS.length - 1));
  const prev = () => goTo(Math.max(step - 1, 0));

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid file type", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large (max 2MB)", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(`${publicUrl}?t=${Date.now()}`);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [user, toast]);

  const saveProfileAndContinue = async () => {
    if (!user) { next(); return; }
    setSaving(true);
    try {
      await supabase.from("profiles").update({
        display_name: displayName.trim().slice(0, 100) || null,
        bio: bio.trim().slice(0, 160) || null,
        avatar_url: avatarUrl || null,
      } as any).eq("id", user.id);
    } catch { /* ignore */ }
    setSaving(false);
    next();
  };

  const saveFocusAndContinue = () => {
    if (focus.length > 0) localStorage.setItem(FOCUS_KEY, JSON.stringify(focus));
    next();
  };

  const complete = () => {
    localStorage.setItem(WIZARD_KEY, "1");
    navigate("/dashboard", { replace: true });
  };

  const skip = () => {
    localStorage.setItem(WIZARD_KEY, "1");
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">T</span>
          </div>
          <span className="font-display text-lg font-bold tracking-tight">Temerio</span>
        </div>
        <Button variant="ghost" size="sm" onClick={skip} className="text-muted-foreground">
          Skip setup
        </Button>
      </div>

      {/* Step indicator */}
      <div className="flex justify-center px-6 pt-2 pb-6">
        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <button
                onClick={() => i < step && goTo(i)}
                disabled={i > step}
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                  i < step && "bg-primary text-primary-foreground",
                  i === step && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  i > step && "bg-muted text-muted-foreground",
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </button>
              {i < STEPS.length - 1 && (
                <div className={cn("h-0.5 w-8 rounded-full transition-colors duration-300", i < step ? "bg-primary" : "bg-border")} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-6 pb-12">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {step === 0 && (
                <StepWelcome name={displayNameVal} onNext={next} />
              )}
              {step === 1 && (
                <StepProfile
                  displayName={displayName}
                  setDisplayName={setDisplayName}
                  bio={bio}
                  setBio={setBio}
                  avatarUrl={avatarUrl}
                  initials={initials}
                  uploading={uploading}
                  saving={saving}
                  fileRef={fileRef}
                  onUpload={handleAvatarUpload}
                  onNext={saveProfileAndContinue}
                  onSkip={next}
                />
              )}
              {step === 2 && (
                <StepFocus focus={focus} setFocus={setFocus} onNext={saveFocusAndContinue} onSkip={next} />
              )}
              {step === 3 && (
                <StepTour onNext={next} />
              )}
              {step === 4 && (
                <StepReady onComplete={complete} />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Back button (not on first/last step) */}
          {step > 0 && step < STEPS.length - 1 && (
            <div className="mt-6 flex justify-center">
              <Button variant="ghost" size="sm" onClick={prev}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Step Components ─── */

function StepWelcome({ name, onNext }: { name: string; onNext: () => void }) {
  return (
    <div className="text-center space-y-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mx-auto rounded-full bg-primary/10 p-5 w-fit"
      >
        <Sparkles className="h-10 w-10 text-primary" />
      </motion.div>
      <div className="space-y-2">
        <h2>Welcome, {name}!</h2>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Temerio helps you organize, create, and collaborate — powered by AI. Let's set things up in under a minute.
        </p>
      </div>
      <Button size="xl" onClick={onNext}>
        Let's get started <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function StepProfile({
  displayName, setDisplayName, bio, setBio, avatarUrl, initials,
  uploading, saving, fileRef, onUpload, onNext, onSkip,
}: {
  displayName: string; setDisplayName: (v: string) => void;
  bio: string; setBio: (v: string) => void;
  avatarUrl: string; initials: string;
  uploading: boolean; saving: boolean;
  fileRef: React.RefObject<HTMLInputElement>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNext: () => void; onSkip: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3>Complete your profile</h3>
        <p className="text-muted-foreground">Let others know who you are.</p>
      </div>

      <div className="flex justify-center">
        <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
          <Avatar className="h-24 w-24">
            {avatarUrl && <AvatarImage src={avatarUrl} />}
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-foreground/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {uploading ? <Loader2 className="h-6 w-6 animate-spin text-background" /> : <Camera className="h-6 w-6 text-background" />}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={onUpload} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="wiz-name">Display Name</Label>
          <Input id="wiz-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={100} placeholder="Your name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wiz-bio">Bio <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Textarea id="wiz-bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} placeholder="A short bio" rows={2} />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onSkip}>Skip</Button>
        <Button className="flex-1" onClick={onNext} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function StepFocus({ focus, setFocus, onNext, onSkip }: {
  focus: string[]; setFocus: (v: string[]) => void;
  onNext: () => void; onSkip: () => void;
}) {
  const toggle = (id: string) =>
    setFocus(focus.includes(id) ? focus.filter((f) => f !== id) : [...focus, id]);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3>What's your focus?</h3>
        <p className="text-muted-foreground">Select all that apply — we'll personalize your experience.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {FOCUS_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => toggle(opt.id)}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200",
              focus.includes(opt.id)
                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                : "border-border hover:border-primary/30 hover:bg-muted/50",
            )}
          >
            <div className={cn(
              "rounded-lg p-2 shrink-0 transition-colors",
              focus.includes(opt.id) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
            )}>
              <opt.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-sm">{opt.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onSkip}>Skip</Button>
        <Button className="flex-1" onClick={onNext}>
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function StepTour({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3>Here's what you can do</h3>
        <p className="text-muted-foreground">A quick look at key features.</p>
      </div>

      <div className="space-y-3">
        {TOUR_FEATURES.map((feat, i) => (
          <motion.div
            key={feat.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            className="flex items-start gap-4 rounded-xl border p-4"
          >
            <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
              <feat.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{feat.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{feat.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <Button className="w-full" size="lg" onClick={onNext}>
        Almost done <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function StepReady({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="text-center space-y-6">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
        className="mx-auto rounded-full bg-success/10 p-5 w-fit"
      >
        <PartyPopper className="h-10 w-10 text-success" />
      </motion.div>
      <div className="space-y-2">
        <h2>You're all set!</h2>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Your account is ready. Dive into your dashboard and start building something great.
        </p>
      </div>

      <Button size="xl" onClick={onComplete}>
        Go to Dashboard <ArrowRight className="h-4 w-4" />
      </Button>

      <div className="flex flex-wrap justify-center gap-4 text-sm">
        <a href="/docs" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" /> Read the Docs
        </a>
        <a href="/features" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5" /> Explore Features
        </a>
        <a href="#" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" /> Get Help
        </a>
      </div>
    </div>
  );
}
