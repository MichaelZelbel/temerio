import { Outlet, Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Calendar, Upload, ClipboardCheck, Users, Zap, Settings, ArrowUpRight, Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useSubscription } from "@/hooks/useSubscription";
import { useFirstRunSeed } from "@/hooks/useFirstRunSeed";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger, SidebarInset,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";

const mainNav = [
  { label: "Timeline", to: "/timeline", icon: Calendar },
  { label: "Upload", to: "/upload", icon: Upload },
  { label: "Review", to: "/review", icon: ClipboardCheck },
  { label: "People", to: "/people", icon: Users },
  { label: "Usage", to: "/usage", icon: Zap },
];

const settingsNav = [
  { label: "Settings", to: "/settings", icon: Settings },
];

export function DashboardLayout() {
  useFirstRunSeed();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <DashboardSidebar />
        <SidebarInset>
          <header className="flex h-14 items-center gap-3 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-5" />
            <div className="flex-1" />
            <ThemeToggle />
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Back to site</Link>
          </header>
          <div className="flex-1 p-6">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function DashboardSidebar() {
  const { user, profile, role } = useAuth();
  const { isSubscribed } = useSubscription();
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link to="/timeline" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary-foreground">T</span>
          </div>
          <span className="font-display text-lg font-bold tracking-tight truncate">Temerio</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>App</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild tooltip={item.label}>
                    <NavLink to={item.to} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNav.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild tooltip={item.label}>
                    <NavLink to={item.to} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!isSubscribed && (
          <div className="px-3 mt-2">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 border-primary/30 text-primary hover:bg-primary/5" asChild>
              <Link to="/pricing">
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>Upgrade</span>
              </Link>
            </Button>
          </div>
        )}
        {role === "admin" && (
          <div className="px-3 mt-2">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 border-destructive/30 text-destructive hover:bg-destructive/5" asChild>
              <Link to="/admin">
                <Shield className="h-3.5 w-3.5" />
                <span>Admin</span>
              </Link>
            </Button>
          </div>
        )}
      </SidebarContent>

      <div className="mt-auto border-t p-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 shrink-0">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
