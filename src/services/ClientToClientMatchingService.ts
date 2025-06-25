
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
  departure_address?: string;
  arrival_address?: string;
  budget_min?: number;
  budget_max?: number;
  special_requirements?: string;
}

interface ClientToClientMatch {
  primary_client: Client;
  secondary_client: Client;
  match_type: 'same_departure' | 'return_trip';
  distance_km: number;
  date_diff_days: number;
  volume_compatible: boolean;
  combined_volume: number;
  match_score: number;
  is_valid: boolean;
  match_reference: string;
  savings_estimate: {
    cost_reduction_percent: number;
    shared_transport_cost: number;
  };
}

// Cache pour les distances calculées
const distanceCache = new Map<string, number>();

const calculateDistance = async (postal1: string, postal2: string): Promise<number> => {
  const cacheKey = `${postal1}-${postal2}`;
  
  if (distanceCache.has(cacheKey)) {
    return distanceCache.get(cacheKey)!;
  }

  const apiKey = 'AIzaSyDgAn_xJ5IsZBJjlwLkMYhWP7DQXvoxK4Y';
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${postal1},France&destinations=${postal2},France&units=metric&key=${apiKey}&mode=driving`,
      { 
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      }
    );
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
        const distanceInKm = Math.round(data.rows[0].elements[0].distance.value / 1000);
        distanceCache.set(cacheKey, distanceInKm);
        distanceCache.set(`${postal2}-${postal1}`, distanceInKm);
        return distanceInKm;
      }
    }
    
    throw new Error('API error');
  } catch (error) {
    // Fallback: estimation basée sur les codes postaux
    const fallbackDistance = calculateFallbackDistance(postal1, postal2);
    distanceCache.set(cacheKey, fallbackDistance);
    return fallbackDistance;
  }
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

export class ClientToClientMatchingService {
  
  static async findClientToClientMatches(): Promise<ClientToClientMatch[]> {
    try {
      console.log('🔍 Démarrage matching client-à-client...');
      const startTime = Date.now();
      
      // Charger les clients non matchés et en attente
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .in('status', ['pending', 'quoted'])
        .neq('match_status', 'accepted')
        .not('departure_postal_code', 'is', null)
        .not('arrival_postal_code', 'is', null)
        .gte('desired_date', new Date().toISOString().split('T')[0]); // Seulement les dates futures

      if (error) throw error;
      if (!clients || clients.length < 2) return [];

      console.log(`📊 Analyse de ${clients.length} clients pour matching...`);
      
      const matches: ClientToClientMatch[] = [];
      
      // Traitement parallélisé pour optimiser les performances
      const matchPromises: Promise<ClientToClientMatch | null>[] = [];
      
      for (let i = 0; i < clients.length; i++) {
        for (let j = i + 1; j < clients.length; j++) {
          const client1 = clients[i];
          const client2 = clients[j];
          
          // Éviter de comparer un client avec lui-même
          if (client1.id === client2.id) continue;
          
          matchPromises.push(this.evaluateClientPair(client1, client2));
        }
      }
      
      const results = await Promise.all(matchPromises);
      const validMatches = results.filter(Boolean) as ClientToClientMatch[];
      
      // Trier par score de compatibilité
      validMatches.sort((a, b) => a.match_score - b.match_score);
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ Matching client-à-client terminé en ${processingTime}ms: ${validMatches.length} correspondances trouvées`);
      
      return validMatches;
      
    } catch (error) {
      console.error('❌ Erreur matching client-à-client:', error);
      return [];
    }
  }
  
  private static async evaluateClientPair(client1: Client, client2: Client): Promise<ClientToClientMatch | null> {
    try {
      // Type 1: Même point de départ (déménagement groupé)
      const sameDepartureMatch = await this.checkSameDepartureMatch(client1, client2);
      if (sameDepartureMatch) return sameDepartureMatch;
      
      // Type 2: Retour sur le même trajet
      const returnTripMatch = await this.checkReturnTripMatch(client1, client2);
      if (returnTripMatch) return returnTripMatch;
      
      return null;
    } catch (error) {
      console.error(`❌ Erreur évaluation clients ${client1.id}-${client2.id}:`, error);
      return null;
    }
  }
  
  private static async checkSameDepartureMatch(client1: Client, client2: Client): Promise<ClientToClientMatch | null> {
    // Vérifier si même zone de départ (rayon 100km)
    const departureDistance = await calculateDistance(
      client1.departure_postal_code, 
      client2.departure_postal_code
    );
    
    if (departureDistance > 100) return null;
    
    // Vérifier si les destinations sont dans des directions compatibles
    const arrivalDistance = await calculateDistance(
      client1.arrival_postal_code,
      client2.arrival_postal_code
    );
    
    // Calculer la distance totale du trajet groupé
    const totalTripDistance = await this.calculateGroupedTripDistance(client1, client2);
    
    // Le trajet groupé ne doit pas dépasser 100km de détour par rapport au trajet direct
    const client1DirectDistance = await calculateDistance(
      client1.departure_postal_code,
      client1.arrival_postal_code
    );
    const client2DirectDistance = await calculateDistance(
      client2.departure_postal_code,
      client2.arrival_postal_code
    );
    
    const totalDirectDistance = client1DirectDistance + client2DirectDistance;
    const detourDistance = totalTripDistance - Math.max(client1DirectDistance, client2DirectDistance);
    
    if (detourDistance > 100) return null;
    
    // Vérifier compatibilité des dates
    const dateDiff = this.calculateDateDifference(client1.desired_date, client2.desired_date);
    if (dateDiff > 15) return null; // ±15 jours max
    
    // Vérifier compatibilité des volumes (estimation camion standard 40m³)
    const combinedVolume = (client1.estimated_volume || 0) + (client2.estimated_volume || 0);
    const volumeCompatible = combinedVolume <= 40;
    
    const matchScore = departureDistance + arrivalDistance + (dateDiff * 5) + (volumeCompatible ? 0 : 1000);
    const isValid = departureDistance <= 100 && dateDiff <= 15 && volumeCompatible && detourDistance <= 100;
    
    return {
      primary_client: client1,
      secondary_client: client2,
      match_type: 'same_departure',
      distance_km: Math.round(departureDistance),
      date_diff_days: dateDiff,
      volume_compatible: volumeCompatible,
      combined_volume: combinedVolume,
      match_score: matchScore,
      is_valid: isValid,
      match_reference: `C2C-DEP-${client1.id}-${client2.id}`,
      savings_estimate: {
        cost_reduction_percent: Math.round(30 + (detourDistance > 50 ? -10 : 10)),
        shared_transport_cost: Math.round(totalDirectDistance * 1.2) // Estimation 1.2€/km
      }
    };
  }
  
  private static async checkReturnTripMatch(client1: Client, client2: Client): Promise<ClientToClientMatch | null> {
    // Vérifier si l'arrivée de client1 est proche du départ de client2 (trajet retour)
    const returnDistance1 = await calculateDistance(
      client1.arrival_postal_code,
      client2.departure_postal_code
    );
    
    // Vérifier si l'arrivée de client2 est proche du départ de client1 (trajet retour inverse)
    const returnDistance2 = await calculateDistance(
      client2.arrival_postal_code,
      client1.departure_postal_code
    );
    
    // Prendre le meilleur scénario de retour
    const bestReturnDistance = Math.min(returnDistance1, returnDistance2);
    if (bestReturnDistance > 100) return null;
    
    // Vérifier que les destinations finales sont compatibles
    const finalDestinationDistance = bestReturnDistance === returnDistance1 
      ? await calculateDistance(client2.arrival_postal_code, client1.departure_postal_code)
      : await calculateDistance(client1.arrival_postal_code, client2.departure_postal_code);
    
    if (finalDestinationDistance > 100) return null;
    
    // Vérifier compatibilité des dates (plus flexible pour les retours)
    const dateDiff = this.calculateDateDifference(client1.desired_date, client2.desired_date);
    if (dateDiff > 15) return null;
    
    // Pour les retours, les volumes peuvent être séparés
    const volumeCompatible = (client1.estimated_volume || 0) <= 40 && (client2.estimated_volume || 0) <= 40;
    
    const matchScore = bestReturnDistance + finalDestinationDistance + (dateDiff * 3);
    const isValid = bestReturnDistance <= 100 && finalDestinationDistance <= 100 && dateDiff <= 15 && volumeCompatible;
    
    return {
      primary_client: client1,
      secondary_client: client2,
      match_type: 'return_trip',
      distance_km: Math.round(bestReturnDistance),
      date_diff_days: dateDiff,
      volume_compatible: volumeCompatible,
      combined_volume: 0, // Voyages séparés
      match_score: matchScore,
      is_valid: isValid,
      match_reference: `C2C-RET-${client1.id}-${client2.id}`,
      savings_estimate: {
        cost_reduction_percent: Math.round(40 + (bestReturnDistance < 50 ? 15 : 0)),
        shared_transport_cost: Math.round((bestReturnDistance + finalDestinationDistance) * 1.2)
      }
    };
  }
  
  private static async calculateGroupedTripDistance(client1: Client, client2: Client): Promise<number> {
    // Calculer le trajet optimal: départ1 -> départ2 -> arrivée1 -> arrivée2 (ou variante optimale)
    const distances = await Promise.all([
      calculateDistance(client1.departure_postal_code, client2.departure_postal_code),
      calculateDistance(client2.departure_postal_code, client1.arrival_postal_code),
      calculateDistance(client1.arrival_postal_code, client2.arrival_postal_code)
    ]);
    
    return distances.reduce((sum, distance) => sum + distance, 0);
  }
  
  private static calculateDateDifference(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.abs(Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24)));
  }
}
