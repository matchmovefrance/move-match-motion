
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
   * Trouve tous les matchs possibles pour un client donné - VERSION SIMPLIFIÉE ET RAPIDE
   */
  public static async findMatchesForClient(client: MovingClient): Promise<MatchResult[]> {
    console.log(`🎯 Recherche matchs pour client ${client.name} (${client.client_reference})`);
    
    if (!this.validateClientData(client)) {
      console.log('❌ Données client invalides');
      return [];
    }
    
    const matches: MatchResult[] = [];
    
    try {
      // Récupérer TOUS les trajets confirmés sans filtre strict
      const { data: moves, error } = await supabase
        .from('confirmed_moves')
        .select('*')
        .eq('status', 'confirmed')
        .gt('max_volume', 0) // Au moins du volume total
        .limit(200); // Plus de trajets à analyser

      if (error || !moves || moves.length === 0) {
        console.log('❌ Aucun trajet disponible:', error);
        return [];
      }

      console.log(`📋 ${moves.length} trajets confirmés trouvés pour analyse`);

      // Analyse TOUS les trajets sans préfiltre
      for (const move of moves) {
        try {
          // Scénario 1: Trajet Aller Groupé (même direction)
          const outboundMatch = await this.checkOutboundMatch(client, move);
          if (outboundMatch) {
            matches.push(outboundMatch);
            console.log(`✅ Match aller trouvé: ${outboundMatch.distance_km}km`);
          }

          // Scénario 2: Trajet Retour (direction inverse)  
          const returnMatch = await this.checkReturnMatch(client, move);
          if (returnMatch) {
            matches.push(returnMatch);
            console.log(`✅ Match retour trouvé: ${returnMatch.distance_km}km`);
          }

        } catch (error) {
          console.warn(`⚠️ Erreur analyse trajet ${move.id}:`, error);
          // Continue avec les autres trajets
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
   * Vérifie trajet aller - même direction
   */
  private static async checkOutboundMatch(client: MovingClient, move: MovingRoute): Promise<MatchResult | null> {
    try {
      // Calculer les distances entre points de départ et d'arrivée
      const departureDistance = await this.calculateDistanceQuick(
        client.departure_postal_code!,
        move.departure_postal_code,
        client.departure_city,
        move.departure_city
      );

      const arrivalDistance = await this.calculateDistanceQuick(
        client.arrival_postal_code!,
        move.arrival_postal_code,
        client.arrival_city,
        move.arrival_city
      );

      const maxDistance = Math.max(departureDistance, arrivalDistance);
      const dateDiff = this.calculateDateDifference(client.desired_date!, move.departure_date);
      
      // Critères plus permissifs
      const isValidDistance = maxDistance <= this.MAX_DISTANCE_KM;
      const isValidDate = dateDiff <= this.MAX_DATE_DIFF_DAYS;
      
      const clientVolume = client.estimated_volume || 1;
      const availableVolume = Math.max(0, move.max_volume - move.used_volume);
      const volumeCompatible = clientVolume <= availableVolume;

      // Accepter le match même si volume légèrement dépassé (jusqu'à 20%)
      const volumeFlexible = clientVolume <= (availableVolume * 1.2);
      const finalVolumeCheck = volumeCompatible || volumeFlexible;

      if (isValidDistance && isValidDate && finalVolumeCheck) {
        return {
          client,
          move,
          match_type: 'grouped_outbound',
          distance_km: Math.round(maxDistance),
          date_diff_days: Math.round(dateDiff),
          volume_compatible: volumeCompatible,
          available_volume_after: Math.max(0, availableVolume - clientVolume),
          match_score: maxDistance + (dateDiff * 2) + (volumeCompatible ? 0 : 20),
          is_valid: true,
          match_reference: `ALLER-${client.id}-${move.id}`,
          explanation: `Trajet groupé même direction: ${Math.round(departureDistance)}km départ, ${Math.round(arrivalDistance)}km arrivée. Volume: ${clientVolume}/${availableVolume}m³`,
          scenario: 1
        };
      }

    } catch (error) {
      console.warn('⚠️ Erreur check aller:', error);
    }

    return null;
  }

  /**
   * Vérifie trajet retour - direction inverse
   */
  private static async checkReturnMatch(client: MovingClient, move: MovingRoute): Promise<MatchResult | null> {
    try {
      // Pour le retour: client départ = arrivée camion, client arrivée = départ camion
      const departureDistance = await this.calculateDistanceQuick(
        client.departure_postal_code!,
        move.arrival_postal_code,
        client.departure_city,
        move.arrival_city
      );

      const arrivalDistance = await this.calculateDistanceQuick(
        client.arrival_postal_code!,
        move.departure_postal_code,
        client.arrival_city,
        move.departure_city
      );

      const maxDistance = Math.max(departureDistance, arrivalDistance);
      const dateDiff = this.calculateDateDifference(client.desired_date!, move.departure_date);
      
      // Critères identiques pour le retour
      const isValidDistance = maxDistance <= this.MAX_DISTANCE_KM;
      const isValidDate = dateDiff <= this.MAX_DATE_DIFF_DAYS;
      
      const clientVolume = client.estimated_volume || 1;
      const availableVolume = Math.max(0, move.max_volume - move.used_volume);
      const volumeCompatible = clientVolume <= availableVolume;
      const volumeFlexible = clientVolume <= (availableVolume * 1.2);
      const finalVolumeCheck = volumeCompatible || volumeFlexible;

      if (isValidDistance && isValidDate && finalVolumeCheck) {
        return {
          client,
          move,
          match_type: 'return_trip',
          distance_km: Math.round(maxDistance),
          date_diff_days: Math.round(dateDiff),
          volume_compatible: volumeCompatible,
          available_volume_after: Math.max(0, availableVolume - clientVolume),
          match_score: maxDistance + (dateDiff * 2) + 10, // Léger bonus pour trajet retour
          is_valid: true,
          match_reference: `RETOUR-${client.id}-${move.id}`,
          explanation: `Trajet retour optimisé: évite retour à vide. Distance max: ${Math.round(maxDistance)}km. Volume: ${clientVolume}/${availableVolume}m³`,
          scenario: 2
        };
      }

    } catch (error) {
      console.warn('⚠️ Erreur check retour:', error);
    }

    return null;
  }

  /**
   * Calcul de distance rapide avec fallback immédiat
   */
  private static async calculateDistanceQuick(
    postal1: string, 
    postal2: string, 
    city1?: string, 
    city2?: string
  ): Promise<number> {
    try {
      // Timeout très court pour Google Maps
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 seconde max

      const result = await calculateDistanceByPostalCode(postal1, postal2, city1, city2);
      clearTimeout(timeoutId);
      
      if (result?.distance && result.distance > 0) {
        return result.distance;
      }
    } catch (error) {
      console.log(`⚠️ Google Maps échoué pour ${postal1}-${postal2}, utilisation fallback`);
    }

    // Fallback basé sur départements - plus permissif
    return this.getFallbackDistanceGenerous(postal1, postal2);
  }

  /**
   * Distance de fallback généreuse basée sur les départements
   */
  private static getFallbackDistanceGenerous(postal1: string, postal2: string): number {
    try {
      const dept1 = parseInt(postal1.substring(0, 2));
      const dept2 = parseInt(postal2.substring(0, 2));
      
      if (isNaN(dept1) || isNaN(dept2)) {
        return 80; // Distance par défaut raisonnable
      }
      
      const distance = Math.abs(dept1 - dept2) * 30; // 30km par département de différence
      return Math.max(distance, 10); // Minimum 10km
    } catch (error) {
      return 80; // Distance par défaut
    }
  }

  /**
   * Validation des données client - plus permissive
   */
  private static validateClientData(client: MovingClient): boolean {
    const hasBasicData = !!(
      client.departure_postal_code?.trim() &&
      client.arrival_postal_code?.trim() &&
      client.desired_date?.trim()
    );

    if (!hasBasicData) {
      console.log('❌ Données manquantes:', {
        departure: !!client.departure_postal_code,
        arrival: !!client.arrival_postal_code,
        date: !!client.desired_date
      });
    }

    return hasBasicData;
  }

  /**
   * Calcule la différence en jours entre deux dates
   */
  private static calculateDateDifference(date1: string, date2: string): number {
    try {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      return Math.abs(d1.getTime() - d2.getTime()) / (1000 * 3600 * 24);
    } catch (error) {
      return 999; // Valeur élevée pour échouer le test de date
    }
  }

  /**
   * Trouve tous les matchs pour l'onglet matching - VERSION OPTIMISÉE
   */
  public static async findAllMatches(): Promise<MatchResult[]> {
    console.log('🎯 Recherche tous les matchs - version optimisée');

    try {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .in('status', ['pending', 'confirmed'])
        .not('departure_postal_code', 'is', null)
        .not('arrival_postal_code', 'is', null)
        .not('desired_date', 'is', null)
        .limit(50); // Plus de clients

      if (clientsError || !clients || clients.length === 0) {
        console.error('❌ Aucun client trouvé:', clientsError);
        return [];
      }

      console.log(`👥 ${clients.length} clients éligibles trouvés`);

      const allMatches: MatchResult[] = [];
      
      // Traitement en parallèle pour plus de rapidité
      const matchPromises = clients.map(async (client) => {
        try {
          const clientMatches = await this.findMatchesForClient(client);
          return clientMatches.slice(0, 3); // Top 3 matchs par client
        } catch (error) {
          console.error(`❌ Erreur client ${client.id}:`, error);
          return [];
        }
      });

      const allClientMatches = await Promise.all(matchPromises);
      
      // Flatten results
      for (const clientMatches of allClientMatches) {
        allMatches.push(...clientMatches);
      }

      console.log(`✅ ${allMatches.length} matchs totaux trouvés`);
      console.log(`📊 Répartition: ${allMatches.filter(m => m.scenario === 1).length} aller, ${allMatches.filter(m => m.scenario === 2).length} retour`);
      
      return allMatches.filter(match => match.is_valid);
      
    } catch (error) {
      console.error('❌ Erreur recherche globale matchs:', error);
      return [];
    }
  }
}
