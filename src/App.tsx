import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import { Toaster } from '@/components/ui/toaster';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import PricingTool from './pages/PricingTool';
import VolumeCalculator from './pages/VolumeCalculator/Index';
import TruckOptimizer from './pages/TruckOptimizer/Index';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="pt-16">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
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
            <Route path="/volume-calculator" element={<VolumeCalculator />} />
            <Route path="/truck-optimizer" element={<TruckOptimizer />} />
          </Routes>
        </main>
        <Toaster />
      </div>
    </AuthProvider>
  );
}

export default App;
