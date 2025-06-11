
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

interface ClientWithMatches {
  client: ClientRequest;
  matches: Array<Match & { move: Move }>;
}

const MatchFinder = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groupedMatches, setGroupedMatches] = useState<ClientWithMatches[]>([]);
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
    data: clientRequestsData, 
    loading: clientsLoading,
    refetch: refetchClients
  } = useCache(fetchClientRequests, {
    key: 'client-requests',
    ttl: 2 * 60 * 1000 // 2 minutes
  });

  const { 
    data: movesData, 
    loading: movesLoading,
    refetch: refetchMoves
  } = useCache(fetchMoves, {
    key: 'moves',
    ttl: 2 * 60 * 1000 // 2 minutes
  });

  const { 
    data: matchesData, 
    loading: matchesLoading,
    refetch: refetchMatches
  } = useCache(fetchMatchesWithActions, {
    key: 'matches-with-actions',
    ttl: 1 * 60 * 1000 // 1 minute
  });

  // Ensure we always have arrays, never null
  const clientRequests = clientRequestsData || [];
  const moves = movesData || [];
  const matches = matchesData || [];

  const loading = clientsLoading || movesLoading || matchesLoading;

  useEffect(() => {
    console.log('MatchFinder useEffect - grouping matches by client');
    
    // Ensure matches is an array before processing
    if (!Array.isArray(matches)) {
      console.warn('matches is not an array:', matches);
      setGroupedMatches([]);
      return;
    }

    // Group matches by client
    const clientMap = new Map<number, ClientWithMatches>();

    matches.forEach(match => {
      const client = clientRequests.find(c => c.id === match.client_request_id);
      const move = moves.find(m => m.id === match.move_id);
      
      if (!client || !move) return;
      if (move.status_custom === 'termine') return;
      if (client.status === 'completed') return;

      // Apply filters
      if (!currentFilters.showAll) {
        const status = match.status || 'pending';
        
        if (!((currentFilters.pending && status === 'pending') ||
              (currentFilters.accepted && status === 'accepted') ||
              (currentFilters.rejected && status === 'rejected'))) {
          return;
        }
      }

      if (!clientMap.has(client.id)) {
        clientMap.set(client.id, {
          client,
          matches: []
        });
      }

      clientMap.get(client.id)!.matches.push({
        ...match,
        move
      });
    });

    setGroupedMatches(Array.from(clientMap.values()));
  }, [matches, currentFilters, clientRequests, moves]);

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

  // Fonction simplifiée pour calculer si les dates sont compatibles
  const areDatesCompatible = (client: ClientRequest, moveDate: string) => {
    const move = new Date(moveDate);
    
    if (client.flexible_dates && client.date_range_start && client.date_range_end) {
      const rangeStart = new Date(client.date_range_start);
      const rangeEnd = new Date(client.date_range_end);
      return move >= rangeStart && move <= rangeEnd;
    } else {
      const clientDate = new Date(client.desired_date);
      const timeDiff = Math.abs(clientDate.getTime() - move.getTime());
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      return daysDiff <= 15;
    }
  };

  // Fonction simplifiée pour calculer la distance (utilise une formule approximative)
  const calculateApproximateDistance = (client: ClientRequest, move: Move): number => {
    // Approximation simple basée sur les codes postaux
    const clientDeptCode = parseInt(client.departure_postal_code.substring(0, 2));
    const moveDeptCode = parseInt(move.departure_postal_code.substring(0, 2));
    const clientArrCode = parseInt(client.arrival_postal_code.substring(0, 2));
    const moveArrCode = parseInt(move.arrival_postal_code.substring(0, 2));
    
    const deptDistance = Math.abs(clientDeptCode - moveDeptCode) * 50; // 50km par département
    const arrDistance = Math.abs(clientArrCode - moveArrCode) * 50;
    
    return Math.round((deptDistance + arrDistance) / 2);
  };

  const findMatches = useCallback(async () => {
    try {
      setIsSearching(true);
      console.log('🔍 Début de la recherche de matchs...');
      
      // Clear old matches without actions first
      const { error: deleteError } = await supabase
        .from('move_matches')
        .delete()
        .not('id', 'in', `(SELECT DISTINCT match_id FROM match_actions WHERE match_id IS NOT NULL)`);

      if (deleteError) {
        console.warn('Erreur lors de la suppression des anciens matchs:', deleteError);
      }

      let newMatchesCount = 0;

      // Process new matches with simplified logic
      for (const client of clientRequests) {
        for (const move of moves) {
          const datesCompatible = areDatesCompatible(client, move.departure_date);
          
          if (!datesCompatible) continue;
          
          const distanceKm = calculateApproximateDistance(client, move);
          const clientVolume = client.estimated_volume || 0;
          const availableVolume = move.available_volume || 0;
          const volumeOk = clientVolume <= availableVolume;
          const combinedVolume = (move.used_volume || 0) + clientVolume;
          
          const clientDate = new Date(client.desired_date);
          const moveDate = new Date(move.departure_date);
          const dateDiffDays = Math.abs((clientDate.getTime() - moveDate.getTime()) / (1000 * 60 * 60 * 24));
          
          const isValid = distanceKm <= 200 && dateDiffDays <= 15 && volumeOk;
          
          let matchType = 'partial';
          if (client.departure_city.toLowerCase() === move.departure_city.toLowerCase() &&
              client.arrival_city.toLowerCase() === move.arrival_city.toLowerCase()) {
            if (dateDiffDays <= 3) {
              matchType = 'perfect';
            } else {
              matchType = 'good';
            }
          } else if (distanceKm <= 100) {
            matchType = 'good';
          }

          // Check if match already exists
          const existingMatch = matches.find(m => 
            m.client_request_id === client.id && m.move_id === move.id
          );

          if (!existingMatch && isValid) {
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
            } else {
              newMatchesCount++;
            }
          }
        }
      }

      console.log('✅ Recherche terminée,', newMatchesCount, 'nouveaux matchs créés');
      
      toast({
        title: "Recherche terminée",
        description: `${newMatchesCount} nouveaux matchs trouvés`,
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

  const totalMatches = groupedMatches.reduce((total, group) => total + group.matches.length, 0);

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
                Trouver des matchs
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
                <p className="text-2xl font-bold">{totalMatches}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Clients avec matchs</p>
                <p className="text-2xl font-bold">{groupedMatches.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <MatchFilters onFiltersChange={handleFiltersChange} />

      {/* Liste des correspondances groupées par client */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Correspondances par client ({groupedMatches.length})
        </h3>
        
        {groupedMatches.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune correspondance trouvée</p>
              <p className="text-sm text-gray-500 mt-2">
                {totalMatches === 0 ? 
                  'Cliquez sur "Trouver des matchs" pour commencer' :
                  'Ajustez les filtres pour voir plus de résultats'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupedMatches.map((group) => (
              <motion.div
                key={group.client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
              >
                {/* En-tête client */}
                <div className="mb-6 border-b pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                        <Users className="h-5 w-5 mr-2 text-blue-600" />
                        {group.client.name || 'Client non renseigné'}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>{group.client.departure_city} → {group.client.arrival_city}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(group.client.desired_date).toLocaleDateString('fr-FR')}</span>
                          {group.client.flexible_dates && (
                            <Badge variant="outline" className="text-xs">Flexible</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Volume2 className="h-4 w-4" />
                          <span>{group.client.estimated_volume || 0}m³</span>
                        </div>
                      </div>
                      {group.client.email && (
                        <div className="text-blue-600 text-sm mt-2">{group.client.email}</div>
                      )}
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      {group.matches.length} match{group.matches.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>

                {/* Liste des déménageurs correspondants */}
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-700">Déménageurs disponibles :</h5>
                  <div className="grid gap-4">
                    {group.matches.map((match) => {
                      const isDistanceOk = match.distance_km <= 200;
                      const isVolumeOk = match.volume_ok;
                      const isDateOk = match.date_diff_days <= 15;
                      const isCompatible = isDistanceOk && isVolumeOk && isDateOk;

                      return (
                        <div
                          key={match.id}
                          className={`p-4 rounded-lg border ${
                            isCompatible ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                          } ${match.status === 'rejected' ? 'opacity-60' : ''}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h6 className="font-semibold text-gray-800 flex items-center">
                                  <Truck className="h-4 w-4 mr-2 text-green-600" />
                                  {match.move.company_name || 'Déménageur non renseigné'}
                                </h6>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  match.match_type === 'perfect' ? 'bg-green-100 text-green-800' :
                                  match.match_type === 'good' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {match.match_type === 'perfect' ? '🎯 Parfait' :
                                   match.match_type === 'good' ? '👍 Bon' : '⚡ Partiel'}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-500">Route:</span>
                                  <div className="font-medium">{match.move.departure_city} → {match.move.arrival_city}</div>
                                </div>
                                <div>
                                  <span className="text-gray-500">Date:</span>
                                  <div className="font-medium">{new Date(match.move.departure_date).toLocaleDateString('fr-FR')}</div>
                                </div>
                                <div>
                                  <span className="text-gray-500">Distance:</span>
                                  <span className={`font-medium ${isDistanceOk ? 'text-green-600' : 'text-red-600'}`}>
                                    {match.distance_km}km
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Volume dispo:</span>
                                  <span className="font-medium">{match.move.available_volume}m³</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end space-y-2">
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchFinder;
