
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Check, Clock, MapPin, Calendar, 
         Package, Euro, TrendingUp, FileText, ClipboardList as ClipboardIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from '@/hooks/use-toast';

interface Opportunity {
  id: string;
  title: string;
  description: string | null;
  estimated_volume: number;
  budget_range_min: number | null;
  budget_range_max: number | null;
  departure_address: string;
  departure_city: string;
  departure_postal_code: string;
  arrival_address: string;
  arrival_city: string;
  arrival_postal_code: string;
  desired_date: string;
  flexible_dates: boolean;
  status: string;
  created_at: string;
  special_requirements: string | null;
}

const OpportunitiesTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['opportunities', searchTerm, statusFilter, sortBy, currentPage],
    queryFn: async () => {
      // Calculer l'offset basé sur la pagination
      const offset = (currentPage - 1) * itemsPerPage;
      
      let query = supabase
        .from('pricing_opportunities')
        .select('*', { count: 'exact' });

      // Appliquer les filtres
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,departure_city.ilike.%${searchTerm}%,arrival_city.ilike.%${searchTerm}%`);
      }

      // Appliquer le tri et la pagination
      query = query
        .order(sortBy, { ascending: false })
        .range(offset, offset + itemsPerPage - 1);

      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        items: data as Opportunity[],
        totalCount: count || 0
      };
    }
  });

  // Calcul des pages totales pour la pagination
  const totalPages = opportunities ? Math.ceil(opportunities.totalCount / itemsPerPage) : 0;

  // Fonction pour chercher le meilleur prix pour une opportunité
  const findBestPrice = async (opportunityId: string) => {
    toast({
      title: "Recherche en cours...",
      description: "Nous cherchons le meilleur prix pour cette opportunité",
    });
    
    try {
      // 1. Récupérer les détails de l'opportunité
      const { data: opportunityData, error: opportunityError } = await supabase
        .from('pricing_opportunities')
        .select('*')
        .eq('id', opportunityId)
        .single();
      
      if (opportunityError) throw opportunityError;
      
      const opportunity = opportunityData as Opportunity;
      
      // 2. Trouver les fournisseurs dans un rayon de 100km
      // Pour simuler, nous allons chercher tous les fournisseurs et calculer un prix
      const { data: suppliers, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true);
      
      if (suppliersError) throw suppliersError;
      
      if (!suppliers || suppliers.length === 0) {
        toast({
          title: "Aucun fournisseur trouvé",
          description: "Impossible de trouver des fournisseurs actifs",
          variant: "destructive"
        });
        return;
      }
      
      // 3. Calculer un prix pour chaque fournisseur selon son modèle de prix
      const suppliersWithPrices = suppliers.map((supplier) => {
        // Calculer le prix basé sur le modèle de prix du fournisseur
        let price = 0;
        const pricingModel = supplier.pricing_model as any;
        
        if (pricingModel && pricingModel.basePrice) {
          // Prix de base
          price += parseFloat(pricingModel.basePrice);
          
          // Coût lié au volume
          if (opportunity.estimated_volume) {
            price += opportunity.estimated_volume * 10; // Exemple simplifié
          }
          
          // On ajoute une variation aléatoire pour la démo
          price = price * (0.9 + Math.random() * 0.3);
        } else {
          // Prix par défaut si pas de modèle
          price = 500 + opportunity.estimated_volume * 20;
        }
        
        return {
          supplier_id: supplier.id,
          company_name: supplier.company_name,
          price: Math.round(price * 100) / 100
        };
      });
      
      // 4. Trier par prix
      const sortedSuppliers = suppliersWithPrices.sort((a, b) => a.price - b.price);
      
      // 5. Afficher les résultats
      if (sortedSuppliers.length > 0) {
        const bestSupplier = sortedSuppliers[0];
        
        // 6. Créer une entrée dans la table quotes pour le meilleur fournisseur
        const { data: quoteData, error: quoteError } = await supabase
          .from('quotes')
          .insert({
            opportunity_id: opportunityId,
            supplier_id: bestSupplier.supplier_id,
            bid_amount: bestSupplier.price,
            status: 'pending',
            created_by: user?.id,
            response_time_hours: 0, // Instantané puisque c'est généré par l'IA
            cost_breakdown: { 
              basePrice: bestSupplier.price * 0.7,
              volumeCost: bestSupplier.price * 0.3,
              automatic: true
            }
          })
          .select()
          .single();
        
        if (quoteError) throw quoteError;
        
        toast({
          title: "Meilleur prix trouvé !",
          description: `${bestSupplier.company_name}: ${bestSupplier.price}€`,
          variant: "default"
        });
      }
      
    } catch (error) {
      console.error('Erreur lors de la recherche du meilleur prix:', error);
      toast({
        title: "Erreur",
        description: "Impossible de calculer le meilleur prix",
        variant: "destructive"
      });
    }
  };

  // Rendu des éléments de pagination
  const renderPagination = () => {
    const pages = [];
    
    // Toujours afficher la première page
    pages.push(
      <PaginationItem key="first">
        <PaginationLink 
          onClick={() => setCurrentPage(1)}
          isActive={currentPage === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Si beaucoup de pages, ajouter des ellipses au début
    if (currentPage > 3) {
      pages.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Pages autour de la page courante
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => setCurrentPage(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Si beaucoup de pages, ajouter des ellipses à la fin
    if (currentPage < totalPages - 2) {
      pages.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Toujours afficher la dernière page si elle existe
    if (totalPages > 1) {
      pages.push(
        <PaginationItem key="last">
          <PaginationLink
            onClick={() => setCurrentPage(totalPages)}
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return pages;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-10 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtrer les opportunités
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par titre, description ou ville..."
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
                <SelectItem value="draft">Brouillons</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="closed">Clôturés</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date de création</SelectItem>
                <SelectItem value="desired_date">Date souhaitée</SelectItem>
                <SelectItem value="estimated_volume">Volume estimé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Opportunities List */}
      {opportunities?.items && opportunities.items.length > 0 ? (
        <div className="space-y-6">
          {opportunities.items.map((opportunity) => (
            <Card key={opportunity.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{opportunity.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span>{opportunity.departure_city} → {opportunity.arrival_city}</span>
                      <Calendar className="h-3 w-3 ml-2" />
                      <span>{format(new Date(opportunity.desired_date), 'dd MMMM yyyy', { locale: fr })}</span>
                      {opportunity.flexible_dates && (
                        <Badge variant="outline" className="ml-1">
                          <Clock className="h-3 w-3 mr-1" />
                          Dates flexibles
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                  <Badge
                    className={
                      opportunity.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      opportunity.status === 'active' ? 'bg-green-100 text-green-800' :
                      opportunity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }
                  >
                    {opportunity.status === 'draft' ? 'Brouillon' :
                     opportunity.status === 'active' ? 'Actif' :
                     opportunity.status === 'pending' ? 'En attente' :
                     'Clôturé'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600 flex items-center justify-center gap-1">
                      <Package className="h-4 w-4" />
                      {opportunity.estimated_volume} m³
                    </div>
                    <div className="text-xs text-gray-600">Volume estimé</div>
                  </div>
                  
                  {opportunity.budget_range_min && opportunity.budget_range_max ? (
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-sm font-semibold text-green-600 flex items-center justify-center gap-1">
                        <Euro className="h-4 w-4" />
                        {opportunity.budget_range_min} - {opportunity.budget_range_max}€
                      </div>
                      <div className="text-xs text-gray-600">Budget estimé</div>
                    </div>
                  ) : (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-semibold text-gray-600">
                        Budget non défini
                      </div>
                      <div className="text-xs text-gray-600">À déterminer</div>
                    </div>
                  )}
                  
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-sm font-semibold text-purple-600">
                      {opportunity.departure_postal_code} → {opportunity.arrival_postal_code}
                    </div>
                    <div className="text-xs text-gray-600">Codes postaux</div>
                  </div>
                  
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-sm font-semibold text-orange-600 flex items-center justify-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      {new Date(opportunity.created_at) > addDays(new Date(), -1) 
                        ? "Nouvel arrivage" 
                        : `${format(new Date(opportunity.created_at), 'dd/MM/yyyy')}`}
                    </div>
                    <div className="text-xs text-gray-600">
                      {new Date(opportunity.created_at) > addDays(new Date(), -1) 
                        ? `Ajouté le ${format(new Date(opportunity.created_at), 'dd/MM')}` 
                        : "Date de création"}
                    </div>
                  </div>
                </div>

                {opportunity.description && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <h4 className="text-sm font-medium mb-1">Description:</h4>
                    <p className="text-sm text-gray-700">{opportunity.description}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-gray-500">
                    ID: {opportunity.id.substring(0, 8)}...
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Détails
                    </Button>
                    {opportunity.status === 'active' && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => findBestPrice(opportunity.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Trouver le meilleur prix
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                
                {renderPagination()}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-gray-500 mb-4">
              <ClipboardIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Aucune opportunité trouvée</h3>
              <p className="text-sm">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucune opportunité ne correspond à vos critères.'
                  : 'Créez votre première opportunité pour commencer.'}
              </p>
            </div>
            <Button>
              Créer une opportunité
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OpportunitiesTab;
