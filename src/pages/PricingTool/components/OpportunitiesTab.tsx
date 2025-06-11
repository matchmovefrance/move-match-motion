
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
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import CreateOpportunityDialog from './CreateOpportunityDialog';
import BestPricesDialog from './BestPricesDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const OpportunitiesTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBestPricesDialog, setShowBestPricesDialog] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [editingOpportunity, setEditingOpportunity] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Charger les opportunités depuis la base de données
  const { data: opportunities, isLoading, error, refetch } = useQuery({
    queryKey: ['pricing-opportunities', statusFilter, searchTerm],
    queryFn: async () => {
      console.log('🔍 Chargement des opportunités...');
      
      let query = supabase
        .from('pricing_opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,departure_city.ilike.%${searchTerm}%,arrival_city.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Erreur chargement opportunités:', error);
        throw error;
      }
      
      console.log('✅ Opportunités chargées:', data?.length || 0);
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

  const handleEditOpportunity = (opportunity: any) => {
    setEditingOpportunity(opportunity);
    setShowCreateDialog(true);
  };

  const handleDeleteOpportunity = async (opportunityId: string) => {
    try {
      console.log('🗑️ Suppression opportunité:', opportunityId);
      
      const { error } = await supabase
        .from('pricing_opportunities')
        .delete()
        .eq('id', opportunityId);

      if (error) throw error;

      toast({
        title: "Opportunité supprimée",
        description: "L'opportunité a été supprimée avec succès",
      });

      queryClient.invalidateQueries({ queryKey: ['pricing-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-stats'] });
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'opportunité",
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
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'closed': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'draft': return 'Brouillon';
      case 'closed': return 'Fermée';
      case 'pending': return 'En attente';
      default: return status;
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3: return 'text-red-600';
      case 2: return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 3: return 'Urgente';
      case 2: return 'Élevée';
      default: return 'Normale';
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
          <h2 className="text-2xl font-bold">Opportunités de devis</h2>
          <p className="text-muted-foreground">
            Gérez vos opportunités commerciales et générez des devis compétitifs
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
              placeholder="Rechercher par titre, ville de départ ou d'arrivée..."
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
            <SelectItem value="active">Actives</SelectItem>
            <SelectItem value="draft">Brouillons</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="closed">Fermées</SelectItem>
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
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune opportunité</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Aucune opportunité ne correspond à vos critères de recherche'
                : 'Commencez par créer votre première opportunité de devis'
              }
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <Button onClick={handleCreateOpportunity}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une opportunité
              </Button>
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
                      <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(opportunity.status)}
                      >
                        {getStatusLabel(opportunity.status)}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(opportunity.priority)}`}
                      >
                        {getPriorityLabel(opportunity.priority)}
                      </Badge>
                    </div>
                    {opportunity.description && (
                      <CardDescription className="text-sm">
                        {opportunity.description}
                      </CardDescription>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditOpportunity(opportunity)}>
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleSearchPrices(opportunity)}
                        className="text-blue-600"
                      >
                        <TrendingDown className="h-4 w-4 mr-2" />
                        Rechercher prix
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteOpportunity(opportunity.id)}
                        className="text-red-600"
                      >
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Route:</span>
                    <span>{opportunity.departure_city} → {opportunity.arrival_city}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Volume:</span>
                    <span>{opportunity.estimated_volume}m³</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Date:</span>
                    <span>{format(new Date(opportunity.desired_date), 'dd/MM/yyyy', { locale: fr })}</span>
                  </div>
                  
                  {(opportunity.budget_range_min || opportunity.budget_range_max) && (
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">Budget:</span>
                      <span>
                        {opportunity.budget_range_min && opportunity.budget_range_max 
                          ? `${opportunity.budget_range_min}€ - ${opportunity.budget_range_max}€`
                          : opportunity.budget_range_min 
                            ? `À partir de ${opportunity.budget_range_min}€`
                            : `Jusqu'à ${opportunity.budget_range_max}€`
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
          queryClient.invalidateQueries({ queryKey: ['pricing-opportunities'] });
          queryClient.invalidateQueries({ queryKey: ['pricing-stats'] });
        }}
      />

      <BestPricesDialog
        open={showBestPricesDialog}
        onOpenChange={setShowBestPricesDialog}
        opportunity={selectedOpportunity}
      />
    </div>
  );
};

export default OpportunitiesTab;
