import { supabase } from '@/integrations/supabase/client';
import { loadGoogleMapsScript } from '@/lib/google-maps-config';

export interface MatchScenario {
  type: 'grouped_outbound' | 'return_trip' | 'loop_optimization';
  clients: Array<{
    id: number;
    name: string;
    departure_postal_code: string;
    arrival_postal_code: string;
    departure_city?: string;
    arrival_city?: string;
    desired_date?: string;
    estimated_volume?: number;
  }>;
  move: {
    id: number;
    company_name: string;
    departure_postal_code: string;
    arrival_postal_code: string;
    departure_city?: string;
    arrival_city?: string;
    departure_date: string;
    max_volume: number;
    used_volume: number;
  };
  total_detour_km: number;
  total_volume_used: number;
  savings_km: number;
  savings_percentage: number;
  route_waypoints: Array<{
    location: string;
    type: 'pickup' | 'delivery' | 'truck_start' | 'truck_end';
    client_id?: number;
  }>;
  is_feasible: boolean;
  match_score: number;
}

export class AdvancedMatchingEngine {
  private static directionsService: google.maps.DirectionsService | null = null;
  private static distanceMatrixService: google.maps.DistanceMatrixService | null = null;

  static async initialize(): Promise<void> {
    await loadGoogleMapsScript();
    if (window.google?.maps) {
      this.directionsService = new google.maps.DirectionsService();
      this.distanceMatrixService = new google.maps.DistanceMatrixService();
    }
  }

  /**
   * SCÉNARIO 1: ALLER GROUPÉ
   * Trouve les clients dont le trajet peut être intégré dans le trajet du camion
   */
  static async findGroupedOutboundMatches(): Promise<MatchScenario[]> {
    console.log('🚚 SCÉNARIO 1: Recherche aller groupé');
    
    const scenarios: MatchScenario[] = [];
    
    try {
      // Récupérer les données
      const [clientsResult, movesResult] = await Promise.all([
        supabase.from('clients').select('*').not('departure_postal_code', 'is', null).not('arrival_postal_code', 'is', null),
        supabase.from('confirmed_moves').select('*').not('departure_postal_code', 'is', null).not('arrival_postal_code', 'is', null)
      ]);

      const clients = clientsResult.data || [];
      const moves = movesResult.data || [];

      console.log(`📊 ${clients.length} clients, ${moves.length} trajets`);

      // Pour chaque trajet de camion
      for (const move of moves.slice(0, 10)) { // Limite pour tests
        const compatibleClients = [];

        // Pour chaque client
        for (const client of clients.slice(0, 20)) { // Limite pour tests
          // Vérifier compatibilité des dates (±15 jours)
          const dateCompatible = this.isDateCompatible(client.desired_date, move.departure_date, 15);
          if (!dateCompatible) continue;

          // Vérifier si le client peut être intégré dans le trajet
          const detourDistance = await this.calculateDetourDistance(
            move.departure_postal_code,
            move.arrival_postal_code,
            client.departure_postal_code,
            client.arrival_postal_code
          );

          if (detourDistance && detourDistance <= 100) {
            compatibleClients.push({
              client,
              detour_km: detourDistance
            });
          }
        }

        // Si on a des clients compatibles, créer un scénario
        if (compatibleClients.length > 0) {
          // Optimiser la sélection des clients (volume + détour)
          const selectedClients = this.optimizeClientSelection(compatibleClients, move);
          
          if (selectedClients.length > 0) {
            const scenario = await this.createGroupedScenario(move, selectedClients);
            if (scenario.is_feasible) {
              scenarios.push(scenario);
            }
          }
        }
      }

      console.log(`✅ ${scenarios.length} scénarios aller groupé trouvés`);
      return scenarios;

    } catch (error) {
      console.error('❌ Erreur scénario 1:', error);
      return [];
    }
  }

  /**
   * SCÉNARIO 2: RETOUR OCCUPÉ
   * Trouve les clients qui peuvent utiliser le trajet retour
   */
  static async findReturnTripMatches(): Promise<MatchScenario[]> {
    console.log('🔄 SCÉNARIO 2: Recherche retour occupé');
    
    const scenarios: MatchScenario[] = [];
    
    try {
      const [clientsResult, movesResult] = await Promise.all([
        supabase.from('clients').select('*').not('departure_postal_code', 'is', null).not('arrival_postal_code', 'is', null),
        supabase.from('confirmed_moves').select('*').not('departure_postal_code', 'is', null).not('arrival_postal_code', 'is', null)
      ]);

      const clients = clientsResult.data || [];
      const moves = movesResult.data || [];

      // Pour chaque trajet de camion
      for (const move of moves.slice(0, 10)) {
        const returnClients = [];

        // Chercher des clients qui veulent aller dans la direction inverse
        for (const client of clients.slice(0, 20)) {
          // Client part de la zone d'arrivée du camion et va vers la zone de départ
          const departureDistance = await this.calculateDirectDistance(
            client.departure_postal_code,
            move.arrival_postal_code
          );
          
          const arrivalDistance = await this.calculateDirectDistance(
            client.arrival_postal_code,
            move.departure_postal_code
          );

          // Si les deux distances sont < 100km, c'est un trajet retour potentiel
          if (departureDistance <= 100 && arrivalDistance <= 100) {
            // Vérifier compatibilité des dates (camion arrive + quelques jours)
            const returnDate = this.addDaysToDate(move.departure_date, 1); // Retour le lendemain
            const dateCompatible = this.isDateCompatible(client.desired_date, returnDate, 7);
            
            if (dateCompatible) {
              returnClients.push({
                client,
                departure_distance_km: departureDistance,
                arrival_distance_km: arrivalDistance
              });
            }
          }
        }

        // Créer des scénarios pour les trajets retour
        if (returnClients.length > 0) {
          for (const returnClient of returnClients.slice(0, 3)) { // Max 3 par trajet
            const scenario = await this.createReturnScenario(move, returnClient);
            if (scenario.is_feasible) {
              scenarios.push(scenario);
            }
          }
        }
      }

      console.log(`✅ ${scenarios.length} scénarios retour occupé trouvés`);
      return scenarios;

    } catch (error) {
      console.error('❌ Erreur scénario 2:', error);
      return [];
    }
  }

  /**
   * SCÉNARIO 3: BOUCLE OPTIMISÉE
   * Trouve des boucles avec plusieurs clients
   */
  static async findLoopOptimization(): Promise<MatchScenario[]> {
    console.log('🔄 SCÉNARIO 3: Recherche boucles optimisées');
    
    const scenarios: MatchScenario[] = [];
    
    try {
      const [clientsResult, movesResult] = await Promise.all([
        supabase.from('clients').select('*').not('departure_postal_code', 'is', null).not('arrival_postal_code', 'is', null).limit(15),
        supabase.from('confirmed_moves').select('*').not('departure_postal_code', 'is', null).not('arrival_postal_code', 'is', null).limit(5)
      ]);

      const clients = clientsResult.data || [];
      const moves = movesResult.data || [];

      // Pour chaque trajet de camion
      for (const move of moves) {
        // Grouper les clients par proximité géographique
        const clientClusters = await this.createClientClusters(clients, move);
        
        // Pour chaque cluster, essayer de créer une boucle
        for (const cluster of clientClusters) {
          if (cluster.length >= 2) {
            const loopScenario = await this.createLoopScenario(move, cluster);
            if (loopScenario.is_feasible) {
              scenarios.push(loopScenario);
            }
          }
        }
      }

      console.log(`✅ ${scenarios.length} scénarios boucle trouvés`);
      return scenarios;

    } catch (error) {
      console.error('❌ Erreur scénario 3:', error);
      return [];
    }
  }

  /**
   * OPTIMISATION GLOBALE
   * Lance les 3 scénarios et retourne les meilleurs matches
   */
  static async optimizeAllRoutes(): Promise<{
    scenarios: MatchScenario[];
    summary: {
      total_scenarios: number;
      total_km_saved: number;
      total_clients_matched: number;
      best_scenario: MatchScenario | null;
    };
  }> {
    console.log('🎯 OPTIMISATION GLOBALE - Lancement des 3 scénarios');
    
    await this.initialize();
    
    const [scenario1, scenario2, scenario3] = await Promise.all([
      this.findGroupedOutboundMatches(),
      this.findReturnTripMatches(),
      this.findLoopOptimization()
    ]);

    const allScenarios = [...scenario1, ...scenario2, ...scenario3];
    
    // Trier par score de match (meilleur en premier)
    allScenarios.sort((a, b) => b.match_score - a.match_score);
    
    const totalKmSaved = allScenarios.reduce((sum, s) => sum + s.savings_km, 0);
    const totalClientsMatched = allScenarios.reduce((sum, s) => sum + s.clients.length, 0);
    const bestScenario = allScenarios[0] || null;

    console.log(`🎉 RÉSULTAT FINAL: ${allScenarios.length} scénarios, ${totalKmSaved}km économisés, ${totalClientsMatched} clients matchés`);

    return {
      scenarios: allScenarios.slice(0, 20), // Top 20
      summary: {
        total_scenarios: allScenarios.length,
        total_km_saved: totalKmSaved,
        total_clients_matched: totalClientsMatched,
        best_scenario: bestScenario
      }
    };
  }

  // MÉTHODES UTILITAIRES

  private static async calculateDetourDistance(
    truckStart: string,
    truckEnd: string,
    clientStart: string,
    clientEnd: string
  ): Promise<number> {
    if (!this.directionsService) return 999;

    try {
      // Trajet direct du camion
      const directRoute = await this.getDirectionsDistance(truckStart, truckEnd);
      
      // Trajet avec détour: camion -> client départ -> client arrivée -> camion arrivée
      const detourRoute = await this.getDirectionsDistance(
        truckStart,
        truckEnd,
        [clientStart, clientEnd]
      );

      if (directRoute && detourRoute) {
        return Math.round(detourRoute - directRoute);
      }
      
      return 999;
    } catch (error) {
      console.error('Erreur calcul détour:', error);
      return 999;
    }
  }

  private static async calculateDirectDistance(postal1: string, postal2: string): Promise<number> {
    if (!this.distanceMatrixService) return 999;

    return new Promise((resolve) => {
      this.distanceMatrixService!.getDistanceMatrix({
        origins: [`${postal1}, France`],
        destinations: [`${postal2}, France`],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC
      }, (response, status) => {
        if (status === 'OK' && response?.rows[0]?.elements[0]?.distance) {
          const distanceKm = Math.round(response.rows[0].elements[0].distance.value / 1000);
          resolve(distanceKm);
        } else {
          resolve(999);
        }
      });
    });
  }

  private static async getDirectionsDistance(origin: string, destination: string, waypoints: string[] = []): Promise<number> {
    if (!this.directionsService) return 0;

    return new Promise((resolve) => {
      const waypointsObj = waypoints.map(wp => ({ location: `${wp}, France`, stopover: true }));
      
      this.directionsService!.route({
        origin: `${origin}, France`,
        destination: `${destination}, France`,
        waypoints: waypointsObj,
        travelMode: google.maps.TravelMode.DRIVING
      }, (result, status) => {
        if (status === 'OK' && result?.routes[0]) {
          const totalDistance = result.routes[0].legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0);
          resolve(Math.round(totalDistance / 1000));
        } else {
          resolve(0);
        }
      });
    });
  }

  private static isDateCompatible(clientDate: string | undefined, moveDate: string, toleranceDays: number): boolean {
    if (!clientDate) return true; // Pas de date = flexible
    
    try {
      const clientD = new Date(clientDate);
      const moveD = new Date(moveDate);
      const diffDays = Math.abs((clientD.getTime() - moveD.getTime()) / (1000 * 3600 * 24));
      return diffDays <= toleranceDays;
    } catch {
      return false;
    }
  }

  private static addDaysToDate(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  private static optimizeClientSelection(compatibleClients: any[], move: any): any[] {
    // Trier par détour croissant et sélectionner selon le volume disponible
    compatibleClients.sort((a, b) => a.detour_km - b.detour_km);
    
    const availableVolume = (move.max_volume || 50) - (move.used_volume || 0);
    const selected = [];
    let usedVolume = 0;
    
    for (const item of compatibleClients) {
      const clientVolume = item.client.estimated_volume || 5;
      if (usedVolume + clientVolume <= availableVolume) {
        selected.push(item);
        usedVolume += clientVolume;
      }
    }
    
    return selected;
  }

  private static async createGroupedScenario(move: any, selectedClients: any[]): Promise<MatchScenario> {
    const clients = selectedClients.map(sc => sc.client);
    const totalDetour = selectedClients.reduce((sum, sc) => sum + sc.detour_km, 0);
    const totalVolume = clients.reduce((sum, c) => sum + (c.estimated_volume || 5), 0);
    const avgDetour = totalDetour / selectedClients.length;
    
    // Calculer les économies (estimation)
    const savingsKm = clients.length * 200 - totalDetour; // 200km = trajet moyen évité par client
    const savingsPercentage = Math.round((savingsKm / (clients.length * 200)) * 100);
    
    return {
      type: 'grouped_outbound',
      clients,
      move,
      total_detour_km: totalDetour,
      total_volume_used: totalVolume,
      savings_km: Math.max(0, savingsKm),
      savings_percentage: Math.max(0, savingsPercentage),
      route_waypoints: [], // À implémenter si nécessaire
      is_feasible: totalVolume <= (move.max_volume - move.used_volume),
      match_score: 100 - avgDetour + (savingsPercentage * 2) // Score basé sur détour et économies
    };
  }

  private static async createReturnScenario(move: any, returnClient: any): Promise<MatchScenario> {
    const avgDistance = (returnClient.departure_distance_km + returnClient.arrival_distance_km) / 2;
    const savingsKm = 400 - (avgDistance * 2); // 400km = aller-retour évité
    const savingsPercentage = Math.round((savingsKm / 400) * 100);
    
    return {
      type: 'return_trip',
      clients: [returnClient.client],
      move,
      total_detour_km: avgDistance * 2,
      total_volume_used: returnClient.client.estimated_volume || 5,
      savings_km: Math.max(0, savingsKm),
      savings_percentage: Math.max(0, savingsPercentage),
      route_waypoints: [],
      is_feasible: (returnClient.client.estimated_volume || 5) <= (move.max_volume - move.used_volume),
      match_score: 100 - avgDistance + (savingsPercentage * 3) // Bonus pour les retours occupés
    };
  }

  private static async createClientClusters(clients: any[], move: any): Promise<any[][]> {
    // Algorithme simple de clustering par proximité géographique
    const clusters: any[][] = [];
    const processed = new Set();
    
    for (const client of clients) {
      if (processed.has(client.id)) continue;
      
      const cluster = [client];
      processed.add(client.id);
      
      // Chercher des clients proches
      for (const otherClient of clients) {
        if (processed.has(otherClient.id)) continue;
        
        const distance = await this.calculateDirectDistance(
          client.departure_postal_code,
          otherClient.departure_postal_code
        );
        
        if (distance <= 50) { // 50km = zone de proximité
          cluster.push(otherClient);
          processed.add(otherClient.id);
        }
      }
      
      if (cluster.length >= 2) {
        clusters.push(cluster);
      }
    }
    
    return clusters;
  }

  private static async createLoopScenario(move: any, clientCluster: any[]): Promise<MatchScenario> {
    const totalVolume = clientCluster.reduce((sum, c) => sum + (c.estimated_volume || 5), 0);
    const estimatedTotalKm = clientCluster.length * 100; // Estimation simple
    const savingsKm = clientCluster.length * 300 - estimatedTotalKm; // 300km = trajet moyen évité
    const savingsPercentage = Math.round((savingsKm / (clientCluster.length * 300)) * 100);
    
    return {
      type: 'loop_optimization',
      clients: clientCluster,
      move,
      total_detour_km: estimatedTotalKm,
      total_volume_used: totalVolume,
      savings_km: Math.max(0, savingsKm),
      savings_percentage: Math.max(0, savingsPercentage),
      route_waypoints: [],
      is_feasible: totalVolume <= (move.max_volume - move.used_volume) && clientCluster.length <= 3,
      match_score: 150 - (estimatedTotalKm / clientCluster.length) + (savingsPercentage * 4) // Bonus fort pour les boucles
    };
  }

  /**
   * Recherche de matchs optimisés
   */
  public static async findOptimizedMatches(): Promise<AdvancedMatchResult[]> {
    console.log('🔥 MATCHING OPTIMISÉ - Recherche avancée');
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Récupérer les données avec filtre de dates futures
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .not('departure_postal_code', 'is', null)
        .not('arrival_postal_code', 'is', null)
        .not('desired_date', 'is', null)
        .gte('desired_date', today.toISOString().split('T')[0]); // Dates futures uniquement

      const { data: moves, error: movesError } = await supabase
        .from('confirmed_moves')
        .select('*')
        .eq('status', 'confirmed')
        .gt('available_volume', 0)
        .gte('departure_date', today.toISOString().split('T')[0]); // Dates futures uniquement

      if (clientsError || movesError || !clients || !moves) {
        console.error('❌ Erreur récupération données:', { clientsError, movesError });
        return [];
      }

      console.log(`📊 Données optimisées: ${clients.length} clients, ${moves.length} trajets (dates futures)`);

      const matches: AdvancedMatchResult[] = [];

      // Algorithme d'optimisation multi-critères
      for (const client of clients) {
        for (const move of moves) {
          const optimizedMatch = await this.analyzeOptimizedMatch(client, move);
          if (optimizedMatch && optimizedMatch.is_valid) {
            matches.push(optimizedMatch);
          }
        }
      }

      // Tri par score d'optimisation
      matches.sort((a, b) => b.optimization_score - a.optimization_score);

      console.log(`🎯 ${matches.length} matchs optimisés trouvés (dates futures uniquement)`);
      return matches;

    } catch (error) {
      console.error('❌ Erreur matching optimisé:', error);
      return [];
    }
  }

  private static async analyzeOptimizedMatch(client: any, move: any): Promise<AdvancedMatchResult> {
    const { data: optimizedMatch, error: optimizedMatchError } = await supabase
      .from('optimized_matches')
      .select('*')
      .eq('client_id', client.id)
      .eq('move_id', move.id)
      .eq('status', 'confirmed')
      .limit(1);

    if (optimizedMatchError || !optimizedMatch) {
      console.error('❌ Erreur analyse match optimisé:', { optimizedMatchError });
      return {
        is_valid: false,
        match_score: 0,
        optimization_score: 0,
        match_reference: null
      };
    }

    return {
      is_valid: true,
      match_score: optimizedMatch[0].match_score,
      optimization_score: optimizedMatch[0].optimization_score,
      match_reference: optimizedMatch[0].match_reference
    };
  }

  private static async calculateDistance(from: string, to: string): Promise<number> {
    const { data: distance, error: distanceError } = await supabase
      .from('distance_matrix')
      .select('*')
      .eq('from_postal_code', from)
      .eq('to_postal_code', to);

    if (distanceError || !distance || distance.length === 0) {
      console.error('❌ Erreur calcul distance:', { distanceError });
      return 999;
    }

    return distance[0].distance;
  }

  private static async calculateDateDiff(date1: string, date2: string): Promise<number> {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.abs((d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));
  }

  private static generateMatchReference(client: any, move: any): string {
    return `${client.name} - ${move.company_name} - ${move.departure_date}`;
  }
}
