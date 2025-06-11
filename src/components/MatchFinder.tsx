import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Calendar, Volume2, Users, Truck, Clock, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCache } from '@/hooks/useCache';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import MatchFilters, { MatchFilterOptions } from './MatchFilters';

interface ClientRequest {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  departure_city: string;
  departure_postal_code: string;
  arrival_city: string;
  arrival_postal_code: string;
  desired_date: string;
  estimated_volume: number | null;
  budget_min: number | null;
  budget_max: number | null;
  status: string;
  is_matched: boolean | null;
  match_status: string | null;
  flexible_dates: boolean | null;
  date_range_start?: string;
  date_range_end?: string;
  departure_address?: string;
  departure_country?: string;
  arrival_address?: string;
  arrival_country?: string;
}

interface Move {
  id: number;
  mover_name: string | null;
  company_name: string | null;
  departure_city: string;
  departure_postal_code: string;
  arrival_city: string;
  arrival_postal_code: string;
  departure_date: string;
  max_volume: number | null;
  used_volume: number;
  available_volume: number;
  price_per_m3: number | null;
  total_price: number | null;
  status: string;
  status_custom: string | null;
  route_type: string | null;
}

interface Match {
  id: number;
  move_id: number;
  client_request_id: number;
  match_type: string;
  distance_km: number;
  date_diff_days: number;
  combined_volume: number;
  volume_ok: boolean;
  is_valid: boolean;
  created_at: string;
  status?: string;
  actions?: Array<{
    action_type: string;
    action_date: string;
    notes: string;
    user_id: string;
  }>;
}

const MatchFinder = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<MatchFilterOptions>({
    pending: true,
    accepted: false,
    rejected: false,
    showAll: false
  });

  // Optimized data fetchers with targeted queries
  const fetchClientRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from('client_requests')
      .select('id, name, email, phone, departure_city, departure_postal_code, arrival_city, arrival_postal_code, desired_date, estimated_volume, budget_min, budget_max, status, is_matched, match_status, flexible_dates, date_range_start, date_range_end, departure_address, departure_country, arrival_address, arrival_country')
      .in('status', ['pending', 'confirmed'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }, []);

  const fetchMoves = useCallback(async () => {
    const { data, error } = await supabase
      .from('confirmed_moves')
      .select('id, mover_name, company_name, departure_city, departure_postal_code, arrival_city, arrival_postal_code, departure_date, max_volume, used_volume, available_volume, price_per_m3, total_price, status, status_custom, route_type')
      .eq('status', 'confirmed')
      .neq('status_custom', 'termine')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }, []);

  const fetchMatchesWithActions = useCallback(async () => {
    // Fetch matches
    const { data: matchData, error: matchError } = await supabase
      .from('move_matches')
      .select('id, move_id, client_request_id, match_type, distance_km, date_diff_days, combined_volume, volume_ok, is_valid, created_at')
      .order('created_at', { ascending: false });

    if (matchError) throw matchError;

    // Fetch actions
    const { data: actionsData, error: actionsError } = await supabase
      .from('match_actions')
      .select('match_id, action_type, action_date, notes, user_id')
      .order('action_date', { ascending: false });

    if (actionsError) {
      console.error('Erreur lors de la récupération des actions:', actionsError);
    }

    // Enrichir les matches avec leurs actions et statuts
    const enrichedMatches = (matchData || []).map(match => {
      const matchActions = actionsData?.filter(action => action.match_id === match.id) || [];
      
      let status = 'pending';
      const latestAction = matchActions[0];
      if (latestAction) {
        status = latestAction.action_type;
      }

      return {
        ...match,
        actions: matchActions,
        status
      };
    });

    return enrichedMatches;
  }, []);

  // Use cache for all data
  const { 
    data: clientRequests = [], 
    loading: clientsLoading,
    refetch: refetchClients
  } = useCache(fetchClientRequests, {
    key: 'client-requests',
    ttl: 2 * 60 * 1000 // 2 minutes
  });

  const { 
    data: moves = [], 
    loading: movesLoading,
    refetch: refetchMoves
  } = useCache(fetchMoves, {
    key: 'moves',
    ttl: 2 * 60 * 1000 // 2 minutes
  });

  const { 
    data: matches = [], 
    loading: matchesLoading,
    refetch: refetchMatches
  } = useCache(fetchMatchesWithActions, {
    key: 'matches-with-actions',
    ttl: 1 * 60 * 1000 // 1 minute
  });

  const loading = clientsLoading || movesLoading || matchesLoading;

  useEffect(() => {
    // Appliquer les filtres
    let filtered = matches.filter(match => {
      const { client, move } = getMatchDetails(match);
      
      if (!client || !move) return false;
      if (move.status_custom === 'termine') return false;
      if (client.status === 'completed') return false;
      
      return true;
    });

    if (!currentFilters.showAll) {
      filtered = filtered.filter(match => {
        const status = match.status || 'pending';
        
        if (currentFilters.pending && status === 'pending') return true;
        if (currentFilters.accepted && status === 'accepted') return true;
        if (currentFilters.rejected && status === 'rejected') return true;
        
        return false;
      });
    }

    setFilteredMatches(filtered);
  }, [matches, currentFilters]);

  const handleFiltersChange = useCallback((filters: MatchFilterOptions) => {
    setCurrentFilters(filters);
  }, []);

  const handleMatchAction = useCallback(async (matchId: number, actionType: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('match_actions')
        .insert({
          match_id: matchId,
          action_type: actionType,
          user_id: user?.id,
          action_date: new Date().toISOString(),
          notes: `Match ${actionType === 'accepted' ? 'accepté' : 'rejeté'} par l'utilisateur`
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Match ${actionType === 'accepted' ? 'accepté' : 'rejeté'} avec succès`,
      });

      refetchMatches();
    } catch (error: any) {
      console.error('Error processing match action:', error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter l'action",
        variant: "destructive",
      });
    }
  }, [user?.id, toast, refetchMatches]);

  // Fonction améliorée pour calculer si les dates sont compatibles avec gestion des dates flexibles
  const areDatesCompatible = (client: ClientRequest, moveDate: string) => {
    const move = new Date(moveDate);
    
    if (client.flexible_dates && client.date_range_start && client.date_range_end) {
      // Si le client a des dates flexibles, vérifier si la date du trajet est dans la plage
      const rangeStart = new Date(client.date_range_start);
      const rangeEnd = new Date(client.date_range_end);
      
      return move >= rangeStart && move <= rangeEnd;
    } else {
      // Si pas de dates flexibles, utiliser la logique standard ±15 jours
      const clientDate = new Date(client.desired_date);
      const timeDiff = Math.abs(clientDate.getTime() - move.getTime());
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      return daysDiff <= 15;
    }
  };

  // Fonction pour calculer la différence de jours (améliorée pour dates flexibles)
  const calculateDateDifference = (client: ClientRequest, moveDate: string) => {
    const move = new Date(moveDate);
    
    if (client.flexible_dates && client.date_range_start && client.date_range_end) {
      // Pour les dates flexibles, calculer la différence la plus petite possible
      const rangeStart = new Date(client.date_range_start);
      const rangeEnd = new Date(client.date_range_end);
      
      if (move >= rangeStart && move <= rangeEnd) {
        return 0; // Parfaitement dans la plage
      } else if (move < rangeStart) {
        return Math.ceil((rangeStart.getTime() - move.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        return Math.ceil((move.getTime() - rangeEnd.getTime()) / (1000 * 60 * 60 * 24));
      }
    } else {
      // Logique standard
      const clientDate = new Date(client.desired_date);
      return Math.abs((clientDate.getTime() - move.getTime()) / (1000 * 60 * 60 * 24));
    }
  };

  // Fonction corrigée pour calculer la VRAIE distance Google Maps Directions API
  const calculateRealDistance = async (client: ClientRequest, move: Move): Promise<number> => {
    return new Promise((resolve) => {
      if (!window.google?.maps) {
        console.warn('Google Maps API not loaded');
        resolve(500);
        return;
      }

      const directionsService = new google.maps.DirectionsService();
      const clientDepartureAddress = `${client.departure_postal_code} ${client.departure_city}, France`;
      const clientArrivalAddress = `${client.arrival_postal_code} ${client.arrival_city}, France`;
      const moveDepartureAddress = `${move.departure_postal_code} ${move.departure_city}, France`;
      const moveArrivalAddress = `${move.arrival_postal_code} ${move.arrival_city}, France`;

      directionsService.route({
        origin: clientDepartureAddress,
        destination: clientArrivalAddress,
        travelMode: google.maps.TravelMode.DRIVING,
        region: 'FR',
        language: 'fr'
      }, (clientResult, clientStatus) => {
        if (clientStatus === 'OK' && clientResult?.routes[0]) {
          const clientDistanceKm = Math.round(clientResult.routes[0].legs[0].distance!.value / 1000);
          
          directionsService.route({
            origin: moveDepartureAddress,
            destination: moveArrivalAddress,
            travelMode: google.maps.TravelMode.DRIVING,
            region: 'FR',
            language: 'fr'
          }, (moveResult, moveStatus) => {
            if (moveStatus === 'OK' && moveResult?.routes[0]) {
              const moveDistanceKm = Math.round(moveResult.routes[0].legs[0].distance!.value / 1000);
              
              directionsService.route({
                origin: clientDepartureAddress,
                destination: moveDepartureAddress,
                travelMode: google.maps.TravelMode.DRIVING,
                region: 'FR',
                language: 'fr'
              }, (deptResult, deptStatus) => {
                if (deptStatus === 'OK' && deptResult?.routes[0]) {
                  const deptDistanceKm = Math.round(deptResult.routes[0].legs[0].distance!.value / 1000);
                  
                  directionsService.route({
                    origin: clientArrivalAddress,
                    destination: moveArrivalAddress,
                    travelMode: google.maps.TravelMode.DRIVING,
                    region: 'FR',
                    language: 'fr'
                  }, (arrResult, arrStatus) => {
                    if (arrStatus === 'OK' && arrResult?.routes[0]) {
                      const arrDistanceKm = Math.round(arrResult.routes[0].legs[0].distance!.value / 1000);\
                      const finalDistance = Math.round((deptDistanceKm + arrDistanceKm) / 2);
                      resolve(finalDistance);
                    } else {
                      resolve(deptDistanceKm);
                    }
                  });
                } else {
                  resolve(500);
                }
              });
            } else {
              resolve(clientDistanceKm > 400 ? clientDistanceKm : 500);
            }
          });
        } else {
          resolve(500);
        }
      });
    });
  };

  const findMatches = useCallback(async () => {
    try {
      setIsSearching(true);
      
      // Clear old matches without actions
      await supabase
        .from('move_matches')
        .delete()
        .not('id', 'in', `(SELECT DISTINCT match_id FROM match_actions)`);

      // Process new matches
      for (const client of clientRequests) {
        for (const move of moves) {
          const distanceKm = await calculateRealDistance(client, move);
          const datesCompatible = areDatesCompatible(client, move.departure_date);
          
          if (!datesCompatible) continue;
          
          const dateDiffDays = calculateDateDifference(client, move.departure_date);
          const clientVolume = client.estimated_volume || 0;
          const availableVolume = move.available_volume || 0;
          const volumeOk = clientVolume <= availableVolume;
          const combinedVolume = (move.used_volume || 0) + clientVolume;
          
          const maxAllowedDays = client.flexible_dates ? 
            (dateDiffDays === 0 ? 0 : 15) : 15;
          
          const isValid = distanceKm <= 100 && dateDiffDays <= maxAllowedDays && volumeOk;
          
          let matchType = 'partial';
          if (client.departure_city.toLowerCase() === move.departure_city.toLowerCase() &&
              client.arrival_city.toLowerCase() === move.arrival_city.toLowerCase()) {
            if (client.flexible_dates && dateDiffDays === 0) {
              matchType = 'perfect';
            } else if (!client.flexible_dates && dateDiffDays <= 3) {
              matchType = 'perfect';
            } else {
              matchType = 'good';
            }
          } else if (distanceKm <= 50) {
            if (client.flexible_dates && dateDiffDays === 0) {
              matchType = 'good';
            } else if (dateDiffDays <= 7) {
              matchType = 'good';
            }
          }

          const existingMatch = matches.find(m => 
            m.client_request_id === client.id && m.move_id === move.id
          );

          if (!existingMatch) {
            const { error } = await supabase
              .from('move_matches')
              .insert({
                move_id: move.id,
                client_request_id: client.id,
                match_type: matchType,
                distance_km: distanceKm,
                date_diff_days: Math.round(dateDiffDays),
                combined_volume: combinedVolume,
                volume_ok: volumeOk,
                is_valid: isValid
              });

            if (error) {
              console.error('Error inserting match:', error);
            }
          }
        }
      }

      toast({
        title: "Succès",
        description: "Recherche terminée avec distances Google Maps réelles",
      });

      // Refresh data
      await Promise.all([refetchClients(), refetchMoves(), refetchMatches()]);
    } catch (error) {
      console.error('Error finding matches:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la recherche de correspondances",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [clientRequests, moves, matches, toast, refetchClients, refetchMoves, refetchMatches]);

  const getMatchDetails = (match: Match) => {
    const client = clientRequests.find(c => c.id === match.client_request_id);
    const move = moves.find(m => m.id === match.move_id);
    return { client, move };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800 border-green-200">✅ Accepté</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">❌ Rejeté</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">⏳ En attente</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Search className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Recherche de correspondances</h2>
          </div>
          <Button disabled>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Chargement...
          </Button>
        </div>
        <LoadingSkeleton type="stats" />
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Search className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Recherche de correspondances</h2>
        </div>
        <div className="relative">
          <Button
            onClick={findMatches}
            disabled={isSearching}
            className="bg-blue-600 hover:bg-blue-700 relative overflow-hidden"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Recherche en cours...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Trouver un match
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Demandes clients</p>
                <p className="text-2xl font-bold">{clientRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Déménagements</p>
                <p className="text-2xl font-bold">{moves.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Correspondances totales</p>
                <p className="text-2xl font-bold">{matches.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Filtrées</p>
                <p className="text-2xl font-bold">{filteredMatches.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <MatchFilters onFiltersChange={handleFiltersChange} />

      {/* Liste des correspondances */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Correspondances ({filteredMatches.length})
        </h3>
        
        {filteredMatches.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune correspondance trouvée</p>
              <p className="text-sm text-gray-500 mt-2">
                {matches.length === 0 ? 
                  'Cliquez sur "Trouver un match" pour commencer' :
                  'Ajustez les filtres pour voir plus de résultats'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredMatches.map((match) => {
              const { client, move } = getMatchDetails(match);
              
              if (!client || !move) return null;

              const isDistanceOk = match.distance_km <= 100;
              const isVolumeOk = match.volume_ok;
              const isDateOk = client.flexible_dates ? 
                (match.date_diff_days === 0 || match.date_diff_days <= 15) : 
                match.date_diff_days <= 15;
              
              const isCompatible = isDistanceOk && isVolumeOk && isDateOk;

              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-xl p-6 shadow-lg border ${
                    isCompatible ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  } ${match.status === 'rejected' ? 'opacity-60' : ''}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Client */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                          <Users className="h-4 w-4 mr-2 text-blue-600" />
                          Client: {client.name || 'Non renseigné'}
                        </h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-3 w-3" />
                            <span>{client.departure_city} → {client.arrival_city}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(client.desired_date).toLocaleDateString('fr-FR')}</span>
                            {client.flexible_dates && (
                              <Badge variant="outline" className="text-xs">
                                Flexible
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Volume2 className="h-3 w-3" />
                            <span>{client.estimated_volume || 0}m³</span>
                          </div>
                          {client.email && (
                            <div className="text-blue-600">{client.email}</div>
                          )}
                        </div>
                      </div>

                      {/* Déménageur */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                          <Truck className="h-4 w-4 mr-2 text-green-600" />
                          Déménageur: {move.company_name || 'Non renseigné'}
                        </h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-3 w-3" />
                            <span>{move.departure_city} → {move.arrival_city}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(move.departure_date).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Volume2 className="h-3 w-3" />
                            <span>Disponible: {move.available_volume}m³</span>
                          </div>
                          {move.price_per_m3 && (
                            <div className="text-green-600">{move.price_per_m3}€/m³</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        match.match_type === 'perfect' ? 'bg-green-100 text-green-800' :
                        match.match_type === 'good' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {match.match_type === 'perfect' ? '🎯 Parfait' :
                         match.match_type === 'good' ? '👍 Bon' : '⚡ Partiel'}
                      </span>
                      
                      {getStatusBadge(match.status || 'pending')}
                      
                      {match.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleMatchAction(match.id, 'accepted')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Accepter
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMatchAction(match.id, 'rejected')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Rejeter
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Détails du match */}
                  <div className="border-t pt-3 mt-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Distance:</span>
                        <span className={`ml-2 font-medium ${
                          isDistanceOk ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {match.distance_km}km
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Diff. dates:</span>
                        <span className={`ml-2 font-medium ${
                          isDateOk ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {match.date_diff_days} jours
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Volume:</span>
                        <span className="ml-2 font-medium">{match.combined_volume}m³</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Compatible:</span>
                        <span className={`ml-2 font-medium ${
                          isCompatible ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isCompatible ? '✅ Oui' : '❌ Non'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchFinder;
