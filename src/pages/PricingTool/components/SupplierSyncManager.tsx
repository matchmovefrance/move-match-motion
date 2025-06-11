
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, CheckCircle, AlertCircle, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface SyncStats {
  totalProviders: number;
  syncedSuppliers: number;
  newSuppliers: number;
  duplicates: number;
}

const SupplierSyncManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);

  // Récupérer les prestataires de services
  const { data: serviceProviders, isLoading } = useQuery({
    queryKey: ['service-providers-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .order('company_name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Récupérer les fournisseurs existants
  const { data: existingSuppliers } = useQuery({
    queryKey: ['suppliers-sync'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });

  const syncSuppliers = async () => {
    if (!serviceProviders || !user) return;

    setIsSyncing(true);
    setSyncProgress(0);
    
    try {
      console.log('🔄 Début de la synchronisation des fournisseurs...');
      
      const stats: SyncStats = {
        totalProviders: serviceProviders.length,
        syncedSuppliers: 0,
        newSuppliers: 0,
        duplicates: 0
      };

      // Grouper les prestataires par email pour éviter les doublons
      const uniqueProviders = new Map();
      serviceProviders.forEach(provider => {
        const key = provider.email.toLowerCase();
        if (!uniqueProviders.has(key)) {
          uniqueProviders.set(key, provider);
        } else {
          stats.duplicates++;
        }
      });

      const providersToSync = Array.from(uniqueProviders.values());
      console.log(`📊 ${providersToSync.length} prestataires uniques à synchroniser`);

      for (let i = 0; i < providersToSync.length; i++) {
        const provider = providersToSync[i];
        
        // Vérifier si le fournisseur existe déjà
        const existingSupplier = existingSuppliers?.find(
          s => s.email.toLowerCase() === provider.email.toLowerCase()
        );

        if (existingSupplier) {
          // Mettre à jour les informations existantes
          const { error } = await supabase
            .from('suppliers')
            .update({
              company_name: provider.company_name,
              contact_name: provider.name,
              phone: provider.phone,
              address: provider.address,
              city: provider.city,
              postal_code: provider.postal_code,
              service_provider_id: provider.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingSupplier.id);

          if (error) throw error;
          stats.syncedSuppliers++;
        } else {
          // Créer un nouveau fournisseur
          const { error } = await supabase
            .from('suppliers')
            .insert({
              company_name: provider.company_name,
              contact_name: provider.name,
              email: provider.email,
              phone: provider.phone,
              address: provider.address,
              city: provider.city,
              postal_code: provider.postal_code,
              service_provider_id: provider.id,
              is_active: true,
              priority_level: 1,
              created_by: user.id,
              performance_metrics: {
                total_bids: 0,
                acceptance_rate: 0,
                avg_response_time: 0
              }
            });

          if (error) throw error;
          stats.newSuppliers++;
        }

        // Mettre à jour la progression
        setSyncProgress(Math.round(((i + 1) / providersToSync.length) * 100));
      }

      setSyncStats(stats);
      
      // Invalider les caches pour forcer le rafraîchissement
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-stats'] });

      console.log('✅ Synchronisation terminée:', stats);
      
      toast({
        title: "Synchronisation réussie",
        description: `${stats.newSuppliers} nouveaux fournisseurs créés, ${stats.syncedSuppliers} mis à jour`,
      });

    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de synchroniser les fournisseurs",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Chargement des prestataires...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-blue-500" />
          Synchronisation des fournisseurs
        </CardTitle>
        <CardDescription>
          Synchronisez automatiquement les prestataires de services vers les fournisseurs du pricing tool
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {serviceProviders?.length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Prestataires total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {existingSuppliers?.length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Fournisseurs actuel</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {syncStats?.newSuppliers || 0}
            </div>
            <div className="text-sm text-muted-foreground">Nouveaux créés</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {syncStats?.duplicates || 0}
            </div>
            <div className="text-sm text-muted-foreground">Doublons évités</div>
          </div>
        </div>

        {/* Progression */}
        {isSyncing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Synchronisation en cours...</span>
              <span>{syncProgress}%</span>
            </div>
            <Progress value={syncProgress} className="w-full" />
          </div>
        )}

        {/* Résultats de la dernière synchronisation */}
        {syncStats && !isSyncing && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Dernière synchronisation: {syncStats.newSuppliers} nouveaux fournisseurs créés, 
              {syncStats.syncedSuppliers} mis à jour, {syncStats.duplicates} doublons évités.
            </AlertDescription>
          </Alert>
        )}

        {/* Aperçu des prestataires */}
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <Building className="h-4 w-4" />
            Prestataires disponibles ({serviceProviders?.length || 0})
          </h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {serviceProviders?.slice(0, 5).map((provider) => {
              const isAlreadySupplier = existingSuppliers?.some(
                s => s.email.toLowerCase() === provider.email.toLowerCase()
              );
              
              return (
                <div key={provider.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <span className="font-medium">{provider.company_name}</span>
                  <Badge variant={isAlreadySupplier ? "default" : "secondary"}>
                    {isAlreadySupplier ? 'Synchronisé' : 'À synchroniser'}
                  </Badge>
                </div>
              );
            })}
            {(serviceProviders?.length || 0) > 5 && (
              <div className="text-sm text-muted-foreground text-center">
                ... et {(serviceProviders?.length || 0) - 5} autres
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={syncSuppliers}
            disabled={isSyncing || !serviceProviders?.length}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
          </Button>
        </div>

        {!serviceProviders?.length && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Aucun prestataire de services trouvé. Ajoutez d'abord des prestataires dans la section principale.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default SupplierSyncManager;
