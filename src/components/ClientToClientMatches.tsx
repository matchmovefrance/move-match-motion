
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, MapPin, Calendar, Package, TrendingUp, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ClientToClientMatchingService } from '@/services/ClientToClientMatchingService';
import { useMatchActions } from '@/hooks/useMatchActions';

interface ClientToClientMatchesProps {
  clientId?: number;
  clientName?: string;
  globalMatches?: any[];
}

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

const ClientToClientMatches = ({ clientId, clientName, globalMatches }: ClientToClientMatchesProps) => {
  const { toast } = useToast();
  const { acceptMatch, rejectMatch, loading: actionLoading } = useMatchActions();
  const [matches, setMatches] = useState<ClientToClientMatch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (globalMatches) {
      // Utiliser les résultats globaux s'ils sont fournis
      const filteredMatches = clientId 
        ? globalMatches.filter((match: any) => 
            match.primary_client.id === clientId || match.secondary_client.id === clientId
          )
        : globalMatches;
      setMatches(filteredMatches);
    } else if (!clientId) {
      // Recherche normale pour tous les clients
      findMatches();
    } else {
      // Recherche spécifique pour un client
      findClientMatches();
    }
  }, [clientId, globalMatches]);

  const findMatches = async () => {
    try {
      setLoading(true);
      console.log('🔍 Recherche de correspondances client-à-client...');
      
      const results = await ClientToClientMatchingService.findClientToClientMatches();
      setMatches(results);
      
      if (!clientId) {
        toast({
          title: "Recherche terminée",
          description: `${results.length} correspondances client-à-client trouvées`,
        });
      }
      
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

  const findClientMatches = async () => {
    if (!clientId) return;
    
    try {
      setLoading(true);
      console.log(`🔍 Recherche matches pour client ${clientId}...`);
      
      const allResults = await ClientToClientMatchingService.findClientToClientMatches();
      const clientMatches = allResults.filter(match => 
        match.primary_client.id === clientId || match.secondary_client.id === clientId
      );
      
      setMatches(clientMatches);
      
      toast({
        title: "Recherche terminée",
        description: `${clientMatches.length} correspondances trouvées pour ${clientName}`,
      });
      
    } catch (error) {
      console.error('❌ Erreur recherche matches client:', error);
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
    const success = await acceptMatch(match);
    if (success) {
      if (globalMatches) {
        // Si on utilise les résultats globaux, ne pas refaire la recherche
        return;
      }
      if (clientId) {
        await findClientMatches();
      } else {
        await findMatches();
      }
    }
  };

  const getMatchTypeDetails = (type: string) => {
    switch (type) {
      case 'same_departure': 
        return {
          label: 'Même Départ',
          description: 'Groupage depuis la même zone de départ',
          icon: <Users className="h-4 w-4" />,
          color: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'return_trip': 
        return {
          label: 'Aller-Retour',
          description: 'Optimisation via trajet aller-retour',
          icon: <TrendingUp className="h-4 w-4" />,
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
              {clientId ? `Matches pour ${clientName}` : 'Matching Client-à-Client'}
            </h3>
            <p className="text-sm text-gray-600">
              Groupages et optimisations de trajets entre clients
            </p>
          </div>
        </div>
        {!globalMatches && (
          <Button 
            onClick={clientId ? findClientMatches : findMatches} 
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
                <p className="text-sm font-medium text-blue-800">Même Départ</p>
                <p className="text-2xl font-bold text-blue-900">
                  {matches.filter(m => m.match_type === 'same_departure').length}
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
                <p className="text-sm font-medium text-green-800">Aller-Retour</p>
                <p className="text-2xl font-bold text-green-900">
                  {matches.filter(m => m.match_type === 'return_trip').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-orange-600" />
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

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {clientId ? `Recherche des correspondances pour ${clientName}...` : 'Analyse des correspondances client-à-client...'}
          </p>
        </div>
      ) : matches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {clientId ? `Aucune correspondance trouvée pour ${clientName}` : 'Aucune correspondance client-à-client trouvée'}
            </h3>
            <p className="text-gray-500">
              {clientId 
                ? 'Ce client ne peut pas être groupé avec d\'autres clients actuellement'
                : 'Aucun groupage possible entre les clients actuels'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {matches.map((match, index) => {
            const typeDetails = getMatchTypeDetails(match.match_type);
            
            return (
              <Card 
                key={`${match.match_reference}-${index}`}
                className="border-purple-200 bg-purple-50/30 hover:shadow-lg transition-shadow"
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
                      <Badge className="bg-green-100 text-green-800">
                        {match.savings_estimate.cost_reduction_percent}% d'économie
                      </Badge>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700">
                        Score: {match.match_score}
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
                            Date souhaitée:
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
                            Date souhaitée:
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

                  {/* Métriques de compatibilité */}
                  <div className="mt-6 pt-4 border-t">
                    <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Analyse de Compatibilité
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
                        <MapPin className="h-5 w-5 text-blue-600 mb-1" />
                        <span className="font-medium text-blue-800">{match.distance_km}km</span>
                        <span className="text-xs text-blue-600">Distance détour</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-purple-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-purple-600 mb-1" />
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
                        <span className="font-medium text-green-800">{match.savings_estimate.cost_reduction_percent}%</span>
                        <span className="text-xs text-green-600">Économie estimée</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex justify-end space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptMatch(match)}
                      disabled={actionLoading}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Accepter Groupage
                    </Button>
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
