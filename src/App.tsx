import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageLayout } from "@/components/layout/PageLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { PageLoader } from "@/components/LoadingStates";

// Lazy-loaded routes
const Index = lazy(() => import("./pages/Index"));
const Features = lazy(() => import("./pages/Features"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Docs = lazy(() => import("./pages/Docs"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardPlaceholder = lazy(() => import("./pages/DashboardPlaceholder"));
const Library = lazy(() => import("./pages/Library"));
const Settings = lazy(() => import("./pages/Settings"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Cookies = lazy(() => import("./pages/Cookies"));
const Impressum = lazy(() => import("./pages/Impressum"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Wizard = lazy(() => import("./pages/Wizard"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminCreditSettings = lazy(() => import("./pages/admin/AdminCreditSettings"));
const AdminSystem = lazy(() => import("./pages/admin/AdminSystem"));
const ActivityPage = lazy(() => import("./pages/ActivityPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 min
      gcTime: 10 * 60 * 1000,         // 10 min
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public pages */}
            <Route element={<PageLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/features" element={<Features />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/cookies" element={<Cookies />} />
              <Route path="/impressum" element={<Impressum />} />
            </Route>

            {/* Auth & Onboarding */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/wizard" element={<ProtectedRoute><Wizard /></ProtectedRoute>} />

            {/* Admin panel */}
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="credits" element={<AdminCreditSettings />} />
              <Route path="system" element={<AdminSystem />} />
            </Route>

            {/* Protected dashboard */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="library" element={<Library />} />
              <Route path="analytics" element={<DashboardPlaceholder />} />
              <Route path="customers" element={<DashboardPlaceholder />} />
              <Route path="reports" element={<DashboardPlaceholder />} />
              <Route path="settings" element={<Settings />} />
              <Route path="notifications" element={<DashboardPlaceholder />} />
              <Route path="activity" element={<ActivityPage />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </ErrorBoundary>
          <CookieConsentBanner />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
