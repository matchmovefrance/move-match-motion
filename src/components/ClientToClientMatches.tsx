
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, MapPin, Calendar, Package, TrendingUp, CheckCircle, XCircle, Repeat, Clock, Euro, Route } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ClientToClientMatchingService } from '@/services/ClientToClientMatchingService';
import { useMatchActions } from '@/hooks/useMatchActions';

interface ClientToClientMatch {
  primary_client: any;
  secondary_client: any;
  match_type: 'same_departure' | 'return_trip';
  distance_km: number;
  date_diff_days: number;
  volume_compatible: boolean;
  combined_volume: number;
  match_score: number;
  is_valid: boolean;
  match_reference: string;
  savings_estimate: {
    cost_reduction_percent: number;
    shared_transport_cost: number;
  };
}

interface ClientToClientMatchesProps {
  clientId?: number; // Pour afficher les matches d'un client spécifique
  clientName?: string;
}

const ClientToClientMatches = ({ clientId, clientName }: ClientToClientMatchesProps) => {
  const { toast } = useToast();
  const { acceptMatch, rejectMatch, loading: actionLoading } = useMatchActions();
  const [matches, setMatches] = useState<ClientToClientMatch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    findMatches();
  }, [clientId]);

  const findMatches = async () => {
    try {
      setLoading(true);
      console.log('🔍 Recherche de correspondances client-à-client...');
      
      const results = await ClientToClientMatchingService.findClientToClientMatches();
      
      // Si un clientId est spécifié, filtrer les résultats pour ce client
      const filteredResults = clientId 
        ? results.filter(match => 
            match.primary_client.id === clientId || match.secondary_client.id === clientId
          )
        : results;
      
      setMatches(filteredResults);
      
      const message = clientId 
        ? `${filteredResults.length} correspondances trouvées pour ${clientName}`
        : `${filteredResults.length} correspondances client-à-client trouvées`;
      
      toast({
        title: "Recherche terminée",
        description: message,
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
    const matchData = {
      client: match.primary_client,
      move: {
        id: `c2c-${match.primary_client.id}-${match.secondary_client.id}`,
        company_name: 'Transport Groupé Client-à-Client',
        departure_postal_code: match.primary_client.departure_postal_code,
        arrival_postal_code: match.primary_client.arrival_postal_code,
        departure_date: match.primary_client.desired_date,
        max_volume: 40,
        used_volume: match.combined_volume,
        available_volume: 40 - match.combined_volume,
        number_of_clients: 2
      },
      distance_km: match.distance_km,
      date_diff_days: match.date_diff_days,
      volume_compatible: match.volume_compatible,
      available_volume_after: 40 - match.combined_volume,
      is_valid: match.is_valid,
      match_reference: match.match_reference
    };
    
    const success = await acceptMatch(matchData);
    if (success) {
      await findMatches();
    }
  };

  const getMatchTypeDetails = (type: string) => {
    switch (type) {
      case 'same_departure': 
        return {
          label: 'Départ Groupé',
          description: 'Clients partant de la même zone géographique',
          icon: <Users className="h-4 w-4" />,
          color: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'return_trip': 
        return {
          label: 'Trajet Retour',
          description: 'Optimisation via trajets de retour complémentaires',
          icon: <Repeat className="h-4 w-4" />,
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

  const getCompatibilityScore = (match: ClientToClientMatch) => {
    let score = 100;
    
    // Pénalités basées sur les critères
    score -= match.distance_km * 0.5; // -0.5 point par km
    score -= match.date_diff_days * 2; // -2 points par jour d'écart
    if (!match.volume_compatible) score -= 20; // -20 points si volume incompatible
    
    return Math.max(0, Math.round(score));
  };

  const formatDateDifference = (days: number) => {
    if (days === 0) return 'Même date';
    if (days === 1) return '1 jour d\'écart';
    return `${days} jours d'écart`;
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
              {clientId ? `Correspondances pour ${clientName}` : 'Matching Client-à-Client'}
            </h3>
            <p className="text-sm text-gray-600">
              Regroupements et trajets retour optimisés dans un rayon de 100km
            </p>
          </div>
        </div>
        <Button 
          onClick={findMatches} 
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {loading ? 'Recherche...' : 'Actualiser'}
        </Button>
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
        
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Compatibles</p>
                <p className="text-2xl font-bold text-green-900">
                  {matches.filter(m => m.is_valid).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800">Départs Groupés</p>
                <p className="text-2xl font-bold text-blue-900">
                  {matches.filter(m => m.match_type === 'same_departure').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-800">Économies Moy.</p>
                <p className="text-2xl font-bold text-orange-900">
                  {matches.length > 0 
                    ? Math.round(matches.reduce((acc, m) => acc + m.savings_estimate.cost_reduction_percent, 0) / matches.length)
                    : 0}%
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
          <span className="font-semibold">Comment ça marche ?</span>
        </div>
        <div className="text-sm text-purple-700 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <strong>🚚 Départs groupés :</strong> Clients partant de zones proches (≤100km) avec destinations compatibles
          </div>
          <div>
            <strong>🔄 Trajets retour :</strong> L'arrivée d'un client correspond au départ de l'autre
          </div>
          <div>
            <strong>💰 Économies :</strong> Réduction des coûts de 30-55% par mutualisation des transports
          </div>
          <div>
            <strong>📅 Flexibilité :</strong> Dates compatibles dans une fenêtre de ±15 jours
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyse des correspondances optimales...</p>
        </div>
      ) : matches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {clientId ? `Aucune correspondance pour ${clientName}` : 'Aucune correspondance client-à-client trouvée'}
            </h3>
            <p className="text-gray-500">
              {clientId 
                ? 'Aucun autre client compatible dans un rayon de 100km pour les dates spécifiées'
                : 'Aucun regroupement ou trajet retour possible dans un rayon de 100km'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {matches.map((match, index) => {
            const typeDetails = getMatchTypeDetails(match.match_type);
            const compatibilityScore = getCompatibilityScore(match);
            
            return (
              <Card 
                key={`${match.match_reference}-${index}`}
                className={`${match.is_valid ? 'border-green-200 bg-green-50/30' : 'border-orange-200 bg-orange-50/30'} hover:shadow-lg transition-shadow`}
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
                      <Badge className={match.is_valid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                        {match.is_valid ? '✓ Compatible' : '⚠ Partiel'}
                      </Badge>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700">
                        Score: {compatibilityScore}%
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-green-600 font-semibold">
                        -{match.savings_estimate.cost_reduction_percent}% coût
                      </Badge>
                      <Badge variant="outline" className="text-blue-600">
                        ~{match.savings_estimate.shared_transport_cost}€
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{typeDetails.description}</p>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Client Principal */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-purple-800 flex items-center border-b pb-2">
                        <Users className="h-4 w-4 mr-2" />
                        Client Principal
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">Nom:</span>
                          <span>{match.primary_client.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Référence:</span>
                          <span className="font-mono">{match.primary_client.client_reference || `CLI-${match.primary_client.id}`}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center">
                            <MapPin className="h-3 w-3 mr-1 text-green-600" />
                            Trajet:
                          </span>
                          <span className="text-right">
                            {match.primary_client.departure_postal_code} → {match.primary_client.arrival_postal_code}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-purple-600" />
                            Date:
                          </span>
                          <span>{new Date(match.primary_client.desired_date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center">
                            <Package className="h-3 w-3 mr-1 text-orange-600" />
                            Volume:
                          </span>
                          <span>{match.primary_client.estimated_volume || 0}m³</span>
                        </div>
                      </div>
                    </div>

                    {/* Client Secondaire */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-purple-800 flex items-center border-b pb-2">
                        <Users className="h-4 w-4 mr-2" />
                        Client Secondaire
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">Nom:</span>
                          <span>{match.secondary_client.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Référence:</span>
                          <span className="font-mono">{match.secondary_client.client_reference || `CLI-${match.secondary_client.id}`}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center">
                            <MapPin className="h-3 w-3 mr-1 text-green-600" />
                            Trajet:
                          </span>
                          <span className="text-right">
                            {match.secondary_client.departure_postal_code} → {match.secondary_client.arrival_postal_code}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-purple-600" />
                            Date:
                          </span>
                          <span>{new Date(match.secondary_client.desired_date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center">
                            <Package className="h-3 w-3 mr-1 text-orange-600" />
                            Volume:
                          </span>
                          <span>{match.secondary_client.estimated_volume || 0}m³</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Métriques détaillées du match */}
                  <div className="mt-6 pt-4 border-t">
                    <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Analyse de Compatibilité
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
                        <Route className="h-5 w-5 text-blue-600 mb-1" />
                        <span className="font-medium text-blue-800">{match.distance_km}km</span>
                        <span className="text-xs text-blue-600">Distance</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-purple-50 rounded-lg">
                        <Clock className="h-5 w-5 text-purple-600 mb-1" />
                        <span className="font-medium text-purple-800">{formatDateDifference(match.date_diff_days)}</span>
                        <span className="text-xs text-purple-600">Flexibilité</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-orange-50 rounded-lg">
                        <Package className="h-5 w-5 text-orange-600 mb-1" />
                        <span className="font-medium text-orange-800">{match.combined_volume}m³</span>
                        <span className="text-xs text-orange-600">Volume Total</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-green-50 rounded-lg">
                        <Euro className="h-5 w-5 text-green-600 mb-1" />
                        <span className="font-medium text-green-800">{match.savings_estimate.shared_transport_cost}€</span>
                        <span className="text-xs text-green-600">Coût Estimé</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {match.is_valid ? (
                    <div className="mt-4 flex justify-end space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptMatch(match)}
                        disabled={actionLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accepter Groupage
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-orange-100 border border-orange-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <XCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                        <div className="text-xs text-orange-800">
                          <strong>Incompatibilités détectées:</strong>
                          <ul className="mt-1 space-y-1">
                            {match.date_diff_days > 15 && (
                              <li>• Écart de dates trop important ({match.date_diff_days} jours, max 15j)</li>
                            )}
                            {!match.volume_compatible && (
                              <li>• Volume combiné trop important ({match.combined_volume}m³, max 40m³)</li>
                            )}
                            {match.distance_km > 100 && (
                              <li>• Distance excessive ({match.distance_km}km, max 100km)</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
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
