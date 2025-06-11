import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Check, X, Eye, BarChart3, Euro, Clock, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface QuoteWithDetails {
  id: string;
  bid_amount: number;
  status: string;
  notes: string | null;
  response_time_hours: number | null;
  submitted_at: string;
  supplier: {
    company_name: string;
    contact_name: string;
  };
  opportunity: {
    title: string;
    departure_city: string;
    arrival_city: string;
  };
}

const QuotesTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('submitted_at');

  const { data: quotes, isLoading, refetch } = useQuery({
    queryKey: ['quotes', searchTerm, statusFilter, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('quotes')
        .select(`
          *,
          supplier:suppliers(company_name, contact_name),
          opportunity:pricing_opportunities(title, departure_city, arrival_city)
        `);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.or(`notes.ilike.%${searchTerm}%`);
      }

      query = query.order(sortBy, { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      
      // Filtrer les devis avec des prestataires demo ou invalides
      const filteredData = (data as QuoteWithDetails[])?.filter(quote => {
        const supplierName = quote.supplier?.company_name?.toLowerCase() || '';
        const isDemo = supplierName.includes('demo') || 
                      supplierName.includes('test') || 
                      supplierName.includes('exemple') ||
                      supplierName.includes('sample');
        return !isDemo && quote.supplier && quote.opportunity;
      }) || [];

      console.log('📋 Devis filtrés (sans demo):', filteredData.length);
      return filteredData;
    },
    refetchInterval: 5000,
  });

  const updateQuoteStatus = async (quoteId: string, status: string) => {
    const { error } = await supabase
      .from('quotes')
      .update({ status })
      .eq('id', quoteId);

    if (error) {
      console.error('Error updating quote:', error);
      return;
    }

    refetch();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'accepted': return 'Accepté';
      case 'rejected': return 'Rejeté';
      case 'expired': return 'Expiré';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
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
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Moteur de comparaison des devis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher dans les notes..."
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
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="accepted">Acceptés</SelectItem>
                <SelectItem value="rejected">Rejetés</SelectItem>
                <SelectItem value="expired">Expirés</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="submitted_at">Date de soumission</SelectItem>
                <SelectItem value="bid_amount">Montant</SelectItem>
                <SelectItem value="response_time_hours">Temps de réponse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quotes List */}
      {quotes && quotes.length > 0 ? (
        <div className="space-y-4">
          {quotes.map((quote) => (
            <Card key={quote.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {quote.opportunity?.title || 'Opportunité supprimée'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span>{quote.supplier?.company_name || 'Fournisseur supprimé'}</span>
                      <span className="text-xs">
                        par {quote.supplier?.contact_name}
                      </span>
                      {quote.opportunity && (
                        <span className="text-xs">
                          {quote.opportunity.departure_city} → {quote.opportunity.arrival_city}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(quote.status)}>
                    {getStatusLabel(quote.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-1">
                      <Euro className="h-5 w-5" />
                      {quote.bid_amount.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">Montant du devis</div>
                  </div>
                  
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-semibold text-green-600 flex items-center justify-center gap-1">
                      <Clock className="h-4 w-4" />
                      {quote.response_time_hours || 'N/A'}h
                    </div>
                    <div className="text-xs text-gray-600">Temps de réponse</div>
                  </div>
                  
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-sm font-semibold text-purple-600 flex items-center justify-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(quote.submitted_at), 'dd/MM', { locale: fr })}
                    </div>
                    <div className="text-xs text-gray-600">Date de soumission</div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-semibold text-gray-600">
                      {quote.notes ? 'Avec notes' : 'Sans notes'}
                    </div>
                    <div className="text-xs text-gray-600">Annotations</div>
                  </div>
                </div>

                {quote.notes && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <h4 className="text-sm font-medium mb-1">Notes du fournisseur:</h4>
                    <p className="text-sm text-gray-700">{quote.notes}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Soumis le {format(new Date(quote.submitted_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                  </div>
                  
                  {quote.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateQuoteStatus(quote.id, 'rejected')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Rejeter
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => updateQuoteStatus(quote.id, 'accepted')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accepter
                      </Button>
                    </div>
                  )}
                  
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Détails
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-gray-500 mb-4">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Aucun devis trouvé</h3>
              <p className="text-sm">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucun devis ne correspond à vos critères.'
                  : 'Les devis soumis par les fournisseurs apparaîtront ici.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuotesTab;
