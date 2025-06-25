
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, MapPin, Calendar, Package, TrendingUp, CheckCircle, XCircle, Repeat } from 'lucide-react';
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

const ClientToClientMatches = () => {
  const { toast } = useToast();
  const { acceptMatch, rejectMatch, loading: actionLoading } = useMatchActions();
  const [matches, setMatches] = useState<ClientToClientMatch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    findMatches();
  }, []);

  const findMatches = async () => {
    try {
      setLoading(true);
      console.log('🔍 Recherche de correspondances client-à-client...');
      
      const results = await ClientToClientMatchingService.findClientToClientMatches();
      setMatches(results);
      
      toast({
        title: "Recherche terminée",
        description: `${results.length} correspondances client-à-client trouvées`,
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
    // Adapter le format pour useMatchActions
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
      await findMatches(); // Recharger les matches
    }
  };

  const getMatchTypeLabel = (type: string) => {
    switch (type) {
      case 'same_departure': return 'Départ Groupé';
      case 'return_trip': return 'Trajet Retour';
      default: return type;
    }
  };

  const getMatchTypeIcon = (type: string) => {
    switch (type) {
      case 'same_departure': return <Users className="h-4 w-4" />;
      case 'return_trip': return <Repeat className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
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
          <h3 className="text-2xl font-bold text-gray-800">Matching Client-à-Client</h3>
        </div>
        <Button 
          onClick={findMatches} 
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {loading ? 'Recherche...' : 'Actualiser'}
        </Button>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-purple-800 mb-2">
          <Users className="h-5 w-5" />
          <span className="font-semibold">Optimisation Client-à-Client</span>
        </div>
        <div className="text-sm text-purple-700">
          • <strong>Départs groupés</strong> : clients partant de la même zone (≤100km)<br/>
          • <strong>Trajets retour</strong> : optimisation des retours entre destinations<br/>
          • <strong>Économies</strong> : réduction des coûts de 30-55% par mutualisation
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Recherche des correspondances optimales...</p>
        </div>
      ) : matches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Aucune correspondance client-à-client trouvée
            </h3>
            <p className="text-gray-500">
              Aucun regroupement ou trajet retour possible dans un rayon de 100km
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {matches.map((match, index) => (
            <Card 
              key={`${match.match_reference}-${index}`}
              className={`${match.is_valid ? 'border-green-200 bg-green-50/30' : 'border-orange-200 bg-orange-50/30'}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="font-mono">
                      {match.match_reference}
                    </Badge>
                    <Badge className="bg-purple-100 text-purple-800">
                      {getMatchTypeIcon(match.match_type)}
                      <span className="ml-1">{getMatchTypeLabel(match.match_type)}</span>
                    </Badge>
                    <Badge className={match.is_valid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                      {match.is_valid ? 'Compatible' : 'Partiel'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-green-600">
                      -{match.savings_estimate.cost_reduction_percent}% coût
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Client Principal */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-purple-800 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Client Principal
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Nom:</strong> {match.primary_client.name}</p>
                      <p><strong>Référence:</strong> {match.primary_client.client_reference || `CLI-${match.primary_client.id}`}</p>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <span>{match.primary_client.departure_postal_code} → {match.primary_client.arrival_postal_code}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <span>{new Date(match.primary_client.desired_date).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-orange-600" />
                        <span>{match.primary_client.estimated_volume || 0}m³</span>
                      </div>
                    </div>
                  </div>

                  {/* Client Secondaire */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-purple-800 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Client Secondaire
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Nom:</strong> {match.secondary_client.name}</p>
                      <p><strong>Référence:</strong> {match.secondary_client.client_reference || `CLI-${match.secondary_client.id}`}</p>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <span>{match.secondary_client.departure_postal_code} → {match.secondary_client.arrival_postal_code}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <span>{new Date(match.secondary_client.desired_date).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-orange-600" />
                        <span>{match.secondary_client.estimated_volume || 0}m³</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Métriques du match */}
                <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span><strong>{match.distance_km}km</strong> écart</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <span><strong>±{match.date_diff_days}j</strong></span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {match.volume_compatible ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>Volume: {match.combined_volume}m³</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span><strong>{match.savings_estimate.shared_transport_cost}€</strong> estimé</span>
                  </div>
                </div>

                {match.is_valid && (
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
                )}

                {!match.is_valid && (
                  <div className="mt-4 text-xs text-orange-700 bg-orange-100 p-3 rounded">
                    <strong>Incompatibilité:</strong>
                    {match.date_diff_days > 15 && ' Écart dates > 15j •'}
                    {!match.volume_compatible && ' Volume insuffisant •'}
                    {match.distance_km > 100 && ' Distance > 100km'}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ClientToClientMatches;
