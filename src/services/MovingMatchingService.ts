
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
  private static readonly MAX_DISTANCE_KM = 100;
  private static readonly MAX_DATE_DIFF_DAYS = 15;

  /**
   * Trouve tous les matchs possibles pour un client donné - VERSION OPTIMISÉE
   */
  public static async findMatchesForClient(client: MovingClient): Promise<MatchResult[]> {
    console.log(`🎯 Recherche matchs optimisés pour client ${client.name}`);
    
    if (!this.validateClientData(client)) {
      console.log('❌ Données client invalides');
      return [];
    }
    
    const matches: MatchResult[] = [];
    
    try {
      // Récupérer tous les trajets confirmés avec volume disponible
      const { data: moves, error } = await supabase
        .from('confirmed_moves')
        .select('*')
        .eq('status', 'confirmed')
        .gte('available_volume', client.estimated_volume || 1)
        .limit(50); // Limiter pour la performance

      if (error || !moves || moves.length === 0) {
        console.log('❌ Aucun trajet disponible:', error);
        return [];
      }

      console.log(`📋 ${moves.length} trajets à analyser`);

      // Traitement optimisé en batch
      const batchSize = 10;
      for (let i = 0; i < moves.length; i += batchSize) {
        const batch = moves.slice(i, i + batchSize);
        const batchPromises = batch.map(move => this.analyzeMove(client, move));
        
        try {
          const batchResults = await Promise.allSettled(batchPromises);
          batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
              matches.push(result.value);
            } else if (result.status === 'rejected') {
              console.warn(`⚠️ Erreur analyse trajet ${batch[index].id}:`, result.reason);
            }
          });
        } catch (error) {
          console.error(`❌ Erreur batch ${i}:`, error);
        }
      }

    } catch (error) {
      console.error('❌ Erreur recherche matchs:', error);
    }

    // Trier par score (meilleur = plus faible)
    matches.sort((a, b) => a.match_score - b.match_score);
    
    console.log(`✅ ${matches.length} matchs trouvés`);
    return matches;
  }

  /**
   * Analyse un trajet pour voir s'il matche avec le client
   */
  private static async analyzeMove(client: MovingClient, move: MovingRoute): Promise<MatchResult | null> {
    // Vérifier d'abord les critères simples (volume et date)
    const volumeCompatible = (client.estimated_volume || 0) <= move.available_volume;
    const dateDiff = this.calculateDateDifference(client.desired_date!, move.departure_date);
    const isValidDate = dateDiff <= this.MAX_DATE_DIFF_DAYS;

    if (!volumeCompatible || !isValidDate) {
      return null;
    }

    try {
      // Scénario 1: Trajet Aller Groupé (même direction)
      const outboundMatch = await this.checkOutboundMatch(client, move);
      if (outboundMatch) return outboundMatch;

      // Scénario 2: Trajet Retour (direction inverse)
      const returnMatch = await this.checkReturnMatch(client, move);
      if (returnMatch) return returnMatch;

    } catch (error) {
      console.warn(`⚠️ Erreur analyse trajet ${move.id}:`, error);
    }

    return null;
  }

  /**
   * Vérifie si le client peut être groupé sur le trajet aller
   */
  private static async checkOutboundMatch(client: MovingClient, move: MovingRoute): Promise<MatchResult | null> {
    try {
      // Calculer distances en parallèle avec timeout
      const [departureDistance, arrivalDistance] = await Promise.all([
        this.calculateDistanceWithTimeout(
          client.departure_postal_code!,
          move.departure_postal_code,
          client.departure_city,
          move.departure_city
        ),
        this.calculateDistanceWithTimeout(
          client.arrival_postal_code!,
          move.arrival_postal_code,
          client.arrival_city,
          move.arrival_city
        )
      ]);

      const maxDistance = Math.max(departureDistance, arrivalDistance);
      const dateDiff = this.calculateDateDifference(client.desired_date!, move.departure_date);

      if (maxDistance <= this.MAX_DISTANCE_KM) {
        return {
          client,
          move,
          match_type: 'grouped_outbound',
          distance_km: Math.round(maxDistance),
          date_diff_days: Math.round(dateDiff),
          volume_compatible: true,
          available_volume_after: move.available_volume - (client.estimated_volume || 0),
          match_score: maxDistance + (dateDiff * 2),
          is_valid: true,
          match_reference: `GROUP-${client.id}-${move.id}`,
          explanation: `Trajet groupé: Départ à ${Math.round(departureDistance)}km, Arrivée à ${Math.round(arrivalDistance)}km`,
          scenario: 1
        };
      }
    } catch (error) {
      console.warn('⚠️ Erreur check outbound:', error);
    }

    return null;
  }

  /**
   * Vérifie si le client peut occuper le trajet retour
   */
  private static async checkReturnMatch(client: MovingClient, move: MovingRoute): Promise<MatchResult | null> {
    try {
      // Pour le retour: client part de B (arrivée camion) vers A (départ camion)
      const [departureDistance, arrivalDistance] = await Promise.all([
        this.calculateDistanceWithTimeout(
          client.departure_postal_code!,
          move.arrival_postal_code, // Client part de l'arrivée du camion
          client.departure_city,
          move.arrival_city
        ),
        this.calculateDistanceWithTimeout(
          client.arrival_postal_code!,
          move.departure_postal_code, // Client arrive au départ du camion
          client.arrival_city,
          move.departure_city
        )
      ]);

      const maxDistance = Math.max(departureDistance, arrivalDistance);
      const dateDiff = this.calculateDateDifference(client.desired_date!, move.departure_date);

      if (maxDistance <= this.MAX_DISTANCE_KM) {
        return {
          client,
          move,
          match_type: 'return_trip',
          distance_km: Math.round(maxDistance),
          date_diff_days: Math.round(dateDiff),
          volume_compatible: true,
          available_volume_after: move.available_volume - (client.estimated_volume || 0),
          match_score: maxDistance + (dateDiff * 2) + 10, // Légère pénalité pour retour
          is_valid: true,
          match_reference: `RETURN-${client.id}-${move.id}`,
          explanation: `Trajet retour: Évite retour à vide, économie de ${Math.round(maxDistance)}km`,
          scenario: 2
        };
      }
    } catch (error) {
      console.warn('⚠️ Erreur check return:', error);
    }

    return null;
  }

  /**
   * Calcul de distance avec timeout pour éviter les blocages
   */
  private static async calculateDistanceWithTimeout(
    postal1: string, 
    postal2: string, 
    city1?: string, 
    city2?: string,
    timeoutMs: number = 3000
  ): Promise<number> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout calcul distance')), timeoutMs);
    });

    try {
      const distancePromise = this.calculateDistance(postal1, postal2, city1, city2);
      return await Promise.race([distancePromise, timeoutPromise]);
    } catch (error) {
      console.warn(`⚠️ Timeout distance ${postal1}-${postal2}, utilisation fallback`);
      return this.getFallbackDistance(postal1, postal2);
    }
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
      return this.getFallbackDistance(postal1, postal2);
    }
  }

  /**
   * Distance de fallback basée sur les départements
   */
  private static getFallbackDistance(postal1: string, postal2: string): number {
    const dept1 = parseInt(postal1.substring(0, 2));
    const dept2 = parseInt(postal2.substring(0, 2));
    const distance = Math.abs(dept1 - dept2) * 50; // Approximation 50km par département
    return Math.min(distance, 150); // Plafonner à 150km pour éviter les aberrations
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
   * Trouve tous les matchs pour l'onglet matching - VERSION OPTIMISÉE
   */
  public static async findAllMatches(): Promise<MatchResult[]> {
    console.log('🎯 Recherche tous les matchs optimisés');

    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .in('status', ['pending', 'confirmed'])
      .not('departure_postal_code', 'is', null)
      .not('arrival_postal_code', 'is', null)
      .not('is_matched', 'eq', true)
      .limit(10); // Réduire encore pour la performance

    if (clientsError || !clients) {
      console.error('❌ Erreur récupération clients:', clientsError);
      return [];
    }

    console.log(`👥 ${clients.length} clients à analyser`);

    const allMatches: MatchResult[] = [];
    
    // Traitement séquentiel pour éviter la surcharge API
    for (const client of clients) {
      try {
        const clientMatches = await this.findMatchesForClient(client);
        // Garder seulement les 3 meilleurs matchs par client
        allMatches.push(...clientMatches.slice(0, 3));
      } catch (error) {
        console.error(`❌ Erreur client ${client.id}:`, error);
      }
    }

    const validMatches = allMatches.filter(match => match.is_valid);
    
    console.log(`✅ ${validMatches.length} matchs valides trouvés`);
    
    return validMatches;
  }
}
