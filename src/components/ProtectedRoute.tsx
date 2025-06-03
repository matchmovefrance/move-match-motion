
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();

  // Show loading only for a short time
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // If no user, redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // For admin user, always allow access even without profile
  if (user.email === 'contact@matchmove.fr') {
    return <>{children}</>;
  }

  // If we have specific role requirements, check them
  if (allowedRoles && allowedRoles.length > 0) {
    if (!profile) {
      // No profile yet, but user is authenticated - redirect to auth to reload
      return <Navigate to="/auth" replace />;
    }
    
    if (!allowedRoles.includes(profile.role)) {
      return <Navigate to="/" replace />;
    }
  }

  // Allow access - user is authenticated and either no role requirements or role matches
  return <>{children}</>;
};

export default ProtectedRoute;
