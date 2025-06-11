
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

export const useAcceptedQuotes = () => {
  const { toast } = useToast();
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<AcceptedQuoteWithDetails | null>(null);

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

  const handleShowCompleteDialog = (quote: AcceptedQuoteWithDetails) => {
    setSelectedQuote(quote);
    setShowCompleteDialog(true);
  };

  const handleConfirmComplete = async () => {
    if (!selectedQuote) return;

    try {
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({ status: 'completed' })
        .eq('id', selectedQuote.id);

      if (quoteError) throw quoteError;

      const { data: quote, error: fetchError } = await supabase
        .from('quotes')
        .select(`
          opportunity_id,
          opportunity:pricing_opportunities(client_request_id)
        `)
        .eq('id', selectedQuote.id)
        .single();

      if (fetchError) throw fetchError;

      if (quote?.opportunity?.client_request_id) {
        const { error: clientError } = await supabase
          .from('client_requests')
          .update({ 
            status: 'completed',
            quote_amount: selectedQuote.bid_amount
          })
          .eq('id', quote.opportunity.client_request_id);

        if (clientError) console.warn('⚠️ Erreur mise à jour client:', clientError);
      }

      const { error: oppError } = await supabase
        .from('pricing_opportunities')
        .update({ status: 'completed' })
        .eq('id', quote.opportunity_id);

      if (oppError) console.warn('⚠️ Erreur mise à jour opportunité:', oppError);

      toast({
        title: "Trajet terminé",
        description: `Le trajet avec ${selectedQuote.supplier?.company_name} a été marqué comme terminé et déplacé vers l'historique.`,
      });

      setShowCompleteDialog(false);
      setSelectedQuote(null);
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

  return {
    acceptedQuotes,
    isLoading,
    showCompleteDialog,
    setShowCompleteDialog,
    selectedQuote,
    handleMarkAsValidated,
    handleShowCompleteDialog,
    handleConfirmComplete,
    handleDownloadPDF
  };
};
