
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Route, TrendingUp, MapPin, Clock, Zap, Users, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { OptimizedMatchingService, OptimizedMatch } from '@/services/OptimizedMatchingService';

const OptimizedTrajetsDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<OptimizedMatch[]>([]);
  const [stats, setStats] = useState({
    total_matches: 0,
    total_savings_km: 0,
    total_clients: 0,
    performance_ms: 0
  });

  const runOptimization = async () => {
    setLoading(true);
    const startTime = Date.now();
    
    toast({
      title: "🚀 Optimisation en cours",
      description: "Recherche ultra-rapide des trajets optimisés...",
    });

    try {
      const results = await OptimizedMatchingService.findOptimizedMatches();
      const duration = Date.now() - startTime;
      
      setMatches(results);
      
      // Calcul des statistiques
      const totalSavings = results.reduce((sum, match) => sum + match.route_optimization.savings_km, 0);
      const totalClients = results.reduce((sum, match) => sum + match.clients.length, 0);
      
      setStats({
        total_matches: results.length,
        total_savings_km: totalSavings,
        total_clients: totalClients,
        performance_ms: duration
      });

      toast({
        title: `⚡ Optimisation terminée en ${duration}ms`,
        description: `${results.length} trajets optimisés trouvés`,
      });

    } catch (error) {
      console.error('❌ Erreur optimisation:', error);
      toast({
        title: "❌ Erreur d'optimisation",
        description: "Impossible d'optimiser les trajets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'aller_groupe': return <Route className="h-4 w-4" />;
      case 'retour_occupe': return <TrendingUp className="h-4 w-4" />;
      case 'boucle_intelligente': return <Target className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'aller_groupe': return 'Aller Groupé';
      case 'retour_occupe': return 'Retour Occupé';
      case 'boucle_intelligente': return 'Boucle Intelligente';
      default: return 'Optimisé';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'aller_groupe': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'retour_occupe': return 'bg-green-100 text-green-800 border-green-200';
      case 'boucle_intelligente': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Trajets Optimisés</h2>
          <p className="text-gray-600">Algorithme intelligent ultra-rapide (&lt;2s)</p>
        </div>
        
        <Button 
          onClick={runOptimization}
          disabled={loading}
          size="lg"
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Optimisation...</span>
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              <span>Optimiser Maintenant</span>
            </>
          )}
        </Button>
      </div>

      {/* Stats de performance */}
      {stats.total_matches > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {stats.total_matches}
                </div>
                <p className="text-sm text-gray-600">Trajets Optimisés</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {stats.total_savings_km.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600">Km Économisés</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">
                  {stats.total_clients}
                </div>
                <p className="text-sm text-gray-600">Clients Matchés</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">
                  {stats.performance_ms}ms
                </div>
                <p className="text-sm text-gray-600">Temps d'Exécution</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Liste des trajets optimisés */}
      {matches.length > 0 ? (
        <div className="space-y-4">
          {matches.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge className={`${getTypeColor(match.type)} flex items-center space-x-1 px-3 py-1`}>
                        {getTypeIcon(match.type)}
                        <span>{getTypeLabel(match.type)}</span>
                      </Badge>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{match.clients.length} client{match.clients.length > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {match.route_optimization.savings_km} km
                        </div>
                        <div className="text-xs text-gray-500">économisés</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          {Math.round(match.score)}
                        </div>
                        <div className="text-xs text-gray-500">score</div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Déménageur */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">🚚 Déménageur</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="font-medium">{match.move.company_name}</div>
                        <div>{match.move.departure_city} → {match.move.arrival_city}</div>
                        <div className="text-xs">{match.move.departure_date}</div>
                        <div>Volume: {match.move.available_volume} m³</div>
                      </div>
                    </div>
                    
                    {/* Clients */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">👥 Clients</h4>
                      <div className="text-sm text-gray-600 space-y-2">
                        {match.clients.slice(0, 3).map((client, idx) => (
                          <div key={idx} className="border-l-2 border-blue-200 pl-2">
                            <div className="font-medium">{client.name}</div>
                            <div>{client.departure_city} → {client.arrival_city}</div>
                            <div className="text-xs">{client.estimated_volume} m³</div>
                          </div>
                        ))}
                        {match.clients.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{match.clients.length - 3} autres...
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Optimisation */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">📊 Optimisation</h4>
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Distance totale:</span>
                          <span className="font-medium">{match.route_optimization.total_distance_km} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Optimisée:</span>
                          <span className="font-medium">{match.route_optimization.optimized_distance_km} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Économies:</span>
                          <span className="font-medium text-green-600">
                            {match.route_optimization.savings_percentage}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Validité:</span>
                          <span className={`font-medium ${match.validity.overall_valid ? 'text-green-600' : 'text-red-600'}`}>
                            {match.validity.overall_valid ? '✓ Valide' : '✗ Invalide'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun trajet optimisé</h3>
              <p className="text-gray-600 mb-4">
                Cliquez sur "Optimiser Maintenant" pour lancer l'analyse ultra-rapide
              </p>
              <Button onClick={runOptimization} variant="outline">
                <Zap className="h-4 w-4 mr-2" />
                Lancer l'optimisation
              </Button>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
};

export default OptimizedTrajetsDashboard;
