
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { SessionProvider } from './contexts/SessionContext';
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
import BackupManager from './pages/BackupManager/Index';
import SecurityDashboard from './pages/Security/Index';
import SystemCheck from './components/SystemCheck';
import PublicClientForm from './pages/PublicClientForm';
import PublicMoverForm from './pages/PublicMoverForm';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SessionProvider>
          <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/public-client/:token" element={<PublicClientForm />} />
            <Route path="/public-mover/:token" element={<PublicMoverForm />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <SystemCheck>
                    <>
                      <Header />
                      <main className="pt-2">
                        <Index />
                      </main>
                    </>
                  </SystemCheck>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pricing-tool"
              element={
                <ProtectedRoute>
                  <SystemCheck>
                    <>
                      <Header />
                      <main className="pt-2">
                        <PricingTool />
                      </main>
                    </>
                  </SystemCheck>
                </ProtectedRoute>
              }
            />
            <Route
              path="/volume-calculator"
              element={
                <ProtectedRoute>
                  <SystemCheck>
                    <>
                      <Header />
                      <main className="pt-2">
                        <VolumeCalculator />
                      </main>
                    </>
                  </SystemCheck>
                </ProtectedRoute>
              }
            />
            <Route
              path="/truck-optimizer"
              element={
                <ProtectedRoute>
                  <SystemCheck>
                    <>
                      <Header />
                      <main className="pt-2">
                        <TruckOptimizer />
                      </main>
                    </>
                  </SystemCheck>
                </ProtectedRoute>
              }
            />
            <Route
              path="/backup-manager"
              element={
                <ProtectedRoute>
                  <SystemCheck>
                    <BackupManager />
                  </SystemCheck>
                </ProtectedRoute>
              }
            />
            <Route path="/security" element={<SecurityDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          </div>
        </SessionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
