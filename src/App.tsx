import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import GpaCalculator from "./pages/GpaCalculator";
import UniversityMatch from "./pages/UniversityMatch";
import DocumentGenerator from "./pages/DocumentGenerator";
import Profile from "./pages/Profile";
import ApplicationTimeline from "./pages/ApplicationTimeline";
import RecommendationManager from "./pages/RecommendationManager";
import ApplicationChecklist from "./pages/ApplicationChecklist";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/gpa-calculator" element={<ProtectedRoute><GpaCalculator /></ProtectedRoute>} />
            <Route path="/university-match" element={<ProtectedRoute><UniversityMatch /></ProtectedRoute>} />
            <Route path="/document-generator" element={<ProtectedRoute><DocumentGenerator /></ProtectedRoute>} />
            <Route path="/application-timeline" element={<ProtectedRoute><ApplicationTimeline /></ProtectedRoute>} />
            <Route path="/recommendations" element={<ProtectedRoute><RecommendationManager /></ProtectedRoute>} />
            <Route path="/checklist" element={<ProtectedRoute><ApplicationChecklist /></ProtectedRoute>} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
