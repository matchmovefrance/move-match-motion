
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, Search, Filter, Plus, Edit, Building, Phone, Mail, MapPin, BarChart3, Link2, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import SupplierSyncManager from './SupplierSyncManager';

type Supplier = Tables<'suppliers'>;

const SuppliersTab = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showSyncManager, setShowSyncManager] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierRating, setSupplierRating] = useState(0);

  // Récupérer les prestataires uniques depuis la table confirmed_moves avec les informations des movers
  const { data: providersFromMoves, isLoading: isLoadingMoves } = useQuery({
    queryKey: ['providers-from-moves'],
    queryFn: async () => {
      console.log('🔍 Chargement des prestataires depuis les trajets...');
      
      const { data: moves, error } = await supabase
        .from('confirmed_moves')
        .select(`
          mover_id,
          mover_name,
          company_name,
          contact_email,
          contact_phone
        `)
        .not('mover_id', 'is', null);

      if (error) {
        console.error('❌ Erreur lors du chargement des trajets:', error);
        return [];
      }

      // Créer un Map pour éviter les doublons par mover_id
      const uniqueProviders = new Map();
      
      moves?.forEach(move => {
        if (move.mover_id && !uniqueProviders.has(move.mover_id)) {
          uniqueProviders.set(move.mover_id, {
            id: move.mover_id,
            name: move.mover_name || 'Nom non défini',
            company_name: move.company_name || 'Entreprise non définie',
            email: move.contact_email || '',
            phone: move.contact_phone || '',
            source: 'moves'
          });
        }
      });

      const providers = Array.from(uniqueProviders.values());
      console.log('✅ Prestataires uniques trouvés:', providers.length);
      return providers;
    },
  });

  const { data: suppliers, isLoading, refetch } = useQuery({
    queryKey: ['suppliers', searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('suppliers')
        .select('*');

      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active');
      }

      if (searchTerm) {
        query = query.or(`company_name.ilike.%${searchTerm}%,contact_name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) {
        console.error('❌ Erreur lors du chargement des fournisseurs:', error);
        return [];
      }
      
      console.log('🏢 Fournisseurs chargés:', data?.length || 0);
      return data as Supplier[];
    },
  });

  // Combiner les prestataires des trajets avec les suppliers existants
  const allProviders = [...(providersFromMoves || []), ...(suppliers || [])];
  
  // Filtrer selon les critères de recherche
  const filteredProviders = allProviders.filter(provider => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        provider.company_name?.toLowerCase().includes(searchLower) ||
        (provider.contact_name || provider.name)?.toLowerCase().includes(searchLower) ||
        provider.city?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    if (statusFilter !== 'all') {
      // Pour les prestataires des trajets, on les considère comme actifs
      if (provider.source === 'moves') {
        return statusFilter === 'active';
      }
      // Pour les suppliers, utiliser le champ is_active
      return provider.is_active === (statusFilter === 'active');
    }

    return true;
  });

  const handleRateSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSupplierRating(0);
    setShowRatingDialog(true);
  };

  const handleSubmitRating = async () => {
    if (!selectedSupplier || supplierRating === 0) return;

    try {
      const currentMetrics = selectedSupplier.performance_metrics as any || {};
      const newMetrics = {
        ...currentMetrics,
        our_rating: supplierRating,
        rated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('suppliers')
        .update({ performance_metrics: newMetrics })
        .eq('id', selectedSupplier.id);

      if (error) throw error;

      toast({
        title: "Note enregistrée",
        description: `Vous avez donné ${supplierRating}/5 étoiles à ${selectedSupplier.company_name}`,
      });

      setShowRatingDialog(false);
      refetch();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la note:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la note.",
        variant: "destructive",
      });
    }
  };

  const getOurRating = (supplier: Supplier) => {
    const metrics = supplier.performance_metrics as any;
    return metrics?.our_rating || 0;
  };

  if (isLoading || isLoadingMoves) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Synchronization Manager */}
      {showSyncManager && (
        <SupplierSyncManager />
      )}

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Gestion des prestataires
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setShowSyncManager(!showSyncManager)}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {showSyncManager ? 'Masquer' : 'Synchronisation'}
              </Button>
              <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4" />
                Nouveau prestataire
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, contact, ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Providers Grid */}
      {filteredProviders && filteredProviders.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProviders.map((provider) => {
            const isFromMoves = provider.source === 'moves';
            const ourRating = isFromMoves ? 0 : getOurRating(provider);
            const isFromServiceProvider = !isFromMoves && provider.service_provider_id !== null;
            
            return (
              <Card key={`${provider.source || 'supplier'}-${provider.id}`} className="hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Building className="h-5 w-5 text-primary" />
                        {provider.company_name}
                        {isFromMoves && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                            Trajet
                          </Badge>
                        )}
                        {isFromServiceProvider && (
                          <Badge variant="outline" className="text-xs">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Synchronisé
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span className="font-medium">{provider.contact_name || provider.name}</span>
                      </CardDescription>
                    </div>
                    <Badge variant={isFromMoves || provider.is_active ? "default" : "secondary"}>
                      {isFromMoves || provider.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Informations de contact */}
                  <div className="space-y-2 text-sm">
                    {provider.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{provider.email}</span>
                      </div>
                    )}
                    {provider.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{provider.phone}</span>
                      </div>
                    )}
                    {(provider.address || provider.city) && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="text-sm">
                          {provider.address && <div>{provider.address}</div>}
                          {provider.city && (
                            <div>{provider.postal_code} {provider.city}</div>
                          )}
                          {provider.country && <div>{provider.country}</div>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notre évaluation - seulement pour les suppliers */}
                  {!isFromMoves && (
                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                      <h4 className="text-sm font-bold text-yellow-800 mb-2 flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        Notre évaluation
                      </h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${
                                i < ourRating 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`} 
                            />
                          ))}
                          <span className="ml-2 text-sm text-yellow-700">
                            {ourRating > 0 ? `${ourRating}/5` : 'Non évalué'}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRateSupplier(provider)}
                        >
                          {ourRating > 0 ? 'Modifier' : 'Noter'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Métriques de performance - seulement pour les suppliers */}
                  {!isFromMoves && (
                    <div className="bg-muted/50 rounded-lg p-3 border">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        Performance
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-bold text-blue-600">
                            {(provider.performance_metrics as any)?.total_bids || 0}
                          </div>
                          <div className="text-muted-foreground">Devis soumis</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-green-600">
                            {(provider.performance_metrics as any)?.acceptance_rate || 0}%
                          </div>
                          <div className="text-muted-foreground">Taux d'acceptation</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Informations spécifiques aux trajets */}
                  {isFromMoves && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-2">
                        Source: Trajets confirmés
                      </h4>
                      <p className="text-xs text-blue-700">
                        Ce prestataire a des trajets actifs dans le système
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Link2 className="h-4 w-4 mr-1" />
                        Portail
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Building className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">Aucun prestataire trouvé</h3>
              <p className="text-sm mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucun prestataire ne correspond à vos critères.'
                  : 'Synchronisez vos prestataires pour créer automatiquement vos fournisseurs.'}
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button 
                variant="outline"
                onClick={() => setShowSyncManager(true)}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Synchroniser les prestataires
              </Button>
              <Button className="bg-primary hover:bg-primary/90" size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Ajouter un prestataire
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Évaluer le prestataire</DialogTitle>
            <DialogDescription>
              Donnez votre note à {selectedSupplier?.company_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setSupplierRating(rating)}
                    className="p-1 transition-colors"
                  >
                    <Star 
                      className={`h-8 w-8 ${
                        rating <= supplierRating 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300 hover:text-yellow-200'
                      }`} 
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Cliquez sur les étoiles pour noter
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRatingDialog(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmitRating}
                disabled={supplierRating === 0}
                className="flex-1"
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuppliersTab;
