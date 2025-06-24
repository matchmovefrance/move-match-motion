
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
   * NOUVELLE LOGIQUE SIMPLE ET EFFICACE
   */
  public static async findMatchesForClient(client: MovingClient): Promise<MatchResult[]> {
    console.log(`🎯 MATCHING SIMPLE pour ${client.name} (${client.departure_postal_code} → ${client.arrival_postal_code})`);
    
    if (!client.departure_postal_code || !client.arrival_postal_code) {
      console.log('❌ Codes postaux client manquants');
      return [];
    }

    const matches: MatchResult[] = [];
    
    try {
      // Récupérer TOUS les trajets
      const { data: moves, error } = await supabase
        .from('confirmed_moves')
        .select('*');

      if (error || !moves) {
        console.error('❌ Erreur DB:', error);
        return [];
      }

      console.log(`📋 ${moves.length} trajets en base de données`);

      // TRAITEMENT SIMPLE POUR CHAQUE TRAJET
      for (const move of moves) {
        if (!move.departure_postal_code || !move.arrival_postal_code) {
          continue;
        }

        console.log(`🔍 Analyse ${move.company_name}: ${move.departure_postal_code} → ${move.arrival_postal_code}`);

        // SCÉNARIO 1: MÊME DIRECTION (Client suit le camion)
        const clientDepToMoveDepDist = await this.calculateDistance(
          client.departure_postal_code, 
          move.departure_postal_code
        );
        const clientArrToMoveArrDist = await this.calculateDistance(
          client.arrival_postal_code, 
          move.arrival_postal_code
        );

        console.log(`📏 Scénario 1: Départ ${clientDepToMoveDepDist}km, Arrivée ${clientArrToMoveArrDist}km`);

        // Si les deux distances sont < 100km = MATCH
        if (clientDepToMoveDepDist <= 100 && clientArrToMoveArrDist <= 100) {
          const dateDiff = this.calculateDateDiff(client.desired_date, move.departure_date);
          
          if (dateDiff <= 7) {
            const match = this.createMatchResult(client, move, 1, 
              Math.max(clientDepToMoveDepDist, clientArrToMoveArrDist), 
              dateDiff, 
              `Trajet groupé: départ ${clientDepToMoveDepDist}km, arrivée ${clientArrToMoveArrDist}km`
            );
            matches.push(match);
            console.log(`✅ MATCH 1 créé: ${match.explanation}`);
          }
        }

        // SCÉNARIO 2: DIRECTION INVERSE (Client prend le retour)
        const clientDepToMoveArrDist = await this.calculateDistance(
          client.departure_postal_code, 
          move.arrival_postal_code
        );
        const clientArrToMoveDepDist = await this.calculateDistance(
          client.arrival_postal_code, 
          move.departure_postal_code
        );

        console.log(`📏 Scénario 2: Départ-vers-Arrivée ${clientDepToMoveArrDist}km, Arrivée-vers-Départ ${clientArrToMoveDepDist}km`);

        // Si les deux distances sont < 100km = MATCH RETOUR
        if (clientDepToMoveArrDist <= 100 && clientArrToMoveDepDist <= 100) {
          const dateDiff = this.calculateDateDiff(client.desired_date, move.departure_date);
          
          if (dateDiff <= 7) {
            const match = this.createMatchResult(client, move, 2, 
              Math.max(clientDepToMoveArrDist, clientArrToMoveDepDist), 
              dateDiff, 
              `Retour optimisé: ${clientDepToMoveArrDist}km + ${clientArrToMoveDepDist}km`
            );
            matches.push(match);
            console.log(`✅ MATCH 2 créé: ${match.explanation}`);
          }
        }
      }

      console.log(`🎉 RÉSULTAT FINAL: ${matches.length} matchs pour ${client.name}`);
      return matches;

    } catch (error) {
      console.error('❌ Erreur matching:', error);
      return [];
    }
  }

  /**
   * Calcul de distance simple avec Google Maps + fallback
   */
  private static async calculateDistance(postal1: string, postal2: string): Promise<number> {
    // Si même code postal = 0km
    if (postal1 === postal2) {
      return 0;
    }

    try {
      // Essayer Google Maps d'abord
      const result = await calculateDistanceByPostalCode(postal1, postal2);
      if (result && result.distance) {
        console.log(`📍 Google Maps: ${postal1} → ${postal2} = ${result.distance}km`);
        return result.distance;
      }
    } catch (error) {
      console.log(`⚠️ Google Maps échec pour ${postal1} → ${postal2}, utilisation fallback`);
    }

    // Fallback basé sur départements
    const dept1 = postal1.substring(0, 2);
    const dept2 = postal2.substring(0, 2);
    
    if (dept1 === dept2) {
      return 25; // Même département
    }

    const deptDiff = Math.abs(parseInt(dept1) - parseInt(dept2));
    if (deptDiff === 1) return 60;  // Départements voisins
    if (deptDiff === 2) return 90;  // Départements proches
    if (deptDiff <= 5) return 130; // Régions proches
    
    return 200; // Loin
  }

  /**
   * Calcul différence de dates
   */
  private static calculateDateDiff(date1: string | undefined, date2: string): number {
    if (!date1) return 3; // Valeur par défaut raisonnable
    
    try {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      const diffTime = Math.abs(d1.getTime() - d2.getTime());
      return Math.ceil(diffTime / (1000 * 3600 * 24));
    } catch {
      return 3;
    }
  }

  /**
   * Créer un résultat de match
   */
  private static createMatchResult(
    client: MovingClient, 
    move: MovingRoute, 
    scenario: 1 | 2, 
    distance: number, 
    dateDiff: number, 
    explanation: string
  ): MatchResult {
    const clientVolume = client.estimated_volume || 1;
    const availableVolume = (move.max_volume || 50) - (move.used_volume || 0);
    const volumeCompatible = clientVolume <= availableVolume;

    return {
      client,
      move,
      match_type: scenario === 1 ? 'grouped_outbound' : 'return_trip',
      distance_km: Math.round(distance),
      date_diff_days: Math.round(dateDiff),
      volume_compatible: volumeCompatible,
      available_volume_after: Math.max(0, availableVolume - clientVolume),
      match_score: distance + (dateDiff * 5), // Score simple
      is_valid: true, // Toujours valide car on a déjà filtré
      match_reference: `S${scenario}-${client.id}-${move.id}-${Date.now()}`,
      explanation,
      scenario: scenario
    };
  }

  /**
   * Recherche globale optimisée
   */
  public static async findAllMatches(): Promise<MatchResult[]> {
    console.log('🌍 MATCHING GLOBAL RAPIDE');

    try {
      // Prendre les 5 premiers clients pour être ultra rapide
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .not('departure_postal_code', 'is', null)
        .not('arrival_postal_code', 'is', null)
        .limit(5);

      if (error || !clients) {
        console.error('❌ Erreur clients:', error);
        return [];
      }

      console.log(`👥 ${clients.length} clients à analyser`);

      const allMatches: MatchResult[] = [];

      // Traitement séquentiel pour éviter la surcharge
      for (const client of clients) {
        const clientMatches = await this.findMatchesForClient(client);
        allMatches.push(...clientMatches);
        
        // Limite pour éviter la surcharge
        if (allMatches.length > 50) {
          break;
        }
      }

      console.log(`🎉 ${allMatches.length} matchs trouvés en TOTAL`);
      
      // Trier par score (distance + date)
      allMatches.sort((a, b) => a.match_score - b.match_score);
      
      return allMatches;

    } catch (error) {
      console.error('❌ Erreur recherche globale:', error);
      return [];
    }
  }
}
