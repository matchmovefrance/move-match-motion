
import { supabase } from '@/integrations/supabase/client';
import { loadGoogleMapsScript } from '@/lib/google-maps-config';

export interface AdvancedMatchResult {
  match_reference: string;
  client: {
    id: number;
    name: string;
    departure_postal_code: string;
    arrival_postal_code: string;
    departure_city?: string;
    arrival_city?: string;
    desired_date?: string;
    estimated_volume?: number;
  };
  move?: {
    id: number;
    company_name: string;
    departure_postal_code: string;
    arrival_postal_code: string;
    departure_city?: string;
    arrival_city?: string;
    departure_date: string;
    available_volume: number;
  };
  distance_km: number;
  date_diff_days: number;
  volume_compatible: number;
  is_valid: boolean;
  explanation: string;
  match_score: number;
  optimization_score: number;
  savings_percentage: number;
  match_type: 'optimized_grouped' | 'optimized_return' | 'optimized_loop';
}

export interface MatchScenario {
  type: 'grouped_outbound' | 'return_trip' | 'loop_optimization';
  clients: Array<{
    id: number;
    name: string;
    departure_postal_code: string;
    arrival_postal_code: string;
    departure_city?: string;
    arrival_city?: string;
    desired_date?: string;
    estimated_volume?: number;
  }>;
  move: {
    id: number;
    company_name: string;
    departure_postal_code: string;
    arrival_postal_code: string;
    departure_city?: string;
    arrival_city?: string;
    departure_date: string;
    max_volume: number;
    used_volume: number;
  };
  total_detour_km: number;
  total_volume_used: number;
  savings_km: number;
  savings_percentage: number;
  route_waypoints: Array<{
    location: string;
    type: 'pickup' | 'delivery' | 'truck_start' | 'truck_end';
    client_id?: number;
  }>;
  is_feasible: boolean;
  match_score: number;
}

export class AdvancedMatchingEngine {
  private static directionsService: google.maps.DirectionsService | null = null;
  private static distanceMatrixService: google.maps.DistanceMatrixService | null = null;

  static async initialize(): Promise<void> {
    await loadGoogleMapsScript();
    if (window.google?.maps) {
      this.directionsService = new google.maps.DirectionsService();
      this.distanceMatrixService = new google.maps.DistanceMatrixService();
    }
  }

  /**
   * Recherche de matchs optimisés simplifiée
   */
  public static async findOptimizedMatches(): Promise<AdvancedMatchResult[]> {
    console.log('🔥 MATCHING OPTIMISÉ - Recherche avancée');
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Récupérer les données avec filtre de dates futures
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .not('departure_postal_code', 'is', null)
        .not('arrival_postal_code', 'is', null)
        .not('desired_date', 'is', null)
        .gte('desired_date', today.toISOString().split('T')[0]);

      const { data: moves, error: movesError } = await supabase
        .from('confirmed_moves')
        .select('*')
        .eq('status', 'confirmed')
        .gt('available_volume', 0)
        .gte('departure_date', today.toISOString().split('T')[0]);

      if (clientsError || movesError || !clients || !moves) {
        console.error('❌ Erreur récupération données:', { clientsError, movesError });
        return [];
      }

      console.log(`📊 Données optimisées: ${clients.length} clients, ${moves.length} trajets (dates futures)`);

      const matches: AdvancedMatchResult[] = [];

      // Algorithme d'optimisation multi-critères
      for (const client of clients) {
        for (const move of moves) {
          const optimizedMatch = await this.analyzeOptimizedMatch(client, move);
          if (optimizedMatch && optimizedMatch.is_valid) {
            matches.push(optimizedMatch);
          }
        }
      }

      // Tri par score d'optimisation
      matches.sort((a, b) => b.optimization_score - a.optimization_score);

      console.log(`🎯 ${matches.length} matchs optimisés trouvés (dates futures uniquement)`);
      return matches;

    } catch (error) {
      console.error('❌ Erreur matching optimisé:', error);
      return [];
    }
  }

  private static async analyzeOptimizedMatch(client: any, move: any): Promise<AdvancedMatchResult | null> {
    try {
      // Calculer les distances avec méthode fallback
      const departureDistance = await this.calculateDistance(
        client.departure_postal_code,
        move.departure_postal_code
      );

      const arrivalDistance = await this.calculateDistance(
        client.arrival_postal_code,
        move.arrival_postal_code
      );

      // Calculer l'écart de dates
      const dateDiff = await this.calculateDateDiff(client.desired_date, move.departure_date);

      // Vérifier la compatibilité
      if (departureDistance <= 150 && arrivalDistance <= 150 && dateDiff <= 20) {
        const volumeCompatible = Math.min(
          client.estimated_volume || 5,
          move.available_volume || 0
        );

        const maxDistance = Math.max(departureDistance, arrivalDistance);
        const optimizationScore = 100 - (maxDistance * 0.5) - (dateDiff * 2);
        const matchScore = optimizationScore + (volumeCompatible * 5);
        const savingsPercentage = Math.round(Math.max(0, (200 - maxDistance) / 200 * 100));

        const explanation = `Match optimisé: ${departureDistance}km (départ), ${arrivalDistance}km (arrivée), ±${dateDiff}j. Score: ${Math.round(optimizationScore)}`;

        return {
          match_reference: this.generateMatchReference(client, move),
          client: {
            id: client.id,
            name: client.name,
            departure_postal_code: client.departure_postal_code,
            arrival_postal_code: client.arrival_postal_code,
            departure_city: client.departure_city,
            arrival_city: client.arrival_city,
            desired_date: client.desired_date,
            estimated_volume: client.estimated_volume
          },
          move: {
            id: move.id,
            company_name: move.company_name,
            departure_postal_code: move.departure_postal_code,
            arrival_postal_code: move.arrival_postal_code,
            departure_city: move.departure_city,
            arrival_city: move.arrival_city,
            departure_date: move.departure_date,
            available_volume: move.available_volume
          },
          distance_km: Math.round(maxDistance),
          date_diff_days: Math.round(dateDiff),
          volume_compatible: volumeCompatible,
          is_valid: true,
          explanation: explanation,
          match_score: Math.round(matchScore),
          optimization_score: Math.round(optimizationScore),
          savings_percentage: savingsPercentage,
          match_type: departureDistance < arrivalDistance ? 'optimized_grouped' : 'optimized_return'
        };
      }

      return null;

    } catch (error) {
      console.error('❌ Erreur analyse match optimisé:', error);
      return null;
    }
  }

  private static async calculateDistance(from: string, to: string): Promise<number> {
    if (from === to) return 0;

    // Fallback basé sur départements
    const dept1 = from.substring(0, 2);
    const dept2 = to.substring(0, 2);
    
    if (dept1 === dept2) return 25;
    
    const deptDiff = Math.abs(parseInt(dept1) - parseInt(dept2));
    if (deptDiff === 1) return 50;
    if (deptDiff === 2) return 80;
    return 120;
  }

  private static async calculateDateDiff(date1: string, date2: string): Promise<number> {
    if (!date1 || !date2) return 999;
    
    try {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      return Math.abs((d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));
    } catch {
      return 999;
    }
  }

  private static generateMatchReference(client: any, move: any): string {
    const timestamp = Date.now().toString(36);
    const randomId = Math.random().toString(36).substring(2, 8);
    return `OPT-${timestamp}-${randomId}`.toUpperCase();
  }

  // Méthodes pour la compatibilité avec l'ancien code
  static async findGroupedOutboundMatches(): Promise<MatchScenario[]> {
    console.log('🚚 SCÉNARIO 1: Recherche aller groupé (simplifié)');
    return [];
  }

  static async findReturnTripMatches(): Promise<MatchScenario[]> {
    console.log('🔄 SCÉNARIO 2: Recherche retour occupé (simplifié)');
    return [];
  }

  static async findLoopOptimization(): Promise<MatchScenario[]> {
    console.log('🔄 SCÉNARIO 3: Recherche boucles optimisées (simplifié)');
    return [];
  }

  static async optimizeAllRoutes(): Promise<{
    scenarios: MatchScenario[];
    summary: {
      total_scenarios: number;
      total_km_saved: number;
      total_clients_matched: number;
      best_scenario: MatchScenario | null;
    };
  }> {
    console.log('🎯 OPTIMISATION GLOBALE - Version simplifiée');
    
    return {
      scenarios: [],
      summary: {
        total_scenarios: 0,
        total_km_saved: 0,
        total_clients_matched: 0,
        best_scenario: null
      }
    };
  }
}
