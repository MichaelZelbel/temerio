import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PageLayout } from "@/components/layout/PageLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import Index from "./pages/Index";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Docs from "./pages/Docs";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardPlaceholder from "./pages/DashboardPlaceholder";
import Settings from "./pages/Settings";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import Impressum from "./pages/Impressum";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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

            {/* Auth */}
            <Route path="/auth" element={<Auth />} />

            {/* Protected dashboard */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="analytics" element={<DashboardPlaceholder />} />
              <Route path="customers" element={<DashboardPlaceholder />} />
              <Route path="reports" element={<DashboardPlaceholder />} />
              <Route path="settings" element={<Settings />} />
              <Route path="notifications" element={<DashboardPlaceholder />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieConsentBanner />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
