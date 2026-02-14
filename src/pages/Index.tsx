import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            Temerio
          </span>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm">Docs</Button>
            <Button variant="ghost" size="sm">Pricing</Button>
            <Button size="sm">Get Started</Button>
          </nav>
        </div>
      </header>

      <main className="container py-16 space-y-20">
        {/* Hero */}
        <section className="text-center space-y-6 animate-fade-in">
          <Badge variant="info" className="mx-auto">Design System v1.0</Badge>
          <h1 className="max-w-2xl mx-auto">
            Temerio Design System
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            A professional, consistent foundation for building modern B2B SaaS applications.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button size="xl">Start Building</Button>
            <Button variant="outline" size="xl">View Components</Button>
          </div>
        </section>

        <Separator />

        {/* Color Palette */}
        <section className="space-y-6">
          <h2>Color Palette</h2>
          <p className="text-muted-foreground">Semantic colors for consistent UI.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: "Primary", cls: "bg-primary text-primary-foreground" },
              { name: "Secondary", cls: "bg-secondary text-secondary-foreground" },
              { name: "Muted", cls: "bg-muted text-muted-foreground" },
              { name: "Accent", cls: "bg-accent text-accent-foreground" },
              { name: "Destructive", cls: "bg-destructive text-destructive-foreground" },
              { name: "Success", cls: "bg-success text-success-foreground" },
              { name: "Warning", cls: "bg-warning text-warning-foreground" },
              { name: "Info", cls: "bg-info text-info-foreground" },
              { name: "Background", cls: "bg-background text-foreground border" },
              { name: "Card", cls: "bg-card text-card-foreground border" },
              { name: "Foreground", cls: "bg-foreground text-background" },
              { name: "Border", cls: "bg-border text-foreground" },
            ].map((c) => (
              <div key={c.name} className={`rounded-xl p-4 text-sm font-medium ${c.cls}`}>
                {c.name}
              </div>
            ))}
          </div>
        </section>

        <Separator />

        {/* Typography */}
        <section className="space-y-6">
          <h2>Typography</h2>
          <p className="text-muted-foreground">Plus Jakarta Sans for headings, Inter for body text.</p>
          <div className="space-y-4">
            <h1>Heading 1 — Bold Display</h1>
            <h2>Heading 2 — Section Title</h2>
            <h3>Heading 3 — Subsection</h3>
            <h4>Heading 4 — Card Title</h4>
            <h5>Heading 5 — Label</h5>
            <h6>Heading 6 — Small Label</h6>
            <p className="text-lg">Body Large — For introductions and lead paragraphs.</p>
            <p>Body Base — The default text size for readable content across the interface.</p>
            <p className="text-sm text-muted-foreground">Body Small — Secondary information and captions.</p>
          </div>
        </section>

        <Separator />

        {/* Buttons */}
        <section className="space-y-6">
          <h2>Buttons</h2>
          <p className="text-muted-foreground">Multiple variants and sizes for every context.</p>

          <div className="space-y-4">
            <h4>Variants</h4>
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="success">Success</Button>
              <Button variant="link">Link</Button>
            </div>

            <h4>Sizes</h4>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="xl">Extra Large</Button>
            </div>
          </div>
        </section>

        <Separator />

        {/* Badges */}
        <section className="space-y-6">
          <h2>Badges</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </section>

        <Separator />

        {/* Cards */}
        <section className="space-y-6">
          <h2>Cards</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Track your key metrics in real-time.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-display">12,489</div>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="text-success font-medium">+14.2%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage your team and permissions.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-display">24</div>
                <p className="text-sm text-muted-foreground mt-1">Across 4 departments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue</CardTitle>
                <CardDescription>Monthly recurring revenue.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-display">$48.2K</div>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="text-success font-medium">+8.1%</span> growth
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Form Inputs */}
        <section className="space-y-6">
          <h2>Form Inputs</h2>
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Create Account</CardTitle>
              <CardDescription>Get started with Temerio today.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="john@company.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Create Account</Button>
            </CardFooter>
          </Card>
        </section>

        <Separator />

        {/* Spacing & Radius */}
        <section className="space-y-6">
          <h2>Spacing & Radius</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h4>Spacing Scale</h4>
              {[4, 8, 12, 16, 24, 32, 48, 64].map((s) => (
                <div key={s} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-12">{s}px</span>
                  <div
                    className="bg-primary/20 rounded"
                    style={{ width: `${s * 2}px`, height: "16px" }}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h4>Border Radius</h4>
              <div className="flex flex-wrap gap-4">
                {["sm", "md", "lg", "xl", "2xl", "full"].map((r) => (
                  <div key={r} className="text-center space-y-2">
                    <div className={`w-16 h-16 bg-primary/15 border-2 border-primary/30 rounded-${r}`} />
                    <span className="text-xs text-muted-foreground">{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Shadows */}
        <section className="space-y-6">
          <h2>Shadows</h2>
          <div className="flex flex-wrap gap-6">
            {["xs", "sm", "md", "lg", "xl"].map((s) => (
              <div key={s} className={`w-28 h-28 bg-card rounded-xl flex items-center justify-center shadow-${s}`}>
                <span className="text-sm text-muted-foreground">{s}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container text-center text-sm text-muted-foreground">
          Temerio Design System — Built for modern B2B SaaS
        </div>
      </footer>
    </div>
  );
};

export default Index;
