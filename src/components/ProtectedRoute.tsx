
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

  if (!user) {
    console.log('❌ No user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Admin users have always access
  if (profile && profile.role === 'admin') {
    console.log('👑 Admin user detected, allowing access');
    return <>{children}</>;
  }

  if (!profile) {
    console.log('⏳ Waiting for profile to load...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(profile.role)) {
      console.log('❌ User role not allowed:', profile.role, 'required:', allowedRoles);
      return <Navigate to="/" replace />;
    }
  }

  console.log('✅ User authenticated, allowing access');
  return <>{children}</>;
};

export default ProtectedRoute;
