
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
  match_type: 'grouped_outbound' | 'return_trip' | 'simple_match';
  distance_km: number;
  date_diff_days: number;
  volume_compatible: boolean;
  available_volume_after: number;
  match_score: number;
  is_valid: boolean;
  match_reference: string;
  explanation: string;
  scenario: 1 | 2;
}

export class MovingMatchingService {
  private static readonly MAX_DISTANCE_KM = 150; // Augmenté de 100 à 150km
  private static readonly MAX_DATE_DIFF_DAYS = 21; // Augmenté de 15 à 21 jours

  /**
   * Trouve tous les matchs possibles pour un client donné - VERSION SIMPLIFIÉE
   */
  public static async findMatchesForClient(client: MovingClient): Promise<MatchResult[]> {
    console.log(`🎯 Recherche matchs pour client ${client.name}`);
    
    if (!this.validateClientData(client)) {
      console.log('❌ Données client invalides');
      return [];
    }
    
    const matches: MatchResult[] = [];
    
    try {
      // Récupérer tous les trajets confirmés (sans filtre de volume strict)
      const { data: moves, error } = await supabase
        .from('confirmed_moves')
        .select('*')
        .eq('status', 'confirmed')
        .gt('available_volume', 0) // Juste s'assurer qu'il y a du volume disponible
        .limit(100); // Augmenter la limite

      if (error || !moves || moves.length === 0) {
        console.log('❌ Aucun trajet disponible:', error);
        return [];
      }

      console.log(`📋 ${moves.length} trajets à analyser pour ${client.name}`);

      // Traitement simplifié - moins de filtres
      for (const move of moves) {
        try {
          const match = await this.analyzeMatchSimplified(client, move);
          if (match) {
            matches.push(match);
            console.log(`✅ Match trouvé: ${match.match_type} - ${match.distance_km}km`);
          }
        } catch (error) {
          console.warn(`⚠️ Erreur analyse trajet ${move.id}:`, error);
        }
      }

    } catch (error) {
      console.error('❌ Erreur recherche matchs:', error);
    }

    // Trier par score (meilleur = plus faible)
    matches.sort((a, b) => a.match_score - b.match_score);
    
    console.log(`✅ ${matches.length} matchs trouvés pour ${client.name}`);
    return matches;
  }

  /**
   * Analyse simplifiée d'un trajet - PLUS PERMISSIVE
   */
  private static async analyzeMatchSimplified(client: MovingClient, move: MovingRoute): Promise<MatchResult | null> {
    // Critères date plus flexibles
    const dateDiff = this.calculateDateDifference(client.desired_date!, move.departure_date);
    const isValidDate = dateDiff <= this.MAX_DATE_DIFF_DAYS;

    if (!isValidDate) {
      return null; // Seule condition stricte : la date
    }

    try {
      // Scénario 1: Trajet Aller Groupé (même direction)
      const outboundMatch = await this.checkOutboundMatchSimplified(client, move);
      if (outboundMatch) return outboundMatch;

      // Scénario 2: Trajet Retour (direction inverse)
      const returnMatch = await this.checkReturnMatchSimplified(client, move);
      if (returnMatch) return returnMatch;

    } catch (error) {
      console.warn(`⚠️ Erreur analyse trajet ${move.id}:`, error);
    }

    return null;
  }

  /**
   * Vérifie trajet aller - VERSION SIMPLIFIÉE
   */
  private static async checkOutboundMatchSimplified(client: MovingClient, move: MovingRoute): Promise<MatchResult | null> {
    try {
      // Calculer distances avec fallback plus rapide
      const [departureDistance, arrivalDistance] = await Promise.all([
        this.calculateDistanceWithFallback(
          client.departure_postal_code!,
          move.departure_postal_code,
          client.departure_city,
          move.departure_city
        ),
        this.calculateDistanceWithFallback(
          client.arrival_postal_code!,
          move.arrival_postal_code,
          client.arrival_city,
          move.arrival_city
        )
      ]);

      const maxDistance = Math.max(departureDistance, arrivalDistance);
      const dateDiff = this.calculateDateDifference(client.desired_date!, move.departure_date);
      
      // Volume plus flexible - accepter même si pas parfait
      const clientVolume = client.estimated_volume || 1;
      const volumeCompatible = clientVolume <= move.available_volume;
      const volumeRatio = move.available_volume > 0 ? (clientVolume / move.available_volume) : 1;

      if (maxDistance <= this.MAX_DISTANCE_KM) {
        return {
          client,
          move,
          match_type: 'grouped_outbound',
          distance_km: Math.round(maxDistance),
          date_diff_days: Math.round(dateDiff),
          volume_compatible: volumeCompatible,
          available_volume_after: Math.max(0, move.available_volume - clientVolume),
          match_score: maxDistance + (dateDiff * 2) + (volumeCompatible ? 0 : 50),
          is_valid: maxDistance <= this.MAX_DISTANCE_KM,
          match_reference: `GROUP-${client.id}-${move.id}`,
          explanation: `Trajet groupé: Départ à ${Math.round(departureDistance)}km, Arrivée à ${Math.round(arrivalDistance)}km. Volume: ${clientVolume}/${move.available_volume}m³`,
          scenario: 1
        };
      }
    } catch (error) {
      console.warn('⚠️ Erreur check outbound:', error);
    }

    return null;
  }

  /**
   * Vérifie trajet retour - VERSION SIMPLIFIÉE
   */
  private static async checkReturnMatchSimplified(client: MovingClient, move: MovingRoute): Promise<MatchResult | null> {
    try {
      // Pour le retour: client part de B (arrivée camion) vers A (départ camion)
      const [departureDistance, arrivalDistance] = await Promise.all([
        this.calculateDistanceWithFallback(
          client.departure_postal_code!,
          move.arrival_postal_code,
          client.departure_city,
          move.arrival_city
        ),
        this.calculateDistanceWithFallback(
          client.arrival_postal_code!,
          move.departure_postal_code,
          client.arrival_city,
          move.departure_city
        )
      ]);

      const maxDistance = Math.max(departureDistance, arrivalDistance);
      const dateDiff = this.calculateDateDifference(client.desired_date!, move.departure_date);
      
      const clientVolume = client.estimated_volume || 1;
      const volumeCompatible = clientVolume <= move.available_volume;

      if (maxDistance <= this.MAX_DISTANCE_KM) {
        return {
          client,
          move,
          match_type: 'return_trip',
          distance_km: Math.round(maxDistance),
          date_diff_days: Math.round(dateDiff),
          volume_compatible: volumeCompatible,
          available_volume_after: Math.max(0, move.available_volume - clientVolume),
          match_score: maxDistance + (dateDiff * 2) + 5, // Léger bonus pour retour
          is_valid: maxDistance <= this.MAX_DISTANCE_KM,
          match_reference: `RETURN-${client.id}-${move.id}`,
          explanation: `Trajet retour: Évite retour à vide. Distance max: ${Math.round(maxDistance)}km. Volume: ${clientVolume}/${move.available_volume}m³`,
          scenario: 2
        };
      }
    } catch (error) {
      console.warn('⚠️ Erreur check return:', error);
    }

    return null;
  }

  /**
   * Calcul de distance avec fallback rapide
   */
  private static async calculateDistanceWithFallback(
    postal1: string, 
    postal2: string, 
    city1?: string, 
    city2?: string
  ): Promise<number> {
    try {
      // Essayer Google Maps avec timeout court
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 2000); // 2 secondes max
      });

      const distancePromise = this.calculateDistance(postal1, postal2, city1, city2);
      const distance = await Promise.race([distancePromise, timeoutPromise]);
      return distance;
    } catch (error) {
      // Fallback immédiat basé sur départements
      return this.getFallbackDistance(postal1, postal2);
    }
  }

  /**
   * Validation des données client - PLUS PERMISSIVE
   */
  private static validateClientData(client: MovingClient): boolean {
    return !!(
      client.departure_postal_code?.trim() &&
      client.arrival_postal_code?.trim() &&
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
      return this.getFallbackDistance(postal1, postal2);
    }
  }

  /**
   * Distance de fallback basée sur les départements - PLUS GÉNÉREUSE
   */
  private static getFallbackDistance(postal1: string, postal2: string): number {
    const dept1 = parseInt(postal1.substring(0, 2));
    const dept2 = parseInt(postal2.substring(0, 2));
    const distance = Math.abs(dept1 - dept2) * 40; // Réduit de 50 à 40km par département
    return Math.min(distance, 120); // Plafonner à 120km au lieu de 150km
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
   * Trouve tous les matchs pour l'onglet matching - VERSION PLUS PERMISSIVE
   */
  public static async findAllMatches(): Promise<MatchResult[]> {
    console.log('🎯 Recherche tous les matchs avec critères assouplis');

    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .in('status', ['pending', 'confirmed'])
      .not('departure_postal_code', 'is', null)
      .not('arrival_postal_code', 'is', null)
      .not('is_matched', 'eq', true)
      .limit(25); // Augmenter à 25 clients

    if (clientsError || !clients) {
      console.error('❌ Erreur récupération clients:', clientsError);
      return [];
    }

    console.log(`👥 ${clients.length} clients à analyser`);

    const allMatches: MatchResult[] = [];
    
    // Traitement de tous les clients
    for (const client of clients) {
      try {
        const clientMatches = await this.findMatchesForClient(client);
        // Garder les 5 meilleurs matchs par client au lieu de 3
        allMatches.push(...clientMatches.slice(0, 5));
        
        // Log pour debug
        if (clientMatches.length > 0) {
          console.log(`Client ${client.name}: ${clientMatches.length} matchs trouvés`);
        }
      } catch (error) {
        console.error(`❌ Erreur client ${client.id}:`, error);
      }
    }

    const validMatches = allMatches.filter(match => match.is_valid);
    
    console.log(`✅ ${validMatches.length} matchs valides trouvés au total`);
    console.log(`📊 Répartition: ${allMatches.filter(m => m.match_type === 'grouped_outbound').length} groupés, ${allMatches.filter(m => m.match_type === 'return_trip').length} retours`);
    
    return validMatches;
  }
}
