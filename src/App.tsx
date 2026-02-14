import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
const TimelinePage = lazy(() => import("./pages/TimelinePage"));
const UploadPage = lazy(() => import("./pages/UploadPage"));
const ReviewPage = lazy(() => import("./pages/ReviewPage"));
const PeoplePage = lazy(() => import("./pages/PeoplePage"));
const UsagePage = lazy(() => import("./pages/UsagePage"));
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
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

            {/* Protected app routes with sidebar */}
            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/timeline" element={<TimelinePage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/review" element={<ReviewPage />} />
              <Route path="/people" element={<PeoplePage />} />
              <Route path="/usage" element={<UsagePage />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Legacy dashboard redirect */}
            <Route path="/dashboard" element={<Navigate to="/timeline" replace />} />
            <Route path="/dashboard/*" element={<Navigate to="/timeline" replace />} />

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
