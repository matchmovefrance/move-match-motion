
import { supabase } from '@/integrations/supabase/client';
import { calculateDistanceByPostalCode } from '@/lib/google-maps-config';

export interface MovingClient {
  id: number;
  name: string;
  departure_postal_code?: string;
  arrival_postal_code?: string;
  departure_city?: string;
  arrival_city?: string;
  desired_date?: string;
  estimated_volume?: number;
  client_reference?: string;
}

export interface MovingRoute {
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
}

export interface MatchResult {
  client: MovingClient;
  move: MovingRoute;
  match_type: 'grouped_outbound' | 'return_trip' | 'loop_trip' | 'simple_match';
  distance_km: number;
  date_diff_days: number;
  volume_compatible: boolean;
  available_volume_after: number;
  match_score: number;
  is_valid: boolean;
  match_reference: string;
  explanation: string;
  scenario: 1 | 2 | 3;
}

export class MovingMatchingService {
  private static readonly MAX_DISTANCE_KM = 100;
  private static readonly MAX_DATE_DIFF_DAYS = 15;

  /**
   * Trouve tous les matchs possibles pour un client donné avec la logique professionnelle
   */
  public static async findMatchesForClient(client: MovingClient): Promise<MatchResult[]> {
    console.log(`🎯 Recherche matchs professionnels pour client ${client.name}`);
    
    if (!this.validateClientData(client)) {
      console.log('❌ Données client invalides');
      return [];
    }
    
    const matches: MatchResult[] = [];
    
    try {
      // Scénario 1: Trajet Aller Groupé (A → B)
      const scenario1Matches = await this.findGroupedOutboundMatches(client);
      matches.push(...scenario1Matches);

      // Scénario 2: Trajet Retour Occupé (B → A)
      const scenario2Matches = await this.findReturnTripMatches(client);
      matches.push(...scenario2Matches);

      // Scénario 3: Boucle A → B → C → A
      const scenario3Matches = await this.findLoopTripMatches(client);
      matches.push(...scenario3Matches);

    } catch (error) {
      console.error('❌ Erreur recherche matchs:', error);
    }

    // Trier par score (meilleur = plus faible)
    matches.sort((a, b) => a.match_score - b.match_score);
    
    console.log(`✅ ${matches.length} matchs trouvés (${matches.filter(m => m.is_valid).length} valides)`);
    return matches;
  }

  /**
   * Scénario 1: Trajet Aller Groupé (A → B)
   * 2 clients partent du même point A (rayon 100km) vers destinations proches (rayon 100km)
   */
  private static async findGroupedOutboundMatches(client: MovingClient): Promise<MatchResult[]> {
    console.log('🚛 Scénario 1: Recherche trajets groupés aller');
    
    const { data: moves, error } = await supabase
      .from('confirmed_moves')
      .select('*')
      .eq('status', 'confirmed')
      .gte('available_volume', client.estimated_volume || 1);

    if (error || !moves) {
      console.error('❌ Erreur récupération trajets:', error);
      return [];
    }

    const matches: MatchResult[] = [];

    for (const move of moves) {
      // Vérifier si les points de départ sont proches (≤100km)
      const departureDistance = await this.calculateDistance(
        client.departure_postal_code!,
        move.departure_postal_code,
        client.departure_city,
        move.departure_city
      );

      // Vérifier si les points d'arrivée sont proches (≤100km)
      const arrivalDistance = await this.calculateDistance(
        client.arrival_postal_code!,
        move.arrival_postal_code,
        client.arrival_city,
        move.arrival_city
      );

      // Vérifier la compatibilité des dates (≤15 jours)
      const dateDiff = this.calculateDateDifference(client.desired_date!, move.departure_date);

      const isValidDistance = departureDistance <= this.MAX_DISTANCE_KM && arrivalDistance <= this.MAX_DISTANCE_KM;
      const isValidDate = dateDiff <= this.MAX_DATE_DIFF_DAYS;
      const volumeCompatible = (client.estimated_volume || 0) <= move.available_volume;

      if (isValidDistance && isValidDate && volumeCompatible) {
        matches.push({
          client,
          move,
          match_type: 'grouped_outbound',
          distance_km: Math.max(departureDistance, arrivalDistance),
          date_diff_days: dateDiff,
          volume_compatible: volumeCompatible,
          available_volume_after: move.available_volume - (client.estimated_volume || 0),
          match_score: departureDistance + arrivalDistance + (dateDiff * 2),
          is_valid: true,
          match_reference: `GROUP-${client.id}-${move.id}`,
          explanation: `Trajet groupé: Départ à ${Math.round(departureDistance)}km, Arrivée à ${Math.round(arrivalDistance)}km`,
          scenario: 1
        });
      }
    }

    console.log(`📦 Scénario 1: ${matches.length} matchs groupés trouvés`);
    return matches;
  }

  /**
   * Scénario 2: Trajet Retour Occupé (B → A)
   * Le camion revient à vide, on trouve un client pour le retour
   */
  private static async findReturnTripMatches(client: MovingClient): Promise<MatchResult[]> {
    console.log('🔄 Scénario 2: Recherche trajets retour');
    
    const { data: moves, error } = await supabase
      .from('confirmed_moves')
      .select('*')
      .eq('status', 'confirmed')
      .gte('available_volume', client.estimated_volume || 1);

    if (error || !moves) return [];

    const matches: MatchResult[] = [];

    for (const move of moves) {
      // Pour le retour: le client part de B (arrivée du camion) vers A (départ du camion)
      const departureDistance = await this.calculateDistance(
        client.departure_postal_code!,
        move.arrival_postal_code, // Client part de l'arrivée du camion
        client.departure_city,
        move.arrival_city
      );

      const arrivalDistance = await this.calculateDistance(
        client.arrival_postal_code!,
        move.departure_postal_code, // Client arrive au départ du camion
        client.arrival_city,
        move.departure_city
      );

      const dateDiff = this.calculateDateDifference(client.desired_date!, move.departure_date);

      const isValidDistance = departureDistance <= this.MAX_DISTANCE_KM && arrivalDistance <= this.MAX_DISTANCE_KM;
      const isValidDate = dateDiff <= this.MAX_DATE_DIFF_DAYS;
      const volumeCompatible = (client.estimated_volume || 0) <= move.available_volume;

      if (isValidDistance && isValidDate && volumeCompatible) {
        matches.push({
          client,
          move,
          match_type: 'return_trip',
          distance_km: Math.max(departureDistance, arrivalDistance),
          date_diff_days: dateDiff,
          volume_compatible: volumeCompatible,
          available_volume_after: move.available_volume - (client.estimated_volume || 0),
          match_score: departureDistance + arrivalDistance + (dateDiff * 2) + 10, // Légère pénalité pour retour
          is_valid: true,
          match_reference: `RETURN-${client.id}-${move.id}`,
          explanation: `Trajet retour: Évite retour à vide du camion`,
          scenario: 2
        });
      }
    }

    console.log(`🔄 Scénario 2: ${matches.length} matchs retour trouvés`);
    return matches;
  }

  /**
   * Scénario 3: Boucle A → B → C → A
   * Combinaison de plusieurs clients pour faire une boucle complète
   */
  private static async findLoopTripMatches(client: MovingClient): Promise<MatchResult[]> {
    console.log('🔁 Scénario 3: Recherche boucles complètes');
    
    // Pour ce scénario, on cherche des combinaisons plus complexes
    // Ici on simplifie en cherchant des trajets qui peuvent s'enchaîner
    const { data: moves, error } = await supabase
      .from('confirmed_moves')
      .select('*')
      .eq('status', 'confirmed');

    if (error || !moves) return [];

    const matches: MatchResult[] = [];

    // Logique simplifiée pour la boucle: trouver un trajet où le client peut s'insérer
    for (const move of moves) {
      const canInsertInLoop = await this.canClientFitInLoop(client, move);
      
      if (canInsertInLoop.possible) {
        matches.push({
          client,
          move,
          match_type: 'loop_trip',
          distance_km: canInsertInLoop.totalDistance,
          date_diff_days: canInsertInLoop.dateDiff,
          volume_compatible: canInsertInLoop.volumeOk,
          available_volume_after: move.available_volume - (client.estimated_volume || 0),
          match_score: canInsertInLoop.totalDistance + (canInsertInLoop.dateDiff * 3) + 20, // Pénalité pour complexité
          is_valid: canInsertInLoop.possible,
          match_reference: `LOOP-${client.id}-${move.id}`,
          explanation: `Boucle optimisée: Client intégré dans circuit existant`,
          scenario: 3
        });
      }
    }

    console.log(`🔁 Scénario 3: ${matches.length} matchs en boucle trouvés`);
    return matches;
  }

  /**
   * Vérifie si un client peut s'insérer dans une boucle
   */
  private static async canClientFitInLoop(client: MovingClient, move: MovingRoute): Promise<{
    possible: boolean;
    totalDistance: number;
    dateDiff: number;
    volumeOk: boolean;
  }> {
    // Calculer si le client peut s'insérer entre le point A et B du trajet existant
    const distanceAtoClient = await this.calculateDistance(
      move.departure_postal_code,
      client.departure_postal_code!,
      move.departure_city,
      client.departure_city
    );

    const distanceClientToB = await this.calculateDistance(
      client.arrival_postal_code!,
      move.arrival_postal_code,
      client.arrival_city,
      move.arrival_city
    );

    const totalDistance = distanceAtoClient + distanceClientToB;
    const dateDiff = this.calculateDateDifference(client.desired_date!, move.departure_date);
    const volumeOk = (client.estimated_volume || 0) <= move.available_volume;

    return {
      possible: totalDistance <= (this.MAX_DISTANCE_KM * 1.5) && dateDiff <= this.MAX_DATE_DIFF_DAYS && volumeOk,
      totalDistance: Math.round(totalDistance),
      dateDiff: Math.round(dateDiff),
      volumeOk
    };
  }

  /**
   * Validation des données client
   */
  private static validateClientData(client: MovingClient): boolean {
    return !!(
      client.departure_postal_code?.trim() &&
      client.arrival_postal_code?.trim() &&
      client.departure_city?.trim() &&
      client.arrival_city?.trim() &&
      client.desired_date?.trim()
    );
  }

  /**
   * Calcule la distance entre deux codes postaux
   */
  private static async calculateDistance(
    postal1: string, 
    postal2: string, 
    city1?: string, 
    city2?: string
  ): Promise<number> {
    try {
      const result = await calculateDistanceByPostalCode(postal1, postal2, city1, city2);
      return result?.distance || this.getFallbackDistance(postal1, postal2);
    } catch (error) {
      console.warn(`⚠️ Erreur calcul distance ${postal1}-${postal2}, utilisation fallback`);
      return this.getFallbackDistance(postal1, postal2);
    }
  }

  /**
   * Distance de fallback basée sur les départements
   */
  private static getFallbackDistance(postal1: string, postal2: string): number {
    const dept1 = parseInt(postal1.substring(0, 2));
    const dept2 = parseInt(postal2.substring(0, 2));
    return Math.abs(dept1 - dept2) * 50; // Approximation
  }

  /**
   * Calcule la différence en jours entre deux dates
   */
  private static calculateDateDifference(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.abs(d1.getTime() - d2.getTime()) / (1000 * 3600 * 24);
  }

  /**
   * Trouve tous les matchs pour l'onglet matching
   */
  public static async findAllMatches(): Promise<MatchResult[]> {
    console.log('🎯 Recherche tous les matchs avec logique professionnelle');

    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .in('status', ['pending', 'confirmed'])
      .not('departure_postal_code', 'is', null)
      .not('arrival_postal_code', 'is', null)
      .not('is_matched', 'eq', true)
      .limit(20); // Limite pour éviter la lenteur

    if (clientsError || !clients) {
      console.error('❌ Erreur récupération clients:', clientsError);
      return [];
    }

    console.log(`👥 ${clients.length} clients à analyser`);

    const allMatches: MatchResult[] = [];
    
    // Traitement en parallèle mais limité pour éviter les timeouts
    const batchSize = 5;
    for (let i = 0; i < clients.length; i += batchSize) {
      const batch = clients.slice(i, i + batchSize);
      const batchPromises = batch.map(client => this.findMatchesForClient(client));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(clientMatches => {
          allMatches.push(...clientMatches);
        });
      } catch (error) {
        console.error(`❌ Erreur traitement batch ${i}-${i + batchSize}:`, error);
      }
    }

    const validMatches = allMatches.filter(match => match.is_valid);
    
    console.log(`✅ ${validMatches.length} matchs valides trouvés sur ${allMatches.length} analysés`);
    
    return validMatches;
  }
}
