
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Target, Play, Users, Truck, Filter, Calendar, MapPin, Package, CheckCircle, XCircle, Radar, Heart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMatchActions } from '@/hooks/useMatchActions';

interface Client {
  id: number;
  name: string;
  client_reference?: string;
  departure_postal_code: string;
  arrival_postal_code: string;
  desired_date: string;
  estimated_volume: number;
  status?: string;
}

interface ConfirmedMove {
  id: number;
  company_name: string;
  departure_postal_code: string;
  arrival_postal_code: string;
  departure_date: string;
  max_volume: number;
  used_volume: number;
  available_volume: number;
  status: string;
  move_reference?: string;
}

interface MatchResult {
  move: ConfirmedMove;
  distance_km: number;
  date_diff_days: number;
  volume_compatible: boolean;
  available_volume_after: number;
  match_score: number;
  is_valid: boolean;
  match_reference?: string;
  client: Client;
}

// Cache pour les distances calculées
const distanceCache = new Map<string, number>();

// Fonction optimisée pour calculer la distance avec cache et parallélisation
const calculateOptimizedDistance = async (
  fromPostal: string, 
  toPostal: string
): Promise<number> => {
  const cacheKey = `${fromPostal}-${toPostal}`;
  
  // Vérifier le cache d'abord
  if (distanceCache.has(cacheKey)) {
    return distanceCache.get(cacheKey)!;
  }

  const apiKey = 'AIzaSyDgAn_xJ5IsZBJjlwLkMYhWP7DQXvoxK4Y';
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Timeout de 3s
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${fromPostal},France&destinations=${toPostal},France&units=metric&key=${apiKey}&mode=driving`,
      { 
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
      const distanceInMeters = data.rows[0].elements[0].distance.value;
      const distanceInKm = Math.round(distanceInMeters / 1000);
      
      // Mettre en cache le résultat
      distanceCache.set(cacheKey, distanceInKm);
      distanceCache.set(`${toPostal}-${fromPostal}`, distanceInKm); // Cache bidirectionnel
      
      return distanceInKm;
    } else {
      throw new Error('Google Maps API error');
    }
  } catch (error) {
    // Fallback rapide en cas d'erreur
    const fallbackDistance = calculateFallbackDistance(fromPostal, toPostal);
    distanceCache.set(cacheKey, fallbackDistance);
    return fallbackDistance;
  }
};

// Fonction de fallback optimisée
const calculateFallbackDistance = (postal1: string, postal2: string): number => {
  const lat1 = parseFloat(postal1.substring(0, 2)) + parseFloat(postal1.substring(2, 5)) / 1000;
  const lon1 = parseFloat(postal1.substring(0, 2)) * 0.5;
  const lat2 = parseFloat(postal2.substring(0, 2)) + parseFloat(postal2.substring(2, 5)) / 1000;
  const lon2 = parseFloat(postal2.substring(0, 2)) * 0.5;
  
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return Math.round(R * c);
};

// Fonction pour traiter les matches en parallèle avec limitation de concurrence
const processMatchesConcurrently = async (
  clients: Client[],
  moves: ConfirmedMove[],
  maxConcurrency: number = 10
): Promise<MatchResult[]> => {
  const allMatches: MatchResult[] = [];
  const tasks: Promise<MatchResult | null>[] = [];

  for (const client of clients) {
    for (const move of moves) {
      // Créer une tâche pour chaque combinaison client/trajet
      const task = processMatch(client, move);
      tasks.push(task);

      // Si on atteint la limite de concurrence, attendre que certaines tâches se terminent
      if (tasks.length >= maxConcurrency) {
        const results = await Promise.allSettled(tasks.splice(0, Math.floor(maxConcurrency / 2)));
        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            allMatches.push(result.value);
          }
        });
      }
    }
  }

  // Traiter les tâches restantes
  const remainingResults = await Promise.allSettled(tasks);
  remainingResults.forEach(result => {
    if (result.status === 'fulfilled' && result.value) {
      allMatches.push(result.value);
    }
  });

  return allMatches;
};

// Fonction pour traiter un match individuel
const processMatch = async (client: Client, move: ConfirmedMove): Promise<MatchResult | null> => {
  try {
    // Calculs parallèles des distances
    const [departureDistance, arrivalDistance] = await Promise.all([
      calculateOptimizedDistance(client.departure_postal_code, move.departure_postal_code),
      calculateOptimizedDistance(client.arrival_postal_code, move.arrival_postal_code)
    ]);

    const totalDistance = departureDistance + arrivalDistance;

    // Filtre précoce pour éviter les calculs inutiles
    if (totalDistance > 100) {
      return null;
    }

    // Calculer la différence de dates
    const clientDate = new Date(client.desired_date);
    const moveDate = new Date(move.departure_date);
    const dateDiff = Math.abs(clientDate.getTime() - moveDate.getTime()) / (1000 * 3600 * 24);

    // Calculer la compatibilité du volume
    const volumeNeeded = client.estimated_volume || 0;
    const volumeAvailable = (move.max_volume || 0) - (move.used_volume || 0);
    const volumeCompatible = volumeNeeded <= volumeAvailable;
    const availableVolumeAfter = Math.max(0, volumeAvailable - volumeNeeded);

    // Critères de validation
    const isValid = 
      totalDistance <= 100 &&
      dateDiff <= 7 &&
      volumeCompatible;

    // Calculer un score de match
    const matchScore = totalDistance + (dateDiff * 10) + (volumeCompatible ? 0 : 1000);

    return {
      move: {
        ...move,
        move_reference: `TRJ-${String(move.id).padStart(6, '0')}`,
        available_volume: volumeAvailable
      },
      distance_km: Math.round(totalDistance),
      date_diff_days: Math.round(dateDiff),
      volume_compatible: volumeCompatible,
      available_volume_after: availableVolumeAfter,
      match_score: matchScore,
      is_valid: isValid,
      match_reference: `MTH-${client.id}-${move.id}`,
      client: client
    };
  } catch (error) {
    console.error(`❌ Erreur traitement match client ${client.id} - trajet ${move.id}:`, error);
    return null;
  }
};

const MatchFinder = () => {
  const { toast } = useToast();
  const { acceptMatch, rejectMatch, loading: actionLoading } = useMatchActions();
  const [clients, setClients] = useState<Client[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [scanProgress, setScanProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      console.log('🔍 Chargement des clients...');

      const { data: clientsData, error } = await supabase
        .from('clients')
        .select('*')
        .in('status', ['pending', 'confirmed'])
        .not('departure_postal_code', 'is', null)
        .not('arrival_postal_code', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedClients = clientsData?.map(client => ({
        ...client,
        client_reference: client.client_reference || `CLI-${String(client.id).padStart(6, '0')}`
      })) || [];

      console.log('✅ Clients chargés:', processedClients.length);
      setClients(processedClients);

    } catch (error) {
      console.error('❌ Erreur chargement clients:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const findMatches = async () => {
    if (clients.length === 0) {
      toast({
        title: "Pas de données",
        description: "Aucun client disponible pour le matching",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setShowResults(false);
    setCurrentMatchIndex(0);
    setScanProgress(0);
    console.log('🚀 Début du processus de matching ULTRA-RAPIDE...');

    try {
      // Étape 1: Charger les trajets confirmés
      setScanProgress(10);
      const { data: movesData, error: movesError } = await supabase
        .from('confirmed_moves')
        .select('*')
        .eq('status', 'confirmed')
        .not('departure_postal_code', 'is', null)
        .not('arrival_postal_code', 'is', null);

      if (movesError) throw movesError;

      if (!movesData || movesData.length === 0) {
        setMatches([]);
        toast({
          title: "Aucun trajet",
          description: "Aucun trajet confirmé disponible",
          variant: "destructive",
        });
        setIsScanning(false);
        return;
      }

      setScanProgress(20);
      console.log(`📦 ${movesData.length} trajets confirmés trouvés`);

      // Étape 2: Traitement en parallèle ultra-rapide
      setScanProgress(30);
      console.log('⚡ Traitement parallèle en cours...');
      
      const startTime = Date.now();
      const allMatches = await processMatchesConcurrently(clients, movesData, 15);
      const processingTime = Date.now() - startTime;

      setScanProgress(80);

      // Étape 3: Tri et finalisation
      allMatches.sort((a, b) => a.match_score - b.match_score);
      setScanProgress(100);

      console.log(`✅ Matching ULTRA-RAPIDE terminé en ${processingTime}ms:`, {
        total: allMatches.length,
        valides: allMatches.filter(m => m.is_valid).length,
        vitesse: `${Math.round(allMatches.length / (processingTime / 1000))} matches/seconde`
      });

      setMatches(allMatches);

      // Attendre 4 secondes avant d'afficher les résultats
      setTimeout(() => {
        setIsScanning(false);
        setShowResults(true);
        toast({
          title: "⚡ Scan ULTRA-RAPIDE terminé",
          description: `${allMatches.length} correspondances trouvées en ${processingTime}ms (${allMatches.filter(m => m.is_valid).length} valides)`,
        });
      }, 4000);

    } catch (error) {
      console.error('❌ Erreur matching:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du processus de matching",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const handleAcceptMatch = async (match: MatchResult) => {
    const success = await acceptMatch(match);
    if (success) {
      setMatches(prev => prev.filter(m => m.match_reference !== match.match_reference));
      if (currentMatchIndex >= filteredMatches.length - 1) {
        setCurrentMatchIndex(0);
      }
    }
  };

  const handleRejectMatch = async (match: MatchResult) => {
    const success = await rejectMatch(match);
    if (success) {
      setMatches(prev => prev.filter(m => m.match_reference !== match.match_reference));
      if (currentMatchIndex >= filteredMatches.length - 1) {
        setCurrentMatchIndex(0);
      }
    }
  };

  const nextMatch = () => {
    if (currentMatchIndex < filteredMatches.length - 1) {
      setCurrentMatchIndex(prev => prev + 1);
    }
  };

  const previousMatch = () => {
    if (currentMatchIndex > 0) {
      setCurrentMatchIndex(prev => prev - 1);
    }
  };

  const filteredMatches = matches.filter(match => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      match.client?.name?.toLowerCase().includes(searchLower) ||
      match.client?.client_reference?.toLowerCase().includes(searchLower) ||
      match.move.company_name?.toLowerCase().includes(searchLower) ||
      match.move.move_reference?.toLowerCase().includes(searchLower) ||
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

  const currentMatch = sortedMatches[currentMatchIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 p-4"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <motion.h1 
            className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            💕 MatchMover
          </motion.h1>
          <p className="text-gray-600">Trouvez l'amour parfait entre clients et transporteurs</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/60 backdrop-blur border-pink-200">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-pink-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-pink-600">{clients.length}</div>
              <p className="text-xs text-gray-600">Clients</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur border-purple-200">
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{matches.length}</div>
              <p className="text-xs text-gray-600">Matches</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur border-green-200">
            <CardContent className="p-4 text-center">
              <Heart className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{matches.filter(m => m.is_valid).length}</div>
              <p className="text-xs text-gray-600">Compatibles</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur border-indigo-200">
            <CardContent className="p-4 text-center">
              <Truck className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-indigo-600">∞</div>
              <p className="text-xs text-gray-600">Possibilités</p>
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
                      <Radar className="w-full h-full text-pink-500" />
                    </motion.div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full border-4 border-pink-300 opacity-30"
                    />
                  </div>
                  
                  <Button
                    onClick={findMatches}
                    disabled={loading || clients.length === 0}
                    size="lg"
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-full shadow-lg"
                  >
                    <Heart className="h-6 w-6 mr-2" />
                    Commencer le Matching ✨
                  </Button>
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
                      <Radar className="w-full h-full text-pink-500" />
                    </motion.div>
                    
                    {/* Ondes radar */}
                    <motion.div
                      animate={{ scale: [1, 2, 1], opacity: [0.8, 0, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full border-4 border-pink-400"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      className="absolute inset-0 rounded-full border-4 border-purple-400"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                      className="absolute inset-0 rounded-full border-4 border-indigo-400"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-800">Recherche en cours... 💕</h2>
                    <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
                      <motion.div 
                        className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${scanProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-gray-600">{scanProgress}% - Analysing compatibility...</p>
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
              {/* Filtres */}
              <Card className="bg-white/60 backdrop-blur border-pink-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-pink-600">
                    <Filter className="h-5 w-5" />
                    Filtres de recherche
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-pink-200 focus:border-pink-400"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="border-pink-200 focus:border-pink-400">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="valid">💕 Compatibles</SelectItem>
                        <SelectItem value="invalid">💔 Incompatibles</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="border-pink-200 focus:border-pink-400">
                        <SelectValue placeholder="Trier par" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date souhaitée</SelectItem>
                        <SelectItem value="distance">Distance</SelectItem>
                        <SelectItem value="score">Score de match</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-sm text-gray-600 flex items-center justify-center">
                      <Heart className="h-4 w-4 mr-1 text-pink-500" />
                      {sortedMatches.length} matches
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Carte de match style Tinder */}
              {sortedMatches.length > 0 && currentMatch ? (
                <div className="flex flex-col items-center space-y-6">
                  <div className="text-center">
                    <p className="text-gray-600">
                      Match {currentMatchIndex + 1} sur {sortedMatches.length}
                    </p>
                  </div>

                  <motion.div
                    key={currentMatchIndex}
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -300, opacity: 0 }}
                    className="w-full max-w-md mx-auto"
                  >
                    <Card className={`overflow-hidden shadow-2xl ${currentMatch.is_valid ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' : 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300'}`}>
                      <CardHeader className="text-center pb-2">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <Badge className={currentMatch.is_valid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                            {currentMatch.is_valid ? '💕 Compatible' : '💔 Incompatible'}
                          </Badge>
                          <Badge variant="outline" className="font-mono text-xs">
                            Score: {currentMatch.match_score}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl font-bold text-gray-800">
                          {currentMatch.client.name} ❤️ {currentMatch.move.company_name}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-white/50 rounded-lg">
                            <h4 className="font-semibold text-gray-700 mb-2">👤 Client</h4>
                            <p className="font-medium">{currentMatch.client.name}</p>
                            <p className="text-sm text-gray-500">{currentMatch.client.client_reference}</p>
                            <p className="text-sm">{currentMatch.client.departure_postal_code} → {currentMatch.client.arrival_postal_code}</p>
                          </div>
                          
                          <div className="text-center p-3 bg-white/50 rounded-lg">
                            <h4 className="font-semibold text-gray-700 mb-2">🚛 Transporteur</h4>
                            <p className="font-medium">{currentMatch.move.company_name}</p>
                            <p className="text-sm text-gray-500">{currentMatch.move.move_reference}</p>
                            <p className="text-sm">{currentMatch.move.departure_postal_code} → {currentMatch.move.arrival_postal_code}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center space-x-2 justify-center p-2 bg-white/50 rounded">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span><strong>{currentMatch.distance_km}km</strong></span>
                          </div>
                          <div className="flex items-center space-x-2 justify-center p-2 bg-white/50 rounded">
                            <Calendar className="h-4 w-4 text-purple-600" />
                            <span><strong>±{currentMatch.date_diff_days}j</strong></span>
                          </div>
                          <div className="flex items-center space-x-2 justify-center p-2 bg-white/50 rounded">
                            <Package className="h-4 w-4 text-orange-600" />
                            <span><strong>{currentMatch.client.estimated_volume}m³</strong></span>
                          </div>
                          <div className="flex items-center space-x-2 justify-center p-2 bg-white/50 rounded">
                            <Package className="h-4 w-4 text-green-600" />
                            <span><strong>Reste: {Number(currentMatch.available_volume_after.toFixed(2))}m³</strong></span>
                          </div>
                        </div>

                        {/* Boutons d'action style Tinder */}
                        <div className="flex justify-center items-center space-x-6 pt-4">
                          <Button
                            onClick={() => handleRejectMatch(currentMatch)}
                            disabled={actionLoading}
                            size="lg"
                            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg"
                          >
                            <X className="h-8 w-8" />
                          </Button>
                          
                          {currentMatch.is_valid && (
                            <Button
                              onClick={() => handleAcceptMatch(currentMatch)}
                              disabled={actionLoading}
                              size="lg"
                              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg"
                            >
                              <Heart className="h-8 w-8" />
                            </Button>
                          )}
                        </div>

                        {/* Navigation */}
                        <div className="flex justify-between items-center pt-4">
                          <Button
                            onClick={previousMatch}
                            disabled={currentMatchIndex === 0}
                            variant="outline"
                            size="sm"
                            className="border-pink-300"
                          >
                            ← Précédent
                          </Button>
                          
                          <Button
                            onClick={nextMatch}
                            disabled={currentMatchIndex >= sortedMatches.length - 1}
                            variant="outline"
                            size="sm"
                            className="border-pink-300"
                          >
                            Suivant →
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="text-6xl mb-4">💔</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Aucun match trouvé</h2>
                  <p className="text-gray-600">Essayez d'ajuster vos filtres ou lancez un nouveau scan</p>
                  <Button
                    onClick={() => {
                      setShowResults(false);
                      setMatches([]);
                    }}
                    className="mt-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
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
