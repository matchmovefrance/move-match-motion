import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Calendar, Volume2, Users, Truck, Clock, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ClientRequest {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  departure_city: string;
  departure_postal_code: string;
  arrival_city: string;
  arrival_postal_code: string;
  desired_date: string;
  estimated_volume: number | null;
  budget_min: number | null;
  budget_max: number | null;
  status: string;
  is_matched: boolean | null;
  match_status: string | null;
  flexible_dates: boolean | null;
  date_range_start?: string;
  date_range_end?: string;
}

interface Move {
  id: number;
  mover_name: string | null;
  company_name: string | null;
  departure_city: string;
  departure_postal_code: string;
  arrival_city: string;
  arrival_postal_code: string;
  departure_date: string;
  max_volume: number | null;
  used_volume: number;
  available_volume: number;
  price_per_m3: number | null;
  total_price: number | null;
  status: string;
  status_custom: string | null;
  route_type: string | null;
}

interface Match {
  id: number;
  move_id: number;
  client_request_id: number;
  match_type: string;
  distance_km: number;
  date_diff_days: number;
  combined_volume: number;
  volume_ok: boolean;
  is_valid: boolean;
  created_at: string;
  status?: string;
  actions?: Array<{
    action_type: string;
    action_date: string;
    notes: string;
    user_id: string;
  }>;
}

const MatchFinder = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientRequests, setClientRequests] = useState<ClientRequest[]>([]);
  const [moves, setMoves] = useState<Move[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Mémoriser la fonction fetchData pour éviter les re-rendus inutiles
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Récupérer les demandes clients (seulement celles en attente et non terminées)
      const { data: clientData, error: clientError } = await supabase
        .from('client_requests')
        .select('*')
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: false });

      if (clientError) throw clientError;

      // Récupérer les déménagements confirmés (seulement ceux en cours)
      const { data: moveData, error: moveError } = await supabase
        .from('confirmed_moves')
        .select('*')
        .eq('status', 'confirmed')
        .neq('status_custom', 'termine')
        .order('created_at', { ascending: false });

      if (moveError) throw moveError;

      // Récupérer les matches existants avec leurs actions
      const { data: matchData, error: matchError } = await supabase
        .from('move_matches')
        .select('*')
        .order('created_at', { ascending: false });

      if (matchError) throw matchError;

      // Récupérer les actions pour chaque match
      const { data: actionsData, error: actionsError } = await supabase
        .from('match_actions')
        .select('*')
        .order('action_date', { ascending: false });

      if (actionsError) {
        console.error('Erreur lors de la récupération des actions:', actionsError);
      }

      // Enrichir les matches avec leurs actions et statuts
      const enrichedMatches = (matchData || []).map(match => {
        const matchActions = actionsData?.filter(action => action.match_id === match.id) || [];
        
        // Déterminer le statut basé sur les actions
        let status = 'pending';
        const latestAction = matchActions[0];
        if (latestAction) {
          status = latestAction.action_type;
        }

        return {
          ...match,
          actions: matchActions,
          status
        };
      });

      setClientRequests(clientData || []);
      setMoves(moveData || []);
      setMatches(enrichedMatches);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMatchAction = useCallback(async (matchId: number, actionType: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('match_actions')
        .insert({
          match_id: matchId,
          action_type: actionType,
          user_id: user?.id,
          action_date: new Date().toISOString(),
          notes: `Match ${actionType === 'accepted' ? 'accepté' : 'rejeté'} par l'utilisateur`
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Match ${actionType === 'accepted' ? 'accepté' : 'rejeté'} avec succès`,
      });

      // Rafraîchir les données
      fetchData();
    } catch (error: any) {
      console.error('Error processing match action:', error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter l'action",
        variant: "destructive",
      });
    }
  }, [user?.id, toast, fetchData]);

  // Fonction améliorée pour calculer si les dates sont compatibles avec gestion des dates flexibles
  const areDatesCompatible = (client: ClientRequest, moveDate: string) => {
    const move = new Date(moveDate);
    
    if (client.flexible_dates && client.date_range_start && client.date_range_end) {
      // Si le client a des dates flexibles, vérifier si la date du trajet est dans la plage
      const rangeStart = new Date(client.date_range_start);
      const rangeEnd = new Date(client.date_range_end);
      
      return move >= rangeStart && move <= rangeEnd;
    } else {
      // Si pas de dates flexibles, utiliser la logique standard ±15 jours
      const clientDate = new Date(client.desired_date);
      const timeDiff = Math.abs(clientDate.getTime() - move.getTime());
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      return daysDiff <= 15;
    }
  };

  // Fonction pour calculer la différence de jours (améliorée pour dates flexibles)
  const calculateDateDifference = (client: ClientRequest, moveDate: string) => {
    const move = new Date(moveDate);
    
    if (client.flexible_dates && client.date_range_start && client.date_range_end) {
      // Pour les dates flexibles, calculer la différence la plus petite possible
      const rangeStart = new Date(client.date_range_start);
      const rangeEnd = new Date(client.date_range_end);
      
      if (move >= rangeStart && move <= rangeEnd) {
        return 0; // Parfaitement dans la plage
      } else if (move < rangeStart) {
        return Math.ceil((rangeStart.getTime() - move.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        return Math.ceil((move.getTime() - rangeEnd.getTime()) / (1000 * 60 * 60 * 24));
      }
    } else {
      // Logique standard
      const clientDate = new Date(client.desired_date);
      return Math.abs((clientDate.getTime() - move.getTime()) / (1000 * 60 * 60 * 24));
    }
  };

  // Fonction pour calculer la distance réelle entre un point et un trajet
  const calculateDistanceToRoute = (clientDepartureCode: string, clientArrivalCode: string, moveDepartureCode: string, moveArrivalCode: string) => {
    // Conversion simplifiée des codes postaux en coordonnées GPS approximatives
    const getCoordinatesFromPostalCode = (postalCode: string) => {
      const dept = parseInt(postalCode.substring(0, 2));
      
      // Coordonnées approximatives des départements français (en degrés)
      const deptCoords: { [key: number]: { lat: number, lng: number } } = {
        1: { lat: 46.2044, lng: 5.2256 }, // Ain
        2: { lat: 49.5667, lng: 3.6233 }, // Aisne
        3: { lat: 46.5667, lng: 2.6000 }, // Allier
        4: { lat: 44.2500, lng: 6.2333 }, // Alpes-de-Haute-Provence
        5: { lat: 44.6667, lng: 6.0833 }, // Hautes-Alpes
        6: { lat: 43.7000, lng: 7.2667 }, // Alpes-Maritimes
        7: { lat: 44.7333, lng: 4.6000 }, // Ardèche
        8: { lat: 49.7667, lng: 4.7167 }, // Ardennes
        9: { lat: 42.9667, lng: 1.6000 }, // Ariège
        10: { lat: 48.3000, lng: 4.0833 }, // Aube
        11: { lat: 43.2167, lng: 2.3500 }, // Aude
        12: { lat: 44.3500, lng: 2.5833 }, // Aveyron
        13: { lat: 43.5333, lng: 5.1333 }, // Bouches-du-Rhône
        14: { lat: 49.1833, lng: -0.3667 }, // Calvados
        15: { lat: 45.0333, lng: 2.4167 }, // Cantal
        16: { lat: 45.6500, lng: 0.1500 }, // Charente
        17: { lat: 45.7500, lng: -0.6333 }, // Charente-Maritime
        18: { lat: 47.0833, lng: 2.3833 }, // Cher
        19: { lat: 45.1667, lng: 2.0333 }, // Corrèze
        21: { lat: 47.3167, lng: 5.0167 }, // Côte-d'Or
        22: { lat: 48.5167, lng: -2.7667 }, // Côtes-d'Armor
        23: { lat: 46.1667, lng: 2.2333 }, // Creuse
        24: { lat: 45.1833, lng: 0.7167 }, // Dordogne
        25: { lat: 47.2333, lng: 6.0333 }, // Doubs
        26: { lat: 44.7333, lng: 5.0833 }, // Drôme
        27: { lat: 49.0667, lng: 1.1500 }, // Eure
        28: { lat: 48.4500, lng: 1.4833 }, // Eure-et-Loir
        29: { lat: 48.1000, lng: -4.1000 }, // Finistère
        30: { lat: 43.8333, lng: 4.3667 }, // Gard
        31: { lat: 43.6000, lng: 1.4333 }, // Haute-Garonne
        32: { lat: 43.6500, lng: 0.5833 }, // Gers
        33: { lat: 44.8333, lng: -0.5667 }, // Gironde
        34: { lat: 43.6000, lng: 3.8833 }, // Hérault
        35: { lat: 48.1167, lng: -1.6833 }, // Ille-et-Vilaine
        36: { lat: 46.8167, lng: 1.6833 }, // Indre
        37: { lat: 47.3833, lng: 0.6833 }, // Indre-et-Loire
        38: { lat: 45.1667, lng: 5.7167 }, // Isère
        39: { lat: 46.6833, lng: 5.9000 }, // Jura
        40: { lat: 44.0000, lng: -0.7667 }, // Landes
        41: { lat: 47.6000, lng: 1.3333 }, // Loir-et-Cher
        42: { lat: 45.4333, lng: 4.3833 }, // Loire
        43: { lat: 45.0433, lng: 3.8833 }, // Haute-Loire
        44: { lat: 47.2167, lng: -1.5500 }, // Loire-Atlantique
        45: { lat: 47.9000, lng: 2.2333 }, // Loiret
        46: { lat: 44.4500, lng: 1.4333 }, // Lot
        47: { lat: 44.2000, lng: 0.6167 }, // Lot-et-Garonne
        48: { lat: 44.5167, lng: 3.5000 }, // Lozère
        49: { lat: 47.4667, lng: -0.5500 }, // Maine-et-Loire
        50: { lat: 49.1167, lng: -1.3000 }, // Manche
        51: { lat: 49.0500, lng: 4.0333 }, // Marne
        52: { lat: 48.1167, lng: 5.1333 }, // Haute-Marne
        53: { lat: 48.0667, lng: -0.7667 }, // Mayenne
        54: { lat: 48.6833, lng: 6.1833 }, // Meurthe-et-Moselle
        55: { lat: 49.1500, lng: 5.3833 }, // Meuse
        56: { lat: 47.7500, lng: -2.7500 }, // Morbihan
        57: { lat: 49.1167, lng: 6.1833 }, // Moselle
        58: { lat: 47.0000, lng: 3.5167 }, // Nièvre
        59: { lat: 50.6333, lng: 3.0667 }, // Nord
        60: { lat: 49.4167, lng: 2.8000 }, // Oise
        61: { lat: 48.7333, lng: 0.0833 }, // Orne
        62: { lat: 50.4167, lng: 2.8333 }, // Pas-de-Calais
        63: { lat: 45.7833, lng: 3.0833 }, // Puy-de-Dôme
        64: { lat: 43.3000, lng: -0.3667 }, // Pyrénées-Atlantiques
        65: { lat: 43.2333, lng: 0.0833 }, // Hautes-Pyrénées
        66: { lat: 42.6833, lng: 2.8833 }, // Pyrénées-Orientales
        67: { lat: 48.5833, lng: 7.7500 }, // Bas-Rhin
        68: { lat: 47.7500, lng: 7.3333 }, // Haut-Rhin
        69: { lat: 45.7500, lng: 4.8500 }, // Rhône
        70: { lat: 47.6333, lng: 6.1500 }, // Haute-Saône
        71: { lat: 46.5500, lng: 4.3500 }, // Saône-et-Loire
        72: { lat: 48.0000, lng: 0.2000 }, // Sarthe
        73: { lat: 45.5667, lng: 6.3667 }, // Savoie
        74: { lat: 46.0667, lng: 6.7167 }, // Haute-Savoie
        75: { lat: 48.8566, lng: 2.3522 }, // Paris
        76: { lat: 49.4333, lng: 1.0833 }, // Seine-Maritime
        77: { lat: 48.5333, lng: 2.6667 }, // Seine-et-Marne
        78: { lat: 48.8000, lng: 2.1333 }, // Yvelines
        79: { lat: 46.3167, lng: -0.4667 }, // Deux-Sèvres
        80: { lat: 49.8833, lng: 2.3000 }, // Somme
        81: { lat: 43.9283, lng: 2.1497 }, // Tarn
        82: { lat: 44.0167, lng: 1.3500 }, // Tarn-et-Garonne
        83: { lat: 43.1250, lng: 6.0167 }, // Var
        84: { lat: 44.0500, lng: 5.0500 }, // Vaucluse
        85: { lat: 46.6667, lng: -1.4333 }, // Vendée
        86: { lat: 46.5833, lng: 0.3333 }, // Vienne
        87: { lat: 45.8333, lng: 1.2667 }, // Haute-Vienne
        88: { lat: 48.1667, lng: 6.4500 }, // Vosges
        89: { lat: 47.7967, lng: 3.5675 }, // Yonne
        90: { lat: 47.6333, lng: 6.8667 }, // Territoire de Belfort
        91: { lat: 48.6333, lng: 2.4333 }, // Essonne
        92: { lat: 48.8167, lng: 2.2167 }, // Hauts-de-Seine
        93: { lat: 48.9167, lng: 2.4500 }, // Seine-Saint-Denis
        94: { lat: 48.7667, lng: 2.4833 }, // Val-de-Marne
        95: { lat: 49.0833, lng: 2.1167 }  // Val-d'Oise
      };
      
      const coords = deptCoords[dept] || { lat: 46.603354, lng: 1.888334 }; // Centre de la France par défaut
      return coords;
    };

    // Fonction pour calculer la distance en km entre deux points GPS
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const R = 6371; // Rayon de la Terre en km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    // Fonction pour calculer la distance d'un point à une ligne (segment)
    const distancePointToLine = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
      const A = px - x1;
      const B = py - y1;
      const C = x2 - x1;
      const D = y2 - y1;
      
      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      
      if (lenSq === 0) {
        // Le segment est un point
        return calculateDistance(py, px, y1, x1);
      }

      let param = dot / lenSq;
      
      let xx, yy;
      if (param < 0) {
        xx = x1;
        yy = y1;
      } else if (param > 1) {
        xx = x2;
        yy = y2;
      } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
      }

      return calculateDistance(py, px, yy, xx);
    };

    const clientDep = getCoordinatesFromPostalCode(clientDepartureCode);
    const clientArr = getCoordinatesFromPostalCode(clientArrivalCode);
    const moveDep = getCoordinatesFromPostalCode(moveDepartureCode);
    const moveArr = getCoordinatesFromPostalCode(moveArrivalCode);

    // Calculer la distance du point de départ client au trajet du déménageur
    const distanceDeparture = distancePointToLine(
      clientDep.lng, clientDep.lat,
      moveDep.lng, moveDep.lat,
      moveArr.lng, moveArr.lat
    );

    // Calculer la distance du point d'arrivée client au trajet du déménageur
    const distanceArrival = distancePointToLine(
      clientArr.lng, clientArr.lat,
      moveDep.lng, moveDep.lat,
      moveArr.lng, moveArr.lat
    );

    // Retourner la distance minimale arrondie
    return Math.round(Math.min(distanceDeparture, distanceArrival));
  };

  const findMatches = useCallback(async () => {
    try {
      setLoading(true);
      setIsSearching(true);
      
      // Animation radar de 4 secondes
      setTimeout(() => {
        setIsSearching(false);
      }, 4000);
      
      // Supprimer les anciens matches sans action (pending)
      await supabase
        .from('move_matches')
        .delete()
        .not('id', 'in', `(SELECT DISTINCT match_id FROM match_actions)`);

      // Calculer les nouveaux matches avec la nouvelle logique de distance
      for (const client of clientRequests) {
        for (const move of moves) {
          // Calculer la distance par rapport au trajet complet
          const distanceKm = calculateDistanceToRoute(
            client.departure_postal_code,
            client.arrival_postal_code,
            move.departure_postal_code,
            move.arrival_postal_code
          );
          
          console.log(`Distance calculée pour client ${client.id} -> move ${move.id}: ${distanceKm}km`);
          
          // Vérifier la compatibilité des dates avec gestion des dates flexibles
          const datesCompatible = areDatesCompatible(client, move.departure_date);
          
          if (!datesCompatible) {
            continue; // Ignorer ce match si les dates ne sont pas compatibles
          }
          
          // Calculer la différence de dates avec gestion des dates flexibles
          const dateDiffDays = calculateDateDifference(client, move.departure_date);
          
          // Vérifier si le volume est compatible
          const clientVolume = client.estimated_volume || 0;
          const availableVolume = move.available_volume || 0;
          const volumeOk = clientVolume <= availableVolume;
          
          // Calculer le volume combiné
          const combinedVolume = (move.used_volume || 0) + clientVolume;
          
          // Déterminer si c'est un match valide - distance <= 100km, volume OK et dates compatibles
          const maxAllowedDays = client.flexible_dates ? 
            (dateDiffDays === 0 ? 0 : 15) : 15;
          
          const isValid = distanceKm <= 100 && dateDiffDays <= maxAllowedDays && volumeOk;
          
          console.log(`Match validity pour client ${client.id} -> move ${move.id}: distance=${distanceKm}km, dateDiff=${dateDiffDays}j, volumeOk=${volumeOk}, isValid=${isValid}`);
          
          // Déterminer le type de match
          let matchType = 'partial';
          if (client.departure_city.toLowerCase() === move.departure_city.toLowerCase() &&
              client.arrival_city.toLowerCase() === move.arrival_city.toLowerCase()) {
            if (client.flexible_dates && dateDiffDays === 0) {
              matchType = 'perfect';
            } else if (!client.flexible_dates && dateDiffDays <= 3) {
              matchType = 'perfect';
            } else {
              matchType = 'good';
            }
          } else if (distanceKm <= 50) {
            if (client.flexible_dates && dateDiffDays === 0) {
              matchType = 'good';
            } else if (dateDiffDays <= 7) {
              matchType = 'good';
            }
          }

          // Vérifier s'il existe déjà un match pour cette combinaison
          const existingMatch = matches.find(m => 
            m.client_request_id === client.id && m.move_id === move.id
          );

          if (!existingMatch) {
            // Insérer le match
            const { error } = await supabase
              .from('move_matches')
              .insert({
                move_id: move.id,
                client_request_id: client.id,
                match_type: matchType,
                distance_km: distanceKm,
                date_diff_days: Math.round(dateDiffDays),
                combined_volume: combinedVolume,
                volume_ok: volumeOk,
                is_valid: isValid
              });

            if (error) {
              console.error('Error inserting match:', error);
            }
          }
        }
      }

      toast({
        title: "Succès",
        description: "Recherche de correspondances terminée avec calcul de distance corrigé",
      });

      fetchData();
    } catch (error) {
      console.error('Error finding matches:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la recherche de correspondances",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [clientRequests, moves, matches, toast, fetchData]);

  const getMatchDetails = (match: Match) => {
    const client = clientRequests.find(c => c.id === match.client_request_id);
    const move = moves.find(m => m.id === match.move_id);
    return { client, move };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Accepté</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
    }
  };

  // Filtrer les matches pour n'afficher que ceux pertinents
  const displayMatches = matches.filter(match => {
    const { client, move } = getMatchDetails(match);
    
    // Ne pas afficher si le client ou le déménagement n'existe plus
    if (!client || !move) return false;
    
    // Ne pas afficher les trajets terminés
    if (move.status_custom === 'termine') return false;
    
    // Ne pas afficher les demandes clients terminées
    if (client.status === 'completed') return false;
    
    return true;
  });

  // Calculer le total des correspondances incluant les matches acceptés et terminés
  const getTotalMatches = () => {
    // Compter les matches affichés (en cours)
    const currentMatches = displayMatches.length;
    
    // Compter les matches acceptés (même si les trajets/demandes sont terminés)
    const acceptedMatches = matches.filter(match => 
      match.status === 'accepted'
    ).length;
    
    // Retourner le total unique (éviter les doublons)
    const uniqueMatches = new Set();
    
    // Ajouter les matches en cours
    displayMatches.forEach(match => uniqueMatches.add(match.id));
    
    // Ajouter les matches acceptés
    matches.filter(match => match.status === 'accepted').forEach(match => 
      uniqueMatches.add(match.id)
    );
    
    return uniqueMatches.size;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Search className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Recherche de correspondances</h2>
        </div>
        <div className="relative">
          <Button
            onClick={findMatches}
            disabled={loading || isSearching}
            className="bg-blue-600 hover:bg-blue-700 relative overflow-hidden"
          >
            <Search className="h-4 w-4 mr-2" />
            Trouver un match
            
            {/* Animation radar */}
            {isSearching && (
              <div className="absolute inset-0 bg-blue-600">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-8 h-8 border border-white/30 rounded-full animate-ping"></div>
                    <div className="absolute inset-0 w-8 h-8 border border-white/20 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute inset-0 w-8 h-8 border border-white/10 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Demandes clients</p>
                <p className="text-2xl font-bold">{clientRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Déménagements</p>
                <p className="text-2xl font-bold">{moves.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Correspondances</p>
                <p className="text-2xl font-bold">{getTotalMatches()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Correspondances valides</p>
                <p className="text-2xl font-bold">{displayMatches.filter(m => m.is_valid).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des correspondances */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Correspondances trouvées</h3>
        
        {displayMatches.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune correspondance trouvée</p>
              <p className="text-sm text-gray-500 mt-2">
                Cliquez sur "Trouver un match" pour commencer
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {displayMatches.map((match) => {
              const { client, move } = getMatchDetails(match);
              
              if (!client || !move) return null;

              // Recalculer la compatibilité pour l'affichage avec la logique corrigée
              const isDistanceOk = match.distance_km <= 100;
              const isVolumeOk = match.volume_ok;
              const isDateOk = client.flexible_dates ? 
                (match.date_diff_days === 0 || match.date_diff_days <= 15) : 
                match.date_diff_days <= 15;
              
              const isCompatible = isDistanceOk && isVolumeOk && isDateOk;

              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-xl p-6 shadow-lg border ${
                    isCompatible ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  } ${match.status === 'rejected' ? 'opacity-60' : ''}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Client */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                          <Users className="h-4 w-4 mr-2 text-blue-600" />
                          Client: {client.name || 'Non renseigné'}
                        </h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-3 w-3" />
                            <span>{client.departure_city} → {client.arrival_city}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(client.desired_date).toLocaleDateString('fr-FR')}</span>
                            {client.flexible_dates && (
                              <Badge variant="outline" className="text-xs">
                                Flexible ({client.date_range_start && client.date_range_end ? 
                                  `${new Date(client.date_range_start).toLocaleDateString('fr-FR')} - ${new Date(client.date_range_end).toLocaleDateString('fr-FR')}` : 
                                  '±15 jours'})
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Volume2 className="h-3 w-3" />
                            <span>{client.estimated_volume || 0}m³</span>
                          </div>
                          {client.email && (
                            <div className="text-blue-600">{client.email}</div>
                          )}
                        </div>
                      </div>

                      {/* Déménageur */}
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                          <Truck className="h-4 w-4 mr-2 text-green-600" />
                          Déménageur: {move.company_name || 'Non renseigné'}
                        </h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-3 w-3" />
                            <span>{move.departure_city} → {move.arrival_city}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(move.departure_date).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Volume2 className="h-3 w-3" />
                            <span>Disponible: {move.available_volume}m³</span>
                          </div>
                          {move.price_per_m3 && (
                            <div className="text-green-600">{move.price_per_m3}€/m³</div>
                          )}
                          {move.route_type && (
                            <Badge variant="outline" className="text-xs">
                              {move.route_type === 'flexible' ? 'Trajet flexible' : 'Trajet fixe'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        match.match_type === 'perfect' ? 'bg-green-100 text-green-800' :
                        match.match_type === 'good' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {match.match_type === 'perfect' ? 'Parfait' :
                         match.match_type === 'good' ? 'Bon' : 'Partiel'}
                      </span>
                      
                      {getStatusBadge(match.status || 'pending')}
                      
                      {match.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleMatchAction(match.id, 'accepted')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Accepter
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMatchAction(match.id, 'rejected')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Rejeter
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Détails du match - logique de compatibilité corrigée */}
                  <div className="border-t pt-3 mt-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Distance:</span>
                        <span className={`ml-2 font-medium ${
                          isDistanceOk ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {match.distance_km}km
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Diff. dates:</span>
                        <span className={`ml-2 font-medium ${
                          isDateOk ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {match.date_diff_days} jours
                          {client.flexible_dates && match.date_diff_days === 0 && ' (dans la plage)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Volume combiné:</span>
                        <span className="ml-2 font-medium">{match.combined_volume}m³</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Compatible:</span>
                        <div className="ml-2">
                          <span className={`font-medium ${
                            isCompatible ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {isCompatible ? 'Oui' : 'Non'}
                          </span>
                          {!isCompatible && !isVolumeOk && (
                            <div className="text-xs text-red-600 mt-1">
                              Volume utilisé sur camion déjà rempli, vérifiez avec le prestataire.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchFinder;
