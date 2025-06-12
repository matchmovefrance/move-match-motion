import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Target, Play, Users, Truck, Filter, Calendar, MapPin, Package, CheckCircle, XCircle } from 'lucide-react';
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

      toast({
        title: "⚡ Scan ULTRA-RAPIDE terminé",
        description: `${allMatches.length} correspondances trouvées en ${processingTime}ms (${allMatches.filter(m => m.is_valid).length} valides)`,
      });

    } catch (error) {
      console.error('❌ Erreur matching:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du processus de matching",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  const handleAcceptMatch = async (match: MatchResult) => {
    const success = await acceptMatch(match);
    if (success) {
      setMatches(prev => prev.filter(m => m.match_reference !== match.match_reference));
    }
  };

  const handleRejectMatch = async (match: MatchResult) => {
    const success = await rejectMatch(match);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center space-x-3">
        <Target className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Moteur de Matching ULTRA-RAPIDE ⚡</h2>
      </div>

      {/* Statistiques et contrôles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2 text-blue-600" />
              Clients actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">Prêts pour matching</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2 text-green-600" />
              Matches trouvés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matches.length}</div>
            <p className="text-xs text-muted-foreground">
              {matches.filter(m => m.is_valid).length} valides
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Truck className="h-4 w-4 mr-2 text-purple-600" />
              Scanner ULTRA-RAPIDE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={findMatches}
              disabled={loading || isScanning || clients.length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isScanning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Scan ULTRA-RAPIDE... {scanProgress}%
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  ⚡ Lancer le scan RAPIDE
                </>
              )}
            </Button>
            {isScanning && (
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                ></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Radar Status ⚡</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-16 w-16 mx-auto">
              {isScanning && (
                <div className="absolute inset-0">
                  <div className="animate-ping absolute h-full w-full rounded-full bg-blue-400 opacity-25"></div>
                  <div className="animate-pulse absolute h-full w-full rounded-full bg-blue-500 opacity-50"></div>
                </div>
              )}
              <div className={`h-full w-full rounded-full ${isScanning ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-300'} flex items-center justify-center`}>
                <Target className={`h-6 w-6 ${isScanning ? 'text-white animate-spin' : 'text-gray-600'}`} />
              </div>
            </div>
            {isScanning && (
              <div className="text-center text-xs text-blue-600 mt-2 font-medium">
                ULTRA-RAPIDE
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par référence, nom, ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="valid">Valides uniquement</SelectItem>
                <SelectItem value="invalid">Non valides</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date souhaitée</SelectItem>
                <SelectItem value="distance">Distance</SelectItem>
                <SelectItem value="score">Score de match</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-600 flex items-center">
              <Package className="h-4 w-4 mr-1" />
              {sortedMatches.length} résultats
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résultats */}
      <Card>
        <CardHeader>
          <CardTitle>Résultats du Matching ULTRA-RAPIDE ⚡</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Chargement des données...</p>
            </div>
          ) : sortedMatches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="font-medium">
                {matches.length === 0 ? 'Aucun match trouvé' : 'Aucun résultat ne correspond aux filtres'}
              </p>
              <p className="text-sm mt-2">
                {matches.length === 0 
                  ? 'Cliquez sur "⚡ Lancer le scan RAPIDE" pour rechercher des correspondances'
                  : 'Ajustez vos filtres de recherche'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedMatches.map((match, index) => (
                <Card 
                  key={`${match.client.id}-${match.move.id}-${index}`}
                  className={`${match.is_valid ? 'border-green-200 bg-green-50/30' : 'border-orange-200 bg-orange-50/30'}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {match.match_reference}
                        </Badge>
                        <Badge className={match.is_valid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                          {match.is_valid ? 'Valide' : 'Partiel'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Score: {match.match_score}
                        </Badge>
                      </div>
                      {match.is_valid && (
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptMatch(match)}
                            disabled={actionLoading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accepter devis
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectMatch(match)}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-700 border-red-300"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Refuser devis
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className="font-medium text-gray-600">Client:</span>
                        <p className="font-medium">{match.client.name}</p>
                        <p className="text-sm text-gray-500">{match.client.client_reference}</p>
                        <p className="text-sm">{match.client.departure_postal_code} → {match.client.arrival_postal_code}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Transporteur:</span>
                        <p className="font-medium">{match.move.company_name}</p>
                        <p className="text-sm text-gray-500">{match.move.move_reference}</p>
                        <p className="text-sm">{match.move.departure_postal_code} → {match.move.arrival_postal_code}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-3 border-t">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span><strong>{match.distance_km}km</strong></span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <span><strong>±{match.date_diff_days}j</strong></span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Package className="h-4 w-4 text-orange-600" />
                        <span><strong>Volume:</strong> {match.client.estimated_volume}m³</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Package className="h-4 w-4 text-green-600" />
                        <span><strong>Reste:</strong> {match.available_volume_after}m³</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MatchFinder;
