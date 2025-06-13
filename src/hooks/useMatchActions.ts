
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useMatchActions = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const acceptMatch = async (matchData: any) => {
    try {
      setLoading(true);
      console.log('✅ Acceptation du match:', matchData.match_reference);

      // Vérifier si ce match existe déjà dans analytics pour éviter les doublons
      const { data: existingMatch, error: checkError } = await supabase
        .from('move_matches')
        .select('id')
        .eq('client_id', matchData.client.id)
        .eq('move_id', matchData.move.id)
        .eq('match_type', 'accepted_match')
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // N'enregistrer dans analytics que si le match n'existe pas déjà
      if (!existingMatch) {
        console.log('📊 Enregistrement match analytics:', matchData.match_reference);
        
        const { error: analyticsError } = await supabase
          .from('move_matches')
          .insert({
            client_id: matchData.client.id,
            move_id: matchData.move.id,
            match_type: 'accepted_match',
            volume_ok: matchData.volume_compatible,
            combined_volume: matchData.available_volume_after,
            distance_km: matchData.distance_km,
            date_diff_days: matchData.date_diff_days,
            is_valid: true
          });

        if (analyticsError) {
          console.warn('⚠️ Erreur enregistrement analytics (non bloquant):', analyticsError);
        } else {
          console.log('✅ Match enregistré dans analytics');
        }
      } else {
        console.log('⚠️ Match déjà existant dans analytics, passage');
      }

      // Créer une opportunité dans pricing_opportunities
      const opportunityData = {
        title: `Déménagement ${matchData.client.departure_postal_code} → ${matchData.client.arrival_postal_code}`,
        description: `Match accepté pour ${matchData.client.name}`,
        departure_address: matchData.client.departure_address || '',
        departure_city: matchData.client.departure_city || '',
        departure_postal_code: matchData.client.departure_postal_code,
        departure_country: matchData.client.departure_country || 'France',
        arrival_address: matchData.client.arrival_address || '',
        arrival_city: matchData.client.arrival_city || '',
        arrival_postal_code: matchData.client.arrival_postal_code,
        arrival_country: matchData.client.arrival_country || 'France',
        desired_date: matchData.client.desired_date,
        estimated_volume: matchData.client.estimated_volume || 0,
        flexible_dates: matchData.client.flexible_dates || false,
        date_range_start: matchData.client.date_range_start,
        date_range_end: matchData.client.date_range_end,
        budget_range_min: matchData.client.budget_min,
        budget_range_max: matchData.client.budget_max,
        special_requirements: matchData.client.special_requirements,
        status: 'active',
        client_request_id: matchData.client.id,
        priority: 1,
        created_by: (await supabase.auth.getUser()).data.user?.id
      };

      const { data: opportunity, error: oppError } = await supabase
        .from('pricing_opportunities')
        .insert(opportunityData)
        .select()
        .single();

      if (oppError) throw oppError;

      // Chercher ou créer un fournisseur pour le transporteur
      const { data: existingSupplier, error: supplierSearchError } = await supabase
        .from('suppliers')
        .select('id')
        .eq('company_name', matchData.move.company_name)
        .maybeSingle();

      if (supplierSearchError) throw supplierSearchError;

      let supplierId = existingSupplier?.id;

      // Si le fournisseur n'existe pas, le créer
      if (!supplierId) {
        const { data: newSupplier, error: supplierCreateError } = await supabase
          .from('suppliers')
          .insert({
            company_name: matchData.move.company_name,
            contact_name: matchData.move.mover_name || 'Contact transporteur',
            email: matchData.move.contact_email || 'contact@example.com',
            phone: matchData.move.contact_phone || 'À renseigner',
            address: 'Adresse à renseigner',
            city: 'Ville à renseigner',
            postal_code: '00000',
            country: 'France',
            created_by: (await supabase.auth.getUser()).data.user?.id
          })
          .select('id')
          .single();

        if (supplierCreateError) throw supplierCreateError;
        supplierId = newSupplier.id;
      }

      // Créer le devis accepté dans quotes
      const { error: quoteError } = await supabase
        .from('quotes')
        .insert({
          opportunity_id: opportunity.id,
          supplier_id: supplierId,
          bid_amount: 0, // Sera calculé par le moteur de pricing
          status: 'accepted',
          notes: `Devis auto-accepté via match ${matchData.match_reference} - Transporteur: ${matchData.move.company_name}`,
          cost_breakdown: {
            match_reference: matchData.match_reference,
            move_id: matchData.move.id,
            distance_km: matchData.distance_km,
            date_diff_days: matchData.date_diff_days,
            volume_after: matchData.available_volume_after
          },
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (quoteError) throw quoteError;

      // Mettre à jour le statut du client
      const { error: clientError } = await supabase
        .from('clients')
        .update({ 
          status: 'confirmed',
          match_status: 'accepted',
          is_matched: true,
          matched_at: new Date().toISOString()
        })
        .eq('id', matchData.client.id);

      if (clientError) throw clientError;

      // IMPORTANT: Mettre à jour le volume utilisé du trajet correctement
      const newUsedVolume = (matchData.move.used_volume || 0) + (matchData.client.estimated_volume || 0);
      const newAvailableVolume = Math.max(0, (matchData.move.available_volume || 0) - (matchData.client.estimated_volume || 0));
      
      const { error: moveError } = await supabase
        .from('confirmed_moves')
        .update({ 
          used_volume: newUsedVolume,
          available_volume: newAvailableVolume, // Mise à jour du volume disponible
          status: 'confirmed',
          number_of_clients: (matchData.move.number_of_clients || 0) + 1
        })
        .eq('id', matchData.move.id);

      if (moveError) throw moveError;

      toast({
        title: "Match accepté",
        description: `Le devis ${matchData.match_reference} a été accepté et ajouté à l'historique`,
      });

      return true;
    } catch (error) {
      console.error('❌ Erreur acceptation match:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accepter le match",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const rejectMatch = async (matchData: any) => {
    try {
      setLoading(true);
      console.log('❌ Rejet du match:', matchData.match_reference);

      // Vérifier si ce match existe déjà dans analytics pour éviter les doublons
      const { data: existingMatch, error: checkError } = await supabase
        .from('move_matches')
        .select('id')
        .eq('client_id', matchData.client.id)
        .eq('move_id', matchData.move.id)
        .eq('match_type', 'rejected_manual')
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // N'enregistrer dans analytics que si le match n'existe pas déjà
      if (!existingMatch) {
        console.log('📊 Enregistrement match rejeté analytics:', matchData.match_reference);
        
        const { error: analyticsError } = await supabase
          .from('move_matches')
          .insert({
            client_id: matchData.client.id,
            move_id: matchData.move.id,
            match_type: 'rejected_manual',
            volume_ok: matchData.volume_compatible,
            combined_volume: 0,
            distance_km: matchData.distance_km,
            date_diff_days: matchData.date_diff_days,
            is_valid: matchData.is_valid
          });

        if (analyticsError) {
          console.warn('⚠️ Erreur enregistrement analytics rejet (non bloquant):', analyticsError);
        }
      } else {
        console.log('⚠️ Match rejeté déjà existant dans analytics, passage');
      }

      // Mettre à jour le statut du client
      const { error: clientError } = await supabase
        .from('clients')
        .update({ 
          match_status: 'rejected'
        })
        .eq('id', matchData.client.id);

      if (clientError) throw clientError;

      toast({
        title: "Match rejeté",
        description: `Le devis ${matchData.match_reference} a été rejeté`,
      });

      return true;
    } catch (error) {
      console.error('❌ Erreur rejet match:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rejeter le match",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async (matchId: number) => {
    try {
      setLoading(true);
      console.log('🏁 Marquage trajet terminé:', matchId);

      // Mettre à jour le statut du match
      const { error } = await supabase
        .from('move_matches')
        .update({ 
          match_type: 'completed'
        })
        .eq('id', matchId);

      if (error) throw error;

      toast({
        title: "Trajet terminé",
        description: "Le trajet a été marqué comme terminé",
      });

      return true;
    } catch (error) {
      console.error('❌ Erreur marquage terminé:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer le trajet comme terminé",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteAcceptedMatch = async (quoteId: string, clientId: number) => {
    try {
      setLoading(true);
      console.log('🗑️ Suppression devis accepté:', quoteId);

      // Supprimer le devis
      const { error: quoteError } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId);

      if (quoteError) throw quoteError;

      // Remettre le client en statut pending pour permettre de nouveaux matchs
      const { error: clientError } = await supabase
        .from('clients')
        .update({ 
          status: 'pending',
          match_status: null,
          is_matched: false,
          matched_at: null
        })
        .eq('id', clientId);

      if (clientError) throw clientError;

      toast({
        title: "Devis supprimé",
        description: "Le devis accepté a été supprimé. Le client peut maintenant recevoir de nouveaux matchs.",
      });

      return true;
    } catch (error) {
      console.error('❌ Erreur suppression devis:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le devis",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    acceptMatch,
    rejectMatch,
    markAsCompleted,
    deleteAcceptedMatch,
    loading
  };
};
