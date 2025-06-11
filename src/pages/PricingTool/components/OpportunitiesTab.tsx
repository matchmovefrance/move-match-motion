
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Plus, Edit, MapPin, Calendar, Euro, BarChart3, TrendingUp, User, Phone, Mail, Clock, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import BestPricesDialog from './BestPricesDialog';
import CreateOpportunityDialog from './CreateOpportunityDialog';

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

  const { data: opportunities, isLoading, refetch } = useQuery({
    queryKey: ['pricing-opportunities', searchTerm, statusFilter, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('pricing_opportunities')
        .select(`
          *,
          client_requests (
            id,
            name,
            email,
            phone,
            clients (
              id,
              name,
              email,
              phone
            )
          )
        `);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,departure_city.ilike.%${searchTerm}%,arrival_city.ilike.%${searchTerm}%`);
      }

      query = query.order(sortBy, { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ['active-suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data as Supplier[];
    },
  });

  const handleFindBestPrices = (opportunity: PricingOpportunity) => {
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
    // Si l'opportunité est liée à une demande client
    if (opportunity.client_requests) {
      const clientRequest = opportunity.client_requests;
      const client = clientRequest.clients;
      
      return {
        name: client?.name || clientRequest.name || 'Client non spécifié',
        email: client?.email || clientRequest.email || '',
        phone: client?.phone || clientRequest.phone || ''
      };
    }
    
    // Sinon, utiliser les informations saisies manuellement (si disponibles)
    return {
      name: opportunity.client_name || 'Client non spécifié',
      email: opportunity.client_email || '',
      phone: opportunity.client_phone || ''
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
    <div className="space-y-6">
      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Opportunités de tarification
            </CardTitle>
            <Button 
              className="flex items-center gap-2"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Nouvelle opportunité
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((opportunity) => {
            const clientInfo = getClientInfo(opportunity);
            
            return (
              <Card key={opportunity.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {opportunity.departure_city} → {opportunity.arrival_city}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(opportunity.status)}>
                      {getStatusLabel(opportunity.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Informations client */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Informations client
                    </h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 text-blue-800">
                        <User className="h-3 w-3" />
                        <span className="font-medium">{clientInfo.name}</span>
                      </div>
                      {clientInfo.email && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{clientInfo.email}</span>
                        </div>
                      )}
                      {clientInfo.phone && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Phone className="h-3 w-3" />
                          <span>{clientInfo.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{opportunity.estimated_volume}</div>
                      <div className="text-xs text-gray-600">m³ estimés</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-sm font-bold text-green-600 flex items-center justify-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(opportunity.desired_date), 'dd/MM', { locale: fr })}
                      </div>
                      <div className="text-xs text-gray-600">Date souhaitée</div>
                    </div>
                  </div>

                  {opportunity.budget_range_min && opportunity.budget_range_max && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Budget client :</span>
                        <span className="font-medium flex items-center gap-1">
                          <Euro className="h-3 w-3" />
                          {opportunity.budget_range_min.toLocaleString()} - {opportunity.budget_range_max.toLocaleString()}€
                        </span>
                      </div>
                    </div>
                  )}

                  {opportunity.special_requirements && (
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <h4 className="text-xs font-medium text-yellow-700 uppercase tracking-wide mb-1">
                        Exigences particulières
                      </h4>
                      <p className="text-xs text-yellow-800">{opportunity.special_requirements}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleFindBestPrices(opportunity)}
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Trouver les prix
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditOpportunity(opportunity)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" title="Fonctionnalité à venir">
                      <BarChart3 className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" title="Fonctionnalité à venir">
                      <Clock className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" title="Fonctionnalité à venir">
                      <FileText className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-gray-500 mb-4">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Aucune opportunité trouvée</h3>
              <p className="text-sm">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucune opportunité ne correspond à vos critères.'
                  : 'Commencez par créer votre première opportunité.'}
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une opportunité
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <BestPricesDialog
        open={showBestPrices}
        onOpenChange={setShowBestPrices}
        opportunity={selectedOpportunity}
        suppliers={suppliers || []}
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
  );
};

export default OpportunitiesTab;
