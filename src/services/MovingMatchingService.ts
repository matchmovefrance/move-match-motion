
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
  // Critères professionnels intelligents
  private static readonly MAX_DISTANCE_KM = 100;
  private static readonly MAX_DATE_DIFF_DAYS = 15;
  private static readonly MIN_VOLUME_EFFICIENCY = 0.2; // 20% minimum plus réaliste

  /**
   * Recherche intelligente de matchs pour un client
   */
  public static async findMatchesForClient(client: MovingClient): Promise<MatchResult[]> {
    console.log(`🎯 MATCHING INTELLIGENT pour ${client.name} (${client.client_reference})`);
    
    if (!this.validateClientData(client)) {
      console.log('❌ Données client invalides');
      return [];
    }

    const matches: MatchResult[] = [];
    
    try {
      // Récupérer TOUS les trajets confirmés disponibles
      const { data: moves, error } = await supabase
        .from('confirmed_moves')
        .select('*')
        .eq('status', 'confirmed')
        .order('departure_date', { ascending: true });

      if (error || !moves || moves.length === 0) {
        console.log('❌ Aucun trajet disponible:', error);
        return [];
      }

      console.log(`📋 Analyse intelligente de ${moves.length} trajets`);

      // Analyse intelligente de chaque trajet
      for (const move of moves) {
        try {
          // Scénario 1: Trajet aller groupé (même direction)
          const outboundMatch = await this.analyzeIntelligentMatch(client, move, 'outbound');
          if (outboundMatch) {
            matches.push(outboundMatch);
          }

          // Scénario 2: Trajet retour optimisé
          const returnMatch = await this.analyzeIntelligentMatch(client, move, 'return');
          if (returnMatch) {
            matches.push(returnMatch);
          }

        } catch (error) {
          console.warn(`⚠️ Erreur analyse trajet ${move.id}:`, error);
        }
      }

    } catch (error) {
      console.error('❌ Erreur recherche matchs:', error);
    }

    // Tri intelligent par score (distance + compatibilité)
    const validMatches = matches.filter(m => m.is_valid);
    validMatches.sort((a, b) => a.match_score - b.match_score);
    
    // Top 15 matchs les plus pertinents
    const topMatches = validMatches.slice(0, 15);
    
    console.log(`🎉 ${topMatches.length} matchs intelligents trouvés pour ${client.name}`);
    
    return topMatches;
  }

  /**
   * Analyse intelligente d'un match potentiel
   */
  private static async analyzeIntelligentMatch(
    client: MovingClient, 
    move: MovingRoute, 
    type: 'outbound' | 'return'
  ): Promise<MatchResult | null> {
    
    console.log(`  🧠 Analyse ${type.toUpperCase()}: ${move.company_name}`);

    // Configuration des points selon le type
    let clientDeparture: [string, string];
    let clientArrival: [string, string];
    let moveDeparture: [string, string];
    let moveArrival: [string, string];

    if (type === 'outbound') {
      // Trajet aller: même direction
      clientDeparture = [client.departure_postal_code!, client.departure_city!];
      clientArrival = [client.arrival_postal_code!, client.arrival_city!];
      moveDeparture = [move.departure_postal_code, move.departure_city!];
      moveArrival = [move.arrival_postal_code, move.arrival_city!];
    } else {
      // Trajet retour: client prend le retour du camion
      clientDeparture = [client.departure_postal_code!, client.departure_city!];
      clientArrival = [client.arrival_postal_code!, client.arrival_city!];
      moveDeparture = [move.arrival_postal_code, move.arrival_city!]; // Retour depuis l'arrivée
      moveArrival = [move.departure_postal_code, move.departure_city!]; // Vers le départ
    }

    // Calcul intelligent des distances
    const distance1 = await this.calculateIntelligentDistance(clientDeparture, moveDeparture);
    const distance2 = await this.calculateIntelligentDistance(clientArrival, moveArrival);

    if (distance1 === null || distance2 === null) {
      console.log(`    ❌ Impossible de calculer les distances`);
      return null;
    }

    const maxDistance = Math.max(distance1, distance2);
    console.log(`    📏 Distances: ${distance1}km ↔ ${distance2}km, max=${maxDistance}km`);

    // Vérification professionnelle de la distance
    if (maxDistance > this.MAX_DISTANCE_KM) {
      console.log(`    ❌ Distance excessive: ${maxDistance}km > ${this.MAX_DISTANCE_KM}km`);
      return null;
    }

    // Vérification intelligente des dates
    const dateDiff = this.calculateDateDifference(client.desired_date!, move.departure_date);
    if (dateDiff > this.MAX_DATE_DIFF_DAYS) {
      console.log(`    ❌ Écart de date trop important: ${dateDiff} jours`);
      return null;
    }

    // Vérification du volume disponible
    const clientVolume = client.estimated_volume || 1;
    const availableVolume = Math.max(0, move.max_volume - move.used_volume);
    
    if (clientVolume > availableVolume) {
      console.log(`    ❌ Volume insuffisant: ${clientVolume}m³ > ${availableVolume}m³`);
      return null;
    }

    // Score intelligent: distance + pénalité date + bonus type
    const dateBonus = dateDiff <= 3 ? -10 : 0; // Bonus si proche en date
    const typeBonus = type === 'return' ? -15 : 0; // Bonus trajet retour (évite retour vide)
    const volumeBonus = clientVolume >= (move.max_volume * this.MIN_VOLUME_EFFICIENCY) ? -5 : 0;
    
    const match: MatchResult = {
      client,
      move,
      match_type: type === 'outbound' ? 'grouped_outbound' : 'return_trip',
      distance_km: Math.round(maxDistance),
      date_diff_days: Math.round(dateDiff),
      volume_compatible: true,
      available_volume_after: Math.max(0, availableVolume - clientVolume),
      match_score: maxDistance + (dateDiff * 3) + dateBonus + typeBonus + volumeBonus,
      is_valid: true,
      match_reference: `${type.toUpperCase()}-${client.id}-${move.id}`,
      explanation: type === 'outbound' 
        ? `Trajet groupé: ${Math.round(distance1)}km départ, ${Math.round(distance2)}km arrivée. Volume: ${clientVolume}/${availableVolume}m³`
        : `Trajet retour optimisé: ${Math.round(maxDistance)}km max, évite retour à vide. Volume: ${clientVolume}/${availableVolume}m³`,
      scenario: type === 'outbound' ? 1 : 2
    };

    console.log(`    ✅ MATCH ${type.toUpperCase()} VALIDÉ - Score: ${match.match_score}`);
    return match;
  }

  /**
   * Calcul intelligent de distance avec optimisations
   */
  private static async calculateIntelligentDistance(
    point1: [string, string], 
    point2: [string, string]
  ): Promise<number | null> {
    
    const [postal1, city1] = point1;
    const [postal2, city2] = point2;

    // Même code postal = distance 0
    if (postal1 === postal2) {
      return 0;
    }

    try {
      console.log(`  🗺️ Distance Google Maps: ${postal1} ${city1} → ${postal2} ${city2}`);
      
      // Timeout réduit pour performance
      const result = await Promise.race([
        calculateDistanceByPostalCode(postal1, postal2, city1, city2),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout Google Maps')), 2000)
        )
      ]);
      
      if (result?.distance && result.distance > 0) {
        console.log(`  ✅ Distance calculée: ${result.distance}km`);
        return result.distance;
      }
    } catch (error) {
      console.log(`  ⚠️ Google Maps échoué: ${error.message}`);
    }

    // Fallback intelligent basé sur les codes postaux
    const fallbackDistance = this.calculateFallbackDistance(postal1, postal2);
    console.log(`  🔄 Distance fallback: ${fallbackDistance}km`);
    return fallbackDistance;
  }

  /**
   * Calcul fallback intelligent basé sur les codes postaux
   */
  private static calculateFallbackDistance(postal1: string, postal2: string): number {
    // Extraction des départements
    const dept1 = postal1.substring(0, 2);
    const dept2 = postal2.substring(0, 2);
    
    if (dept1 === dept2) {
      // Même département: distance locale
      const zone1 = parseInt(postal1.substring(2, 3) || '0');
      const zone2 = parseInt(postal2.substring(2, 3) || '0');
      return Math.abs(zone1 - zone2) * 15 + 25; // 25-85km dans le département
    }
    
    // Départements différents: distance inter-départementale
    const deptNum1 = parseInt(dept1);
    const deptNum2 = parseInt(dept2);
    const deptDiff = Math.abs(deptNum1 - deptNum2);
    
    // Estimation basée sur la proximité géographique des départements
    if (deptDiff === 1) return 80; // Départements adjacents
    if (deptDiff <= 3) return 150; // Départements proches
    if (deptDiff <= 10) return 300; // Départements moyennement éloignés
    return 500; // Départements éloignés
  }

  /**
   * Validation stricte mais intelligente des données client
   */
  private static validateClientData(client: MovingClient): boolean {
    const hasRequiredData = !!(
      client.departure_postal_code?.trim() &&
      client.arrival_postal_code?.trim() &&
      client.departure_city?.trim() &&
      client.arrival_city?.trim() &&
      client.desired_date?.trim()
    );

    if (!hasRequiredData) {
      console.log('❌ Données client incomplètes');
      return false;
    }

    // Validation intelligente des codes postaux français
    const postalRegex = /^[0-9]{5}$/;
    if (!postalRegex.test(client.departure_postal_code!) || 
        !postalRegex.test(client.arrival_postal_code!)) {
      console.log('❌ Codes postaux invalides');
      return false;
    }

    return true;
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
   * Recherche globale intelligente de tous les matchs
   */
  public static async findAllMatches(): Promise<MatchResult[]> {
    console.log('🧠 === RECHERCHE GLOBALE INTELLIGENTE ===');

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
        .order('created_at', { ascending: false })
        .limit(30); // Limite raisonnable

      if (clientsError || !clients || clients.length === 0) {
        console.error('❌ Aucun client trouvé:', clientsError);
        return [];
      }

      console.log(`👥 ${clients.length} clients éligibles pour matching intelligent`);

      const allMatches: MatchResult[] = [];
      
      // Traitement séquentiel pour précision
      for (const client of clients) {
        try {
          console.log(`\n🔍 === ANALYSE INTELLIGENTE: ${client.name} ===`);
          const clientMatches = await this.findMatchesForClient(client);
          allMatches.push(...clientMatches);
          
          // Pause courte pour éviter la surcharge
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`❌ Erreur client ${client.id}:`, error);
        }
      }

      console.log(`\n🎉 === RÉSULTATS INTELLIGENTS ===`);
      console.log(`📊 ${allMatches.length} matchs intelligents trouvés`);
      console.log(`📊 Répartition: ${allMatches.filter(m => m.scenario === 1).length} aller, ${allMatches.filter(m => m.scenario === 2).length} retour`);
      
      return allMatches;
      
    } catch (error) {
      console.error('❌ Erreur recherche globale intelligente:', error);
      return [];
    }
  }
}
