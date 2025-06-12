
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Calendar, Volume2, Target, Users, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import MatchFilters from './MatchFilters';
import MatchDetailsDialog from './MatchDetailsDialog';

interface ClientRequest {
  id: number;
  name: string;
  departure_city: string;
  departure_postal_code: string;
  arrival_city: string;
  arrival_postal_code: string;
  desired_date: string;
  estimated_volume: number;
  flexible_dates: boolean;
  status: string;
  created_at: string;
}

interface ConfirmedMove {
  id: number;
  mover_name: string;
  company_name: string;
  departure_city: string;
  departure_postal_code: string;
  arrival_city: string;
  arrival_postal_code: string;
  departure_date: string;
  max_volume: number;
  used_volume: number;
  available_volume: number;
  price_per_m3: number;
  status: string;
}

interface MatchResult {
  client: ClientRequest;
  move: ConfirmedMove;
  distance: number;
  dateDiff: number;
  volumeMatch: boolean;
  matchScore: number;
}

const MatchFinder = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientRequest[]>([]);
  const [moves, setMoves] = useState<ConfirmedMove[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Filtres
  const [maxDistance, setMaxDistance] = useState(100);
  const [maxDateDiff, setMaxDateDiff] = useState(7);
  const [minMatchScore, setMinMatchScore] = useState(70);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (clients.length > 0 && moves.length > 0) {
      findMatches();
    }
  }, [clients, moves, maxDistance, maxDateDiff, minMatchScore]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Chargement des données pour le matching...');

      // Charger les demandes clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('client_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (clientsError) {
        console.error('❌ Erreur chargement clients:', clientsError);
        throw clientsError;
      }

      // Charger les déménagements confirmés
      const { data: movesData, error: movesError } = await supabase
        .from('confirmed_moves')
        .select('*')
        .eq('status', 'confirmed')
        .order('departure_date', { ascending: true });

      if (movesError) {
        console.error('❌ Erreur chargement déménagements:', movesError);
        throw movesError;
      }

      setClients(clientsData || []);
      setMoves(movesData || []);
      
      console.log('✅ Données chargées:', {
        clients: clientsData?.length || 0,
        moves: movesData?.length || 0
      });

    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (postalCode1: string, postalCode2: string): number => {
    // Simulation de calcul de distance basé sur les codes postaux
    // Dans une vraie application, on utiliserait l'API Google Maps
    const code1 = parseInt(postalCode1.substring(0, 2));
    const code2 = parseInt(postalCode2.substring(0, 2));
    return Math.abs(code1 - code2) * 10; // Distance approximative en km
  };

  const calculateDateDiff = (date1: string, date2: string): number => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.abs((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateMatchScore = (distance: number, dateDiff: number, volumeMatch: boolean): number => {
    let score = 100;
    
    // Pénalité distance (max 30 points)
    score -= Math.min(distance / 10, 30);
    
    // Pénalité différence de dates (max 20 points)
    score -= Math.min(dateDiff * 3, 20);
    
    // Bonus volume compatible (15 points)
    if (volumeMatch) score += 15;
    
    // Bonus départ proche (10 points si < 20km)
    if (distance < 20) score += 10;
    
    return Math.max(0, Math.round(score));
  };

  const findMatches = () => {
    console.log('🎯 Recherche de matches...');
    const foundMatches: MatchResult[] = [];

    clients.forEach(client => {
      moves.forEach(move => {
        // Calculer distance entre départs
        const departureDistance = calculateDistance(
          client.departure_postal_code,
          move.departure_postal_code
        );

        // Calculer distance entre arrivées
        const arrivalDistance = calculateDistance(
          client.arrival_postal_code,
          move.arrival_postal_code
        );

        // Distance moyenne
        const avgDistance = (departureDistance + arrivalDistance) / 2;

        // Différence de dates
        const dateDiff = calculateDateDiff(client.desired_date, move.departure_date);

        // Vérifier compatibilité volume
        const volumeMatch = move.available_volume >= client.estimated_volume;

        // Calculer score de match
        const matchScore = calculateMatchScore(avgDistance, dateDiff, volumeMatch);

        // Appliquer les filtres
        if (avgDistance <= maxDistance && 
            dateDiff <= maxDateDiff && 
            matchScore >= minMatchScore) {
          
          foundMatches.push({
            client,
            move,
            distance: avgDistance,
            dateDiff,
            volumeMatch,
            matchScore
          });
        }
      });
    });

    // Trier par score décroissant
    foundMatches.sort((a, b) => b.matchScore - a.matchScore);
    
    setMatches(foundMatches);
    console.log('✅ Matches trouvés:', foundMatches.length);
  };

  const createMatch = async (match: MatchResult) => {
    if (!user) return;

    try {
      console.log('🔗 Création du match...', match);

      const { error } = await supabase
        .from('move_matches')
        .insert({
          client_request_id: match.client.id,
          move_id: match.move.id,
          match_type: 'automatic',
          distance_km: match.distance,
          date_diff_days: match.dateDiff,
          volume_ok: match.volumeMatch,
          combined_volume: match.client.estimated_volume + match.move.used_volume,
          is_valid: true
        });

      if (error) throw error;

      // Mettre à jour le statut du client
      await supabase
        .from('client_requests')
        .update({
          is_matched: true,
          matched_at: new Date().toISOString(),
          match_status: 'matched'
        })
        .eq('id', match.client.id);

      toast({
        title: "Match créé",
        description: `Match créé entre ${match.client.name} et ${match.move.company_name}`,
      });

      // Recharger les données
      fetchData();

    } catch (error) {
      console.error('❌ Erreur création match:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le match",
        variant: "destructive",
      });
    }
  };

  const getMatchTypeColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 75) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getMatchTypeLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Très bon';
    if (score >= 60) return 'Bon';
    return 'Moyen';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Target className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Recherche de correspondances</h2>
          <Badge variant="secondary">{matches.length} match(es) trouvé(s)</Badge>
        </div>
        <Button onClick={fetchData} disabled={loading}>
          <Search className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <MatchFilters
        maxDistance={maxDistance}
        setMaxDistance={setMaxDistance}
        maxDateDiff={maxDateDiff}
        setMaxDateDiff={setMaxDateDiff}
        minMatchScore={minMatchScore}
        setMinMatchScore={setMinMatchScore}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {matches.map((match, index) => (
          <Card key={`${match.client.id}-${match.move.id}`} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Match #{index + 1}</CardTitle>
                <Badge className={getMatchTypeColor(match.matchScore)}>
                  {getMatchTypeLabel(match.matchScore)} ({match.matchScore}%)
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Informations client */}
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <Users className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-800">Client: {match.client.name}</span>
                </div>
                <div className="space-y-1 text-sm text-blue-700">
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {match.client.departure_postal_code} → {match.client.arrival_postal_code}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(match.client.desired_date).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="flex items-center">
                    <Volume2 className="h-3 w-3 mr-1" />
                    {match.client.estimated_volume} m³
                  </div>
                </div>
              </div>

              {/* Informations déménagement */}
              <div className="bg-green-50 rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <Truck className="h-4 w-4 text-green-600 mr-2" />
                  <span className="font-medium text-green-800">{match.move.company_name}</span>
                </div>
                <div className="space-y-1 text-sm text-green-700">
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {match.move.departure_postal_code} → {match.move.arrival_postal_code}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(match.move.departure_date).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="flex items-center">
                    <Volume2 className="h-3 w-3 mr-1" />
                    {match.move.available_volume} m³ disponible
                  </div>
                </div>
              </div>

              {/* Métriques du match */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-gray-700">Distance</div>
                  <div className="text-lg font-bold text-gray-900">{Math.round(match.distance)} km</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-700">Écart dates</div>
                  <div className="text-lg font-bold text-gray-900">{Math.round(match.dateDiff)} jours</div>
                </div>
              </div>

              <div className="flex space-x-2 pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedMatch(match);
                    setShowDetailsDialog(true);
                  }}
                  className="flex-1"
                >
                  Détails
                </Button>
                <Button
                  size="sm"
                  onClick={() => createMatch(match)}
                  className="flex-1"
                >
                  Créer le match
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {matches.length === 0 && !loading && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Aucune correspondance trouvée</p>
          <p className="text-sm text-gray-500">
            Essayez d'ajuster les filtres de recherche
          </p>
        </div>
      )}

      <MatchDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        match={selectedMatch}
      />
    </motion.div>
  );
};

export default MatchFinder;
