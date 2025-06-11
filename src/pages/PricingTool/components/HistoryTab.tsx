
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Filter, 
  Calendar,
  MapPin,
  Package,
  Euro,
  RefreshCw,
  AlertCircle,
  Archive,
  CheckCircle,
  XCircle,
  Trash2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const HistoryTab = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const { toast } = useToast();

  // Charger l'historique des dossiers cloturés
  const { data: historyItems, isLoading, error, refetch } = useQuery({
    queryKey: ['client-history', statusFilter, searchTerm, dateFilter],
    queryFn: async () => {
      console.log('📚 Chargement de l\'historique...');
      
      let query = supabase
        .from('client_requests')
        .select('*')
        .in('status', ['completed', 'cancelled', 'closed'])
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,departure_city.ilike.%${searchTerm}%,arrival_city.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      // Filtre par date
      if (dateFilter !== 'all') {
        const now = new Date();
        let dateThreshold = new Date();
        
        switch (dateFilter) {
          case 'last_week':
            dateThreshold.setDate(now.getDate() - 7);
            break;
          case 'last_month':
            dateThreshold.setMonth(now.getMonth() - 1);
            break;
          case 'last_3_months':
            dateThreshold.setMonth(now.getMonth() - 3);
            break;
          case 'last_year':
            dateThreshold.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        if (dateFilter !== 'all') {
          query = query.gte('created_at', dateThreshold.toISOString());
        }
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Erreur chargement historique:', error);
        throw error;
      }
      
      console.log('✅ Historique chargé:', data?.length || 0);
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Charger aussi les devis terminés
  const { data: completedQuotes } = useQuery({
    queryKey: ['completed-quotes', searchTerm],
    queryFn: async () => {
      console.log('📋 Chargement des devis terminés...');
      
      let query = supabase
        .from('quotes')
        .select(`
          *,
          supplier:suppliers(company_name, contact_name),
          opportunity:pricing_opportunities(title, departure_city, arrival_city, desired_date)
        `)
        .eq('status', 'completed')
        .order('submitted_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`notes.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Erreur chargement devis terminés:', error);
        return [];
      }
      
      // Filtrer les devis avec des prestataires demo
      const filteredData = data?.filter(quote => {
        const supplierName = quote.supplier?.company_name?.toLowerCase() || '';
        const isDemo = supplierName.includes('demo') || 
                      supplierName.includes('test') || 
                      supplierName.includes('exemple') ||
                      supplierName.includes('sample');
        return !isDemo && quote.supplier && quote.opportunity;
      }) || [];
      
      console.log('✅ Devis terminés chargés (sans demo):', filteredData.length);
      return filteredData;
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleDeleteHistoryItem = async (itemId: string | number, itemType: 'client_request' | 'quote') => {
    try {
      // Convert itemId to string to ensure consistency with UUID format
      const id = String(itemId);
      
      if (itemType === 'client_request') {
        const { error } = await supabase
          .from('client_requests')
          .delete()
          .eq('id', id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('quotes')
          .delete()
          .eq('id', id);

        if (error) throw error;
      }

      toast({
        title: "Élément supprimé",
        description: "L'élément a été supprimé définitivement de l'historique.",
      });

      refetch();
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'élément",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      case 'closed': return 'Fermé';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'closed': return <Archive className="h-4 w-4 text-gray-600" />;
      default: return <Archive className="h-4 w-4 text-gray-600" />;
    }
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2 text-red-700">Erreur de chargement</h3>
        <p className="text-red-600 mb-4">Impossible de charger l'historique</p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  const totalItems = (historyItems?.length || 0) + (completedQuotes?.length || 0);
  const completedItems = (historyItems?.filter(item => item.status === 'completed').length || 0) + (completedQuotes?.length || 0);
  const cancelledItems = historyItems?.filter(item => item.status === 'cancelled').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Historique & Dossiers Cloturés</h2>
          <p className="text-muted-foreground">
            Consultez l'historique des dossiers terminés, annulés ou fermés
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher dans l'historique..."
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
            <SelectItem value="completed">Terminés</SelectItem>
            <SelectItem value="cancelled">Annulés</SelectItem>
            <SelectItem value="closed">Fermés</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les dates</SelectItem>
            <SelectItem value="last_week">Dernière semaine</SelectItem>
            <SelectItem value="last_month">Dernier mois</SelectItem>
            <SelectItem value="last_3_months">3 derniers mois</SelectItem>
            <SelectItem value="last_year">Dernière année</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium leading-none">Trajets terminés</p>
                <p className="text-2xl font-bold text-green-600">{completedItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium leading-none">Trajets annulés</p>
                <p className="text-2xl font-bold text-red-600">{cancelledItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Archive className="h-4 w-4 text-gray-600" />
              <div>
                <p className="text-sm font-medium leading-none">Total historique</p>
                <p className="text-2xl font-bold text-gray-600">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste de l'historique */}
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
      ) : totalItems === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun élément dans l'historique</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Aucun élément ne correspond à vos critères de recherche'
                : 'Aucun dossier cloturé pour le moment'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {/* Demandes clients terminées */}
          {historyItems?.map((item) => (
            <Card key={`client-${item.id}`} className="hover:shadow-md transition-shadow opacity-75">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(item.status)}
                      <CardTitle className="text-lg">
                        {item.name || `Client #${item.id}`}
                      </CardTitle>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(item.status)}
                      >
                        {getStatusLabel(item.status)}
                      </Badge>
                    </div>
                    {item.email && (
                      <CardDescription className="text-sm">
                        {item.email}
                      </CardDescription>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteHistoryItem(item.id, 'client_request')}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Route:</span>
                    <span>{item.departure_city} → {item.arrival_city}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Volume:</span>
                    <span>{item.estimated_volume}m³</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Date:</span>
                    <span>{format(new Date(item.desired_date), 'dd/MM/yyyy', { locale: fr })}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Cloturé le:</span>
                    <span>{format(new Date(item.created_at), 'dd/MM/yyyy', { locale: fr })}</span>
                  </div>
                </div>
                
                {item.quote_amount && (
                  <div className="mt-3 p-2 bg-green-50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Montant final: {item.quote_amount}€
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Devis terminés */}
          {completedQuotes?.map((quote) => (
            <Card key={`quote-${quote.id}`} className="hover:shadow-md transition-shadow opacity-75 border-blue-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <CardTitle className="text-lg">
                        Devis terminé - {quote.opportunity?.title}
                      </CardTitle>
                      <Badge className="bg-blue-100 text-blue-800">
                        Devis terminé
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      {quote.supplier?.company_name} • {quote.supplier?.contact_name}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteHistoryItem(quote.id, 'quote')}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Route:</span>
                    <span>{quote.opportunity?.departure_city} → {quote.opportunity?.arrival_city}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Montant:</span>
                    <span>{quote.bid_amount.toLocaleString()}€</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Date souhaitée:</span>
                    <span>{quote.opportunity?.desired_date ? format(new Date(quote.opportunity.desired_date), 'dd/MM/yyyy', { locale: fr }) : 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Terminé le:</span>
                    <span>{format(new Date(quote.submitted_at), 'dd/MM/yyyy', { locale: fr })}</span>
                  </div>
                </div>
                
                {quote.notes && (
                  <div className="mt-3 p-2 bg-gray-50 rounded-md">
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Notes: </span>
                      {quote.notes}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
