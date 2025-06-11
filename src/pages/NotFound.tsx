
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-md px-6">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page non trouvée</h2>
          <p className="text-gray-600 mb-6">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md mb-6">
            URL demandée: <code className="font-mono">{location.pathname}</code>
          </div>
        </div>
        
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Retourner au tableau de bord
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link to="/auth">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Page de connexion
            </Link>
          </Button>
        </div>

        <p className="text-xs text-gray-400 mt-8">
          Si le problème persiste, contactez l'administrateur
        </p>
      </div>
    </div>
  );
};

export default NotFound;
