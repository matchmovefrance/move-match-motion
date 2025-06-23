
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
  private static readonly MAX_DISTANCE_KM = 200; // Plus permissif
  private static readonly MAX_DATE_DIFF_DAYS = 30; // Plus permissif

  /**
   * Trouve tous les matchs possibles pour un client donné - VERSION CORRIGÉE
   */
  public static async findMatchesForClient(client: MovingClient): Promise<MatchResult[]> {
    console.log(`🎯 RECHERCHE MATCHS pour client ${client.name} (${client.client_reference})`);
    console.log('📍 Données client:', {
      departure: `${client.departure_postal_code} ${client.departure_city}`,
      arrival: `${client.arrival_postal_code} ${client.arrival_city}`,
      date: client.desired_date,
      volume: client.estimated_volume
    });
    
    if (!this.validateClientData(client)) {
      console.log('❌ Données client invalides');
      return [];
    }
    
    const matches: MatchResult[] = [];
    
    try {
      // Récupérer TOUS les trajets confirmés
      const { data: moves, error } = await supabase
        .from('confirmed_moves')
        .select('*')
        .eq('status', 'confirmed');

      if (error || !moves || moves.length === 0) {
        console.log('❌ Aucun trajet disponible:', error);
        return [];
      }

      console.log(`📋 ${moves.length} trajets confirmés analysés:`);
      moves.forEach(move => {
        console.log(`- ${move.company_name}: ${move.departure_postal_code} → ${move.arrival_postal_code} (${move.departure_date})`);
      });

      // Analyse TOUS les trajets
      for (const move of moves) {
        try {
          console.log(`🔍 Analyse trajet: ${move.company_name} (${move.departure_postal_code} → ${move.arrival_postal_code})`);

          // Scénario 1: Trajet Aller Groupé (même direction)
          const outboundMatch = await this.checkOutboundMatch(client, move);
          if (outboundMatch) {
            matches.push(outboundMatch);
            console.log(`✅ MATCH ALLER trouvé: ${outboundMatch.distance_km}km, score: ${outboundMatch.match_score}`);
          }

          // Scénario 2: Trajet Retour (direction inverse)  
          const returnMatch = await this.checkReturnMatch(client, move);
          if (returnMatch) {
            matches.push(returnMatch);
            console.log(`✅ MATCH RETOUR trouvé: ${returnMatch.distance_km}km, score: ${returnMatch.match_score}`);
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
    
    console.log(`🎉 RÉSULTAT FINAL: ${matches.length} matchs trouvés pour ${client.name}`);
    matches.forEach((match, i) => {
      console.log(`${i+1}. ${match.move.company_name} - ${match.match_type} - ${match.distance_km}km - Score: ${match.match_score}`);
    });
    
    return matches;
  }

  /**
   * Vérifie trajet aller - même direction - VERSION SIMPLIFIÉE
   */
  private static async checkOutboundMatch(client: MovingClient, move: MovingRoute): Promise<MatchResult | null> {
    try {
      console.log(`  🔍 Check ALLER: Client ${client.departure_postal_code}→${client.arrival_postal_code} vs Trajet ${move.departure_postal_code}→${move.arrival_postal_code}`);

      // Calculer les distances
      const departureDistance = await this.calculateDistanceSimple(
        client.departure_postal_code!,
        move.departure_postal_code
      );

      const arrivalDistance = await this.calculateDistanceSimple(
        client.arrival_postal_code!,
        move.arrival_postal_code
      );

      const maxDistance = Math.max(departureDistance, arrivalDistance);
      const dateDiff = this.calculateDateDifference(client.desired_date!, move.departure_date);
      
      console.log(`    📏 Distances: départ=${departureDistance}km, arrivée=${arrivalDistance}km, max=${maxDistance}km`);
      console.log(`    📅 Différence date: ${dateDiff} jours`);

      // Critères TRÈS permissifs
      const isValidDistance = maxDistance <= this.MAX_DISTANCE_KM;
      const isValidDate = dateDiff <= this.MAX_DATE_DIFF_DAYS;
      
      const clientVolume = client.estimated_volume || 1;
      const availableVolume = Math.max(0, move.max_volume - move.used_volume);
      const volumeCompatible = clientVolume <= availableVolume;

      console.log(`    ✅ Critères: distance=${isValidDistance} (${maxDistance}≤${this.MAX_DISTANCE_KM}), date=${isValidDate} (${dateDiff}≤${this.MAX_DATE_DIFF_DAYS}), volume=${volumeCompatible} (${clientVolume}≤${availableVolume})`);

      // Accepter si au moins 2 critères sur 3 sont OK
      const validCriteria = [isValidDistance, isValidDate, volumeCompatible].filter(Boolean).length;
      const isValid = validCriteria >= 2;

      if (isValid) {
        const match: MatchResult = {
          client,
          move,
          match_type: 'grouped_outbound',
          distance_km: Math.round(maxDistance),
          date_diff_days: Math.round(dateDiff),
          volume_compatible: volumeCompatible,
          available_volume_after: Math.max(0, availableVolume - clientVolume),
          match_score: maxDistance + (dateDiff * 2) + (volumeCompatible ? 0 : 50),
          is_valid: true,
          match_reference: `ALLER-${client.id}-${move.id}`,
          explanation: `Trajet groupé: ${Math.round(departureDistance)}km départ, ${Math.round(arrivalDistance)}km arrivée. Volume: ${clientVolume}/${availableVolume}m³`,
          scenario: 1
        };

        console.log(`    🎉 MATCH ALLER VALIDÉ!`);
        return match;
      } else {
        console.log(`    ❌ Match aller rejeté: seulement ${validCriteria}/3 critères OK`);
      }

    } catch (error) {
      console.warn('⚠️ Erreur check aller:', error);
    }

    return null;
  }

  /**
   * Vérifie trajet retour - direction inverse - VERSION SIMPLIFIÉE
   */
  private static async checkReturnMatch(client: MovingClient, move: MovingRoute): Promise<MatchResult | null> {
    try {
      console.log(`  🔍 Check RETOUR: Client ${client.departure_postal_code}→${client.arrival_postal_code} vs Trajet ${move.arrival_postal_code}→${move.departure_postal_code}`);

      // Pour le retour: client départ = arrivée camion, client arrivée = départ camion
      const departureDistance = await this.calculateDistanceSimple(
        client.departure_postal_code!,
        move.arrival_postal_code
      );

      const arrivalDistance = await this.calculateDistanceSimple(
        client.arrival_postal_code!,
        move.departure_postal_code
      );

      const maxDistance = Math.max(departureDistance, arrivalDistance);
      const dateDiff = this.calculateDateDifference(client.desired_date!, move.departure_date);
      
      console.log(`    📏 Distances retour: départ=${departureDistance}km, arrivée=${arrivalDistance}km, max=${maxDistance}km`);
      console.log(`    📅 Différence date: ${dateDiff} jours`);

      // Critères identiques pour le retour
      const isValidDistance = maxDistance <= this.MAX_DISTANCE_KM;
      const isValidDate = dateDiff <= this.MAX_DATE_DIFF_DAYS;
      
      const clientVolume = client.estimated_volume || 1;
      const availableVolume = Math.max(0, move.max_volume - move.used_volume);
      const volumeCompatible = clientVolume <= availableVolume;

      console.log(`    ✅ Critères retour: distance=${isValidDistance}, date=${isValidDate}, volume=${volumeCompatible}`);

      const validCriteria = [isValidDistance, isValidDate, volumeCompatible].filter(Boolean).length;
      const isValid = validCriteria >= 2;

      if (isValid) {
        const match: MatchResult = {
          client,
          move,
          match_type: 'return_trip',
          distance_km: Math.round(maxDistance),
          date_diff_days: Math.round(dateDiff),
          volume_compatible: volumeCompatible,
          available_volume_after: Math.max(0, availableVolume - clientVolume),
          match_score: maxDistance + (dateDiff * 2) + 10, // Bonus pour trajet retour
          is_valid: true,
          match_reference: `RETOUR-${client.id}-${move.id}`,
          explanation: `Trajet retour optimisé: évite retour à vide. Distance max: ${Math.round(maxDistance)}km. Volume: ${clientVolume}/${availableVolume}m³`,
          scenario: 2
        };

        console.log(`    🎉 MATCH RETOUR VALIDÉ!`);
        return match;
      } else {
        console.log(`    ❌ Match retour rejeté: seulement ${validCriteria}/3 critères OK`);
      }

    } catch (error) {
      console.warn('⚠️ Erreur check retour:', error);
    }

    return null;
  }

  /**
   * Calcul de distance SIMPLE et RAPIDE
   */
  private static async calculateDistanceSimple(postal1: string, postal2: string): Promise<number> {
    // Si même code postal, distance = 0
    if (postal1 === postal2) {
      return 0;
    }

    try {
      // Essai Google Maps avec timeout court
      const result = await Promise.race([
        calculateDistanceByPostalCode(postal1, postal2),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000)
        )
      ]);
      
      if (result?.distance && result.distance > 0) {
        console.log(`  📍 Google Maps: ${postal1} → ${postal2} = ${result.distance}km`);
        return result.distance;
      }
    } catch (error) {
      console.log(`  ⚠️ Google Maps failed for ${postal1} → ${postal2}, using fallback`);
    }

    // Fallback basé sur départements
    return this.getFallbackDistance(postal1, postal2);
  }

  /**
   * Distance de fallback TRÈS généreuse
   */
  private static getFallbackDistance(postal1: string, postal2: string): number {
    try {
      const dept1 = parseInt(postal1.substring(0, 2));
      const dept2 = parseInt(postal2.substring(0, 2));
      
      if (isNaN(dept1) || isNaN(dept2)) {
        console.log(`  📍 Fallback: ${postal1} → ${postal2} = 50km (départements invalides)`);
        return 50;
      }
      
      const distance = Math.abs(dept1 - dept2) * 25; // 25km par département de différence
      const finalDistance = Math.max(distance, 5); // Minimum 5km
      
      console.log(`  📍 Fallback: dept ${dept1} → dept ${dept2} = ${finalDistance}km`);
      return finalDistance;
    } catch (error) {
      console.log(`  📍 Fallback error: ${postal1} → ${postal2} = 50km (par défaut)`);
      return 50;
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
      const diffTime = Math.abs(d1.getTime() - d2.getTime());
      const diffDays = diffTime / (1000 * 3600 * 24);
      return diffDays;
    } catch (error) {
      console.error('❌ Erreur calcul date:', error);
      return 999;
    }
  }

  /**
   * Trouve tous les matchs pour l'onglet matching - VERSION OPTIMISÉE
   */
  public static async findAllMatches(): Promise<MatchResult[]> {
    console.log('🎯 === RECHERCHE GLOBALE DE TOUS LES MATCHS ===');

    try {
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .in('status', ['pending', 'confirmed'])
        .not('departure_postal_code', 'is', null)
        .not('arrival_postal_code', 'is', null)
        .not('desired_date', 'is', null)
        .limit(100);

      if (clientsError || !clients || clients.length === 0) {
        console.error('❌ Aucun client trouvé:', clientsError);
        return [];
      }

      console.log(`👥 ${clients.length} clients éligibles pour le matching:`);
      clients.forEach(client => {
        console.log(`- ${client.name} (${client.client_reference}): ${client.departure_postal_code} → ${client.arrival_postal_code}`);
      });

      const allMatches: MatchResult[] = [];
      
      // Traitement séquentiel pour debug
      for (const client of clients) {
        try {
          console.log(`\n🔍 === ANALYSE CLIENT: ${client.name} ===`);
          const clientMatches = await this.findMatchesForClient(client);
          allMatches.push(...clientMatches);
          console.log(`✅ ${clientMatches.length} matchs trouvés pour ${client.name}`);
        } catch (error) {
          console.error(`❌ Erreur client ${client.id}:`, error);
        }
      }

      console.log(`\n🎉 === RÉSULTATS GLOBAUX ===`);
      console.log(`📊 ${allMatches.length} matchs totaux trouvés`);
      console.log(`📊 Répartition: ${allMatches.filter(m => m.scenario === 1).length} aller, ${allMatches.filter(m => m.scenario === 2).length} retour`);
      
      return allMatches.filter(match => match.is_valid);
      
    } catch (error) {
      console.error('❌ Erreur recherche globale matchs:', error);
      return [];
    }
  }
}
