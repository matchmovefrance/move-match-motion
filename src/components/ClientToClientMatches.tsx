import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, MapPin, Calendar, Package, TrendingUp, CheckCircle, XCircle, Target, Clock, Route } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ClientToClientMatchingService } from '@/services/ClientToClientMatchingService';
import { useMatchActions } from '@/hooks/useMatchActions';
import { supabase } from '@/integrations/supabase/client';

interface ClientToClientMatchesProps {
  clientId?: number;
  clientName?: string;
  globalMatches?: any[];
}

interface ClientToClientMatch {
  client1: any;
  client2: any;
  match_type: 'bidirectional_shared' | 'unidirectional_shared' | 'optimized_route';
  distance_km: number;
  date_diff_days: number;
  volume_compatible: boolean;
  combined_volume: number;
  cost_savings: number;
  is_valid: boolean;
  match_reference: string;
  efficiency_score: number;
}

const ClientToClientMatches = ({ clientId, clientName, globalMatches }: ClientToClientMatchesProps) => {
  const { toast } = useToast();
  const { acceptMatch, rejectMatch, loading: actionLoading } = useMatchActions();
  const [matches, setMatches] = useState<ClientToClientMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [acceptedMatches, setAcceptedMatches] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (globalMatches) {
      // Convert globalMatches to the expected format
      const convertedMatches = globalMatches.map(match => ({
        client1: match.primary_client || match.client1,
        client2: match.secondary_client || match.client2,
        match_type: match.match_type as 'bidirectional_shared' | 'unidirectional_shared' | 'optimized_route',
        distance_km: match.distance_km,
        date_diff_days: match.date_diff_days,
        volume_compatible: match.volume_compatible,
        combined_volume: match.combined_volume,
        cost_savings: match.savings_estimate?.cost_reduction_percent || 0,
        is_valid: match.is_valid,
        match_reference: match.match_reference,
        efficiency_score: match.match_score || 0
      }));
      setMatches(convertedMatches);
    } else if (clientId) {
      findMatchesForClient();
    } else {
      findMatches();
    }
    loadAcceptedMatches();
  }, [globalMatches, clientId]);

  const loadAcceptedMatches = async () => {
    try {
      // Charger les clients avec match_status = 'accepted'
      const { data: acceptedClients, error } = await supabase
        .from('clients')
        .select('id, client_reference')
        .eq('match_status', 'accepted');

      if (error) throw error;

      const acceptedSet = new Set(
        acceptedClients?.map(client => `client-${client.id}`) || []
      );
      setAcceptedMatches(acceptedSet);
    } catch (error) {
      console.error('❌ Erreur chargement matchs acceptés:', error);
    }
  };

  const findMatchesForClient = async () => {
    if (!clientId) return;
    
    try {
      setLoading(true);
      console.log(`🔍 Recherche de correspondances pour client ${clientId}...`);
      
      const results = await ClientToClientMatchingService.findClientToClientMatches();
      // Filter matches that involve this specific client
      const clientMatches = results.filter(match => 
        match.primary_client?.id === clientId || match.secondary_client?.id === clientId
      ).map(match => ({
        client1: match.primary_client,
        client2: match.secondary_client,
        match_type: match.match_type as 'bidirectional_shared' | 'unidirectional_shared' | 'optimized_route',
        distance_km: match.distance_km,
        date_diff_days: match.date_diff_days,
        volume_compatible: match.volume_compatible,
        combined_volume: match.combined_volume,
        cost_savings: match.savings_estimate?.cost_reduction_percent || 0,
        is_valid: match.is_valid,
        match_reference: match.match_reference,
        efficiency_score: match.match_score || 0
      }));
      
      setMatches(clientMatches);
      
      toast({
        title: "Recherche terminée",
        description: `${clientMatches.length} correspondances trouvées pour ${clientName}`,
      });
      
    } catch (error) {
      console.error('❌ Erreur recherche matches:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rechercher les correspondances",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const findMatches = async () => {
    try {
      setLoading(true);
      console.log('🔍 Recherche de correspondances client-à-client...');
      
      const results = await ClientToClientMatchingService.findClientToClientMatches();
      const convertedMatches = results.map(match => ({
        client1: match.primary_client,
        client2: match.secondary_client,
        match_type: match.match_type as 'bidirectional_shared' | 'unidirectional_shared' | 'optimized_route',
        distance_km: match.distance_km,
        date_diff_days: match.date_diff_days,
        volume_compatible: match.volume_compatible,
        combined_volume: match.combined_volume,
        cost_savings: match.savings_estimate?.cost_reduction_percent || 0,
        is_valid: match.is_valid,
        match_reference: match.match_reference,
        efficiency_score: match.match_score || 0
      }));
      
      setMatches(convertedMatches);
      
      toast({
        title: "Recherche terminée",
        description: `${convertedMatches.length} correspondances client-à-client trouvées`,
      });
      
    } catch (error) {
      console.error('❌ Erreur recherche matches:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rechercher les correspondances",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptMatch = async (match: ClientToClientMatch) => {
    // Pour les matchs client-client, on accepte le premier client
    const matchData = {
      ...match,
      client: match.client1,
      move: null // Pas de trajet spécifique pour les matchs client-client
    };
    
    const success = await acceptMatch(matchData);
    if (success) {
      // Marquer les deux clients comme acceptés
      setAcceptedMatches(prev => new Set([
        ...prev, 
        `client-${match.client1.id}`,
        `client-${match.client2.id}`
      ]));
      
      if (!globalMatches) {
        if (clientId) {
          await findMatchesForClient();
        } else {
          await findMatches();
        }
      }
    }
  };

  const handleRejectMatch = async (match: ClientToClientMatch) => {
    const matchData = {
      ...match,
      client: match.client1,
      move: null
    };
    
    const success = await rejectMatch(matchData);
    if (success && !globalMatches) {
      if (clientId) {
        await findMatchesForClient();
      } else {
        await findMatches();
      }
    }
  };

  const isMatchAccepted = (match: ClientToClientMatch) => {
    return acceptedMatches.has(`client-${match.client1.id}`) || 
           acceptedMatches.has(`client-${match.client2.id}`);
  };

  const getMatchTypeDetails = (type: string) => {
    switch (type) {
      case 'bidirectional_shared': 
        return {
          label: 'Partage Bidirectionnel',
          description: 'Les deux clients partagent le même trajet',
          icon: <Users className="h-4 w-4" />,
          color: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'unidirectional_shared': 
        return {
          label: 'Partage Unidirectionnel',
          description: 'Un client profite du trajet de l\'autre',
          icon: <TrendingUp className="h-4 w-4" />,
          color: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'optimized_route': 
        return {
          label: 'Route Optimisée',
          description: 'Les deux clients sont intégrés dans un circuit optimisé',
          icon: <Route className="h-4 w-4" />,
          color: 'bg-purple-100 text-purple-800 border-purple-200'
        };
      case 'same_departure':
        return {
          label: 'Même Départ',
          description: 'Les deux clients partagent la même zone de départ',
          icon: <Users className="h-4 w-4" />,
          color: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'return_trip':
        return {
          label: 'Trajet Retour',
          description: 'Optimisation avec trajet de retour',
          icon: <Route className="h-4 w-4" />,
          color: 'bg-green-100 text-green-800 border-green-200'
        };
      default: 
        return {
          label: type,
          description: '',
          icon: <Users className="h-4 w-4" />,
          color: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const formatDateDifference = (days: number) => {
    if (days === 0) return 'Même date';
    if (days === 1) return '1 jour d\'écart';
    return `${days} jours d\'écart`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-purple-600" />
          <div>
            <h3 className="text-2xl font-bold text-gray-800">
              {clientId ? `Matching pour ${clientName}` : 'Matching Client-à-Client'}
            </h3>
            <p className="text-sm text-gray-600">
              {clientId 
                ? `Correspondances spécifiques pour ce client`
                : 'Correspondances partagées et circuits optimisés entre clients'
              }
            </p>
          </div>
        </div>
        {!globalMatches && (
          <Button 
            onClick={clientId ? findMatchesForClient : findMatches} 
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? 'Recherche...' : 'Actualiser'}
          </Button>
        )}
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-800">Total Matches</p>
                <p className="text-2xl font-bold text-purple-900">{matches.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800">Partage Bidirectionnel</p>
                <p className="text-2xl font-bold text-blue-900">
                  {matches.filter(m => m.match_type === 'bidirectional_shared').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Partage Unidirectionnel</p>
                <p className="text-2xl font-bold text-green-900">
                  {matches.filter(m => m.match_type === 'unidirectional_shared').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-800">Score Moyen</p>
                <p className="text-2xl font-bold text-orange-900">
                  {matches.length > 0 
                    ? Math.round(matches.reduce((acc, m) => acc + m.efficiency_score, 0) / matches.length)
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Guide explicatif */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-purple-800 mb-2">
          <Users className="h-5 w-5" />
          <span className="font-semibold">Logique de Matching Client-à-Client</span>
        </div>
        <div className="text-sm text-purple-700 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <strong>🤝 Partage bidirectionnel :</strong> Les deux clients partagent un même trajet (économies maximales)
          </div>
          <div>
            <strong>↗️ Partage unidirectionnel :</strong> Un client profite d'un trajet déjà prévu par un autre
          </div>
          <div>
            <strong>🔗 Route optimisée :</strong> Les deux clients sont intégrés dans un circuit multi-arrêts
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyse des correspondances client-à-client...</p>
        </div>
      ) : matches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {clientId 
                ? `Aucune correspondance trouvée pour ${clientName}`
                : 'Aucune correspondance client-à-client trouvée'
              }
            </h3>
            <p className="text-gray-500">
              {clientId 
                ? 'Ce client n\'a pas de correspondance avec d\'autres clients actuellement'
                : 'Aucun regroupement optimal n\'a été identifié entre les clients actuels'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {matches.map((match, index) => {
            const typeDetails = getMatchTypeDetails(match.match_type);
            const isAccepted = isMatchAccepted(match);
            
            return (
              <Card 
                key={`${match.match_reference}-${index}`}
                className={`border-purple-200 bg-purple-50/30 hover:shadow-lg transition-shadow ${
                  isAccepted ? 'opacity-75' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="font-mono text-xs">
                        {match.match_reference}
                      </Badge>
                      <Badge className={typeDetails.color}>
                        {typeDetails.icon}
                        <span className="ml-1">{typeDetails.label}</span>
                      </Badge>
                      {isAccepted ? (
                        <Badge className="bg-green-100 text-green-800">
                          ✓ Match Accepté
                        </Badge>
                      ) : (
                        <Badge className="bg-purple-100 text-purple-800">
                          ✓ Compatible
                        </Badge>
                      )}
                      <Badge variant="outline" className="bg-orange-50 text-orange-700">
                        Score: {match.efficiency_score}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{typeDetails.description}</p>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Informations Client 1 */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-blue-800 flex items-center border-b pb-2">
                        <Users className="h-4 w-4 mr-2" />
                        Client 1
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">Nom:</span>
                          <span>{match.client1.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Référence:</span>
                          <span className="font-mono">{match.client1.client_reference || `CLI-${match.client1.id}`}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center">
                            <MapPin className="h-3 w-3 mr-1 text-green-600" />
                            Trajet:
                          </span>
                          <span className="text-right">
                            {match.client1.departure_postal_code} → {match.client1.arrival_postal_code}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-purple-600" />
                            Date souhaitée:
                          </span>
                          <span>{new Date(match.client1.desired_date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center">
                            <Package className="h-3 w-3 mr-1 text-orange-600" />
                            Volume:
                          </span>
                          <span>{match.client1.estimated_volume || 0}m³</span>
                        </div>
                      </div>
                    </div>

                    {/* Informations Client 2 */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-blue-800 flex items-center border-b pb-2">
                        <Users className="h-4 w-4 mr-2" />
                        Client 2
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">Nom:</span>
                          <span>{match.client2.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Référence:</span>
                          <span className="font-mono">{match.client2.client_reference || `CLI-${match.client2.id}`}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center">
                            <MapPin className="h-3 w-3 mr-1 text-green-600" />
                            Trajet:
                          </span>
                          <span className="text-right">
                            {match.client2.departure_postal_code} → {match.client2.arrival_postal_code}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-purple-600" />
                            Date souhaitée:
                          </span>
                          <span>{new Date(match.client2.desired_date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center">
                            <Package className="h-3 w-3 mr-1 text-orange-600" />
                            Volume:
                          </span>
                          <span>{match.client2.estimated_volume || 0}m³</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Métriques de compatibilité */}
                  <div className="mt-6 pt-4 border-t">
                    <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Analyse de Compatibilité
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
                        <Route className="h-5 w-5 text-blue-600 mb-1" />
                        <span className="font-medium text-blue-800">{match.distance_km}km</span>
                        <span className="text-xs text-blue-600">Distance totale</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-purple-50 rounded-lg">
                        <Clock className="h-5 w-5 text-purple-600 mb-1" />
                        <span className="font-medium text-purple-800">{formatDateDifference(match.date_diff_days)}</span>
                        <span className="text-xs text-purple-600">Flexibilité</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-orange-50 rounded-lg">
                        <Package className="h-5 w-5 text-orange-600 mb-1" />
                        <span className="font-medium text-orange-800">{match.combined_volume}m³</span>
                        <span className="text-xs text-orange-600">Volume combiné</span>
                      </div>
                       <div className="flex flex-col items-center p-3 bg-green-50 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-green-600 mb-1" />
                        <span className="font-medium text-green-800">{match.efficiency_score}</span>
                        <span className="text-xs text-green-600">Score efficacité</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex justify-end space-x-2">
                    {isAccepted ? (
                      <Badge className="bg-green-100 text-green-800 px-4 py-2">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Match Déjà Accepté
                      </Badge>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectMatch(match)}
                          disabled={actionLoading}
                          className="border-red-200 text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Refuser Match
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAcceptMatch(match)}
                          disabled={actionLoading}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accepter Match
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default ClientToClientMatches;
