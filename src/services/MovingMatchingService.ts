import { supabase } from '@/integrations/supabase/client';
import { calculateDistanceByPostalCode } from '@/lib/google-maps-config';

export interface MatchResult {
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
    client_reference?: string;
  };
  move: {
    id: number;
    company_name: string;
    departure_postal_code: string;
    arrival_postal_code: string;
    departure_city?: string;
    arrival_city?: string;
    departure_date: string;
    available_volume: number;
    used_volume: number;
    max_volume: number;
  };
  distance_km: number;
  date_diff_days: number;
  volume_compatible: number;
  available_volume_after: number;
  is_valid: boolean;
  explanation: string;
  match_score: number;
  scenario: number;
  match_type: 'grouped_outbound' | 'return_trip' | 'simple_match';
}

export interface MovingClient {
  id: number;
  name: string;
  departure_postal_code: string;
  arrival_postal_code: string;
  departure_city?: string;
  arrival_city?: string;
  desired_date: string;
  estimated_volume?: number;
  client_reference?: string;
}

export class MovingMatchingService {
  
  /**
   * Trouver tous les matchs possibles
   */
  public static async findAllMatches(): Promise<MatchResult[]> {
    console.log('🎯 MATCHING PROFESSIONNEL - Recherche de tous les matchs');
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Récupérer tous les clients avec trajets définis (dates futures uniquement)
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .not('departure_postal_code', 'is', null)
        .not('arrival_postal_code', 'is', null)
        .not('desired_date', 'is', null)
        .gte('desired_date', today.toISOString().split('T')[0]); // Filtrer les dates futures

      if (clientsError || !clients) {
        console.error('❌ Erreur récupération clients:', clientsError);
        return [];
      }

      // Récupérer tous les trajets confirmés (dates futures uniquement)
      const { data: moves, error: movesError } = await supabase
        .from('confirmed_moves')
        .select('*')
        .eq('status', 'confirmed')
        .gt('available_volume', 0)
        .gte('departure_date', today.toISOString().split('T')[0]); // Filtrer les dates futures

      if (movesError || !moves) {
        console.error('❌ Erreur récupération trajets:', movesError);
        return [];
      }

      console.log(`👥 ${clients.length} clients actifs (dates futures)`);
      console.log(`🚛 ${moves.length} trajets disponibles (dates futures)`);

      const matches: MatchResult[] = [];

      // Analyser chaque client contre chaque trajet
      for (const client of clients) {
        for (const move of moves) {
          console.log(`🔍 Analyse: ${client.name} x ${move.company_name}`);

          // SCÉNARIO 1: Trajet aller groupé (même direction)
          const scenario1Match = await this.analyzeScenario1(client, move);
          if (scenario1Match) {
            matches.push(scenario1Match);
          }

          // SCÉNARIO 2: Trajet retour occupé (retour optimisé)
          const scenario2Match = await this.analyzeScenario2(client, move);
          if (scenario2Match) {
            matches.push(scenario2Match);
          }
        }
      }

      console.log(`🎉 ${matches.length} matchs professionnels trouvés (dates futures uniquement)`);
      return matches.sort((a, b) => a.match_score - b.match_score);

    } catch (error) {
      console.error('❌ Erreur matching professionnel:', error);
      return [];
    }
  }

  /**
   * Scénario 1: Aller groupé (même direction, ±100km)
   */
  private static async analyzeScenario1(client: any, move: any): Promise<MatchResult | null> {
    try {
      // 1. Distance entre les points de départ et d'arrivée
      const departureDistance = await this.calculateDistance(
        client.departure_postal_code,
        move.departure_postal_code
      );

      const arrivalDistance = await this.calculateDistance(
        client.arrival_postal_code,
        move.arrival_postal_code
      );

      // 2. Écart de date
      const dateDiff = this.calculateDateDiff(client.desired_date, move.departure_date);

      console.log(`[S1] Distances: Départ ${departureDistance}km, Arrivée ${arrivalDistance}km, Date ±${dateDiff}j`);

      // 3. Validation du match
      if (departureDistance <= 100 && arrivalDistance <= 100 && dateDiff <= 15) {
        const volumeCompatible = Math.min(
          client.estimated_volume || 5,
          move.available_volume
        );

        const availableVolumeAfter = move.available_volume - volumeCompatible;

        const maxDistance = Math.max(departureDistance, arrivalDistance);
        const matchScore = 100 - (maxDistance + (dateDiff * 5)); // Score basé sur distance et date

        const explanation = `Trajet groupé possible: ${departureDistance}km (départ) et ${arrivalDistance}km (arrivée).`;

        return {
          match_reference: this.generateMatchReference(),
          client: client,
          move: move,
          distance_km: Math.round(maxDistance),
          date_diff_days: Math.round(dateDiff),
          volume_compatible: volumeCompatible,
          available_volume_after: availableVolumeAfter,
          is_valid: true,
          explanation: explanation,
          match_score: matchScore,
          scenario: 1,
          match_type: 'grouped_outbound'
        };
      }

      return null;

    } catch (error) {
      console.error('❌ Erreur analyse scénario 1:', error);
      return null;
    }
  }

  /**
   * Scénario 2: Retour occupé (optimisation du retour)
   */
  private static async analyzeScenario2(client: any, move: any): Promise<MatchResult | null> {
    try {
      // 1. Distances inversées
      const departureDistance = await this.calculateDistance(
        client.departure_postal_code,
        move.arrival_postal_code
      );

      const arrivalDistance = await this.calculateDistance(
        client.arrival_postal_code,
        move.departure_postal_code
      );

      // 2. Écart de date
      const dateDiff = this.calculateDateDiff(client.desired_date, move.departure_date);

      console.log(`[S2] Distances: Départ ${departureDistance}km, Arrivée ${arrivalDistance}km, Date ±${dateDiff}j`);

      // 3. Validation du match
      if (departureDistance <= 100 && arrivalDistance <= 100 && dateDiff <= 15) {
        const volumeCompatible = Math.min(
          client.estimated_volume || 5,
          move.available_volume
        );

        const availableVolumeAfter = move.available_volume - volumeCompatible;

        const maxDistance = Math.max(departureDistance, arrivalDistance);
        const matchScore = 90 - (maxDistance + (dateDiff * 5)); // Score ajusté

        const explanation = `Retour optimisé: ${departureDistance}km (départ) et ${arrivalDistance}km (arrivée).`;

        return {
          match_reference: this.generateMatchReference(),
          client: client,
          move: move,
          distance_km: Math.round(maxDistance),
          date_diff_days: Math.round(dateDiff),
          volume_compatible: volumeCompatible,
          available_volume_after: availableVolumeAfter,
          is_valid: true,
          explanation: explanation,
          match_score: matchScore,
          scenario: 2,
          match_type: 'return_trip'
        };
      }

      return null;

    } catch (error) {
      console.error('❌ Erreur analyse scénario 2:', error);
      return null;
    }
  }

  /**
   * Recherche de matchs pour un client spécifique
   */
  public static async findMatchesForClient(movingClient: MovingClient): Promise<MatchResult[]> {
    console.log(`🔍 Recherche de matchs pour client: ${movingClient.name}`);

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Récupérer tous les trajets confirmés (dates futures uniquement)
      const { data: moves, error: movesError } = await supabase
        .from('confirmed_moves')
        .select('*')
        .eq('status', 'confirmed')
        .gt('available_volume', 0)
        .gte('departure_date', today.toISOString().split('T')[0]); // Filtrer les dates futures

      if (movesError || !moves) {
        console.error('❌ Erreur récupération trajets:', movesError);
        return [];
      }

      console.log(`🚛 ${moves.length} trajets disponibles (dates futures)`);

      const matches: MatchResult[] = [];

      // Analyser le client contre chaque trajet
      for (const move of moves) {
        console.log(`🔍 Analyse: ${movingClient.name} x ${move.company_name}`);

        // SCÉNARIO 1: Trajet aller groupé (même direction)
        const scenario1Match = await this.analyzeScenario1(movingClient, move);
        if (scenario1Match) {
          matches.push(scenario1Match);
        }

        // SCÉNARIO 2: Trajet retour occupé (retour optimisé)
        const scenario2Match = await this.analyzeScenario2(movingClient, move);
        if (scenario2Match) {
          matches.push(scenario2Match);
        }
      }

      console.log(`🎉 ${matches.length} matchs trouvés pour ${movingClient.name}`);
      return matches.sort((a, b) => a.match_score - b.match_score);

    } catch (error) {
      console.error('❌ Erreur recherche matchs pour client:', error);
      return [];
    }
  }

  /**
   * Calcul de distance avec fallback
   */
  private static async calculateDistance(postal1: string, postal2: string): Promise<number> {
    if (postal1 === postal2) return 0;

    try {
      const result = await calculateDistanceByPostalCode(postal1, postal2);
      if (result && result.distance) {
        return result.distance;
      }
    } catch (error) {
      console.log(`⚠️ Fallback distance pour ${postal1} → ${postal2}`);
    }

    // Fallback basé sur départements
    const dept1 = postal1.substring(0, 2);
    const dept2 = postal2.substring(0, 2);
    
    if (dept1 === dept2) return 25;
    
    const deptDiff = Math.abs(parseInt(dept1) - parseInt(dept2));
    if (deptDiff === 1) return 50;
    if (deptDiff === 2) return 80;
    return 120;
  }

  /**
   * Calcul différence de dates
   */
  private static calculateDateDiff(date1: string | undefined, date2: string): number {
    if (!date1 || !date2) return 999; // Écart important si date manquante
    
    try {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      const diffTime = Math.abs(d1.getTime() - d2.getTime());
      return Math.ceil(diffTime / (1000 * 3600 * 24));
    } catch {
      return 999; // Écart important en cas d'erreur
    }
  }

  /**
   * Générer une référence unique pour le match
   */
  private static generateMatchReference(): string {
    const timestamp = Date.now().toString(36); // Convertir timestamp en base36
    const randomId = Math.random().toString(36).substring(2, 8); // ID aléatoire court
    return `MATCH-${timestamp}-${randomId}`.toUpperCase();
  }
}
