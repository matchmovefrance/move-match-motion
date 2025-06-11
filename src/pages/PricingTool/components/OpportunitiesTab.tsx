
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Filter, Plus, Edit, MapPin, Calendar, Euro, BarChart3, TrendingUp, User, Phone, Mail, Clock, FileText, Calculator } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import BestPricesDialog from './BestPricesDialog';
import CreateOpportunityDialog from './CreateOpportunityDialog';
import ValidationTestButton from './ValidationTestButton';

type PricingOpportunity = Tables<'pricing_opportunities'>;
type Supplier = Tables<'suppliers'>;

const OpportunitiesTab = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [selectedOpportunity, setSelectedOpportunity] = useState<PricingOpportunity | null>(null);
  const [showBestPrices, setShowBestPrices] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Sample opportunity for demo when no real data exists
  const createSampleOpportunity = (): PricingOpportunity => ({
    id: 'sample-demo-opportunity',
    title: 'Déménagement Paris → Lyon (DEMO)',
    description: 'Démonstration du système de pricing',
    departure_address: '123 Rue de Rivoli',
    departure_city: 'Paris',
    departure_postal_code: '75001',
    departure_country: 'France',
    arrival_address: '456 Avenue de la République',
    arrival_city: 'Lyon',
    arrival_postal_code: '69001',
    arrival_country: 'France',
    estimated_volume: 25,
    desired_date: '2024-02-15',
    status: 'active',
    budget_range_min: 1500,
    budget_range_max: 2500,
    special_requirements: 'Piano droit à transporter avec précaution',
    priority: 1,
    flexible_dates: false,
    date_range_start: null,
    date_range_end: null,
    ai_price_suggestion: null,
    client_request_id: null,
    created_by: user?.id || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // Requête corrigée pour les opportunités - pas de rafraîchissement automatique
  const { data: opportunities, isLoading, refetch } = useQuery({
    queryKey: ['pricing-opportunities', searchTerm, statusFilter, sortBy],
    queryFn: async () => {
      console.log('🔍 Chargement des opportunités...');
      
      let query = supabase
        .from('pricing_opportunities')
        .select('*'); // Suppression de la relation problématique

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,departure_city.ilike.%${searchTerm}%,arrival_city.ilike.%${searchTerm}%`);
      }

      query = query.order(sortBy, { ascending: false });

      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Erreur lors du chargement des opportunités:', error);
        return [createSampleOpportunity()];
      }
      
      console.log('✅ Opportunités chargées:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('📋 Première opportunité:', data[0]);
        return data;
      } else {
        console.log('⚠️ Aucune opportunité en DB, utilisation de données de démonstration');
        return [createSampleOpportunity()];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - pas de rafraîchissement automatique
    refetchOnWindowFocus: false, // Pas de rafraîchissement au focus
    refetchOnMount: true, // Charger une seule fois au montage
  });

  // Requête pour les fournisseurs - optimisée
  const { data: suppliers } = useQuery({
    queryKey: ['active-suppliers'],
    queryFn: async () => {
      console.log('🏢 Chargement des fournisseurs...');
      
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true);
      
      if (error) {
        console.error('❌ Erreur lors du chargement des fournisseurs:', error);
        return [];
      }
      
      console.log('✅ Fournisseurs actifs chargés:', data?.length || 0);
      return data as Supplier[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - les fournisseurs changent rarement
    refetchOnWindowFocus: false,
  });

  const handleFindBestPrices = (opportunity: PricingOpportunity) => {
    console.log('🔍 BOUTON CLIQUÉ - Recherche des meilleurs prix pour:', opportunity.title);
    setSelectedOpportunity(opportunity);
    setShowBestPrices(true);
  };

  const handleEditOpportunity = (opportunity: PricingOpportunity) => {
    setSelectedOpportunity(opportunity);
    setShowCreateDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'closed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const getClientInfo = (opportunity: any) => {
    // Données simplifiées puisque nous n'avons plus la relation
    return {
      name: 'Client démo',
      email: 'demo@client.fr',
      phone: '+33 1 23 45 67 89'
    };
  };

  if (isLoading) {
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
    <TooltipProvider>
      <div className="space-y-6">
        {/* Validation Component */}
        <ValidationTestButton />

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Opportunités de tarification
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => refetch()}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Actualiser
                </Button>
                <Button 
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle opportunité
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par titre, ville de départ ou d'arrivée..."
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
                  <SelectItem value="active">Actives</SelectItem>
                  <SelectItem value="draft">Brouillons</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="closed">Fermées</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date de création</SelectItem>
                  <SelectItem value="desired_date">Date souhaitée</SelectItem>
                  <SelectItem value="priority">Priorité</SelectItem>
                  <SelectItem value="estimated_volume">Volume</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Opportunities Grid */}
        {opportunities && opportunities.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((opportunity) => {
              const clientInfo = getClientInfo(opportunity);
              
              return (
                <Card key={opportunity.id} className="hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-bold">{opportunity.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="font-medium">{opportunity.departure_city} → {opportunity.arrival_city}</span>
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(opportunity.status)}>
                        {getStatusLabel(opportunity.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Informations client */}
                    <div className="bg-muted/50 rounded-lg p-3 border">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Client
                      </h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2 font-medium">
                          <User className="h-3 w-3" />
                          <span>{clientInfo.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{clientInfo.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{clientInfo.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Métriques */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-lg font-bold text-green-700">{opportunity.estimated_volume}</div>
                        <div className="text-xs text-green-600 font-medium">m³ estimés</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="text-sm font-bold text-orange-700 flex items-center justify-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(opportunity.desired_date), 'dd/MM', { locale: fr })}
                        </div>
                        <div className="text-xs text-orange-600 font-medium">Date souhaitée</div>
                      </div>
                    </div>

                    {/* Budget */}
                    {opportunity.budget_range_min && opportunity.budget_range_max && (
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-purple-700 font-medium">Budget client :</span>
                          <span className="font-bold text-purple-900 flex items-center gap-1">
                            <Euro className="h-3 w-3" />
                            {opportunity.budget_range_min.toLocaleString()} - {opportunity.budget_range_max.toLocaleString()}€
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Exigences spéciales */}
                    {opportunity.special_requirements && (
                      <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                        <h4 className="text-xs font-bold text-yellow-700 uppercase tracking-wide mb-1">
                          Exigences particulières
                        </h4>
                        <p className="text-xs text-yellow-800">{opportunity.special_requirements}</p>
                      </div>
                    )}

                    {/* BOUTON PRINCIPAL - TROUVER LES PRIX */}
                    <div className="pt-3 border-t">
                      <Button 
                        id="pricing-submit"
                        data-testid="find-prices-button"
                        onClick={() => handleFindBestPrices(opportunity)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                        size="lg"
                      >
                        <Calculator className="h-5 w-5 mr-2" />
                        <span className="text-base font-bold">TROUVER DES PRIX</span>
                        <TrendingUp className="h-5 w-5 ml-2" />
                      </Button>
                    </div>

                    {/* Actions secondaires */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditOpportunity(opportunity)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              disabled
                            >
                              <BarChart3 className="h-4 w-4 mr-1" />
                              Analyse
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Analyse des prix comparés (à venir)</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      <div className="flex gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              disabled
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              <span className="text-xs">Planning</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Gestion du planning automatisé (à venir)</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              disabled
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              <span className="text-xs">Rapport</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Rapports détaillés PDF/Excel (à venir)</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              disabled
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              <span className="text-xs">Email</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Envoi automatique aux clients (à venir)</p>
                          </TooltipContent>
                        </Tooltip>
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
                <Calculator className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-2">Aucune opportunité trouvée</h3>
                <p className="text-sm mb-6">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Aucune opportunité ne correspond à vos critères.'
                    : 'Commencez par créer votre première opportunité pour comparer les prix.'}
                </p>
              </div>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-primary hover:bg-primary/90"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Créer votre première opportunité
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dialogs */}
        <BestPricesDialog
          open={showBestPrices}
          onOpenChange={setShowBestPrices}
          opportunity={selectedOpportunity}
        />

        <CreateOpportunityDialog
          open={showCreateDialog}
          onOpenChange={(open) => {
            setShowCreateDialog(open);
            if (!open) {
              setSelectedOpportunity(null);
            }
          }}
          opportunity={selectedOpportunity}
          onSuccess={() => {
            refetch();
            setShowCreateDialog(false);
            setSelectedOpportunity(null);
          }}
        />
      </div>
    </TooltipProvider>
  );
};

export default OpportunitiesTab;
