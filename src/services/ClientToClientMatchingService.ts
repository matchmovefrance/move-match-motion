
import { supabase } from '@/integrations/supabase/client';
import { calculateDistanceByPostalCode } from '@/lib/google-maps-config';

export interface ClientMatchResult {
  client1: {
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
  client2: {
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
  match_type: 'same_route' | 'complementary_route';
  distance_km: number;
  date_diff_days: number;
  combined_volume: number;
  match_score: number;
  is_feasible: boolean;
  explanation: string;
  suggested_action: string;
}

export class ClientToClientMatchingService {
  
  /**
   * Recherche de matchs client-à-client
   */
  public static async findClientToClientMatches(): Promise<ClientMatchResult[]> {
    console.log('🤝 MATCHING CLIENT-À-CLIENT - Recherche de paires compatibles');
    
    try {
      // Récupérer tous les clients avec trajets définis
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .not('departure_postal_code', 'is', null)
        .not('arrival_postal_code', 'is', null)
        .not('desired_date', 'is', null);

      if (error || !clients) {
        console.error('❌ Erreur récupération clients:', error);
        return [];
      }

      console.log(`👥 ${clients.length} clients à analyser pour matching`);

      const matches: ClientMatchResult[] = [];

      // Analyser chaque paire de clients
      for (let i = 0; i < clients.length; i++) {
        for (let j = i + 1; j < clients.length; j++) {
          const client1 = clients[i];
          const client2 = clients[j];

          console.log(`🔍 Analyse paire: ${client1.name} x ${client2.name}`);

          // SCÉNARIO 1: Même trajet (A→B + A→B)
          const sameRouteMatch = await this.analyzeSameRoute(client1, client2);
          if (sameRouteMatch) {
            matches.push(sameRouteMatch);
          }

          // SCÉNARIO 2: Trajets complémentaires (A→B + B→A)
          const complementaryMatch = await this.analyzeComplementaryRoute(client1, client2);
          if (complementaryMatch) {
            matches.push(complementaryMatch);
          }
        }
      }

      console.log(`🎉 ${matches.length} matchs client-à-client trouvés`);
      return matches.sort((a, b) => a.match_score - b.match_score);

    } catch (error) {
      console.error('❌ Erreur matching client-à-client:', error);
      return [];
    }
  }

  /**
   * Analyser si 2 clients ont le même trajet
   */
  private static async analyzeSameRoute(client1: any, client2: any): Promise<ClientMatchResult | null> {
    try {
      // Distance entre les départs
      const departureDistance = await this.calculateDistance(
        client1.departure_postal_code, 
        client2.departure_postal_code
      );

      // Distance entre les arrivées  
      const arrivalDistance = await this.calculateDistance(
        client1.arrival_postal_code,
        client2.arrival_postal_code
      );

      console.log(`📏 Même trajet: Départ ${departureDistance}km, Arrivée ${arrivalDistance}km`);

      // Si les deux distances sont < 50km = trajet similaire
      if (departureDistance <= 50 && arrivalDistance <= 50) {
        const dateDiff = this.calculateDateDiff(client1.desired_date, client2.desired_date);
        
        if (dateDiff <= 7) {
          const combinedVolume = (client1.estimated_volume || 5) + (client2.estimated_volume || 5);
          const maxDistance = Math.max(departureDistance, arrivalDistance);
          
          return {
            client1,
            client2,
            match_type: 'same_route',
            distance_km: Math.round(maxDistance),
            date_diff_days: Math.round(dateDiff),
            combined_volume: combinedVolume,
            match_score: maxDistance + (dateDiff * 3),
            is_feasible: combinedVolume <= 50, // Capacité camion standard
            explanation: `Trajet similaire: ${departureDistance}km entre départs, ${arrivalDistance}km entre arrivées`,
            suggested_action: combinedVolume <= 50 
              ? "Grouper ces 2 clients sur un même camion" 
              : "Contacter un prestataire pour organiser un trajet dédié à ces 2 clients"
          };
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Erreur analyse même trajet:', error);
      return null;
    }
  }

  /**
   * Analyser si 2 clients ont des trajets complémentaires
   */
  private static async analyzeComplementaryRoute(client1: any, client2: any): Promise<ClientMatchResult | null> {
    try {
      // Client1: A→B, Client2: B→A (ou proche)
      const crossDistance1 = await this.calculateDistance(
        client1.departure_postal_code,
        client2.arrival_postal_code
      );

      const crossDistance2 = await this.calculateDistance(
        client1.arrival_postal_code,
        client2.departure_postal_code
      );

      console.log(`📏 Trajet complémentaire: ${crossDistance1}km + ${crossDistance2}km`);

      // Si les trajets se complètent (< 50km entre connexions)
      if (crossDistance1 <= 50 && crossDistance2 <= 50) {
        const dateDiff = this.calculateDateDiff(client1.desired_date, client2.desired_date);
        
        if (dateDiff <= 7) {
          const combinedVolume = (client1.estimated_volume || 5) + (client2.estimated_volume || 5);
          const maxDistance = Math.max(crossDistance1, crossDistance2);
          
          return {
            client1,
            client2,
            match_type: 'complementary_route',
            distance_km: Math.round(maxDistance),
            date_diff_days: Math.round(dateDiff),
            combined_volume: combinedVolume,
            match_score: maxDistance + (dateDiff * 3),
            is_feasible: combinedVolume <= 50,
            explanation: `Trajets complémentaires: ${client1.departure_city}→${client1.arrival_city} puis ${client2.departure_city}→${client2.arrival_city}`,
            suggested_action: combinedVolume <= 50
              ? "Organiser un trajet en boucle pour ces 2 clients"
              : "Contacter un prestataire pour créer un circuit dédié à ces 2 clients"
          };
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Erreur analyse trajet complémentaire:', error);
      return null;
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
    if (!date1) return 3;
    
    try {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      const diffTime = Math.abs(d1.getTime() - d2.getTime());
      return Math.ceil(diffTime / (1000 * 3600 * 24));
    } catch {
      return 3;
    }
  }
}
