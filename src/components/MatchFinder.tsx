
import { useState, useEffect, useCallback, useMemo } from 'react';
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
  matches: Array<Match & { move: Move; realDistance?: number }>;
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

  // Fonctions de récupération de données optimisées
  const fetchClientRequests = useCallback(async () => {
    console.log('🔍 Récupération des demandes clients...');
    const { data, error } = await supabase
      .from('client_requests')
      .select('*')
      .in('status', ['pending', 'confirmed'])
      .neq('status', 'completed')
      .limit(100);

    if (error) {
      console.error('❌ Erreur récupération clients:', error);
      throw error;
    }
    
    console.log('✅ Clients récupérés:', data?.length || 0);
    return data || [];
  }, []);

  const fetchMoves = useCallback(async () => {
    console.log('🚛 Récupération des déménagements...');
    const { data, error } = await supabase
      .from('confirmed_moves')
      .select('*')
      .eq('status', 'confirmed')
      .neq('status_custom', 'termine')
      .limit(100);

    if (error) {
      console.error('❌ Erreur récupération moves:', error);
      throw error;
    }
    
    console.log('✅ Déménagements récupérés:', data?.length || 0);
    return data || [];
  }, []);

  const fetchMatchesWithActions = useCallback(async () => {
    console.log('🔗 Récupération des matchs...');
    const { data: matchData, error } = await supabase
      .from('move_matches')
      .select(`
        id, move_id, client_request_id, match_type, distance_km, date_diff_days, 
        combined_volume, volume_ok, is_valid, created_at
      `)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('❌ Erreur récupération matchs:', error);
      throw error;
    }

    // Récupérer les actions séparément pour éviter les problèmes de jointure
    const { data: actionsData } = await supabase
      .from('match_actions')
      .select('match_id, action_type, action_date')
      .order('action_date', { ascending: false });

    const enrichedMatches = (matchData || []).map(match => {
      const matchActions = (actionsData || []).filter(action => action.match_id === match.id);
      const latestAction = matchActions[0]; // Le plus récent
      
      return {
        ...match,
        status: latestAction?.action_type || 'pending'
      };
    });

    console.log('✅ Matchs enrichis:', enrichedMatches.length);
    return enrichedMatches;
  }, []);

  // Cache avec TTL plus court pour éviter les données obsolètes
  const { 
    data: clientRequestsData, 
    loading: clientsLoading,
    refetch: refetchClients
  } = useCache(fetchClientRequests, {
    key: 'client-requests-match-finder',
    ttl: 10 * 60 * 1000, // 10 minutes
    staleWhileRevalidate: true
  });

  const { 
    data: movesData, 
    loading: movesLoading,
    refetch: refetchMoves
  } = useCache(fetchMoves, {
    key: 'moves-match-finder',
    ttl: 10 * 60 * 1000, // 10 minutes
    staleWhileRevalidate: true
  });

  const { 
    data: matchesData, 
    loading: matchesLoading,
    refetch: refetchMatches
  } = useCache(fetchMatchesWithActions, {
    key: 'matches-actions-match-finder',
    ttl: 5 * 60 * 1000, // 5 minutes
    staleWhileRevalidate: true
  });

  const clientRequests = clientRequestsData || [];
  const moves = movesData || [];
  const matches = matchesData || [];

  const loading = clientsLoading || movesLoading || matchesLoading;

  console.log('📊 Données chargées:', {
    clients: clientRequests.length,
    moves: moves.length,
    matches: matches.length
  });

  // Calcul de distance optimisé
  const calculateDistance = useMemo(() => {
    const cache = new Map<string, number>();
    
    return (postalCode1: string, postalCode2: string): number => {
      const key = `${postalCode1}-${postalCode2}`;
      if (cache.has(key)) return cache.get(key)!;
      
      const dept1 = parseInt(postalCode1.substring(0, 2));
      const dept2 = parseInt(postalCode2.substring(0, 2));
      const deptDistance = Math.abs(dept1 - dept2) * 50;
      const num1 = parseInt(postalCode1.substring(2));
      const num2 = parseInt(postalCode2.substring(2));
      const granularDiff = Math.abs(num1 - num2) * 0.1;
      const distance = Math.round(deptDistance + granularDiff);
      
      cache.set(key, distance);
      return distance;
    };
  }, []);

  // Traitement des matchs optimisé et stabilisé
  const processedMatches = useMemo(() => {
    if (!Array.isArray(matches) || matches.length === 0) {
      console.log('⚠️ Aucun match à traiter');
      return [];
    }

    console.log('🔄 Traitement des matchs...', matches.length);
    const clientMap = new Map<number, ClientWithMatches>();

    matches.forEach(match => {
      const client = clientRequests.find(c => c.id === match.client_request_id);
      const move = moves.find(m => m.id === match.move_id);
      
      if (!client || !move || move.status_custom === 'termine' || client.status === 'completed') {
        return;
      }

      // Appliquer les filtres
      if (!currentFilters.showAll) {
        const status = match.status || 'pending';
        if (!((currentFilters.pending && status === 'pending') ||
              (currentFilters.accepted && status === 'accepted') ||
              (currentFilters.rejected && status === 'rejected'))) {
          return;
        }
      }

      const realDistance = calculateDistance(move.departure_postal_code, client.departure_postal_code);

      if (!clientMap.has(client.id)) {
        clientMap.set(client.id, { client, matches: [] });
      }

      clientMap.get(client.id)!.matches.push({
        ...match,
        move,
        realDistance
      });
    });

    const result = Array.from(clientMap.values()).map(group => ({
      ...group,
      matches: group.matches
        .sort((a, b) => (a.realDistance || 0) - (b.realDistance || 0))
        .slice(0, 5)
    }));

    console.log('✅ Traitement terminé:', result.length, 'groupes');
    return result;
  }, [matches, currentFilters, clientRequests, moves, calculateDistance]);

  // Effet stabilisé pour mettre à jour les matchs groupés
  useEffect(() => {
    setGroupedMatches(processedMatches);
  }, [processedMatches]);

  const handleFiltersChange = useCallback((filters: MatchFilterOptions) => {
    console.log('🔧 Changement de filtres:', filters);
    setCurrentFilters(filters);
  }, []);

  const handleMatchAction = useCallback(async (matchId: number, actionType: 'accepted' | 'rejected') => {
    try {
      console.log('⚙️ Action match:', { matchId, actionType });
      
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
      console.error('❌ Erreur action match:', error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter l'action",
        variant: "destructive",
      });
    }
  }, [user?.id, toast, refetchMatches]);

  const findMatches = useCallback(async () => {
    try {
      setIsSearching(true);
      console.log('🔍 Recherche de matchs - Démarrage...');
      console.log('📊 Données disponibles:', {
        clients: clientRequests.length,
        moves: moves.length
      });
      
      // Nettoyer les anciens matchs sans actions (correction de la requête SQL)
      console.log('🧹 Nettoyage des anciens matchs...');
      const { error: deleteError } = await supabase
        .from('move_matches')
        .delete()
        .not('id', 'in', `(
          SELECT DISTINCT move_matches.id 
          FROM move_matches 
          LEFT JOIN match_actions ON move_matches.id = match_actions.match_id 
          WHERE match_actions.match_id IS NOT NULL
        )`);

      if (deleteError) {
        console.warn('⚠️ Erreur nettoyage (ignorée):', deleteError);
      }

      let newMatchesCount = 0;
      const batchInserts: any[] = [];

      console.log('🔄 Analyse des combinaisons client-move...');
      
      for (const client of clientRequests.slice(0, 50)) {
        if (client.status === 'completed') continue;
        
        console.log(`👤 Analyse client: ${client.name} (${client.departure_city} → ${client.arrival_city})`);
        
        const clientMatches: Array<{ move: any; distance: number; match: any }> = [];

        for (const move of moves.slice(0, 50)) {
          if (move.status_custom === 'termine') continue;
          
          const clientVolume = client.estimated_volume || 0;
          const availableVolume = move.available_volume || 0;
          
          console.log(`🚛 Test move: ${move.company_name} vol:${availableVolume} vs ${clientVolume}`);
          
          if (clientVolume > availableVolume) {
            console.log('❌ Volume insuffisant');
            continue;
          }
          
          const distanceKm = calculateDistance(move.departure_postal_code, client.departure_postal_code);
          if (distanceKm > 500) {
            console.log('❌ Distance trop grande:', distanceKm);
            continue;
          }
          
          const clientDate = new Date(client.desired_date);
          const moveDate = new Date(move.departure_date);
          const dateDiffDays = Math.abs((clientDate.getTime() - moveDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (dateDiffDays > 15) {
            console.log('❌ Date trop éloignée:', dateDiffDays);
            continue;
          }
          
          let matchType = 'partial';
          if (client.departure_city.toLowerCase() === move.departure_city.toLowerCase() &&
              client.arrival_city.toLowerCase() === move.arrival_city.toLowerCase()) {
            matchType = dateDiffDays <= 3 ? 'perfect' : 'good';
          } else if (distanceKm <= 100) {
            matchType = 'good';
          }

          console.log(`✅ Match trouvé: ${matchType}, distance: ${distanceKm}km, date diff: ${dateDiffDays}j`);

          clientMatches.push({
            move,
            distance: distanceKm,
            match: {
              move_id: move.id,
              client_request_id: client.id,
              match_type: matchType,
              distance_km: distanceKm,
              date_diff_days: Math.round(dateDiffDays),
              combined_volume: (move.used_volume || 0) + clientVolume,
              volume_ok: true,
              is_valid: true
            }
          });
        }

        console.log(`📊 ${clientMatches.length} matchs trouvés pour ${client.name}`);

        // Prendre les 5 meilleurs matchs par client
        clientMatches
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 5)
          .forEach(({ match }) => {
            // Vérifier si le match existe déjà
            const existingMatch = matches.find(m => 
              m.client_request_id === match.client_request_id && m.move_id === match.move_id
            );
            if (!existingMatch) {
              batchInserts.push(match);
              newMatchesCount++;
            }
          });
      }

      console.log('💾 Insertion en batch:', batchInserts.length, 'nouveaux matchs');

      if (batchInserts.length > 0) {
        const { error } = await supabase
          .from('move_matches')
          .insert(batchInserts);

        if (error) {
          console.error('❌ Erreur insertion batch:', error);
          throw error;
        }
      }

      console.log('✅ Recherche terminée:', newMatchesCount, 'nouveaux matchs');
      
      toast({
        title: "Recherche terminée",
        description: `${newMatchesCount} nouveaux matchs trouvés`,
      });

      refetchMatches();
    } catch (error) {
      console.error('❌ Erreur recherche matchs:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la recherche",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [clientRequests, moves, matches, calculateDistance, toast, refetchMatches]);

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

  const totalMatches = useMemo(() => 
    groupedMatches.reduce((total, group) => total + group.matches.length, 0), 
    [groupedMatches]
  );

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
          <h2 className="text-2xl font-bold text-gray-800">Recherche de correspondances 🔍</h2>
        </div>
        <div className="relative">
          <Button
            onClick={findMatches}
            disabled={isSearching}
            className="bg-blue-600 hover:bg-blue-700"
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
                <p className="text-sm text-gray-600">Correspondances</p>
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

      <MatchFilters onFiltersChange={handleFiltersChange} />

      {/* Liste des correspondances groupées par client */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Correspondances par client ({groupedMatches.length}) - Maximum 5 matchs par client
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
              <div className="mt-4 text-sm text-gray-400">
                <p>Debug: {clientRequests.length} clients, {moves.length} déménagements disponibles</p>
              </div>
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
                      {group.matches.length}/5 match{group.matches.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>

                {/* Liste des déménageurs correspondants */}
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-700">
                    Déménageurs disponibles (triés par proximité) :
                  </h5>
                  <div className="grid gap-4">
                    {group.matches.map((match, index) => (
                      <div
                        key={match.id}
                        className={`p-4 rounded-lg border ${
                          match.volume_ok ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
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
                                index === 0 ? 'bg-gold-100 text-gold-800' :
                                index <= 2 ? 'bg-green-100 text-green-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {index === 0 ? '🥇 Le plus proche' :
                                 index === 1 ? '🥈 2ème choix' :
                                 index === 2 ? '🥉 3ème choix' :
                                 `${index + 1}ème choix`}
                              </span>
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
                                <span className="text-gray-500">Distance départ:</span>
                                <span className="font-medium text-blue-600">
                                  {match.realDistance || match.distance_km}km
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
                    ))}
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
