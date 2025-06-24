
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Users2, Zap, Play, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

// Import des services de matching
import { MovingMatchingService, type MatchResult } from '@/services/MovingMatchingService';
import { ClientToClientMatchingService, type ClientMatchResult } from '@/services/ClientToClientMatchingService';
import { AdvancedMatchingEngine, type AdvancedMatchResult } from '@/services/AdvancedMatchingEngine';

// Import des composants pour les actions
import { useMatchActions } from '@/hooks/useMatchActions';

const UnifiedMatchingDashboard = () => {
  const { toast } = useToast();
  const { acceptMatch, rejectMatch, loading: actionLoading } = useMatchActions();
  
  const [loading, setLoading] = useState(false);
  const [activeMatchType, setActiveMatchType] = useState('all');
  
  // États pour les différents types de matches
  const [professionalMatches, setProfessionalMatches] = useState<MatchResult[]>([]);
  const [clientMatches, setClientMatches] = useState<ClientMatchResult[]>([]);
  const [optimizedMatches, setOptimizedMatches] = useState<AdvancedMatchResult[]>([]);
  
  const [showResults, setShowResults] = useState(false);

  const runAllMatching = async () => {
    setLoading(true);
    setShowResults(false);
    console.log('🚀 Début du matching unifié - Tous types');

    try {
      // Matching professionnel (clients -> trajets)
      console.log('1️⃣ Matching professionnel...');
      const profMatches = await MovingMatchingService.findAllMatches();
      setProfessionalMatches(profMatches);
      
      // Matching client-à-client
      console.log('2️⃣ Matching client-à-client...');
      const c2cMatches = await ClientToClientMatchingService.findClientToClientMatches();
      setClientMatches(c2cMatches);
      
      // Matching optimisé avec scénarios
      console.log('3️⃣ Matching optimisé...');
      const optMatches = await AdvancedMatchingEngine.findOptimizedMatches();
      setOptimizedMatches(optMatches);

      const totalMatches = profMatches.length + c2cMatches.length + optMatches.length;
      
      setShowResults(true);
      
      toast({
        title: "Matching unifié terminé",
        description: `${totalMatches} correspondances trouvées au total`,
      });

      console.log('✅ Matching unifié terminé:', {
        professionnel: profMatches.length,
        clientClient: c2cMatches.length,
        optimise: optMatches.length,
        total: totalMatches
      });

    } catch (error) {
      console.error('❌ Erreur matching unifié:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du matching unifié",
        variant: "destructive",
      });
      setShowResults(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptProfessionalMatch = async (match: MatchResult) => {
    const matchData = {
      match_reference: match.match_reference,
      client: match.client,
      move: {
        id: match.move.id,
        company_name: match.move.company_name,
        departure_postal_code: match.move.departure_postal_code,
        arrival_postal_code: match.move.arrival_postal_code,
        departure_city: match.move.departure_city,
        arrival_city: match.move.arrival_city,
        departure_date: match.move.departure_date,
        available_volume: match.move.available_volume,
        used_volume: match.move.used_volume
      },
      distance_km: match.distance_km,
      date_diff_days: match.date_diff_days,
      volume_compatible: match.volume_compatible,
      available_volume_after: match.available_volume_after,
      is_valid: match.is_valid
    };

    const success = await acceptMatch(matchData);
    if (success) {
      setProfessionalMatches(prev => prev.filter(m => m.match_reference !== match.match_reference));
    }
  };

  const handleRejectProfessionalMatch = async (match: MatchResult) => {
    const matchData = {
      match_reference: match.match_reference,
      client: match.client,
      move: {
        id: match.move.id,
        company_name: match.move.company_name,
        departure_postal_code: match.move.departure_postal_code,
        arrival_postal_code: match.move.arrival_postal_code,
        departure_city: match.move.departure_city,
        arrival_city: match.move.arrival_city,
        departure_date: match.move.departure_date,
        available_volume: match.move.available_volume,
        used_volume: match.move.used_volume
      },
      distance_km: match.distance_km,
      date_diff_days: match.date_diff_days,
      volume_compatible: match.volume_compatible,
      is_valid: match.is_valid
    };

    const success = await rejectMatch(matchData);
    if (success) {
      setProfessionalMatches(prev => prev.filter(m => m.match_reference !== match.match_reference));
    }
  };

  const getTotalMatches = () => {
    return professionalMatches.length + clientMatches.length + optimizedMatches.length;
  };

  const getValidMatches = () => {
    return professionalMatches.filter(m => m.is_valid).length + 
           clientMatches.filter(m => m.is_feasible).length + 
           optimizedMatches.filter(m => m.is_valid).length;
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
          Matching Unifié
        </motion.h1>
        <p className="text-gray-600">Tous les types de matching en un seul endroit</p>
      </div>

      {/* Stats globales */}
      {showResults && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {getTotalMatches()}
              </div>
              <p className="text-sm text-gray-600">Total Matches</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {professionalMatches.length}
              </div>
              <p className="text-sm text-gray-600">Prof. Matches</p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <Users2 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">
                {clientMatches.length}
              </div>
              <p className="text-sm text-gray-600">Client-à-Client</p>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">
                {optimizedMatches.length}
              </div>
              <p className="text-sm text-gray-600">Optimisés</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bouton de lancement */}
      {!showResults && (
        <div className="flex flex-col items-center justify-center py-16">
          <motion.div
            animate={{ rotate: loading ? 360 : 0 }}
            transition={{ duration: 2, repeat: loading ? Infinity : 0, ease: "linear" }}
            className="w-24 h-24 mx-auto mb-8"
          >
            <Target className="w-full h-full text-blue-500" />
          </motion.div>
          
          <Button
            onClick={runAllMatching}
            disabled={loading}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-full shadow-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Analyse en cours...
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Lancer le Matching Complet
              </>
            )}
          </Button>
          
          <div className="text-sm text-gray-600 max-w-md mx-auto mt-6 text-center">
            <p className="mb-2">🎯 <strong>Matching complet:</strong></p>
            <ul className="text-left space-y-1">
              <li>• ⚡ Matching professionnel (clients → trajets)</li>
              <li>• 🤝 Matching client-à-client</li>
              <li>• 🔥 Matching optimisé avec scénarios</li>
              <li>• 📅 Filtre automatique des dates passées</li>
            </ul>
          </div>
        </div>
      )}

      {/* Résultats */}
      {showResults && (
        <Tabs value={activeMatchType} onValueChange={setActiveMatchType}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="all">Tous ({getTotalMatches()})</TabsTrigger>
              <TabsTrigger value="professional">Professionnel ({professionalMatches.length})</TabsTrigger>
              <TabsTrigger value="client-client">Client-Client ({clientMatches.length})</TabsTrigger>
              <TabsTrigger value="optimized">Optimisé ({optimizedMatches.length})</TabsTrigger>
            </TabsList>
            
            <Button variant="outline" onClick={runAllMatching} disabled={loading}>
              <Target className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>

          <TabsContent value="all" className="space-y-4">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">Vue d'ensemble</h3>
              <p className="text-gray-600">
                {getTotalMatches()} correspondances trouvées ({getValidMatches()} valides)
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Utilisez les onglets ci-dessus pour voir les détails par type de matching
              </p>
            </div>
          </TabsContent>

          <TabsContent value="professional" className="space-y-4">
            {professionalMatches.length > 0 ? (
              <div className="grid gap-4">
                {professionalMatches.map((match, index) => (
                  <Card key={`prof-${match.match_reference}-${index}`} className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-lg">{match.client.name} → {match.move.company_name}</h4>
                            <Badge className="bg-green-100 text-green-800">Professionnel</Badge>
                            <Badge variant="outline" className={match.is_valid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                              {match.is_valid ? 'Compatible' : 'Incompatible'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{match.explanation}</p>
                          <div className="text-sm text-gray-500">
                            Distance: {match.distance_km}km | Écart: ±{match.date_diff_days}j | Volume: {match.client.estimated_volume || 0}m³
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600"
                            onClick={() => handleRejectProfessionalMatch(match)}
                            disabled={actionLoading}
                          >
                            Rejeter
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleAcceptProfessionalMatch(match)}
                            disabled={actionLoading}
                          >
                            Accepter
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucun match professionnel trouvé</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="client-client" className="space-y-4">
            {clientMatches.length > 0 ? (
              <div className="grid gap-4">
                {clientMatches.map((match, index) => (
                  <Card key={`c2c-${match.client1.id}-${match.client2.id}-${index}`} className="border-purple-200 bg-purple-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-lg">{match.client1.name} ↔ {match.client2.name}</h4>
                        <div className="flex gap-2">
                          <Badge className="bg-purple-100 text-purple-800">Client-à-Client</Badge>
                          <Badge variant="outline" className={match.is_feasible ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                            {match.is_feasible ? 'Faisable' : 'Volume important'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{match.explanation}</p>
                      <div className="text-sm text-gray-500">
                        Distance: {match.distance_km}km | Écart: ±{match.date_diff_days}j | Volume total: {match.combined_volume}m³
                      </div>
                      <div className="mt-2 p-2 bg-white rounded text-sm">
                        <strong>Action:</strong> {match.suggested_action}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucun match client-à-client trouvé</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="optimized" className="space-y-4">
            {optimizedMatches.length > 0 ? (
              <div className="grid gap-4">
                {optimizedMatches.map((match, index) => (
                  <Card key={`opt-${match.match_reference}-${index}`} className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-lg">Match Optimisé #{index + 1}</h4>
                        <Badge className="bg-orange-100 text-orange-800">Optimisé</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{match.explanation}</p>
                      <div className="text-sm text-gray-500">
                        Score: {match.optimization_score} | Économies: {match.savings_percentage}%
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucun match optimisé trouvé</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default UnifiedMatchingDashboard;
