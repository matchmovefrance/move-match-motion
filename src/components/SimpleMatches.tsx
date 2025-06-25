
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, MapPin, Calendar, Package, TrendingUp, CheckCircle, XCircle, Truck, Route, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { SimpleMatchingService } from '@/services/SimpleMatchingService';
import { useMatchActions } from '@/hooks/useMatchActions';

interface ClientToMoverMatch {
  client: any;
  move: any;
  match_type: 'direct' | 'return_trip' | 'loop' | 'multi_stop';
  distance_km: number;
  date_diff_days: number;
  volume_compatible: boolean;
  available_volume_after: number;
  is_valid: boolean;
  match_reference: string;
  efficiency_score: number;
}

export const SimpleMatches = () => {
  const { toast } = useToast();
  const { acceptMatch, rejectMatch, loading: actionLoading } = useMatchActions();
  const [matches, setMatches] = useState<ClientToMoverMatch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    findMatches();
  }, []);

  const findMatches = async () => {
    try {
      setLoading(true);
      console.log('🔍 Recherche de correspondances client-déménageur...');
      
      const results = await SimpleMatchingService.findClientToMoverMatches();
      setMatches(results);
      
      toast({
        title: "Recherche terminée",
        description: `${results.length} correspondances client-déménageur trouvées`,
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

  const handleAcceptMatch = async (match: ClientToMoverMatch) => {
    const success = await acceptMatch(match);
    if (success) {
      await findMatches();
    }
  };

  const getMatchTypeDetails = (type: string) => {
    switch (type) {
      case 'direct': 
        return {
          label: 'Trajet Direct',
          description: 'Correspondance directe départ → arrivée',
          icon: <Route className="h-4 w-4" />,
          color: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'return_trip': 
        return {
          label: 'Trajet Retour',
          description: 'Optimisation via trajet de retour',
          icon: <TrendingUp className="h-4 w-4" />,
          color: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'loop': 
        return {
          label: 'Circuit/Boucle',
          description: 'Intégration dans un circuit existant',
          icon: <Package className="h-4 w-4" />,
          color: 'bg-purple-100 text-purple-800 border-purple-200'
        };
      default: 
        return {
          label: type,
          description: '',
          icon: <Route className="h-4 w-4" />,
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
          <Target className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Matching Client-Déménageur</h3>
            <p className="text-sm text-gray-600">
              Correspondances directes, trajets retour et circuits optimisés
            </p>
          </div>
        </div>
        <Button 
          onClick={findMatches} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? 'Recherche...' : 'Actualiser'}
        </Button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800">Total Matches</p>
                <p className="text-2xl font-bold text-blue-900">{matches.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Route className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Trajets Directs</p>
                <p className="text-2xl font-bold text-green-900">
                  {matches.filter(m => m.match_type === 'direct').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-800">Trajets Retour</p>
                <p className="text-2xl font-bold text-purple-900">
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
                <p className="text-sm font-medium text-orange-800">Score Moy.</p>
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-800 mb-2">
          <Target className="h-5 w-5" />
          <span className="font-semibold">Logique de Matching Client-Déménageur</span>
        </div>
        <div className="text-sm text-blue-700 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <strong>🚚 Trajets directs :</strong> Correspondance directe entre départ/arrivée client et déménageur (≤50km détour)
          </div>
          <div>
            <strong>🔄 Trajets retour :</strong> Client utilise le voyage de retour du déménageur (économique)
          </div>
          <div>
            <strong>🔗 Circuits/Boucles :</strong> Intégration du client dans un circuit multi-arrêts existant
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyse des correspondances client-déménageur...</p>
        </div>
      ) : matches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Aucune correspondance client-déménageur trouvée
            </h3>
            <p className="text-gray-500">
              Aucun déménageur disponible ne correspond aux critères des clients actuels
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
                className="border-green-200 bg-green-50/30 hover:shadow-lg transition-shadow"
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
                        ✓ Compatible
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        Score: {match.efficiency_score}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{typeDetails.description}</p>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Informations Client */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-blue-800 flex items-center border-b pb-2">
                        <Target className="h-4 w-4 mr-2" />
                        Client
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">Nom:</span>
                          <span>{match.client.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Référence:</span>
                          <span className="font-mono">{match.client.client_reference || `CLI-${match.client.id}`}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center">
                            <MapPin className="h-3 w-3 mr-1 text-green-600" />
                            Trajet:
                          </span>
                          <span className="text-right">
                            {match.client.departure_postal_code} → {match.client.arrival_postal_code}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-purple-600" />
                            Date souhaitée:
                          </span>
                          <span>{new Date(match.client.desired_date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center">
                            <Package className="h-3 w-3 mr-1 text-orange-600" />
                            Volume:
                          </span>
                          <span>{match.client.estimated_volume || 0}m³</span>
                        </div>
                      </div>
                    </div>

                    {/* Informations Déménageur */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-blue-800 flex items-center border-b pb-2">
                        <Truck className="h-4 w-4 mr-2" />
                        Déménageur
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">Entreprise:</span>
                          <span>{match.move.company_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Réf. déplacement:</span>
                          <span className="font-mono">MOV-{match.move.id}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center">
                            <MapPin className="h-3 w-3 mr-1 text-green-600" />
                            Trajet:
                          </span>
                          <span className="text-right">
                            {match.move.departure_postal_code} → {match.move.arrival_postal_code}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-purple-600" />
                            Date départ:
                          </span>
                          <span>{new Date(match.move.departure_date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center">
                            <Package className="h-3 w-3 mr-1 text-orange-600" />
                            Volume disponible:
                          </span>
                          <span>{match.move.available_volume}m³</span>
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
                        <span className="font-medium text-orange-800">{match.available_volume_after}m³</span>
                        <span className="text-xs text-orange-600">Reste après</span>
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
                    <Button
                      size="sm"
                      onClick={() => handleAcceptMatch(match)}
                      disabled={actionLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Accepter Match
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
