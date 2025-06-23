
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
  // Critères professionnels stricts
  private static readonly MAX_DISTANCE_KM = 100; // Distance professionnelle de 100km
  private static readonly MAX_DATE_DIFF_DAYS = 7; // Maximum 7 jours d'écart
  private static readonly MIN_VOLUME_EFFICIENCY = 0.3; // Minimum 30% du volume utilisé

  /**
   * Trouve les meilleurs matchs pour un client avec critères professionnels
   */
  public static async findMatchesForClient(client: MovingClient): Promise<MatchResult[]> {
    console.log(`🎯 RECHERCHE PROFESSIONNELLE pour ${client.name} (${client.client_reference})`);
    console.log('📍 Critères:', {
      departure: `${client.departure_postal_code} ${client.departure_city}`,
      arrival: `${client.arrival_postal_code} ${client.arrival_city}`,
      date: client.desired_date,
      volume: client.estimated_volume,
      maxDistance: this.MAX_DISTANCE_KM,
      maxDateDiff: this.MAX_DATE_DIFF_DAYS
    });
    
    if (!this.validateClientData(client)) {
      console.log('❌ Données client invalides');
      return [];
    }
    
    const matches: MatchResult[] = [];
    
    try {
      // Récupérer les trajets confirmés
      const { data: moves, error } = await supabase
        .from('confirmed_moves')
        .select('*')
        .eq('status', 'confirmed')
        .limit(50); // Limite pour performance

      if (error || !moves || moves.length === 0) {
        console.log('❌ Aucun trajet disponible:', error);
        return [];
      }

      console.log(`📋 Analyse de ${moves.length} trajets confirmés`);

      // Analyse séquentielle pour précision
      for (const move of moves) {
        try {
          // Scénario 1: Trajet groupé (même direction)
          const outboundMatch = await this.checkProfessionalOutboundMatch(client, move);
          if (outboundMatch && outboundMatch.is_valid) {
            matches.push(outboundMatch);
            console.log(`✅ Match aller validé: ${outboundMatch.distance_km}km`);
          }

          // Scénario 2: Trajet retour optimisé
          const returnMatch = await this.checkProfessionalReturnMatch(client, move);
          if (returnMatch && returnMatch.is_valid) {
            matches.push(returnMatch);
            console.log(`✅ Match retour validé: ${returnMatch.distance_km}km`);
          }

        } catch (error) {
          console.warn(`⚠️ Erreur analyse trajet ${move.id}:`, error);
        }
      }

    } catch (error) {
      console.error('❌ Erreur recherche matchs:', error);
    }

    // Tri par score professionnel (distance + date + volume)
    matches.sort((a, b) => a.match_score - b.match_score);
    
    // Limiter aux 10 meilleurs matchs
    const topMatches = matches.slice(0, 10);
    
    console.log(`🎉 ${topMatches.length} matchs professionnels validés pour ${client.name}`);
    topMatches.forEach((match, i) => {
      console.log(`${i+1}. ${match.move.company_name} - ${match.match_type} - ${match.distance_km}km - Score: ${match.match_score}`);
    });
    
    return topMatches;
  }

  /**
   * Vérification professionnelle trajet aller groupé
   */
  private static async checkProfessionalOutboundMatch(client: MovingClient, move: MovingRoute): Promise<MatchResult | null> {
    try {
      console.log(`  🔍 Analyse ALLER: ${move.company_name}`);

      // Calcul distances Google Maps obligatoire
      const departureDistance = await this.getGoogleMapsDistance(
        client.departure_postal_code!,
        client.departure_city!,
        move.departure_postal_code,
        move.departure_city!
      );

      const arrivalDistance = await this.getGoogleMapsDistance(
        client.arrival_postal_code!,
        client.arrival_city!,
        move.arrival_postal_code,
        move.arrival_city!
      );

      if (departureDistance === null || arrivalDistance === null) {
        console.log(`    ❌ Impossible de calculer les distances Google Maps`);
        return null;
      }

      const maxDistance = Math.max(departureDistance, arrivalDistance);
      const dateDiff = this.calculateDateDifference(client.desired_date!, move.departure_date);
      
      console.log(`    📏 Distances: départ=${departureDistance}km, arrivée=${arrivalDistance}km, max=${maxDistance}km`);
      console.log(`    📅 Différence date: ${dateDiff} jours`);

      // Critères professionnels stricts
      if (maxDistance > this.MAX_DISTANCE_KM) {
        console.log(`    ❌ Distance trop importante: ${maxDistance}km > ${this.MAX_DISTANCE_KM}km`);
        return null;
      }

      if (dateDiff > this.MAX_DATE_DIFF_DAYS) {
        console.log(`    ❌ Écart de date trop important: ${dateDiff} jours > ${this.MAX_DATE_DIFF_DAYS} jours`);
        return null;
      }

      const clientVolume = client.estimated_volume || 1;
      const availableVolume = Math.max(0, move.max_volume - move.used_volume);
      const volumeCompatible = clientVolume <= availableVolume;

      if (!volumeCompatible) {
        console.log(`    ❌ Volume incompatible: ${clientVolume}m³ > ${availableVolume}m³ disponible`);
        return null;
      }

      // Vérifier l'efficacité du volume
      const volumeEfficiency = clientVolume / move.max_volume;
      if (volumeEfficiency < this.MIN_VOLUME_EFFICIENCY) {
        console.log(`    ⚠️ Efficacité volume faible: ${Math.round(volumeEfficiency * 100)}% < ${this.MIN_VOLUME_EFFICIENCY * 100}%`);
      }

      // Score professionnel: distance principale + bonus/malus
      const match: MatchResult = {
        client,
        move,
        match_type: 'grouped_outbound',
        distance_km: Math.round(maxDistance),
        date_diff_days: Math.round(dateDiff),
        volume_compatible: true,
        available_volume_after: Math.max(0, availableVolume - clientVolume),
        match_score: maxDistance + (dateDiff * 5) + (volumeEfficiency < this.MIN_VOLUME_EFFICIENCY ? 20 : 0),
        is_valid: true,
        match_reference: `ALLER-${client.id}-${move.id}`,
        explanation: `Trajet groupé optimisé: ${Math.round(departureDistance)}km départ, ${Math.round(arrivalDistance)}km arrivée. Volume: ${clientVolume}/${availableVolume}m³`,
        scenario: 1
      };

      console.log(`    ✅ MATCH ALLER PROFESSIONNEL VALIDÉ - Score: ${match.match_score}`);
      return match;

    } catch (error) {
      console.warn('⚠️ Erreur check aller professionnel:', error);
      return null;
    }
  }

  /**
   * Vérification professionnelle trajet retour
   */
  private static async checkProfessionalReturnMatch(client: MovingClient, move: MovingRoute): Promise<MatchResult | null> {
    try {
      console.log(`  🔍 Analyse RETOUR: ${move.company_name}`);

      // Pour le retour: client départ = arrivée camion, client arrivée = départ camion
      const departureDistance = await this.getGoogleMapsDistance(
        client.departure_postal_code!,
        client.departure_city!,
        move.arrival_postal_code,
        move.arrival_city!
      );

      const arrivalDistance = await this.getGoogleMapsDistance(
        client.arrival_postal_code!,
        client.arrival_city!,
        move.departure_postal_code,
        move.departure_city!
      );

      if (departureDistance === null || arrivalDistance === null) {
        console.log(`    ❌ Impossible de calculer les distances Google Maps pour retour`);
        return null;
      }

      const maxDistance = Math.max(departureDistance, arrivalDistance);
      const dateDiff = this.calculateDateDifference(client.desired_date!, move.departure_date);
      
      console.log(`    📏 Distances retour: départ=${departureDistance}km, arrivée=${arrivalDistance}km, max=${maxDistance}km`);
      console.log(`    📅 Différence date: ${dateDiff} jours`);

      // Critères professionnels stricts
      if (maxDistance > this.MAX_DISTANCE_KM) {
        console.log(`    ❌ Distance retour trop importante: ${maxDistance}km > ${this.MAX_DISTANCE_KM}km`);
        return null;
      }

      if (dateDiff > this.MAX_DATE_DIFF_DAYS) {
        console.log(`    ❌ Écart de date retour trop important: ${dateDiff} jours > ${this.MAX_DATE_DIFF_DAYS} jours`);
        return null;
      }

      const clientVolume = client.estimated_volume || 1;
      const availableVolume = Math.max(0, move.max_volume - move.used_volume);
      const volumeCompatible = clientVolume <= availableVolume;

      if (!volumeCompatible) {
        console.log(`    ❌ Volume retour incompatible: ${clientVolume}m³ > ${availableVolume}m³ disponible`);
        return null;
      }

      // Score retour : légèrement favorisé (évite retour à vide)
      const match: MatchResult = {
        client,
        move,
        match_type: 'return_trip',
        distance_km: Math.round(maxDistance),
        date_diff_days: Math.round(dateDiff),
        volume_compatible: true,
        available_volume_after: Math.max(0, availableVolume - clientVolume),
        match_score: maxDistance + (dateDiff * 5) - 5, // Bonus -5 pour trajet retour
        is_valid: true,
        match_reference: `RETOUR-${client.id}-${move.id}`,
        explanation: `Trajet retour optimisé (évite retour à vide): ${Math.round(maxDistance)}km max. Volume: ${clientVolume}/${availableVolume}m³`,
        scenario: 2
      };

      console.log(`    ✅ MATCH RETOUR PROFESSIONNEL VALIDÉ - Score: ${match.match_score}`);
      return match;

    } catch (error) {
      console.warn('⚠️ Erreur check retour professionnel:', error);
      return null;
    }
  }

  /**
   * Calcul distance Google Maps avec timeout court
   */
  private static async getGoogleMapsDistance(
    postalCode1: string, 
    city1: string, 
    postalCode2: string, 
    city2: string
  ): Promise<number | null> {
    if (postalCode1 === postalCode2) {
      return 0;
    }

    try {
      console.log(`  📍 Google Maps: ${postalCode1} ${city1} → ${postalCode2} ${city2}`);
      
      // Timeout court pour performance
      const result = await Promise.race([
        calculateDistanceByPostalCode(postalCode1, postalCode2, city1, city2),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Google Maps timeout')), 3000)
        )
      ]);
      
      if (result?.distance && result.distance > 0) {
        console.log(`  ✅ Distance Google Maps: ${result.distance}km`);
        return result.distance;
      }
    } catch (error) {
      console.log(`  ⚠️ Google Maps failed: ${error.message}`);
    }

    return null;
  }

  /**
   * Validation stricte des données client
   */
  private static validateClientData(client: MovingClient): boolean {
    const isValid = !!(
      client.departure_postal_code?.trim() &&
      client.arrival_postal_code?.trim() &&
      client.departure_city?.trim() &&
      client.arrival_city?.trim() &&
      client.desired_date?.trim()
    );

    if (!isValid) {
      console.log('❌ Données client incomplètes:', {
        departure_postal: !!client.departure_postal_code,
        arrival_postal: !!client.arrival_postal_code,
        departure_city: !!client.departure_city,
        arrival_city: !!client.arrival_city,
        date: !!client.desired_date
      });
    }

    return isValid;
  }

  /**
   * Calcule la différence en jours entre deux dates
   */
  private static calculateDateDifference(date1: string, date2: string): number {
    try {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      const diffTime = Math.abs(d1.getTime() - d2.getTime());
      const diffDays = diffTime / (1000 * 3600 * 24);
      return diffDays;
    } catch (error) {
      console.error('❌ Erreur calcul date:', error);
      return 999;
    }
  }

  /**
   * Recherche globale de tous les matchs professionnels
   */
  public static async findAllMatches(): Promise<MatchResult[]> {
    console.log('🎯 === RECHERCHE GLOBALE PROFESSIONNELLE ===');

    try {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .in('status', ['pending', 'confirmed'])
        .not('departure_postal_code', 'is', null)
        .not('arrival_postal_code', 'is', null)
        .not('departure_city', 'is', null)
        .not('arrival_city', 'is', null)
        .not('desired_date', 'is', null)
        .limit(50); // Limite pour performance

      if (clientsError || !clients || clients.length === 0) {
        console.error('❌ Aucun client trouvé:', clientsError);
        return [];
      }

      console.log(`👥 ${clients.length} clients éligibles`);

      const allMatches: MatchResult[] = [];
      
      // Traitement séquentiel pour précision
      for (const client of clients) {
        try {
          console.log(`\n🔍 === ANALYSE CLIENT: ${client.name} ===`);
          const clientMatches = await this.findMatchesForClient(client);
          allMatches.push(...clientMatches);
        } catch (error) {
          console.error(`❌ Erreur client ${client.id}:`, error);
        }
      }

      console.log(`\n🎉 === RÉSULTATS PROFESSIONNELS ===`);
      console.log(`📊 ${allMatches.length} matchs professionnels trouvés`);
      console.log(`📊 Répartition: ${allMatches.filter(m => m.scenario === 1).length} aller, ${allMatches.filter(m => m.scenario === 2).length} retour`);
      
      return allMatches.filter(match => match.is_valid);
      
    } catch (error) {
      console.error('❌ Erreur recherche globale professionnelle:', error);
      return [];
    }
  }
}
