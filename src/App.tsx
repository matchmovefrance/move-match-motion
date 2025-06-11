
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Index from './pages/Index';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';
import PublicMoverForm from './pages/PublicMoverForm';
// Import the PricingTool using React.lazy()
const PricingTool = React.lazy(() => import('./pages/PricingTool/Index'));

// Configure React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <React.Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading...</div>}>
            <Routes>
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              {/* Redirect /dashboard to / for compatibility */}
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/public-mover/:token" element={<PublicMoverForm />} />
              <Route path="/pricing-tool" element={<ProtectedRoute><PricingTool /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </React.Suspense>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
