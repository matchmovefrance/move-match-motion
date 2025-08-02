import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Wrench, Lock } from 'lucide-react';

interface SystemState {
  maintenance_mode: boolean;
  kill_switch_active: boolean;
  encryption_enabled: boolean;
}

const SystemCheck: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSystemState();
    
    // Vérifier l'état toutes les 30 secondes
    const interval = setInterval(checkSystemState, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const checkSystemState = async () => {
    try {
      const { data, error } = await supabase
        .from('system_control')
        .select('maintenance_mode, kill_switch_active, encryption_enabled')
        .single();

      if (error) {
        console.error('Error checking system state:', error);
        return;
      }

      setSystemState(data);
    } catch (error) {
      console.error('System check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToSecurityDashboard = () => {
    window.open('/security', '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Vérification du système...</p>
        </div>
      </div>
    );
  }

  // Kill Switch activé - arrêt complet
  if (systemState?.kill_switch_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-900 mb-4">
            Système en Arrêt d'Urgence
          </h1>
          <p className="text-red-700 mb-6">
            L'application a été arrêtée par mesure de sécurité. 
            Seul l'administrateur peut la redémarrer.
          </p>
          <Button onClick={goToSecurityDashboard} className="bg-red-600 hover:bg-red-700">
            <Lock className="w-4 h-4 mr-2" />
            Accès Administrateur
          </Button>
        </div>
      </div>
    );
  }

  // Mode maintenance activé
  if (systemState?.maintenance_mode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yellow-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wrench className="w-10 h-10 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-yellow-900 mb-4">
            Maintenance en Cours
          </h1>
          <p className="text-yellow-700 mb-6">
            L'application est temporairement indisponible pour maintenance. 
            Veuillez réessayer dans quelques instants.
          </p>
          <Button onClick={goToSecurityDashboard} variant="outline">
            <Lock className="w-4 h-4 mr-2" />
            Accès Administrateur
          </Button>
        </div>
      </div>
    );
  }

  // Chiffrement activé - afficher un avertissement
  if (systemState?.encryption_enabled) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Alert className="m-4 border-orange-200 bg-orange-50">
          <Lock className="h-4 w-4" />
          <AlertDescription className="text-orange-800">
            <strong>Mode Chiffrement Activé:</strong> Les données sont actuellement chiffrées. 
            Certaines fonctionnalités peuvent être limitées.
          </AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }

  // Système normal
  return <>{children}</>;
};

export default SystemCheck;