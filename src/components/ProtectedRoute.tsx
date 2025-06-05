
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();

  console.log('🛡️ ProtectedRoute check:', {
    loading,
    userEmail: user?.email,
    profileRole: profile?.role,
    allowedRoles
  });

  // Show loading state with timeout
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // If no user, redirect to auth
  if (!user) {
    console.log('❌ No user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Admin users always have access
  if (user.email === 'contact@matchmove.fr' || user.email === 'mehdi@matchmove.fr') {
    console.log('👑 Admin user detected, allowing access');
    return <>{children}</>;
  }

  // For other users, wait for profile to load but with a reasonable timeout
  if (!profile) {
    console.log('⏳ Waiting for profile to load...');
    // If we've been waiting too long, show an error or redirect
    setTimeout(() => {
      if (!profile) {
        console.log('⏰ Profile loading timeout, redirecting to auth');
        window.location.href = '/auth';
      }
    }, 10000);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  // Check role requirements if specified
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(profile.role)) {
      console.log('❌ User role not allowed:', profile.role, 'required:', allowedRoles);
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Allow access for authenticated users
  console.log('✅ User authenticated, allowing access');
  return <>{children}</>;
};

export default ProtectedRoute;
