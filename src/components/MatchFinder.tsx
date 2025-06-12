
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Truck, Target, Play, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { loadGoogleMapsScript, calculateDistanceByPostalCode } from '@/lib/google-maps-config';
import MatchResults from './MatchResults';

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
  max_volume: number;
  used_volume: number;
  available_volume: number;
}

interface MatchResult {
  client_id: number;
  move_id: number;
  match_type: 'perfect' | 'partial' | 'return_trip';
  volume_ok: boolean;
  combined_volume: number;
  distance_km: number;
  date_diff_days: number;
  is_valid: boolean;
  trip_type: 'direct' | 'return';
}

const MatchFinder = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [confirmedMoves, setConfirmedMoves] = useState<ConfirmedMove[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

      // Charger les trajets confirmés avec calcul du volume disponible
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

      // Calculer le volume disponible pour chaque trajet
      const processedMoves = movesData?.map(move => ({
        ...move,
        available_volume: (move.max_volume || 0) - (move.used_volume || 0)
      })) || [];

      console.log('✅ Données chargées:', {
        clients: clientsData?.length || 0,
        moves: processedMoves.length,
        movesWithVolume: processedMoves.filter(m => m.available_volume > 0).length
      });

      setClients(clientsData || []);
      setConfirmedMoves(processedMoves);

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

  // Calcul de distance optimisé avec timeout
  const calculateDistance = async (postal1: string, postal2: string, city1?: string, city2?: string): Promise<number> => {
    try {
      console.log(`🗺️ Calcul distance: ${postal1} -> ${postal2}`);
      
      // Charger Google Maps script si nécessaire
      await loadGoogleMapsScript();
      
      // Utiliser l'API centralisée avec timeout
      const result = await Promise.race([
        calculateDistanceByPostalCode(postal1, postal2, city1, city2),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]);

      if (result && result.distance) {
        console.log(`✅ Distance calculée: ${result.distance}km`);
        return result.distance;
      } else {
        throw new Error('Aucun résultat de distance');
      }
    } catch (error) {
      console.warn(`⚠️ Erreur calcul distance ${postal1}->${postal2}, utilisation fallback:`, error);
      return calculateFallbackDistance(postal1, postal2);
    }
  };

  const calculateFallbackDistance = (postal1: string, postal2: string): number => {
    // Calcul approximatif basé sur les codes postaux
    const dept1 = parseInt(postal1.substring(0, 2));
    const dept2 = parseInt(postal2.substring(0, 2));
    
    // Distance approximative entre départements (en km)
    const deptDistance = Math.abs(dept1 - dept2) * 50;
    
    // Ajouter variation locale
    const localVariation = Math.abs(parseInt(postal1.substring(2, 5)) - parseInt(postal2.substring(2, 5))) / 10;
    
    const distance = Math.round(deptDistance + localVariation);
    console.log(`📏 Distance fallback: ${distance}km pour ${postal1} -> ${postal2}`);
    return distance;
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
    console.log('🎯 Début du processus de matching optimisé...');

    try {
      // Supprimer les anciens matches
      const { error: deleteError } = await supabase
        .from('move_matches')
        .delete()
        .neq('id', 0);

      if (deleteError) {
        console.warn('⚠️ Erreur suppression anciens matches:', deleteError);
      }

      const matches: MatchResult[] = [];
      let totalProcessed = 0;
      let validMatches = 0;

      for (const client of clients) {
        console.log(`🔍 Recherche matches pour client ${client.name} (${client.client_reference || `CLI-${client.id}`})`);
        
        for (const move of confirmedMoves) {
          try {
            totalProcessed++;

            // Filtrer par volume dès le début
            if (client.estimated_volume > move.available_volume) {
              continue;
            }

            // TRAJET DIRECT: Client départ -> Move départ ET Client arrivée -> Move arrivée
            const directDepartureDistance = await calculateDistance(
              client.departure_postal_code,
              move.departure_postal_code,
              client.departure_city,
              move.departure_city
            );
            
            const directArrivalDistance = await calculateDistance(
              client.arrival_postal_code,
              move.arrival_postal_code,
              client.arrival_city,
              move.arrival_city
            );
            
            const directTotalDistance = directDepartureDistance + directArrivalDistance;

            // TRAJET RETOUR: Client départ -> Move arrivée ET Client arrivée -> Move départ
            const returnDepartureDistance = await calculateDistance(
              client.departure_postal_code,
              move.arrival_postal_code,
              client.departure_city,
              move.arrival_city
            );
            
            const returnArrivalDistance = await calculateDistance(
              client.arrival_postal_code,
              move.departure_postal_code,
              client.arrival_city,
              move.departure_city
            );
            
            const returnTotalDistance = returnDepartureDistance + returnArrivalDistance;

            // Calculer la différence de dates
            const clientDate = new Date(client.desired_date);
            const moveDate = new Date(move.departure_date);
            const dateDiff = Math.abs(clientDate.getTime() - moveDate.getTime()) / (1000 * 3600 * 24);
            
            // Vérifier la compatibilité du volume
            const volumeOk = client.estimated_volume <= move.available_volume;
            const combinedVolume = volumeOk ? move.available_volume - client.estimated_volume : move.available_volume;

            // ÉVALUER TRAJET DIRECT (≤100km seulement)
            if (directTotalDistance <= 100) {
              const isDirectValid = 
                directTotalDistance <= 100 &&
                dateDiff <= 7 &&
                volumeOk;

              matches.push({
                client_id: client.id,
                move_id: move.id,
                match_type: isDirectValid ? 'perfect' : 'partial',
                volume_ok: volumeOk,
                combined_volume: combinedVolume,
                distance_km: directTotalDistance,
                date_diff_days: Math.round(dateDiff),
                is_valid: isDirectValid,
                trip_type: 'direct'
              });

              if (isDirectValid) validMatches++;
              console.log(`📊 DIRECT Match: Client ${client.id} -> Move ${move.id}, Distance: ${directTotalDistance}km, Valide: ${isDirectValid}`);
            }

            // ÉVALUER TRAJET RETOUR (≤100km seulement)
            if (returnTotalDistance <= 100) {
              const isReturnValid = 
                returnTotalDistance <= 100 &&
                dateDiff <= 7 &&
                volumeOk;

              matches.push({
                client_id: client.id,
                move_id: move.id,
                match_type: isReturnValid ? 'perfect' : 'return_trip',
                volume_ok: volumeOk,
                combined_volume: combinedVolume,
                distance_km: returnTotalDistance,
                date_diff_days: Math.round(dateDiff),
                is_valid: isReturnValid,
                trip_type: 'return'
              });

              if (isReturnValid) validMatches++;
              console.log(`🔄 RETOUR Match: Client ${client.id} -> Move ${move.id}, Distance: ${returnTotalDistance}km, Valide: ${isReturnValid}`);
            }

          } catch (error) {
            console.error(`❌ Erreur calcul match Client ${client.id} -> Move ${move.id}:`, error);
          }
        }
      }

      console.log(`🔢 Résultats du matching:`, {
        totalProcessed,
        totalMatches: matches.length,
        directMatches: matches.filter(m => m.trip_type === 'direct').length,
        returnMatches: matches.filter(m => m.trip_type === 'return').length,
        validMatches
      });

      // Sauvegarder les matches en base
      if (matches.length > 0) {
        const { error } = await supabase
          .from('move_matches')
          .insert(matches);

        if (error) throw error;

        // Mettre à jour les statuts des clients matchés
        const validMatchedClientIds = [...new Set(matches
          .filter(m => m.is_valid)
          .map(m => m.client_id))];

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

        console.log('✅ Matches sauvegardés:', matches.length);
        toast({
          title: "Matching terminé avec succès",
          description: `${matches.length} correspondances trouvées (${matches.filter(m => m.trip_type === 'direct').length} directes, ${matches.filter(m => m.trip_type === 'return').length} retours) dont ${validMatches} valides`,
        });

        // Déclencher le rafraîchissement des résultats
        setRefreshTrigger(prev => prev + 1);
      } else {
        toast({
          title: "Aucun match trouvé",
          description: "Aucune correspondance ≤100km trouvée avec les critères actuels",
          variant: "destructive",
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
        <h2 className="text-2xl font-bold text-gray-800">Moteur de Matching Optimisé</h2>
      </div>

      <Tabs defaultValue="engine" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="engine" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Moteur de Matching
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Résultats ({refreshTrigger > 0 ? 'Mis à jour' : 'Vide'})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="engine" className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <Target className="h-5 w-5" />
              <span className="font-semibold">Algorithme de Matching Rapide</span>
            </div>
            <div className="text-sm text-blue-700">
              • <strong>Trajets directs</strong> : correspondance départ-départ + arrivée-arrivée<br/>
              • <strong>Trajets retour</strong> : utilisation des retours à vide (départ-arrivée + arrivée-départ)<br/>
              • <strong>Distances Google Maps</strong> avec fallback rapide (≤100km max)<br/>
              • <strong>Critères</strong> : ≤7 jours d'écart, volume compatible
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
                  Trajets disponibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{confirmedMoves.length}</div>
                <p className="text-xs text-muted-foreground">
                  Avec volume disponible: {confirmedMoves.filter(m => m.available_volume > 0).length}
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
                      Matching en cours...
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
                  {clients.length === 0 && "Aucun client actif trouvé. "}
                  {confirmedMoves.length === 0 && "Aucun trajet confirmé trouvé. "}
                  Veuillez ajouter des données pour pouvoir lancer le matching.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <MatchResults refreshTrigger={refreshTrigger} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default MatchFinder;
