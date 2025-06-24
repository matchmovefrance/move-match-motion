
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Route, 
  TrendingUp, 
  Users, 
  MapPin, 
  Clock, 
  Zap,
  BarChart3,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { AdvancedMatchingEngine, MatchScenario } from '@/services/AdvancedMatchingEngine';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const OptimizedMatchingDashboard = () => {
  const { toast } = useToast();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [scenarios, setScenarios] = useState<MatchScenario[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  const runOptimization = async () => {
    setIsOptimizing(true);
    setProgress(0);
    
    toast({
      title: "🚚 Optimisation en cours",
      description: "Recherche des meilleurs trajets groupés...",
    });

    try {
      // Simulation de progression
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      const result = await AdvancedMatchingEngine.optimizeAllRoutes();
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setScenarios(result.scenarios);
      setSummary(result.summary);

      toast({
        title: "✅ Optimisation terminée",
        description: `${result.summary.total_scenarios} scénarios trouvés, ${result.summary.total_km_saved}km économisés`,
      });

    } catch (error) {
      console.error('Erreur optimisation:', error);
      toast({
        title: "❌ Erreur d'optimisation",
        description: "Impossible d'optimiser les trajets",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const getScenarioIcon = (type: string) => {
    switch (type) {
      case 'grouped_outbound': return <Route className="h-4 w-4" />;
      case 'return_trip': return <TrendingUp className="h-4 w-4" />;
      case 'loop_optimization': return <BarChart3 className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getScenarioLabel = (type: string) => {
    switch (type) {
      case 'grouped_outbound': return 'Aller Groupé';
      case 'return_trip': return 'Retour Occupé';
      case 'loop_optimization': return 'Boucle Optimisée';
      default: return 'Autre';
    }
  };

  const getScenarioColor = (type: string) => {
    switch (type) {
      case 'grouped_outbound': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'return_trip': return 'bg-green-100 text-green-800 border-green-200';
      case 'loop_optimization': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec bouton d'optimisation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Optimisation Avancée</h2>
          <p className="text-gray-600">Algorithme intelligent de matching multi-scénarios</p>
        </div>
        
        <Button 
          onClick={runOptimization}
          disabled={isOptimizing}
          size="lg"
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isOptimizing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Optimisation...</span>
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              <span>Optimiser les Trajets</span>
            </>
          )}
        </Button>
      </div>

      {/* Barre de progression */}
      {isOptimizing && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                  <span>Analyse en cours...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résumé des résultats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Scénarios Trouvés</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.total_scenarios}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Km Économisés</p>
                    <p className="text-2xl font-bold text-green-600">{summary.total_km_saved.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Clients Matchés</p>
                    <p className="text-2xl font-bold text-purple-600">{summary.total_clients_matched}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Meilleur Score</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {summary.best_scenario ? Math.round(summary.best_scenario.match_score) : 0}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Liste des scénarios */}
      {scenarios.length > 0 && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Tous ({scenarios.length})</TabsTrigger>
            <TabsTrigger value="grouped_outbound">
              Aller Groupé ({scenarios.filter(s => s.type === 'grouped_outbound').length})
            </TabsTrigger>
            <TabsTrigger value="return_trip">
              Retour Occupé ({scenarios.filter(s => s.type === 'return_trip').length})
            </TabsTrigger>
            <TabsTrigger value="loop_optimization">
              Boucles ({scenarios.filter(s => s.type === 'loop_optimization').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {scenarios.map((scenario, index) => (
              <ScenarioCard key={index} scenario={scenario} />
            ))}
          </TabsContent>

          <TabsContent value="grouped_outbound" className="space-y-4">
            {scenarios.filter(s => s.type === 'grouped_outbound').map((scenario, index) => (
              <ScenarioCard key={index} scenario={scenario} />
            ))}
          </TabsContent>

          <TabsContent value="return_trip" className="space-y-4">
            {scenarios.filter(s => s.type === 'return_trip').map((scenario, index) => (
              <ScenarioCard key={index} scenario={scenario} />
            ))}
          </TabsContent>

          <TabsContent value="loop_optimization" className="space-y-4">
            {scenarios.filter(s => s.type === 'loop_optimization').map((scenario, index) => (
              <ScenarioCard key={index} scenario={scenario} />
            ))}
          </TabsContent>
        </Tabs>
      )}

      {/* Message si pas de résultats */}
      {!isOptimizing && scenarios.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun scénario trouvé</h3>
            <p className="text-gray-600 mb-4">
              Cliquez sur "Optimiser les Trajets" pour lancer l'analyse complète
            </p>
            <Button onClick={runOptimization} variant="outline">
              <Zap className="h-4 w-4 mr-2" />
              Lancer l'optimisation
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Composant pour afficher un scénario
const ScenarioCard = ({ scenario }: { scenario: MatchScenario }) => {
  const getScenarioIcon = (type: string) => {
    switch (type) {
      case 'grouped_outbound': return <Route className="h-4 w-4" />;
      case 'return_trip': return <TrendingUp className="h-4 w-4" />;
      case 'loop_optimization': return <BarChart3 className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getScenarioLabel = (type: string) => {
    switch (type) {
      case 'grouped_outbound': return 'Aller Groupé';
      case 'return_trip': return 'Retour Occupé';
      case 'loop_optimization': return 'Boucle Optimisée';
      default: return 'Autre';
    }
  };

  const getScenarioColor = (type: string) => {
    switch (type) {
      case 'grouped_outbound': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'return_trip': return 'bg-green-100 text-green-800 border-green-200';
      case 'loop_optimization': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full"
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Badge className={`${getScenarioColor(scenario.type)} flex items-center space-x-1 px-3 py-1`}>
                {getScenarioIcon(scenario.type)}
                <span>{getScenarioLabel(scenario.type)}</span>
              </Badge>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{scenario.clients.length} client{scenario.clients.length > 1 ? 's' : ''}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">
                  {scenario.savings_km.toLocaleString()} km
                </div>
                <div className="text-xs text-gray-500">économisés</div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">
                  {Math.round(scenario.match_score)}
                </div>
                <div className="text-xs text-gray-500">score</div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Informations du déménageur */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🚚 Déménageur</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="font-medium">{scenario.move.company_name}</div>
                <div>{scenario.move.departure_city} → {scenario.move.arrival_city}</div>
                <div>{scenario.move.departure_postal_code} → {scenario.move.arrival_postal_code}</div>
                <div>Volume: {scenario.move.used_volume}/{scenario.move.max_volume} m³</div>
              </div>
            </div>
            
            {/* Clients */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">👥 Clients</h4>
              <div className="text-sm text-gray-600 space-y-2">
                {scenario.clients.map((client, idx) => (
                  <div key={idx} className="border-l-2 border-blue-200 pl-2">
                    <div className="font-medium">{client.name}</div>
                    <div>{client.departure_city} → {client.arrival_city}</div>
                    <div className="text-xs">{client.estimated_volume || 5} m³</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Métriques */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📊 Métriques</h4>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Détour total:</span>
                  <span className="font-medium">{scenario.total_detour_km} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Volume utilisé:</span>
                  <span className="font-medium">{scenario.total_volume_used} m³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Économies:</span>
                  <span className="font-medium text-green-600">{scenario.savings_percentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Faisabilité:</span>
                  <span className={`font-medium ${scenario.is_feasible ? 'text-green-600' : 'text-red-600'}`}>
                    {scenario.is_feasible ? '✓ Faisable' : '✗ Non faisable'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OptimizedMatchingDashboard;
