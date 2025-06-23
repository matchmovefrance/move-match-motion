
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
  
  /**
   * Recherche de matchs pour un client - LOGIQUE SIMPLE
   */
  public static async findMatchesForClient(client: MovingClient): Promise<MatchResult[]> {
    console.log(`🔍 RECHERCHE SIMPLE pour ${client.name}`);
    
    if (!client.departure_postal_code || !client.arrival_postal_code || !client.desired_date) {
      console.log('❌ Données client incomplètes');
      return [];
    }

    const matches: MatchResult[] = [];
    
    try {
      // Récupérer tous les trajets confirmés
      const { data: moves, error } = await supabase
        .from('confirmed_moves')
        .select('*')
        .eq('status', 'confirmed');

      if (error || !moves || moves.length === 0) {
        console.log('❌ Aucun trajet trouvé');
        return [];
      }

      console.log(`📋 ${moves.length} trajets à analyser`);

      for (const move of moves) {
        // SCÉNARIO 1: Trajet dans la même direction
        const scenario1Match = await this.checkScenario1(client, move);
        if (scenario1Match) {
          matches.push(scenario1Match);
        }

        // SCÉNARIO 2: Trajet de retour
        const scenario2Match = await this.checkScenario2(client, move);
        if (scenario2Match) {
          matches.push(scenario2Match);
        }
      }

      // Trier par score (distance + date)
      matches.sort((a, b) => a.match_score - b.match_score);
      
      console.log(`✅ ${matches.length} matchs trouvés`);
      return matches.slice(0, 10); // Top 10

    } catch (error) {
      console.error('❌ Erreur recherche:', error);
      return [];
    }
  }

  /**
   * SCÉNARIO 1: Client va dans la même direction que le camion
   */
  private static async checkScenario1(client: MovingClient, move: MovingRoute): Promise<MatchResult | null> {
    console.log(`  📍 Scénario 1: ${move.company_name}`);
    
    // Calculer distance départ client <-> départ camion
    const distanceDeparture = await this.calculateDistance(
      client.departure_postal_code!,
      move.departure_postal_code
    );
    
    // Calculer distance arrivée client <-> arrivée camion  
    const distanceArrival = await this.calculateDistance(
      client.arrival_postal_code!,
      move.arrival_postal_code
    );

    if (distanceDeparture === null || distanceArrival === null) {
      return null;
    }

    const maxDistance = Math.max(distanceDeparture, distanceArrival);
    console.log(`    Distances: départ=${distanceDeparture}km, arrivée=${distanceArrival}km, max=${maxDistance}km`);

    // Vérifications simples
    if (maxDistance > 50) { // Distance raisonnable
      console.log(`    ❌ Trop loin: ${maxDistance}km`);
      return null;
    }

    const dateDiff = this.calculateDateDiff(client.desired_date!, move.departure_date);
    if (dateDiff > 7) { // 1 semaine max
      console.log(`    ❌ Date trop éloignée: ${dateDiff} jours`);
      return null;
    }

    const clientVolume = client.estimated_volume || 1;
    const availableVolume = move.max_volume - move.used_volume;
    
    if (clientVolume > availableVolume) {
      console.log(`    ❌ Pas assez de volume: ${clientVolume} > ${availableVolume}`);
      return null;
    }

    console.log(`    ✅ MATCH Scénario 1 validé`);

    return {
      client,
      move,
      match_type: 'grouped_outbound',
      distance_km: Math.round(maxDistance),
      date_diff_days: Math.round(dateDiff),
      volume_compatible: true,
      available_volume_after: availableVolume - clientVolume,
      match_score: maxDistance + (dateDiff * 2),
      is_valid: true,
      match_reference: `S1-${client.id}-${move.id}`,
      explanation: `Trajet groupé: départ à ${distanceDeparture}km, arrivée à ${distanceArrival}km`,
      scenario: 1
    };
  }

  /**
   * SCÉNARIO 2: Client prend le trajet de retour du camion
   */
  private static async checkScenario2(client: MovingClient, move: MovingRoute): Promise<MatchResult | null> {
    console.log(`  🔄 Scénario 2: ${move.company_name}`);
    
    // Le camion va de A à B, le client veut aller de B vers A (ou proche)
    // Départ client <-> Arrivée camion
    const distanceDeparture = await this.calculateDistance(
      client.departure_postal_code!,
      move.arrival_postal_code
    );
    
    // Arrivée client <-> Départ camion
    const distanceArrival = await this.calculateDistance(
      client.arrival_postal_code!,
      move.departure_postal_code
    );

    if (distanceDeparture === null || distanceArrival === null) {
      return null;
    }

    const maxDistance = Math.max(distanceDeparture, distanceArrival);
    console.log(`    Distances retour: départ=${distanceDeparture}km, arrivée=${distanceArrival}km, max=${maxDistance}km`);

    // Vérifications
    if (maxDistance > 50) {
      console.log(`    ❌ Trop loin pour retour: ${maxDistance}km`);
      return null;
    }

    const dateDiff = this.calculateDateDiff(client.desired_date!, move.departure_date);
    if (dateDiff > 7) {
      console.log(`    ❌ Date trop éloignée: ${dateDiff} jours`);
      return null;
    }

    const clientVolume = client.estimated_volume || 1;
    const availableVolume = move.max_volume - move.used_volume;
    
    if (clientVolume > availableVolume) {
      console.log(`    ❌ Pas assez de volume: ${clientVolume} > ${availableVolume}`);
      return null;
    }

    console.log(`    ✅ MATCH Scénario 2 validé`);

    return {
      client,
      move,
      match_type: 'return_trip',
      distance_km: Math.round(maxDistance),
      date_diff_days: Math.round(dateDiff),
      volume_compatible: true,
      available_volume_after: availableVolume - clientVolume,
      match_score: maxDistance + (dateDiff * 2) - 10, // Bonus retour
      is_valid: true,
      match_reference: `S2-${client.id}-${move.id}`,
      explanation: `Trajet retour: évite retour à vide, distance max ${maxDistance}km`,
      scenario: 2
    };
  }

  /**
   * Calcul de distance simple
   */
  private static async calculateDistance(postal1: string, postal2: string): Promise<number | null> {
    // Même code postal = 0km
    if (postal1 === postal2) {
      return 0;
    }

    try {
      // Essayer Google Maps avec timeout court
      const result = await Promise.race([
        calculateDistanceByPostalCode(postal1, postal2),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        )
      ]);
      
      if (result?.distance && result.distance > 0) {
        return result.distance;
      }
    } catch (error) {
      console.log(`⚠️ Google Maps échoué, fallback`);
    }

    // Fallback simple par département
    const dept1 = postal1.substring(0, 2);
    const dept2 = postal2.substring(0, 2);
    
    if (dept1 === dept2) {
      return 25; // Même département = 25km en moyenne
    }
    
    const deptDiff = Math.abs(parseInt(dept1) - parseInt(dept2));
    if (deptDiff === 1) return 60; // Départements voisins
    if (deptDiff <= 3) return 120;
    return 200; // Loin
  }

  /**
   * Calcul différence de dates en jours
   */
  private static calculateDateDiff(date1: string, date2: string): number {
    try {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      const diffTime = Math.abs(d1.getTime() - d2.getTime());
      return diffTime / (1000 * 3600 * 24);
    } catch {
      return 999;
    }
  }

  /**
   * Recherche globale pour tous les clients
   */
  public static async findAllMatches(): Promise<MatchResult[]> {
    console.log('🌍 RECHERCHE GLOBALE SIMPLE');

    try {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .in('status', ['pending', 'confirmed'])
        .not('departure_postal_code', 'is', null)
        .not('arrival_postal_code', 'is', null)
        .not('desired_date', 'is', null)
        .limit(20);

      if (error || !clients) {
        console.error('❌ Erreur clients:', error);
        return [];
      }

      console.log(`👥 ${clients.length} clients à analyser`);

      const allMatches: MatchResult[] = [];

      for (const client of clients) {
        const clientMatches = await this.findMatchesForClient(client);
        allMatches.push(...clientMatches);
      }

      console.log(`🎉 ${allMatches.length} matchs au total`);
      return allMatches;

    } catch (error) {
      console.error('❌ Erreur recherche globale:', error);
      return [];
    }
  }
}
