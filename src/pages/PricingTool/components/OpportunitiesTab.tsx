
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Calendar,
  MapPin,
  Package,
  Euro,
  RefreshCw,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  Calculator
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import CreateOpportunityDialog from './CreateOpportunityDialog';
import BestPricesDialog from './BestPricesDialog';
import CreateClientDialog from './CreateClientDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

const OpportunitiesTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreateClientDialog, setShowCreateClientDialog] = useState(false);
  const [showBestPricesDialog, setShowBestPricesDialog] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [editingOpportunity, setEditingOpportunity] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour les dialogues de confirmation
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [opportunityToUpdate, setOpportunityToUpdate] = useState<any>(null);

  // Charger les clients depuis la table clients unifiée
  const { data: opportunities, isLoading, error, refetch } = useQuery({
    queryKey: ['client-opportunities', statusFilter, searchTerm],
    queryFn: async () => {
      console.log('🔍 Chargement des opportunités depuis clients...');
      
      let query = supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      // Filtrer par statut (considérer les statuts correspondants)
      if (statusFilter === 'active') {
        query = query.in('status', ['pending', 'confirmed']);
      } else if (statusFilter === 'closed') {
        query = query.in('status', ['completed', 'cancelled', 'closed']);
      } else if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,departure_city.ilike.%${searchTerm}%,arrival_city.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Erreur chargement opportunités:', error);
        throw error;
      }
      
      console.log('✅ Opportunités client chargées:', data?.length || 0);
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const handleRefresh = async () => {
    console.log('🔄 Actualisation manuelle des opportunités...');
    await refetch();
    toast({
      title: "Données actualisées",
      description: "Les opportunités ont été rechargées depuis la base de données",
    });
  };

  const handleCreateOpportunity = () => {
    setEditingOpportunity(null);
    setShowCreateDialog(true);
  };

  const handleCreateClient = () => {
    setShowCreateClientDialog(true);
  };

  const handleShowCompleteDialog = (opportunity: any) => {
    setOpportunityToUpdate(opportunity);
    setShowCompleteDialog(true);
  };

  const handleShowCancelDialog = (opportunity: any) => {
    setOpportunityToUpdate(opportunity);
    setShowCancelDialog(true);
  };

  const handleConfirmComplete = async () => {
    if (!opportunityToUpdate) return;

    try {
      console.log('🔄 Finalisation de l\'opportunité:', opportunityToUpdate.id);
      
      const { error } = await supabase
        .from('clients')
        .update({ 
          status: 'completed'
        })
        .eq('id', opportunityToUpdate.id);

      if (error) throw error;

      toast({
        title: "Trajet terminé",
        description: "L'opportunité a été finalisée avec succès",
      });

      setShowCompleteDialog(false);
      setOpportunityToUpdate(null);
      queryClient.invalidateQueries({ queryKey: ['client-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-stats'] });
    } catch (error) {
      console.error('❌ Erreur lors de la finalisation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de finaliser l'opportunité",
        variant: "destructive",
      });
    }
  };

  const handleConfirmCancel = async () => {
    if (!opportunityToUpdate) return;

    try {
      console.log('🔄 Annulation de l\'opportunité:', opportunityToUpdate.id);
      
      const { error } = await supabase
        .from('clients')
        .update({ 
          status: 'cancelled'
        })
        .eq('id', opportunityToUpdate.id);

      if (error) throw error;

      toast({
        title: "Trajet annulé",
        description: "L'opportunité a été annulée avec succès",
      });

      setShowCancelDialog(false);
      setOpportunityToUpdate(null);
      queryClient.invalidateQueries({ queryKey: ['client-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-stats'] });
    } catch (error) {
      console.error('❌ Erreur lors de l\'annulation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler l'opportunité",
        variant: "destructive",
      });
    }
  };

  const handleSearchPrices = (opportunity: any) => {
    setSelectedOpportunity(opportunity);
    setShowBestPricesDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmé';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      case 'closed': return 'Fermé';
      default: return status;
    }
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-red-700">Erreur de chargement</h3>
        <p className="text-red-600 mb-4">Impossible de charger les opportunités</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Clients & Opportunités</h2>
          <p className="text-muted-foreground">
            Gérez vos clients et leurs demandes de déménagement
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={handleCreateClient} variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Nouveau client
          </Button>
          <Button onClick={handleCreateOpportunity} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle opportunité
          </Button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher par nom, email, ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="confirmed">Confirmés</SelectItem>
            <SelectItem value="closed">Fermés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste des opportunités */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : opportunities?.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune opportunité</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'active' 
                ? 'Aucune opportunité ne correspond à vos critères de recherche'
                : 'Commencez par créer votre première opportunité client'
              }
            </p>
            {(!searchTerm && statusFilter === 'active') && (
              <div className="flex gap-2 justify-center">
                <Button onClick={handleCreateClient} variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Nouveau client
                </Button>
                <Button onClick={handleCreateOpportunity}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle opportunité
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {opportunities?.map((opportunity) => (
            <Card key={opportunity.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">
                        {opportunity.name || `Client #${opportunity.id}`}
                      </CardTitle>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(opportunity.status)}
                      >
                        {getStatusLabel(opportunity.status)}
                      </Badge>
                    </div>
                    {opportunity.email && (
                      <CardDescription className="text-sm">
                        {opportunity.email}
                      </CardDescription>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSearchPrices(opportunity)}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Calculator className="h-4 w-4 mr-1" />
                      Rechercher devis
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {(opportunity.status === 'pending' || opportunity.status === 'confirmed') && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => handleShowCompleteDialog(opportunity)}
                              className="text-green-600"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Trajet terminé
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleShowCancelDialog(opportunity)}
                              className="text-red-600"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Annuler trajet
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Route:</span>
                    <span>{opportunity.departure_city} → {opportunity.arrival_city}</span>
                  </div>
                  
                  {opportunity.estimated_volume && (
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Volume:</span>
                      <span>{opportunity.estimated_volume}m³</span>
                    </div>
                  )}
                  
                  {opportunity.desired_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">Date:</span>
                      <span>{format(new Date(opportunity.desired_date), 'dd/MM/yyyy', { locale: fr })}</span>
                    </div>
                  )}
                  
                  {(opportunity.budget_min || opportunity.budget_max) && (
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">Budget:</span>
                      <span>
                        {opportunity.budget_min && opportunity.budget_max 
                          ? `${opportunity.budget_min}€ - ${opportunity.budget_max}€`
                          : opportunity.budget_min 
                            ? `À partir de ${opportunity.budget_min}€`
                            : `Jusqu'à ${opportunity.budget_max}€`
                        }
                      </span>
                    </div>
                  )}
                </div>
                
                {opportunity.special_requirements && (
                  <div className="mt-3 p-2 bg-gray-50 rounded-md">
                    <span className="text-xs font-medium text-gray-600">Exigences spéciales:</span>
                    <p className="text-sm text-gray-800 mt-1">{opportunity.special_requirements}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateOpportunityDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        opportunity={editingOpportunity}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['client-opportunities'] });
          queryClient.invalidateQueries({ queryKey: ['pricing-stats'] });
        }}
      />

      <CreateClientDialog
        open={showCreateClientDialog}
        onOpenChange={setShowCreateClientDialog}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['client-opportunities'] });
          queryClient.invalidateQueries({ queryKey: ['pricing-stats'] });
        }}
      />

      <BestPricesDialog
        open={showBestPricesDialog}
        onOpenChange={setShowBestPricesDialog}
        opportunity={selectedOpportunity}
      />

      {/* Dialogues de confirmation */}
      <ConfirmDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        title="Confirmer la fin du trajet"
        description={`Êtes-vous sûr de vouloir marquer le trajet de ${opportunityToUpdate?.name || 'ce client'} comme terminé ? Cette action est définitive et ne peut pas être annulée.`}
        confirmText="Trajet terminé"
        cancelText="Annuler"
        onConfirm={handleConfirmComplete}
        variant="default"
      />

      <ConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        title="Confirmer l'annulation du trajet"
        description={`Êtes-vous sûr de vouloir annuler le trajet de ${opportunityToUpdate?.name || 'ce client'} ? Cette action est définitive et ne peut pas être annulée.`}
        confirmText="Annuler le trajet"
        cancelText="Retour"
        onConfirm={handleConfirmCancel}
        variant="destructive"
      />
    </div>
  );
};

export default OpportunitiesTab;
