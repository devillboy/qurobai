import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
 import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
 import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import { LandingPage } from "@/components/LandingPage";
import Subscribe from "@/pages/Subscribe";
import AdminPanel from "@/pages/AdminPanel";
import SubscriptionHistory from "@/pages/SubscriptionHistory";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import Security from "@/pages/Security";
import NotFound from "@/pages/NotFound";
import ApiAccess from "@/pages/ApiAccess";
import { HelmetProvider } from "react-helmet-async";
 import { SplashScreen } from "@/components/SplashScreen";

const queryClient = new QueryClient();

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/welcome" replace />;
  }
  
  return <>{children}</>;
};

// Public route - redirects to chat if logged in
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/chat" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/welcome" replace />} />
      <Route path="/welcome" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/subscribe" element={<ProtectedRoute><Subscribe /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
      <Route path="/subscription-history" element={<ProtectedRoute><SubscriptionHistory /></ProtectedRoute>} />
      <Route path="/api-access" element={<ProtectedRoute><ApiAccess /></ProtectedRoute>} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/security" element={<Security />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
   const [showSplash, setShowSplash] = useState(true);
 
   // Only show splash on initial app load (not route changes)
   useEffect(() => {
     const hasSeenSplash = sessionStorage.getItem("qurobai_splash_shown");
     if (hasSeenSplash) {
       setShowSplash(false);
     }
   }, []);
 
   const handleSplashComplete = () => {
     setShowSplash(false);
     sessionStorage.setItem("qurobai_splash_shown", "true");
   };
 
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
