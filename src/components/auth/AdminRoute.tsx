import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ShieldX } from "lucide-react";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?redirect=/admin" replace />;
  }

  if (role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <ShieldX className="h-12 w-12 text-destructive mx-auto" />
          <h3>Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to access this area.</p>
          <a href="/dashboard" className="inline-block text-primary underline underline-offset-4 hover:text-primary/80">
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
