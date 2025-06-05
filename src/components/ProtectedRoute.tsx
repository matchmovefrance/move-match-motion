
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();

  // Show loading for a reasonable time but don't block indefinitely
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

  // For admin user, always allow access
  if (user.email === 'contact@matchmove.fr') {
    return <>{children}</>;
  }

  // If we have specific role requirements, check them
  if (allowedRoles && allowedRoles.length > 0) {
    if (!profile) {
      // If no profile but user exists, allow access with default permissions
      console.warn('No profile found for authenticated user, allowing access with default permissions');
      return <>{children}</>;
    }
    
    if (!allowedRoles.includes(profile.role)) {
      return <Navigate to="/" replace />;
    }
  }

  // Allow access - user is authenticated
  return <>{children}</>;
};

export default ProtectedRoute;
