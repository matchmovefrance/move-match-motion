import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Target, Radar, CheckCircle, XCircle, MapPin, Calendar, Package, Users, Truck, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMatchActions } from '@/hooks/useMatchActions';
import { MovingMatchingService, type MatchResult } from '@/services/MovingMatchingService';

const MatchFinder = () => {
  const { toast } = useToast();
  const { acceptMatch, rejectMatch, loading: actionLoading } = useMatchActions();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const findMatches = async () => {
    setIsScanning(true);
    setShowResults(false);
    setScanProgress(0);
    console.log('🎯 Début du matching professionnel intelligent...');

    try {
      setScanProgress(20);
      
      const startTime = Date.now();
      const allMatches = await MovingMatchingService.findAllMatches();
      const processingTime = Date.now() - startTime;

      setScanProgress(80);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setScanProgress(100);

      console.log(`✅ Matching intelligent terminé en ${processingTime}ms`);

      setMatches(allMatches);

      setTimeout(() => {
        setIsScanning(false);
        setShowResults(true);
        toast({
          title: "Analyse terminée",
          description: `${allMatches.length} correspondances trouvées (logique professionnelle)`,
        });
      }, 1500);

    } catch (error) {
      console.error('❌ Erreur matching intelligent:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'analyse intelligente",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const handleAcceptMatch = async (match: MatchResult) => {
    const matchData = {
      match_reference: match.match_reference,
      client: match.client,
      move: {
        id: match.move.id,
        company_name: match.move.company_name,
        departure_postal_code: match.move.departure_postal_code,
        arrival_postal_code: match.move.arrival_postal_code,
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
      setMatches(prev => prev.filter(m => m.match_reference !== match.match_reference));
    }
  };

  const handleRejectMatch = async (match: MatchResult) => {
    const matchData = {
      match_reference: match.match_reference,
      client: match.client,
      move: {
        id: match.move.id,
        company_name: match.move.company_name,
        departure_postal_code: match.move.departure_postal_code,
        arrival_postal_code: match.move.arrival_postal_code,
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
      setMatches(prev => prev.filter(m => m.match_reference !== match.match_reference));
    }
  };

  const getScenarioInfo = (scenario: number) => {
    switch (scenario) {
      case 1:
        return {
          title: 'Trajet Aller Groupé',
          description: 'Même point de départ (±100km)',
          color: 'bg-green-100 text-green-800',
          icon: Users
        };
      case 2:
        return {
          title: 'Trajet Retour Occupé',
          description: 'Évite retour à vide',
          color: 'bg-blue-100 text-blue-800',
          icon: RotateCcw
        };
      case 3:
        return {
          title: 'Boucle Complète',
          description: 'Circuit optimisé',
          color: 'bg-purple-100 text-purple-800',
          icon: Target
        };
      default:
        return {
          title: 'Match Simple',
          description: 'Correspondance directe',
          color: 'bg-gray-100 text-gray-800',
          icon: Truck
        };
    }
  };

  const renderMatchCard = (match: MatchResult) => {
    const scenarioInfo = getScenarioInfo(match.scenario);
    const IconComponent = scenarioInfo.icon;

    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <IconComponent className="h-5 w-5" />
              {match.client.name} → {match.move.company_name}
            </CardTitle>
            <div className="flex gap-2">
              <Badge className={scenarioInfo.color}>
                Scénario {match.scenario}
              </Badge>
              <Badge className="bg-green-100 text-green-800">
                Compatible
              </Badge>
            </div>
          </div>
          <p className="text-sm text-gray-600">{scenarioInfo.description}</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-sm text-green-700 font-medium">
            💡 {match.explanation}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-700 flex items-center gap-1">
                <Users className="h-4 w-4" /> Client
              </h4>
              <p className="font-medium">{match.client.name}</p>
              <p className="text-sm text-gray-500">{match.client.client_reference}</p>
              <p className="text-sm">{match.client.departure_postal_code} → {match.client.arrival_postal_code}</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-700 flex items-center gap-1">
                <Truck className="h-4 w-4" /> Transporteur
              </h4>
              <p className="font-medium">{match.move.company_name}</p>
              <p className="text-sm">{match.move.departure_postal_code} → {match.move.arrival_postal_code}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2 justify-center p-2 bg-white rounded">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span><strong>{match.distance_km}km</strong></span>
            </div>
            <div className="flex items-center space-x-2 justify-center p-2 bg-white rounded">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span><strong>±{match.date_diff_days}j</strong></span>
            </div>
            <div className="flex items-center space-x-2 justify-center p-2 bg-white rounded">
              <Package className="h-4 w-4 text-green-600" />
              <span><strong>{match.client.estimated_volume || 0}m³</strong></span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              onClick={() => handleRejectMatch(match)}
              disabled={actionLoading}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Rejeter
            </Button>
            
            <Button
              onClick={() => handleAcceptMatch(match)}
              disabled={actionLoading}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Accepter
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const scenario1Count = matches.filter(m => m.scenario === 1).length;
  const scenario2Count = matches.filter(m => m.scenario === 2).length;
  const scenario3Count = matches.filter(m => m.scenario === 3).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <motion.h1 
            className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            Matching Intelligent
          </motion.h1>
          <p className="text-gray-600">Logique professionnelle anti-trajets à vide</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/60 backdrop-blur border-green-200">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{scenario1Count}</div>
              <p className="text-xs text-gray-600">Groupés</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur border-blue-200">
            <CardContent className="p-4 text-center">
              <RotateCcw className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{scenario2Count}</div>
              <p className="text-xs text-gray-600">Retours</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur border-purple-200">
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{scenario3Count}</div>
              <p className="text-xs text-gray-600">Boucles</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur border-orange-200">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">{matches.length}</div>
              <p className="text-xs text-gray-600">Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Scanner ou Résultats */}
        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center justify-center py-16"
            >
              {!isScanning ? (
                <motion.div className="text-center space-y-8">
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-32 h-32 mx-auto"
                    >
                      <Radar className="w-full h-full text-green-500" />
                    </motion.div>
                  </div>
                  
                  <Button
                    onClick={findMatches}
                    disabled={loading}
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-4 text-lg rounded-full shadow-lg"
                  >
                    <Target className="h-6 w-6 mr-2" />
                    Lancer l'analyse intelligente
                  </Button>
                  
                  <div className="text-sm text-gray-600 max-w-md mx-auto">
                    <p className="mb-2">🎯 <strong>3 Scénarios intelligents:</strong></p>
                    <ul className="text-left space-y-1">
                      <li>• Scénario 1: Trajets groupés (±100km)</li>
                      <li>• Scénario 2: Retours occupés (anti-vide)</li>
                      <li>• Scénario 3: Boucles optimisées</li>
                    </ul>
                  </div>
                </motion.div>
              ) : (
                <motion.div className="text-center space-y-8">
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-48 h-48 mx-auto"
                    >
                      <Radar className="w-full h-full text-green-500" />
                    </motion.div>
                  </div>
                  
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-800">Analyse intelligente en cours...</h2>
                    <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
                      <motion.div 
                        className="bg-gradient-to-r from-green-500 to-blue-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${scanProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-gray-600">{scanProgress}% - Application logique professionnelle...</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {matches.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">
                      {matches.length} correspondances intelligentes trouvées
                    </h3>
                    <Button variant="outline" onClick={findMatches} disabled={loading}>
                      <Search className="h-4 w-4 mr-2" />
                      Actualiser
                    </Button>
                  </div>
                  
                  <div className="grid gap-4">
                    {matches.map((match, index) => (
                      <motion.div
                        key={`${match.match_reference}-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        {renderMatchCard(match)}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <motion.div className="text-center py-16">
                  <div className="text-6xl mb-4">🎯</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Aucune correspondance trouvée</h2>
                  <p className="text-gray-600">Aucun client ne correspond aux 3 scénarios intelligents</p>
                  <Button
                    onClick={() => {
                      setShowResults(false);
                      setMatches([]);
                    }}
                    className="mt-4 bg-gradient-to-r from-green-500 to-blue-600"
                  >
                    <Radar className="h-4 w-4 mr-2" />
                    Nouvelle analyse
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default MatchFinder;
