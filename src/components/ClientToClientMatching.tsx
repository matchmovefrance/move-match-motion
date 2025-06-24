
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users2, Search, Calendar, MapPin, Package, CheckCircle, AlertCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ClientToClientMatchingService, type ClientMatchResult } from '@/services/ClientToClientMatchingService';

const ClientToClientMatching = () => {
  const { toast } = useToast();
  const [matches, setMatches] = useState<ClientMatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const findClientMatches = async () => {
    setLoading(true);
    setShowResults(false);
    console.log('🤝 Début matching client-à-client...');

    try {
      const clientMatches = await ClientToClientMatchingService.findClientToClientMatches();
      
      setMatches(clientMatches);
      setShowResults(true);

      toast({
        title: "Matching Client-à-Client terminé",
        description: `${clientMatches.length} paire(s) de clients compatibles trouvée(s)`,
      });

    } catch (error) {
      console.error('❌ Erreur matching client-à-client:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du matching client-à-client",
        variant: "destructive",
      });
      setMatches([]);
      setShowResults(true);
    } finally {
      setLoading(false);
    }
  };

  const getMatchTypeInfo = (type: 'same_route' | 'complementary_route') => {
    switch (type) {
      case 'same_route':
        return {
          label: 'Même Trajet',
          description: 'Départ et arrivée similaires',
          color: 'bg-blue-100 text-blue-800',
          icon: Users2
        };
      case 'complementary_route':
        return {
          label: 'Trajets Complémentaires', 
          description: 'Aller-retour optimisé',
          color: 'bg-purple-100 text-purple-800',
          icon: Users2
        };
      default:
        return {
          label: 'Autre',
          description: '',
          color: 'bg-gray-100 text-gray-800',
          icon: Users2
        };
    }
  };

  const renderMatchCard = (match: ClientMatchResult, index: number) => {
    const typeInfo = getMatchTypeInfo(match.match_type);
    const IconComponent = typeInfo.icon;

    return (
      <motion.div
        key={`${match.client1.id}-${match.client2.id}-${index}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <Card className={`border-2 ${match.is_feasible ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <IconComponent className="h-5 w-5" />
                {match.client1.name} ↔ {match.client2.name}
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Badge className={typeInfo.color}>
                  {typeInfo.label}
                </Badge>
                <Badge className={match.is_feasible ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                  {match.is_feasible ? '✓ Faisable' : '⚠ Volume important'}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-gray-600">{typeInfo.description}</p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="text-sm text-blue-700 font-medium bg-blue-50 p-3 rounded">
              💡 {match.explanation}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client 1 */}
              <div className="space-y-2 p-3 bg-white rounded border">
                <h4 className="font-semibold text-gray-700 flex items-center gap-1">
                  <Users2 className="h-4 w-4" /> Client 1
                </h4>
                <p className="font-medium">{match.client1.name}</p>
                <p className="text-sm text-gray-500">{match.client1.client_reference}</p>
                <p className="text-sm">
                  {match.client1.departure_postal_code} {match.client1.departure_city} → {match.client1.arrival_postal_code} {match.client1.arrival_city}
                </p>
                <p className="text-xs text-gray-500">
                  Volume: {match.client1.estimated_volume || 5}m³ | 
                  Date: {match.client1.desired_date ? new Date(match.client1.desired_date).toLocaleDateString('fr-FR') : 'Non définie'}
                </p>
              </div>

              {/* Client 2 */}
              <div className="space-y-2 p-3 bg-white rounded border">
                <h4 className="font-semibold text-gray-700 flex items-center gap-1">
                  <Users2 className="h-4 w-4" /> Client 2
                </h4>
                <p className="font-medium">{match.client2.name}</p>
                <p className="text-sm text-gray-500">{match.client2.client_reference}</p>
                <p className="text-sm">
                  {match.client2.departure_postal_code} {match.client2.departure_city} → {match.client2.arrival_postal_code} {match.client2.arrival_city}
                </p>
                <p className="text-xs text-gray-500">
                  Volume: {match.client2.estimated_volume || 5}m³ | 
                  Date: {match.client2.desired_date ? new Date(match.client2.desired_date).toLocaleDateString('fr-FR') : 'Non définie'}
                </p>
              </div>
            </div>

            {/* Métriques */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2 justify-center p-2 bg-white rounded border">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span><strong>{match.distance_km}km</strong></span>
              </div>
              <div className="flex items-center space-x-2 justify-center p-2 bg-white rounded border">
                <Calendar className="h-4 w-4 text-purple-600" />
                <span><strong>±{match.date_diff_days}j</strong></span>
              </div>
              <div className="flex items-center space-x-2 justify-center p-2 bg-white rounded border">
                <Package className="h-4 w-4 text-green-600" />
                <span><strong>{match.combined_volume}m³</strong></span>
              </div>
            </div>

            {/* Action suggérée */}
            <div className={`p-4 rounded-lg border-l-4 ${match.is_feasible ? 'bg-green-50 border-green-400' : 'bg-orange-50 border-orange-400'}`}>
              <div className="flex items-center gap-2 mb-2">
                {match.is_feasible ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Phone className="h-5 w-5 text-orange-600" />
                )}
                <span className="font-medium text-gray-800">Action recommandée:</span>
              </div>
              <p className="text-sm text-gray-700">{match.suggested_action}</p>
              
              {!match.is_feasible && (
                <div className="mt-2 p-2 bg-orange-100 rounded text-xs text-orange-800">
                  ⚠️ Volume total ({match.combined_volume}m³) > capacité standard. Contacter un prestataire pour organiser un trajet dédié.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <motion.h1 
          className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
        >
          Matching Client-à-Client
        </motion.h1>
        <p className="text-gray-600">Trouvez des clients compatibles pour optimiser les trajets</p>
      </div>

      {/* Stats */}
      {showResults && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <Users2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {matches.filter(m => m.match_type === 'same_route').length}
              </div>
              <p className="text-sm text-gray-600">Même Trajet</p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <Users2 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">
                {matches.filter(m => m.match_type === 'complementary_route').length}
              </div>
              <p className="text-sm text-gray-600">Complémentaires</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {matches.filter(m => m.is_feasible).length}
              </div>
              <p className="text-sm text-gray-600">Faisables</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bouton de recherche */}
      {!showResults && (
        <div className="flex flex-col items-center justify-center py-16">
          <motion.div
            animate={{ rotate: loading ? 360 : 0 }}
            transition={{ duration: 2, repeat: loading ? Infinity : 0, ease: "linear" }}
            className="w-24 h-24 mx-auto mb-8"
          >
            <Users2 className="w-full h-full text-blue-500" />
          </motion.div>
          
          <Button
            onClick={findClientMatches}
            disabled={loading}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-full shadow-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Recherche en cours...
              </>
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                Rechercher des matchs Client-à-Client
              </>
            )}
          </Button>
          
          <div className="text-sm text-gray-600 max-w-md mx-auto mt-6 text-center">
            <p className="mb-2">🤝 <strong>Matching entre clients:</strong></p>
            <ul className="text-left space-y-1">
              <li>• 🎯 Même trajet (±50km, ±7 jours)</li>
              <li>• 🔄 Trajets complémentaires (A→B + B→A)</li>
              <li>• 📞 Suggestion de prestataire si nécessaire</li>
              <li>• 📊 Optimisation des volumes</li>
            </ul>
          </div>
        </div>
      )}

      {/* Résultats */}
      {showResults && (
        <div className="space-y-6">
          {matches.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">
                  🤝 {matches.length} paire(s) de clients compatibles
                </h3>
                <Button variant="outline" onClick={findClientMatches} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
              
              <div className="grid gap-4">
                {matches.map((match, index) => renderMatchCard(match, index))}
              </div>
            </div>
          ) : (
            <motion.div className="text-center py-16">
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Aucun match client-à-client trouvé</h2>
              <p className="text-gray-600 mb-4">
                Aucune paire de clients compatible dans les critères actuels.
              </p>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-md mx-auto mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-800">Suggestion</span>
                </div>
                <p className="text-sm text-orange-700">
                  <strong>Aucun trajet disponible.</strong><br/>
                  Contactez un prestataire pour démarrer un nouveau trajet pour vos clients.
                </p>
              </div>
              
              <Button
                onClick={() => {
                  setShowResults(false);
                  setMatches([]);
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-600"
              >
                <Users2 className="h-4 w-4 mr-2" />
                Nouvelle recherche
              </Button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientToClientMatching;
