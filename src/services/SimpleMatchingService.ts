
import { supabase } from '@/integrations/supabase/client';

interface Client {
  id: number;
  name: string;
  client_reference?: string;
  departure_postal_code: string;
  arrival_postal_code: string;
  departure_city?: string;
  arrival_city?: string;
  desired_date: string;
  estimated_volume: number;
  flexible_dates?: boolean;
  flexibility_days?: number;
  status?: string;
  match_status?: string;
}

interface Move {
  id: number;
  company_name: string;
  departure_postal_code: string;
  arrival_postal_code: string;
  departure_date: string;
  max_volume: number;
  used_volume: number;
  available_volume: number;
  price_per_m3?: number;
  route_type?: string;
}

interface ClientToMoverMatch {
  client: Client;
  move: Move;
  match_type: 'direct' | 'return_trip' | 'loop' | 'multi_stop';
  distance_km: number;
  date_diff_days: number;
  volume_compatible: boolean;
  available_volume_after: number;
  is_valid: boolean;
  match_reference: string;
  efficiency_score: number;
}

// Cache pour les distances calculées
const distanceCache = new Map<string, number>();

const calculateDistance = async (postal1: string, postal2: string): Promise<number> => {
  const cacheKey = `${postal1}-${postal2}`;
  
  if (distanceCache.has(cacheKey)) {
    return distanceCache.get(cacheKey)!;
  }

  // Estimation basée sur les codes postaux (fallback simple)
  const fallbackDistance = calculateFallbackDistance(postal1, postal2);
  distanceCache.set(cacheKey, fallbackDistance);
  return fallbackDistance;
};

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

export class SimpleMatchingService {
  
  static async findClientToMoverMatches(): Promise<ClientToMoverMatch[]> {
    try {
      console.log('🔍 Démarrage matching client-déménageur...');
      const startTime = Date.now();
      
      // Charger les clients non matchés
      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .in('status', ['pending', 'quoted'])
        .neq('match_status', 'accepted')
        .not('departure_postal_code', 'is', null)
        .not('arrival_postal_code', 'is', null)
        .gte('desired_date', new Date().toISOString().split('T')[0]);

      if (clientError) throw clientError;

      // Charger les déplacements confirmés avec capacité disponible
      const { data: moves, error: moveError } = await supabase
        .from('confirmed_moves')
        .select('*')
        .gte('departure_date', new Date().toISOString().split('T')[0])
        .gt('available_volume', 0)
        .in('status', ['confirmed', 'en_cours']);

      if (moveError) throw moveError;

      if (!clients || !moves || clients.length === 0 || moves.length === 0) return [];

      console.log(`📊 Analyse: ${clients.length} clients × ${moves.length} déménageurs...`);
      
      const matches: ClientToMoverMatch[] = [];
      
      // Traitement parallélisé pour optimiser les performances
      const matchPromises: Promise<ClientToMoverMatch[]>[] = [];
      
      for (const client of clients) {
        for (const move of moves) {
          matchPromises.push(this.evaluateClientMoverPair(client, move));
        }
      }
      
      const results = await Promise.all(matchPromises);
      const allMatches = results.flat().filter(Boolean);
      
      // Trier par score d'efficacité
      allMatches.sort((a, b) => b.efficiency_score - a.efficiency_score);
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ Matching client-déménageur terminé en ${processingTime}ms: ${allMatches.length} correspondances trouvées`);
      
      return allMatches;
      
    } catch (error) {
      console.error('❌ Erreur matching client-déménageur:', error);
      return [];
    }
  }
  
  private static async evaluateClientMoverPair(client: Client, move: Move): Promise<ClientToMoverMatch[]> {
    const matches: ClientToMoverMatch[] = [];
    
    try {
      // Type 1: Trajet direct
      const directMatch = await this.checkDirectMatch(client, move);
      if (directMatch) matches.push(directMatch);
      
      // Type 2: Trajet retour
      const returnMatch = await this.checkReturnTripMatch(client, move);
      if (returnMatch) matches.push(returnMatch);
      
      // Type 3: Boucle/multi-arrêts (si le déménageur fait des arrêts multiples)
      if (move.route_type === 'multi_stop') {
        const loopMatch = await this.checkLoopMatch(client, move);
        if (loopMatch) matches.push(loopMatch);
      }
      
      return matches;
    } catch (error) {
      console.error(`❌ Erreur évaluation client ${client.id} - move ${move.id}:`, error);
      return [];
    }
  }
  
  private static async checkDirectMatch(client: Client, move: Move): Promise<ClientToMoverMatch | null> {
    // Vérifier correspondance des codes postaux de départ
    const departureDistance = await calculateDistance(
      client.departure_postal_code, 
      move.departure_postal_code
    );
    
    if (departureDistance > 50) return null; // Max 50km de détour au départ
    
    // Vérifier correspondance des destinations
    const arrivalDistance = await calculateDistance(
      client.arrival_postal_code,
      move.arrival_postal_code
    );
    
    if (arrivalDistance > 50) return null; // Max 50km de détour à l'arrivée
    
    // Vérifier compatibilité des dates
    const dateDiff = this.calculateDateDifference(client.desired_date, move.departure_date);
    const flexibilityDays = client.flexible_dates ? (client.flexibility_days || 3) : 0;
    
    if (dateDiff > flexibilityDays) return null;
    
    // Vérifier compatibilité des volumes
    const volumeCompatible = (client.estimated_volume || 0) <= move.available_volume;
    if (!volumeCompatible) return null;
    
    const totalDistance = departureDistance + arrivalDistance;
    const efficiencyScore = this.calculateEfficiencyScore(totalDistance, dateDiff, move.available_volume, client.estimated_volume || 0);
    
    return {
      client,
      move,
      match_type: 'direct',
      distance_km: totalDistance,
      date_diff_days: dateDiff,
      volume_compatible: volumeCompatible,
      available_volume_after: move.available_volume - (client.estimated_volume || 0),
      is_valid: true,
      match_reference: `C2M-DIR-${client.id}-${move.id}`,
      efficiency_score: efficiencyScore
    };
  }
  
  private static async checkReturnTripMatch(client: Client, move: Move): Promise<ClientToMoverMatch | null> {
    // Vérifier si le client veut aller là où le déménageur revient
    const departureToMoveArrival = await calculateDistance(
      client.departure_postal_code,
      move.arrival_postal_code
    );
    
    const clientArrivalToMoveStart = await calculateDistance(
      client.arrival_postal_code,
      move.departure_postal_code
    );
    
    // Pour un trajet retour, les distances doivent être raisonnables
    if (departureToMoveArrival > 100 || clientArrivalToMoveStart > 100) return null;
    
    // Vérifier compatibilité des dates (plus flexible pour les retours)
    const dateDiff = this.calculateDateDifference(client.desired_date, move.departure_date);
    if (dateDiff > 7) return null; // ±7 jours pour les retours
    
    // Vérifier compatibilité des volumes
    const volumeCompatible = (client.estimated_volume || 0) <= move.available_volume;
    if (!volumeCompatible) return null;
    
    const totalDistance = departureToMoveArrival + clientArrivalToMoveStart;
    const efficiencyScore = this.calculateEfficiencyScore(totalDistance, dateDiff, move.available_volume, client.estimated_volume || 0, 'return');
    
    return {
      client,
      move,
      match_type: 'return_trip',
      distance_km: totalDistance,
      date_diff_days: dateDiff,
      volume_compatible: volumeCompatible,
      available_volume_after: move.available_volume - (client.estimated_volume || 0),
      is_valid: true,
      match_reference: `C2M-RET-${client.id}-${move.id}`,
      efficiency_score: efficiencyScore
    };
  }
  
  private static async checkLoopMatch(client: Client, move: Move): Promise<ClientToMoverMatch | null> {
    // Pour les boucles, on vérifie si le client peut s'intégrer dans un circuit
    const departureDistance = await calculateDistance(
      client.departure_postal_code,
      move.departure_postal_code
    );
    
    const arrivalDistance = await calculateDistance(
      client.arrival_postal_code,
      move.arrival_postal_code
    );
    
    // Distance acceptable pour intégration dans une boucle
    if (departureDistance > 75 && arrivalDistance > 75) return null;
    
    // Vérifier compatibilité des dates
    const dateDiff = this.calculateDateDifference(client.desired_date, move.departure_date);
    if (dateDiff > 5) return null; // ±5 jours pour les boucles
    
    // Vérifier compatibilité des volumes
    const volumeCompatible = (client.estimated_volume || 0) <= move.available_volume;
    if (!volumeCompatible) return null;
    
    const totalDistance = Math.min(departureDistance, arrivalDistance);
    const efficiencyScore = this.calculateEfficiencyScore(totalDistance, dateDiff, move.available_volume, client.estimated_volume || 0, 'loop');
    
    return {
      client,
      move,
      match_type: 'loop',
      distance_km: totalDistance,
      date_diff_days: dateDiff,
      volume_compatible: volumeCompatible,
      available_volume_after: move.available_volume - (client.estimated_volume || 0),
      is_valid: true,
      match_reference: `C2M-LOOP-${client.id}-${move.id}`,
      efficiency_score: efficiencyScore
    };
  }
  
  private static calculateDateDifference(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.abs(Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24)));
  }
  
  private static calculateEfficiencyScore(distance: number, dateDiff: number, availableVolume: number, clientVolume: number, type: string = 'direct'): number {
    let score = 100;
    
    // Pénalités
    score -= distance * 0.5; // -0.5 point par km
    score -= dateDiff * 2; // -2 points par jour d'écart
    
    // Bonus pour l'utilisation du volume
    const volumeUtilization = clientVolume / availableVolume;
    score += volumeUtilization * 20; // Bonus utilisation volume
    
    // Bonus selon le type de trajet
    switch (type) {
      case 'direct': score += 10; break;
      case 'return': score += 15; break; // Bonus pour optimisation retour
      case 'loop': score += 20; break; // Bonus pour optimisation boucle
    }
    
    return Math.max(0, Math.round(score));
  }
}
