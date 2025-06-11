
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, User, Building, Euro, Calendar, Download, Check, Archive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AcceptedQuoteWithDetails {
  id: string;
  bid_amount: number;
  status: string;
  notes: string | null;
  submitted_at: string;
  supplier: {
    company_name: string;
    contact_name: string;
    email: string;
    phone: string;
  };
  opportunity: {
    title: string;
    departure_city: string;
    arrival_city: string;
  };
}

const AcceptedQuotesTab = () => {
  const { toast } = useToast();

  const { data: acceptedQuotes, isLoading, refetch } = useQuery({
    queryKey: ['accepted-quotes'],
    queryFn: async () => {
      console.log('📋 Chargement des devis acceptés...');
      
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          supplier:suppliers(company_name, contact_name, email, phone),
          opportunity:pricing_opportunities(title, departure_city, arrival_city)
        `)
        .in('status', ['accepted', 'validated_by_client']);

      if (error) throw error;
      
      // Filtrer les devis avec des prestataires demo ou invalides
      const filteredData = (data as AcceptedQuoteWithDetails[])?.filter(quote => {
        const supplierName = quote.supplier?.company_name?.toLowerCase() || '';
        const isDemo = supplierName.includes('demo') || 
                      supplierName.includes('test') || 
                      supplierName.includes('exemple') ||
                      supplierName.includes('sample');
        return !isDemo && quote.supplier && quote.opportunity;
      }) || [];

      console.log('✅ Devis acceptés chargés (sans demo):', filteredData.length);
      return filteredData;
    },
    refetchInterval: 5000,
  });

  const handleMarkAsValidated = async (quoteId: string) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'validated_by_client' })
        .eq('id', quoteId);

      if (error) throw error;

      toast({
        title: "Devis validé",
        description: "Le devis a été marqué comme validé par le client.",
      });

      refetch();
    } catch (error) {
      console.error('❌ Erreur validation devis:', error);
      toast({
        title: "Erreur",
        description: "Impossible de valider le devis",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsCompleted = async (quoteId: string, quoteBidAmount: number, supplierName: string) => {
    try {
      // Marquer le devis comme terminé
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({ status: 'completed' })
        .eq('id', quoteId);

      if (quoteError) throw quoteError;

      // Récupérer l'opportunité liée
      const { data: quote, error: fetchError } = await supabase
        .from('quotes')
        .select(`
          opportunity_id,
          opportunity:pricing_opportunities(client_request_id)
        `)
        .eq('id', quoteId)
        .single();

      if (fetchError) throw fetchError;

      // Si il y a une demande client liée, la marquer comme terminée
      if (quote?.opportunity?.client_request_id) {
        const { error: clientError } = await supabase
          .from('client_requests')
          .update({ 
            status: 'completed',
            quote_amount: quoteBidAmount
          })
          .eq('id', quote.opportunity.client_request_id);

        if (clientError) console.warn('⚠️ Erreur mise à jour client:', clientError);
      }

      // Marquer l'opportunité comme terminée
      const { error: oppError } = await supabase
        .from('pricing_opportunities')
        .update({ status: 'completed' })
        .eq('id', quote.opportunity_id);

      if (oppError) console.warn('⚠️ Erreur mise à jour opportunité:', oppError);

      toast({
        title: "Trajet terminé",
        description: `Le trajet avec ${supplierName} a été marqué comme terminé et déplacé vers l'historique.`,
      });

      refetch();
    } catch (error) {
      console.error('❌ Erreur marquage terminé:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer le trajet comme terminé",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = (quote: AcceptedQuoteWithDetails) => {
    toast({
      title: "Téléchargement PDF",
      description: `Le PDF du devis de ${quote.supplier.company_name} va être téléchargé.`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge variant="secondary">En attente validation client</Badge>;
      case 'validated_by_client':
        return <Badge className="bg-green-100 text-green-800">Validé par le client</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Devis acceptés en cours de validation
          </CardTitle>
          <CardDescription>
            Gestion des devis acceptés et validation par les clients
          </CardDescription>
        </CardHeader>
      </Card>

      {acceptedQuotes && acceptedQuotes.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opportunité</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead className="text-center">Prix</TableHead>
                  <TableHead className="text-center">Date d'acceptation</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acceptedQuotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{quote.opportunity?.title || 'Opportunité supprimée'}</div>
                        {quote.opportunity && (
                          <div className="text-sm text-muted-foreground">
                            {quote.opportunity.departure_city} → {quote.opportunity.arrival_city}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{quote.supplier?.company_name || 'Fournisseur supprimé'}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {quote.supplier?.contact_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {quote.supplier?.email}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Euro className="h-4 w-4 text-green-600" />
                        <span className="font-bold text-lg">{quote.bid_amount.toLocaleString()}€</span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(quote.submitted_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      {getStatusBadge(quote.status)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(quote)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                        
                        {quote.status === 'accepted' && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsValidated(quote.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Validé
                          </Button>
                        )}
                        
                        {quote.status === 'validated_by_client' && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsCompleted(quote.id, quote.bid_amount, quote.supplier?.company_name || 'Fournisseur')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Archive className="h-4 w-4 mr-1" />
                            Trajet terminé
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-muted-foreground mb-4">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Aucun devis accepté</h3>
              <p className="text-sm">
                Les devis acceptés apparaîtront ici en attente de validation client.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AcceptedQuotesTab;
