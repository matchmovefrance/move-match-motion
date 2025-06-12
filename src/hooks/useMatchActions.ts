
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

      // Insérer le match accepté dans move_matches
      const { error: matchError } = await supabase
        .from('move_matches')
        .insert({
          client_id: matchData.client.id,
          move_id: matchData.move.id,
          match_type: matchData.is_valid ? 'perfect' : 'partial',
          volume_ok: matchData.volume_compatible,
          combined_volume: matchData.available_volume_after,
          distance_km: matchData.distance_km,
          date_diff_days: matchData.date_diff_days,
          is_valid: matchData.is_valid
        });

      if (matchError) throw matchError;

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

      // Mettre à jour le volume utilisé du trajet
      const newUsedVolume = (matchData.move.used_volume || 0) + (matchData.client.estimated_volume || 0);
      const { error: moveError } = await supabase
        .from('confirmed_moves')
        .update({ 
          used_volume: newUsedVolume,
          status: 'confirmed',
          number_of_clients: (matchData.move.number_of_clients || 0) + 1
        })
        .eq('id', matchData.move.id);

      if (moveError) throw moveError;

      toast({
        title: "Match accepté",
        description: `Le devis ${matchData.match_reference} a été accepté avec succès`,
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

      // Insérer le match rejeté dans move_matches avec statut rejeté
      const { error: matchError } = await supabase
        .from('move_matches')
        .insert({
          client_id: matchData.client.id,
          move_id: matchData.move.id,
          match_type: 'rejected',
          volume_ok: matchData.volume_compatible,
          combined_volume: 0,
          distance_km: matchData.distance_km,
          date_diff_days: matchData.date_diff_days,
          is_valid: false
        });

      if (matchError) throw matchError;

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

  return {
    acceptMatch,
    rejectMatch,
    markAsCompleted,
    loading
  };
};
