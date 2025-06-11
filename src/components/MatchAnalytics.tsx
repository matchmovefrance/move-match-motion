import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, X, History, TrendingUp, TrendingDown, Users, Truck, Calendar, MapPin, Volume2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusToggle from './StatusToggle';

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
  client?: {
    id: number;
    name: string;
    email: string;
    departure_city: string;
    arrival_city: string;
    desired_date: string;
    estimated_volume: number;
  };
  move?: {
    id: number;
    company_name: string;
    departure_city: string;
    arrival_city: string;
    departure_date: string;
    available_volume: number;
    status_custom?: string;
  };
  actions?: Array<{
    action_type: string;
    action_date: string;
    notes: string;
    user_id: string;
  }>;
}

const MatchAnalytics = () => {
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMatches: 0,
    acceptedMatches: 0,
    rejectedMatches: 0,
    pendingMatches: 0,
    acceptanceRate: 0,
    averageDistance: 0,
    averageDateDiff: 0,
  });

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setMatchesLoading(true);
      console.log('🔄 Fetching match history...');

      // Fetch matches with actions
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

      // Fetch clients for these matches
      const clientIds = matchData?.map(match => match.client_request_id) || [];
      const { data: clientsData, error: clientsError } = await supabase
        .from('client_requests')
        .select('id, name, email, departure_city, arrival_city, desired_date, estimated_volume')
        .in('id', clientIds);

      if (clientsError) {
        console.error('Erreur lors de la récupération des clients:', clientsError);
      }

      // Fetch moves for these matches
      const moveIds = matchData?.map(match => match.move_id) || [];
      const { data: movesData, error: movesError } = await supabase
        .from('confirmed_moves')
        .select('id, company_name, departure_city, arrival_city, departure_date, available_volume, status_custom')
        .in('id', moveIds);

      if (movesError) {
        console.error('Erreur lors de la récupération des déménagements:', movesError);
      }

      // Enrichir les matches avec leurs actions, statuts, clients et déménagements
      const enrichedMatches = (matchData || []).map(match => {
        const matchActions = actionsData?.filter(action => action.match_id === match.id) || [];
        
        let status = 'pending';
        const latestAction = matchActions[0];
        if (latestAction) {
          status = latestAction.action_type;
        }

        const client = clientsData?.find(c => c.id === match.client_request_id);
        const move = movesData?.find(m => m.id === match.move_id);

        return {
          ...match,
          actions: matchActions,
          status,
          client,
          move
        };
      });

      console.log('✅ Match history loaded:', enrichedMatches.length);
      setMatches(enrichedMatches);

      // Calculate stats
      if (enrichedMatches.length > 0) {
        const accepted = enrichedMatches.filter(m => m.status === 'accepted').length;
        const rejected = enrichedMatches.filter(m => m.status === 'rejected').length;
        const pending = enrichedMatches.filter(m => m.status === 'pending').length;
        
        const totalDistances = enrichedMatches.reduce((sum, match) => sum + match.distance_km, 0);
        const totalDateDiffs = enrichedMatches.reduce((sum, match) => sum + match.date_diff_days, 0);
        
        setStats({
          totalMatches: enrichedMatches.length,
          acceptedMatches: accepted,
          rejectedMatches: rejected,
          pendingMatches: pending,
          acceptanceRate: Math.round((accepted / (accepted + rejected || 1)) * 100),
          averageDistance: Math.round(totalDistances / enrichedMatches.length),
          averageDateDiff: Math.round(totalDateDiffs / enrichedMatches.length),
        });
      }

    } catch (error) {
      console.error('Error fetching match history:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique des correspondances",
        variant: "destructive",
      });
    } finally {
      setMatchesLoading(false);
    }
  };

  const handleMatchAction = async (matchId: number, actionType: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('match_actions')
        .insert({
          match_id: matchId,
          action_type: actionType,
          action_date: new Date().toISOString(),
          notes: `Match ${actionType === 'accepted' ? 'accepté' : 'rejeté'} manuellement`
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Match ${actionType === 'accepted' ? 'accepté' : 'rejeté'} avec succès`,
      });

      await fetchMatches();
    } catch (error) {
      console.error('Error processing match action:', error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter l'action",
        variant: "destructive",
      });
    }
  };

  const handleMoveStatusChange = async (moveId: number, newStatus: 'en_cours' | 'termine') => {
    try {
      const { error } = await supabase
        .from('confirmed_moves')
        .update({ status_custom: newStatus })
        .eq('id', moveId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Déménagement ${newStatus === 'termine' ? 'terminé' : 'remis en cours'}`,
      });

      fetchMatches();
    } catch (error) {
      console.error('Error updating move status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const getMatchStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800 border-green-200">✅ Accepté</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">❌ Rejeté</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">⏳ En attente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <TrendingUp className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Analyse des correspondances</h2>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total des correspondances</p>
                <p className="text-2xl font-bold">{stats.totalMatches}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Taux d'acceptation</p>
                <p className="text-2xl font-bold">{stats.acceptanceRate}%</p>
                <p className="text-xs text-gray-500">{stats.acceptedMatches} acceptés / {stats.rejectedMatches} rejetés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Distance moyenne</p>
                <p className="text-2xl font-bold">{stats.averageDistance} km</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Écart de dates moyen</p>
                <p className="text-2xl font-bold">{stats.averageDateDiff} jours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historique des correspondances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            Historique des correspondances
          </CardTitle>
        </CardHeader>
        <CardContent>
          {matchesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : matches && matches.length > 0 ? (
            <div className="space-y-4">
              {matches.map((match) => (
                <div key={match.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Client</h4>
                      <p className="text-sm">{match.client?.name || 'Non renseigné'}</p>
                      <p className="text-xs text-gray-600">{match.client?.email}</p>
                      <p className="text-xs text-gray-500">
                        {match.client?.departure_city} → {match.client?.arrival_city}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Déménageur</h4>
                      <p className="text-sm">{match.move?.company_name || 'Non renseigné'}</p>
                      <p className="text-xs text-gray-500">
                        {match.move?.departure_city} → {match.move?.arrival_city}
                      </p>
                      <p className="text-xs text-gray-500">
                        Date: {match.move?.departure_date ? new Date(match.move.departure_date).toLocaleDateString('fr-FR') : 'Non définie'}
                      </p>
                      {match.move && (
                        <div className="mt-2">
                          <StatusToggle
                            status={match.move.status_custom || 'en_cours'}
                            onStatusChange={(newStatus) => handleMoveStatusChange(match.move.id, newStatus)}
                            variant="button"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Correspondance</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={`${
                          match.match_type === 'perfect' ? 'bg-green-100 text-green-800' :
                          match.match_type === 'good' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {match.match_type === 'perfect' ? 'Parfait' :
                           match.match_type === 'good' ? 'Bon' : 'Partiel'}
                        </Badge>
                        {getMatchStatusBadge(match.status || 'pending')}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        <div>Distance: {match.distance_km}km</div>
                        <div>Écart de dates: {match.date_diff_days} jours</div>
                        <div>Volume combiné: {match.combined_volume}m³</div>
                      </div>
                      {match.status === 'pending' && (
                        <div className="flex space-x-2 mt-2">
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
          ) : (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune correspondance trouvée</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MatchAnalytics;
