import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, Settings, LogOut, LayoutDashboard, Sparkles, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Docs", to: "/docs" },
];

export function Header() {
  const { user, profile, signOut } = useAuth();
  const { isSubscribed } = useSubscription();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const isLoggedIn = !!user;
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-200",
        scrolled
          ? "bg-background/80 backdrop-blur-lg border-border shadow-sm"
          : "bg-background/95 backdrop-blur-sm border-transparent"
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">T</span>
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-foreground">Temerio</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === "/"} className="px-3 py-2 text-sm font-medium text-muted-foreground rounded-md transition-colors hover:text-foreground hover:bg-accent" activeClassName="text-foreground bg-accent">
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {isLoggedIn ? (
            <>
              {!isSubscribed && (
                <Button variant="outline" size="sm" asChild className="border-primary/30 text-primary hover:bg-primary/5">
                  <Link to="/pricing"><ArrowUpRight className="h-3.5 w-3.5 mr-1" /> Upgrade</Link>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 pl-2 pr-3">
                    <Avatar className="h-7 w-7">
                      {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{displayName}</span>
                    {isSubscribed && <Badge variant="success" className="text-2xs">Pro</Badge>}
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center gap-2"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings" className="flex items-center gap-2"><Settings className="h-4 w-4" /> Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 text-destructive">
                  <LogOut className="h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/auth">Sign In</Link></Button>
              <Button size="sm" asChild><Link to="/auth?tab=signup">Get Started</Link></Button>
            </>
          )}
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-background animate-fade-in">
          <nav className="container py-4 space-y-1">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.to === "/"} className="block px-3 py-2.5 text-sm font-medium text-muted-foreground rounded-md transition-colors hover:text-foreground hover:bg-accent" activeClassName="text-foreground bg-accent">
                {link.label}
              </NavLink>
            ))}
            <div className="pt-3 border-t mt-3 space-y-2">
              {isLoggedIn ? (
                <>
                  <Button variant="ghost" className="w-full justify-start gap-2" asChild><Link to="/dashboard"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link></Button>
                  <Button variant="ghost" className="w-full justify-start gap-2" asChild><Link to="/dashboard/settings"><Settings className="h-4 w-4" /> Settings</Link></Button>
                  <Button variant="ghost" className="w-full justify-start gap-2 text-destructive" onClick={signOut}><LogOut className="h-4 w-4" /> Sign Out</Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="w-full" asChild><Link to="/auth">Sign In</Link></Button>
                  <Button className="w-full" asChild><Link to="/auth?tab=signup">Get Started</Link></Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
