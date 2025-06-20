
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Target, Play, Users, Truck, Filter, Calendar, MapPin, Package, CheckCircle, XCircle, Radar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('score');
  const [scanProgress, setScanProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const findMatches = async () => {
    setIsScanning(true);
    setShowResults(false);
    setScanProgress(0);
    console.log('🚀 Début du processus de matching professionnel...');

    try {
      setScanProgress(10);
      
      const startTime = Date.now();
      const allMatches = await MovingMatchingService.findAllMatches();
      const processingTime = Date.now() - startTime;

      setScanProgress(80);
      
      // Simuler un temps de traitement pour l'effet visuel
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setScanProgress(100);

      console.log(`✅ Matching professionnel terminé en ${processingTime}ms:`, {
        total: allMatches.length,
        valides: allMatches.filter(m => m.is_valid).length
      });

      setMatches(allMatches);

      // Attendre 2 secondes avant d'afficher les résultats
      setTimeout(() => {
        setIsScanning(false);
        setShowResults(true);
        toast({
          title: "Scan terminé",
          description: `${allMatches.length} correspondances trouvées en ${processingTime}ms (${allMatches.filter(m => m.is_valid).length} valides)`,
        });
      }, 2000);

    } catch (error) {
      console.error('❌ Erreur matching professionnel:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du processus de matching",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const handleAcceptMatch = async (match: MatchResult) => {
    // Convertir MatchResult vers le format attendu par useMatchActions
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

  const filteredMatches = matches.filter(match => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      match.client?.name?.toLowerCase().includes(searchLower) ||
      match.client?.client_reference?.toLowerCase().includes(searchLower) ||
      match.move.company_name?.toLowerCase().includes(searchLower) ||
      match.match_reference?.toLowerCase().includes(searchLower) ||
      match.move.departure_postal_code?.includes(searchTerm) ||
      match.move.arrival_postal_code?.includes(searchTerm)
    );
  }).filter(match => {
    if (statusFilter === 'valid') return match.is_valid;
    if (statusFilter === 'invalid') return !match.is_valid;
    return true;
  });

  // Tri des résultats
  const sortedMatches = [...filteredMatches].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(a.client.desired_date).getTime() - new Date(b.client.desired_date).getTime();
      case 'distance':
        return a.distance_km - b.distance_km;
      case 'score':
        return a.match_score - b.match_score;
      default:
        return 0;
    }
  });

  const getMatchTypeLabel = (matchType: MatchResult['match_type']) => {
    switch (matchType) {
      case 'direct_outbound': return 'Trajet direct';
      case 'direct_return': return 'Trajet retour';
      case 'pickup_on_route': return 'Prise en route';
      case 'delivery_on_route': return 'Livraison en route';
      default: return 'Autre';
    }
  };

  const getMatchTypeColor = (matchType: MatchResult['match_type']) => {
    switch (matchType) {
      case 'direct_outbound': return 'bg-green-100 text-green-800';
      case 'direct_return': return 'bg-blue-100 text-blue-800';
      case 'pickup_on_route': return 'bg-orange-100 text-orange-800';
      case 'delivery_on_route': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderMatchCard = (match: MatchResult) => (
    <Card className={`${match.is_valid ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {match.client.name} → {match.move.company_name}
          </CardTitle>
          <div className="flex gap-2">
            <Badge className={getMatchTypeColor(match.match_type)}>
              {getMatchTypeLabel(match.match_type)}
            </Badge>
            <Badge className={match.is_valid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
              {match.is_valid ? 'Compatible' : 'Incompatible'}
            </Badge>
            <Badge variant="outline" className="font-mono text-xs">
              Score: {match.match_score}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 mb-2">
          <strong>Logique:</strong> {match.explanation}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700">👤 Client</h4>
            <p className="font-medium">{match.client.name}</p>
            <p className="text-sm text-gray-500">{match.client.client_reference}</p>
            <p className="text-sm">{match.client.departure_postal_code} → {match.client.arrival_postal_code}</p>
            <p className="text-sm text-gray-600">Date souhaitée: {new Date(match.client.desired_date).toLocaleDateString()}</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700">🚛 Transporteur</h4>
            <p className="font-medium">{match.move.company_name}</p>
            <p className="text-sm">{match.move.departure_postal_code} → {match.move.arrival_postal_code}</p>
            <p className="text-sm text-gray-600">Date départ: {new Date(match.move.departure_date).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2 justify-center p-2 bg-white rounded">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span><strong>{match.distance_km}km</strong></span>
          </div>
          <div className="flex items-center space-x-2 justify-center p-2 bg-white rounded">
            <Calendar className="h-4 w-4 text-purple-600" />
            <span><strong>±{match.date_diff_days}j</strong></span>
          </div>
          <div className="flex items-center space-x-2 justify-center p-2 bg-white rounded">
            <Package className="h-4 w-4 text-orange-600" />
            <span><strong>{match.client.estimated_volume || 0}m³</strong></span>
          </div>
          <div className="flex items-center space-x-2 justify-center p-2 bg-white rounded">
            <Package className="h-4 w-4 text-green-600" />
            <span><strong>Reste: {Number(match.available_volume_after.toFixed(2))}m³</strong></span>
          </div>
        </div>

        {/* Boutons d'action */}
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
          
          {match.is_valid && (
            <Button
              onClick={() => handleAcceptMatch(match)}
              disabled={actionLoading}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Accepter
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <motion.h1 
            className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            Matching Professionnel
          </motion.h1>
          <p className="text-gray-600">Logique de déménagement avec trajets aller-retour et proximité</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/60 backdrop-blur border-blue-200">
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{matches.length}</div>
              <p className="text-xs text-gray-600">Matches</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur border-green-200">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{matches.filter(m => m.is_valid).length}</div>
              <p className="text-xs text-gray-600">Compatibles</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur border-blue-200">
            <CardContent className="p-4 text-center">
              <MapPin className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">≤100km</div>
              <p className="text-xs text-gray-600">Distance max</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur border-indigo-200">
            <CardContent className="p-4 text-center">
              <Truck className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-indigo-600">A/R</div>
              <p className="text-xs text-gray-600">Trajets retour</p>
            </CardContent>
          </Card>
        </div>

        {/* Radar Scanner ou Résultats */}
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
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-8"
                >
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-32 h-32 mx-auto"
                    >
                      <Radar className="w-full h-full text-blue-500" />
                    </motion.div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full border-4 border-blue-300 opacity-30"
                    />
                  </div>
                  
                  <Button
                    onClick={findMatches}
                    disabled={loading}
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-full shadow-lg"
                  >
                    <Target className="h-6 w-6 mr-2" />
                    Lancer l'analyse professionnelle
                  </Button>
                  
                  <div className="text-sm text-gray-600 max-w-md mx-auto">
                    <p className="mb-2">🎯 <strong>Logique professionnelle:</strong></p>
                    <ul className="text-left space-y-1">
                      <li>• Distance max: 100km</li>
                      <li>• Trajets aller et retour</li>
                      <li>• Prise en charge sur trajet</li>
                      <li>• Calcul Google Maps réel</li>
                    </ul>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-8"
                >
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-48 h-48 mx-auto"
                    >
                      <Radar className="w-full h-full text-blue-500" />
                    </motion.div>
                    
                    {/* Ondes radar avec couleurs différentes */}
                    <motion.div
                      animate={{ scale: [1, 2, 1], opacity: [0.8, 0, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full border-4 border-green-400"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      className="absolute inset-0 rounded-full border-4 border-blue-400"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-800">Analyse professionnelle en cours...</h2>
                    <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
                      <motion.div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${scanProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-gray-600">{scanProgress}% - Calcul des distances réelles...</p>
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
              {sortedMatches.length > 0 ? (
                <div className="space-y-4">
                  {/* Filtres de recherche */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <Input
                        placeholder="Rechercher un match..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filtrer par statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les matches</SelectItem>
                        <SelectItem value="valid">Compatibles</SelectItem>
                        <SelectItem value="invalid">Incompatibles</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Trier par" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="score">Score</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="distance">Distance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Grille des résultats */}
                  <div className="grid gap-4">
                    {sortedMatches.map((match, index) => (
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
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="text-6xl mb-4">🎯</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Aucun match professionnel</h2>
                  <p className="text-gray-600">Aucun trajet compatible dans les critères professionnels</p>
                  <Button
                    onClick={() => {
                      setShowResults(false);
                      setMatches([]);
                    }}
                    className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Radar className="h-4 w-4 mr-2" />
                    Nouveau scan
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
