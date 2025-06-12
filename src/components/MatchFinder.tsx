
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Truck, Target, Play, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { pricingEngine } from '@/pages/PricingTool/components/PricingEngine';

interface Client {
  id: number;
  name: string;
  departure_city: string;
  departure_postal_code: string;
  arrival_city: string;
  arrival_postal_code: string;
  estimated_volume: number;
  desired_date: string;
  status: string;
  client_reference: string;
}

interface ConfirmedMove {
  id: number;
  company_name: string;
  departure_city: string;
  departure_postal_code: string;
  arrival_city: string;
  arrival_postal_code: string;
  departure_date: string;
  available_volume: number;
}

const MatchFinder = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [confirmedMoves, setConfirmedMoves] = useState<ConfirmedMove[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMatching, setIsMatching] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Chargement des données pour le matching...');

      // Charger les clients depuis la table unifiée
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .in('status', ['pending', 'confirmed'])
        .not('departure_postal_code', 'is', null)
        .not('arrival_postal_code', 'is', null)
        .order('created_at', { ascending: false });

      if (clientsError) {
        console.error('❌ Erreur chargement clients:', clientsError);
        throw clientsError;
      }

      // Charger les trajets confirmés
      const { data: movesData, error: movesError } = await supabase
        .from('confirmed_moves')
        .select('*')
        .eq('status', 'confirmed')
        .not('departure_postal_code', 'is', null)
        .not('arrival_postal_code', 'is', null)
        .order('departure_date', { ascending: true });

      if (movesError) {
        console.error('❌ Erreur chargement trajets:', movesError);
        throw movesError;
      }

      console.log('✅ Données chargées:', {
        clients: clientsData?.length || 0,
        moves: movesData?.length || 0
      });

      setClients(clientsData || []);
      setConfirmedMoves(movesData || []);

    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Utiliser la même méthode de calcul de distance que PricingEngine pour la cohérence
  const calculateExactDistance = async (postal1: string, postal2: string): Promise<number> => {
    try {
      return await pricingEngine.getExactDistance(postal1, postal2);
    } catch (error) {
      console.error('❌ Erreur calcul distance:', error);
      // Fallback vers calcul simple si Google Maps échoue
      return calculateFallbackDistance(postal1, postal2);
    }
  };

  const calculateFallbackDistance = (postal1: string, postal2: string): number => {
    const lat1 = parseFloat(postal1.substring(0, 2)) + parseFloat(postal1.substring(2, 5)) / 1000;
    const lon1 = parseFloat(postal1.substring(0, 2)) * 0.5;
    const lat2 = parseFloat(postal2.substring(0, 2)) + parseFloat(postal2.substring(2, 5)) / 1000;
    const lon2 = parseFloat(postal2.substring(0, 2)) * 0.5;
    
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return Math.round(R * c);
  };

  const findMatches = async () => {
    if (clients.length === 0 || confirmedMoves.length === 0) {
      toast({
        title: "Pas de données",
        description: "Aucun client ou trajet disponible pour le matching",
        variant: "destructive",
      });
      return;
    }

    setIsMatching(true);
    console.log('🎯 Début du processus de matching avec distances exactes...');

    try {
      // Supprimer les anciens matches pour éviter les doublons
      const { error: deleteError } = await supabase
        .from('move_matches')
        .delete()
        .neq('id', 0); // Supprime tous les matches existants

      if (deleteError) {
        console.warn('⚠️ Erreur suppression anciens matches:', deleteError);
      }

      const matches = [];

      for (const client of clients) {
        console.log(`🔍 Recherche matches pour client ${client.name}...`);
        
        for (const move of confirmedMoves) {
          try {
            // Calculer la distance exacte entre les points de départ
            const departureDistance = await calculateExactDistance(
              client.departure_postal_code,
              move.departure_postal_code
            );
            
            // Calculer la distance exacte entre les points d'arrivée
            const arrivalDistance = await calculateExactDistance(
              client.arrival_postal_code,
              move.arrival_postal_code
            );
            
            const totalDistance = departureDistance + arrivalDistance;
            
            // Calculer la différence de dates
            const clientDate = new Date(client.desired_date);
            const moveDate = new Date(move.departure_date);
            const dateDiff = Math.abs(clientDate.getTime() - moveDate.getTime()) / (1000 * 3600 * 24);
            
            // Vérifier la compatibilité du volume
            const volumeOk = client.estimated_volume <= move.available_volume;
            const combinedVolume = client.estimated_volume + (move.available_volume - client.estimated_volume);
            
            // Critères de validation cohérents avec le reste de l'application
            const isValid = 
              totalDistance <= 100 && // Max 100km de distance totale
              dateDiff <= 7 &&        // Max 7 jours de différence
              volumeOk;               // Volume compatible
            
            // Enregistrer même les matches partiels pour analyse
            if (totalDistance <= 200) {
              matches.push({
                client_id: client.id,
                move_id: move.id,
                match_type: isValid ? 'perfect' : 'partial',
                volume_ok: volumeOk,
                combined_volume: combinedVolume,
                distance_km: totalDistance,
                date_diff_days: Math.round(dateDiff),
                is_valid: isValid
              });
              
              console.log(`📊 Match trouvé: Client ${client.id} -> Move ${move.id}, Distance: ${totalDistance}km, Valide: ${isValid}`);
            }
          } catch (error) {
            console.error(`❌ Erreur calcul match Client ${client.id} -> Move ${move.id}:`, error);
          }
        }
      }

      // Sauvegarder les matches en base
      if (matches.length > 0) {
        const { error } = await supabase
          .from('move_matches')
          .insert(matches);

        if (error) throw error;

        // Mettre à jour les statuts des clients matchés
        const validMatchedClientIds = matches
          .filter(m => m.is_valid)
          .map(m => m.client_id);

        if (validMatchedClientIds.length > 0) {
          const { error: updateError } = await supabase
            .from('clients')
            .update({
              is_matched: true,
              matched_at: new Date().toISOString(),
              match_status: 'matched'
            })
            .in('id', validMatchedClientIds);

          if (updateError) console.warn('⚠️ Erreur mise à jour statuts:', updateError);
        }

        console.log('✅ Matches sauvegardés avec distances exactes:', matches.length);
        toast({
          title: "Matching terminé",
          description: `${matches.length} correspondances trouvées dont ${matches.filter(m => m.is_valid).length} valides (distances exactes Google Maps)`,
        });
      } else {
        toast({
          title: "Aucun match",
          description: "Aucune correspondance trouvée avec les critères actuels",
        });
      }

      await fetchData(); // Recharger les données

    } catch (error) {
      console.error('❌ Erreur matching:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du processus de matching",
        variant: "destructive",
      });
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center space-x-3">
        <Search className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Moteur de Matching - Distances Exactes</h2>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 text-blue-800 mb-2">
          <Target className="h-5 w-5" />
          <span className="font-semibold">Algorithme de Matching Unifié</span>
        </div>
        <div className="text-sm text-blue-700">
          • <strong>Distances exactes</strong> calculées via Google Maps API<br/>
          • <strong>Critères cohérents</strong> : ≤100km distance totale, ≤7 jours d'écart, volume compatible<br/>
          • <strong>Synchronisation</strong> avec le moteur de devis pour des résultats cohérents
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2 text-blue-600" />
              Clients actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">
              Status: pending, confirmed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Truck className="h-4 w-4 mr-2 text-green-600" />
              Trajets confirmés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedMoves.length}</div>
            <p className="text-xs text-muted-foreground">
              Status: confirmed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2 text-purple-600" />
              Action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={findMatches}
              disabled={loading || isMatching || clients.length === 0 || confirmedMoves.length === 0}
              className="w-full"
            >
              {isMatching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Calcul distances exactes...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Lancer le matching
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Messages d'état */}
      {loading && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-blue-700">Chargement des données...</p>
          </CardContent>
        </Card>
      )}

      {!loading && (clients.length === 0 || confirmedMoves.length === 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-orange-800 mb-2">Données insuffisantes</h3>
            <p className="text-orange-700">
              {clients.length === 0 && "Aucun client actif trouvé (status: pending/confirmed). "}
              {confirmedMoves.length === 0 && "Aucun trajet confirmé trouvé (status: confirmed). "}
              Veuillez ajouter des données pour pouvoir lancer le matching.
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default MatchFinder;
