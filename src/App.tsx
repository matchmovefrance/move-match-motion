
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import { Toaster } from '@/components/ui/toaster';
import { Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import PricingTool from './pages/PricingTool/Index';
import VolumeCalculator from './pages/VolumeCalculator/Index';
import TruckOptimizer from './pages/TruckOptimizer/Index';
import PublicClientForm from './pages/PublicClientForm';
import PublicMoverForm from './pages/PublicMoverForm';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/public-client/:token" element={<PublicClientForm />} />
            <Route path="/public-mover/:token" element={<PublicMoverForm />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <>
                    <Header />
                    <main className="pt-4">
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
                    <main className="pt-4">
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
                    <main className="pt-4">
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
                    <main className="pt-4">
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
  );
}

export default App;
