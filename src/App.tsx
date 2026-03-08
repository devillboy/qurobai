import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import { LandingPage } from "@/components/LandingPage";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import Security from "@/pages/Security";
import NotFound from "@/pages/NotFound";
import { HelmetProvider } from "react-helmet-async";
import { SplashScreen } from "@/components/SplashScreen";
import { WhatsNewPopup } from "@/components/WhatsNewPopup";
import { MaintenancePage } from "@/components/MaintenancePage";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";

// Lazy loaded pages
const Subscribe = lazy(() => import("@/pages/Subscribe"));
const AdminPanel = lazy(() => import("@/pages/AdminPanel"));
const SubscriptionHistory = lazy(() => import("@/pages/SubscriptionHistory"));
const ApiAccess = lazy(() => import("@/pages/ApiAccess"));
const DownloadPage = lazy(() => import("@/pages/Download"));
const Qurobs = lazy(() => import("@/pages/Qurobs"));
const PatchUpdates = lazy(() => import("@/pages/PatchUpdates"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="relative">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/chat" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isMaintenance, maintenanceMessage, loading: maintenanceLoading } = useMaintenanceMode();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").then(({ data }) => {
        setIsAdmin(!!(data && data.length > 0));
      });
    }
  }, [user]);

  if (maintenanceLoading) return <PageLoader />;
  if (isMaintenance && !isAdmin) return <MaintenancePage message={maintenanceMessage} endsAt={endsAt} />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/welcome" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Index /></ProtectedRoute>} />
        <Route path="/subscribe" element={<ProtectedRoute><Subscribe /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
        <Route path="/subscription-history" element={<ProtectedRoute><SubscriptionHistory /></ProtectedRoute>} />
        <Route path="/api-access" element={<ProtectedRoute><ApiAccess /></ProtectedRoute>} />
        <Route path="/qurobs" element={<ProtectedRoute><Qurobs /></ProtectedRoute>} />
        <Route path="/patch-updates" element={<PatchUpdates />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/security" element={<Security />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem("qurobai_splash_shown");
  });

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    sessionStorage.setItem("qurobai_splash_shown", "true");
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <TooltipProvider>
              <AppRoutes />
              <WhatsNewPopup />
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
