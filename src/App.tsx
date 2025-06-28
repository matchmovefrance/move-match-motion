
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import PricingTool from "./pages/PricingTool/Index";
import VolumeCalculator from "./pages/VolumeCalculator/Index";
import TruckOptimizer from "./pages/TruckOptimizer/Index";
import PublicClientForm from "./pages/PublicClientForm";
import PublicMoverForm from "./pages/PublicMoverForm";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/public/client/:token" element={<PublicClientForm />} />
            <Route path="/public/mover/:token" element={<PublicMoverForm />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pricing-tool"
              element={
                <ProtectedRoute>
                  <PricingTool />
                </ProtectedRoute>
              }
            />
            <Route
              path="/volume-calculator"
              element={
                <ProtectedRoute>
                  <VolumeCalculator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/truck-optimizer"
              element={
                <ProtectedRoute>
                  <TruckOptimizer />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
