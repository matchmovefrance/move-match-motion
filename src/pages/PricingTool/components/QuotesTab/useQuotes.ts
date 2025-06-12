
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { pricingEngine } from '../PricingEngine';

interface GeneratedQuote {
  id: string;
  client_id: number;
  client_name: string;
  client_email: string;
  departure_city: string;
  arrival_city: string;
  estimated_volume: number;
  desired_date: string;
  supplier_id: string;
  supplier_name: string;
  supplier_company: string;
  calculated_price: number;
  supplier_price: number;
  matchmove_margin: number;
  original_quote_amount?: number;
  pricing_breakdown?: any;
  rank: number;
}

export const useQuotes = () => {
  const { toast } = useToast();
  const [generatedQuotes, setGeneratedQuotes] = useState<GeneratedQuote[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: activeClients, refetch: refetchClients } = useQuery({
    queryKey: ['active-clients'],
    queryFn: async () => {
      console.log('🔍 Fetching active clients from unified clients table...');
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .in('status', ['pending', 'confirmed'])
        .not('departure_postal_code', 'is', null)
        .not('arrival_postal_code', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching clients:', error);
        throw error;
      }
      
      console.log('✅ Active clients loaded:', data?.length || 0);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (activeClients?.length && generatedQuotes.length === 0) {
      generateAllQuotes();
    }
  }, [activeClients]);

  const generateAllQuotes = async () => {
    if (!activeClients?.length) {
      console.log('⚠️ No active clients to generate quotes for');
      return;
    }
    
    setIsGenerating(true);
    console.log('🔄 Génération des devis avec distances exactes Google Maps...');
    
    setGeneratedQuotes([]);
    
    try {
      const allQuotes: GeneratedQuote[] = [];
      
      for (const client of activeClients) {
        console.log(`🗺️ Calcul distances exactes pour ${client.name}: ${client.departure_postal_code} -> ${client.arrival_postal_code}`);
        const clientQuotes = await pricingEngine.generateQuotesForClient(client);
        allQuotes.push(...clientQuotes);
      }
      
      setGeneratedQuotes(allQuotes);
      console.log('✅ Devis générés avec distances exactes Google Maps:', allQuotes.length);
      
      toast({
        title: "Devis générés avec distances exactes",
        description: `${allQuotes.length} devis calculés avec les vraies distances Google Maps`,
      });
      
    } catch (error) {
      console.error('❌ Erreur génération devis:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer les devis",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptQuote = async (quote: GeneratedQuote) => {
    try {
      console.log('✅ Acceptation devis:', quote.id);
      
      const { error } = await supabase
        .from('quotes')
        .insert({
          opportunity_id: quote.client_id.toString(),
          supplier_id: quote.supplier_id,
          bid_amount: quote.calculated_price,
          status: 'accepted',
          notes: `Devis généré automatiquement - Rang #${quote.rank} pour ${quote.client_name}`,
          cost_breakdown: quote.pricing_breakdown,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      setGeneratedQuotes(prev => prev.filter(q => q.id !== quote.id));
      
      toast({
        title: "Devis accepté",
        description: `Le devis de ${quote.supplier_company} pour ${quote.client_name} a été accepté`,
      });
      
    } catch (error) {
      console.error('❌ Erreur acceptation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accepter le devis",
        variant: "destructive",
      });
    }
  };

  const handleRejectQuote = async (quote: GeneratedQuote) => {
    try {
      console.log('❌ Rejet devis:', quote.id);
      
      const { error } = await supabase
        .from('quotes')
        .insert({
          opportunity_id: quote.client_id.toString(),
          supplier_id: quote.supplier_id,
          bid_amount: quote.calculated_price,
          status: 'rejected',
          notes: `Devis rejeté - Rang #${quote.rank} pour ${quote.client_name}`,
          cost_breakdown: quote.pricing_breakdown,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      setGeneratedQuotes(prev => prev.filter(q => q.id !== quote.id));
      
      toast({
        title: "Devis rejeté",
        description: `Le devis de ${quote.supplier_company} pour ${quote.client_name} a été rejeté`,
      });
      
    } catch (error) {
      console.error('❌ Erreur rejet:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rejeter le devis",
        variant: "destructive",
      });
    }
  };

  return {
    activeClients,
    generatedQuotes,
    isGenerating,
    generateAllQuotes,
    handleAcceptQuote,
    handleRejectQuote
  };
};
