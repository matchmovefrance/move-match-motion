
import { AuthProvider } from './contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/Header';
import { Toaster } from '@/components/ui/toaster';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import Index from './pages/Index';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import PricingTool from './pages/PricingTool/Index';
import VolumeCalculator from './pages/VolumeCalculator/Index';
import TruckOptimizer from './pages/TruckOptimizer/Index';
import PublicMoverForm from './pages/PublicMoverForm';

// Créer une instance de QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/public-mover/:token" element={<PublicMoverForm />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <>
                      <Header />
                      <main className="pt-16">
                        <Index />
                      </main>
                    </>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pricing-tool"
                element={
                  <ProtectedRoute>
                    <>
                      <Header />
                      <main className="pt-16">
                        <PricingTool />
                      </main>
                    </>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/volume-calculator"
                element={
                  <ProtectedRoute>
                    <>
                      <Header />
                      <main className="pt-16">
                        <VolumeCalculator />
                      </main>
                    </>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/truck-optimizer"
                element={
                  <ProtectedRoute>
                    <>
                      <Header />
                      <main className="pt-16">
                        <TruckOptimizer />
                      </main>
                    </>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
