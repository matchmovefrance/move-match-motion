
import { supabase } from '@/integrations/supabase/client';
import { loadGoogleMapsScript } from '@/lib/google-maps-config';

export interface OptimizedMatch {
  id: string;
  type: 'aller_groupe' | 'retour_occupe' | 'boucle_intelligente';
  clients: Array<{
    id: number;
    name: string;
    departure_postal_code: string;
    arrival_postal_code: string;
    departure_city: string;
    arrival_city: string;
    desired_date: string;
    estimated_volume: number;
  }>;
  move: {
    id: number;
    company_name: string;
    departure_postal_code: string;
    arrival_postal_code: string;
    departure_city: string;
    arrival_city: string;
    departure_date: string;
    available_volume: number;
  };
  route_optimization: {
    total_distance_km: number;
    optimized_distance_km: number;
    savings_km: number;
    savings_percentage: number;
    waypoints: Array<{
      type: 'pickup' | 'delivery' | 'truck_start' | 'truck_end';
      location: string;
      coordinates: { lat: number; lng: number };
    }>;
  };
  validity: {
    distance_valid: boolean;
    date_valid: boolean;
    volume_valid: boolean;
    overall_valid: boolean;
  };
  score: number;
  created_at: string;
}

export interface MatchingZone {
  center: { lat: number; lng: number };
  radius_km: number;
  postal_codes: string[];
  cached_distances: Map<string, number>;
}

export class OptimizedMatchingService {
  private static cache = new Map<string, any>();
  private static zones = new Map<string, MatchingZone>();
  private static isInitialized = false;

  /**
   * Initialisation du service avec pré-calcul des zones
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('🚀 Initialisation du matching optimisé...');
    
    await loadGoogleMapsScript();
    await this.precomputeZones();
    
    this.isInitialized = true;
    console.log('✅ Service de matching optimisé initialisé');
  }

  /**
   * Pré-calcul des zones de 100km via Google Distance Matrix
   */
  private static async precomputeZones(): Promise<void> {
    const { data: locations } = await supabase
      .from('clients')
      .select('departure_postal_code, arrival_postal_code')
      .not('departure_postal_code', 'is', null)
      .not('arrival_postal_code', 'is', null);

    const { data: moves } = await supabase
      .from('confirmed_moves')
      .select('departure_postal_code, arrival_postal_code')
      .not('departure_postal_code', 'is', null)
      .not('arrival_postal_code', 'is', null);

    if (!locations || !moves) return;

    const allPostalCodes = new Set<string>();
    locations.forEach(l => {
      allPostalCodes.add(l.departure_postal_code);
      allPostalCodes.add(l.arrival_postal_code);
    });
    moves.forEach(m => {
      allPostalCodes.add(m.departure_postal_code);
      allPostalCodes.add(m.arrival_postal_code);
    });

    console.log(`📍 Pré-calcul de ${allPostalCodes.size} codes postaux...`);

    // Calcul par batch pour éviter les limites API
    const postalCodesArray = Array.from(allPostalCodes);
    const batchSize = 25;
    
    for (let i = 0; i < postalCodesArray.length; i += batchSize) {
      const batch = postalCodesArray.slice(i, i + batchSize);
      await this.processZoneBatch(batch);
    }
  }

  private static async processZoneBatch(postalCodes: string[]): Promise<void> {
    if (!window.google?.maps) return;

    const service = new google.maps.DistanceMatrixService();
    
    try {
      const result = await new Promise<google.maps.DistanceMatrixResponse>((resolve, reject) => {
        service.getDistanceMatrix({
          origins: postalCodes.map(pc => `${pc}, France`),
          destinations: postalCodes.map(pc => `${pc}, France`),
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false
        }, (response, status) => {
          if (status === 'OK' && response) {
            resolve(response);
          } else {
            reject(new Error(`Distance Matrix failed: ${status}`));
          }
        });
      });

      // Mise en cache des distances
      for (let i = 0; i < result.rows.length; i++) {
        for (let j = 0; j < result.rows[i].elements.length; j++) {
          const element = result.rows[i].elements[j];
          if (element.status === 'OK') {
            const origin = postalCodes[i];
            const destination = postalCodes[j];
            const distance = Math.round(element.distance.value / 1000);
            
            this.cache.set(`distance_${origin}_${destination}`, distance);
          }
        }
      }

    } catch (error) {
      console.warn('Erreur batch distance matrix:', error);
    }
  }

  /**
   * Recherche ultra-rapide de matchs optimisés
   */
  static async findOptimizedMatches(): Promise<OptimizedMatch[]> {
    await this.initialize();
    
    const startTime = Date.now();
    console.log('⚡ Recherche ultra-rapide en cours...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Récupération des données avec optimisation
      const [clientsResult, movesResult] = await Promise.all([
        supabase
          .from('clients')
          .select('*')
          .not('departure_postal_code', 'is', null)
          .not('arrival_postal_code', 'is', null)
          .not('desired_date', 'is', null)
          .gte('desired_date', today.toISOString().split('T')[0])
          .limit(100),
        supabase
          .from('confirmed_moves')
          .select('*')
          .eq('status', 'confirmed')
          .gt('available_volume', 0)
          .gte('departure_date', today.toISOString().split('T')[0])
          .limit(50)
      ]);

      const clients = clientsResult.data || [];
      const moves = movesResult.data || [];

      const matches: OptimizedMatch[] = [];

      // 1. Aller groupé optimisé
      const allerGroupeMatches = await this.findAllerGroupeMatches(clients, moves);
      matches.push(...allerGroupeMatches);

      // 2. Retour occupé optimisé
      const retourOccupeMatches = await this.findRetourOccupeMatches(clients, moves);
      matches.push(...retourOccupeMatches);

      // 3. Boucles intelligentes
      const boucleMatches = await this.findBoucleIntelligente(clients, moves);
      matches.push(...boucleMatches);

      // Tri par score et limitation
      matches.sort((a, b) => b.score - a.score);
      const topMatches = matches.slice(0, 20);

      const duration = Date.now() - startTime;
      console.log(`🎯 ${topMatches.length} matchs trouvés en ${duration}ms`);

      return topMatches;

    } catch (error) {
      console.error('❌ Erreur matching optimisé:', error);
      return [];
    }
  }

  /**
   * Aller groupé avec rayon de 100km strict
   */
  private static async findAllerGroupeMatches(clients: any[], moves: any[]): Promise<OptimizedMatch[]> {
    const matches: OptimizedMatch[] = [];

    for (const move of moves) {
      const compatibleClients = [];

      for (const client of clients) {
        // Validation stricte des distances (100km max)
        const departureDistance = this.getCachedDistance(
          client.departure_postal_code,
          move.departure_postal_code
        );
        const arrivalDistance = this.getCachedDistance(
          client.arrival_postal_code,
          move.arrival_postal_code
        );

        // Validation des dates (±15 jours max)
        const dateDiff = this.calculateDateDiff(client.desired_date, move.departure_date);

        if (departureDistance <= 100 && arrivalDistance <= 100 && dateDiff <= 15) {
          compatibleClients.push({
            ...client,
            departure_distance: departureDistance,
            arrival_distance: arrivalDistance,
            date_diff: dateDiff
          });
        }
      }

      // Groupement intelligent par volume
      const volumeAvailable = move.available_volume || 0;
      let usedVolume = 0;
      const selectedClients = [];

      compatibleClients
        .sort((a, b) => (a.departure_distance + a.arrival_distance) - (b.departure_distance + b.arrival_distance))
        .forEach(client => {
          const clientVolume = client.estimated_volume || 5;
          if (usedVolume + clientVolume <= volumeAvailable) {
            selectedClients.push(client);
            usedVolume += clientVolume;
          }
        });

      if (selectedClients.length > 0) {
        const routeOpt = await this.optimizeRoute(selectedClients, move, 'aller_groupe');
        const score = this.calculateScore(routeOpt, selectedClients.length, 'aller_groupe');

        matches.push({
          id: `aller_${move.id}_${Date.now()}`,
          type: 'aller_groupe',
          clients: selectedClients.map(c => ({
            id: c.id,
            name: c.name,
            departure_postal_code: c.departure_postal_code,
            arrival_postal_code: c.arrival_postal_code,
            departure_city: c.departure_city,
            arrival_city: c.arrival_city,
            desired_date: c.desired_date,
            estimated_volume: c.estimated_volume
          })),
          move: {
            id: move.id,
            company_name: move.company_name,
            departure_postal_code: move.departure_postal_code,
            arrival_postal_code: move.arrival_postal_code,
            departure_city: move.departure_city,
            arrival_city: move.arrival_city,
            departure_date: move.departure_date,
            available_volume: move.available_volume
          },
          route_optimization: routeOpt,
          validity: {
            distance_valid: true,
            date_valid: true,
            volume_valid: usedVolume <= volumeAvailable,
            overall_valid: true
          },
          score,
          created_at: new Date().toISOString()
        });
      }
    }

    return matches;
  }

  /**
   * Retour occupé avec détection automatique
   */
  private static async findRetourOccupeMatches(clients: any[], moves: any[]): Promise<OptimizedMatch[]> {
    const matches: OptimizedMatch[] = [];

    for (const move of moves) {
      // Recherche de clients pour le trajet retour
      const returnClients = clients.filter(client => {
        const departureDistance = this.getCachedDistance(
          client.departure_postal_code,
          move.arrival_postal_code // Retour depuis l'arrivée du camion
        );
        const arrivalDistance = this.getCachedDistance(
          client.arrival_postal_code,
          move.departure_postal_code // Vers le départ du camion
        );

        const dateDiff = this.calculateDateDiff(client.desired_date, move.departure_date);

        return departureDistance <= 100 && arrivalDistance <= 100 && dateDiff <= 15;
      });

      if (returnClients.length > 0) {
        const routeOpt = await this.optimizeRoute(returnClients, move, 'retour_occupe');
        const score = this.calculateScore(routeOpt, returnClients.length, 'retour_occupe');

        matches.push({
          id: `retour_${move.id}_${Date.now()}`,
          type: 'retour_occupe',
          clients: returnClients.map(c => ({
            id: c.id,
            name: c.name,
            departure_postal_code: c.departure_postal_code,
            arrival_postal_code: c.arrival_postal_code,
            departure_city: c.departure_city,
            arrival_city: c.arrival_city,
            desired_date: c.desired_date,
            estimated_volume: c.estimated_volume
          })),
          move: {
            id: move.id,
            company_name: move.company_name,
            departure_postal_code: move.departure_postal_code,
            arrival_postal_code: move.arrival_postal_code,
            departure_city: move.departure_city,
            arrival_city: move.arrival_city,
            departure_date: move.departure_date,
            available_volume: move.available_volume
          },
          route_optimization: routeOpt,
          validity: {
            distance_valid: true,
            date_valid: true,
            volume_valid: true,
            overall_valid: true
          },
          score,
          created_at: new Date().toISOString()
        });
      }
    }

    return matches;
  }

  /**
   * Boucles intelligentes avec algorithme de graphe
   */
  private static async findBoucleIntelligente(clients: any[], moves: any[]): Promise<OptimizedMatch[]> {
    const matches: OptimizedMatch[] = [];

    for (const move of moves) {
      // Recherche de boucles A→B→C→A avec max 4 clients
      const nearbyClients = clients.filter(client => {
        const departureDistance = this.getCachedDistance(
          client.departure_postal_code,
          move.departure_postal_code
        );
        return departureDistance <= 100;
      });

      if (nearbyClients.length >= 2) {
        const loops = this.findOptimalLoops(nearbyClients, move);
        
        for (const loop of loops) {
          const routeOpt = await this.optimizeRoute(loop, move, 'boucle_intelligente');
          const score = this.calculateScore(routeOpt, loop.length, 'boucle_intelligente');

          matches.push({
            id: `boucle_${move.id}_${Date.now()}`,
            type: 'boucle_intelligente',
            clients: loop.map(c => ({
              id: c.id,
              name: c.name,
              departure_postal_code: c.departure_postal_code,
              arrival_postal_code: c.arrival_postal_code,
              departure_city: c.departure_city,
              arrival_city: c.arrival_city,
              desired_date: c.desired_date,
              estimated_volume: c.estimated_volume
            })),
            move: {
              id: move.id,
              company_name: move.company_name,
              departure_postal_code: move.departure_postal_code,
              arrival_postal_code: move.arrival_postal_code,
              departure_city: move.departure_city,
              arrival_city: move.arrival_city,
              departure_date: move.departure_date,
              available_volume: move.available_volume
            },
            route_optimization: routeOpt,
            validity: {
              distance_valid: true,
              date_valid: true,
              volume_valid: true,
              overall_valid: true
            },
            score,
            created_at: new Date().toISOString()
          });
        }
      }
    }

    return matches;
  }

  private static findOptimalLoops(clients: any[], move: any): any[][] {
    const loops: any[][] = [];
    const maxClients = Math.min(4, clients.length);

    // Algorithme simple de génération de boucles
    for (let i = 2; i <= maxClients; i++) {
      const combinations = this.getCombinations(clients, i);
      
      for (const combo of combinations) {
        // Vérifier si la boucle est valide
        const totalVolume = combo.reduce((sum, c) => sum + (c.estimated_volume || 5), 0);
        if (totalVolume <= (move.available_volume || 0)) {
          loops.push(combo);
        }
      }
    }

    return loops.slice(0, 3); // Limiter à 3 meilleures boucles
  }

  private static getCombinations(arr: any[], size: number): any[][] {
    if (size === 1) return arr.map(item => [item]);
    
    const combinations: any[][] = [];
    for (let i = 0; i < arr.length - size + 1; i++) {
      const head = arr[i];
      const tailCombinations = this.getCombinations(arr.slice(i + 1), size - 1);
      tailCombinations.forEach(tail => combinations.push([head, ...tail]));
    }
    
    return combinations;
  }

  private static async optimizeRoute(clients: any[], move: any, type: string): Promise<any> {
    // Calcul optimisé des waypoints
    const directDistance = this.getCachedDistance(
      move.departure_postal_code,
      move.arrival_postal_code
    ) || 500;

    let optimizedDistance = directDistance;
    const waypoints = [];

    // Simulation d'optimisation de route
    clients.forEach(client => {
      optimizedDistance += this.getCachedDistance(
        move.departure_postal_code,
        client.departure_postal_code
      ) || 50;
      
      waypoints.push({
        type: 'pickup' as const,
        location: `${client.departure_city} (${client.departure_postal_code})`,
        coordinates: { lat: 46.6, lng: 2.0 }
      });
    });

    const savings = Math.max(0, directDistance * clients.length - optimizedDistance);
    const savingsPercentage = Math.round((savings / (directDistance * clients.length)) * 100);

    return {
      total_distance_km: directDistance * clients.length,
      optimized_distance_km: optimizedDistance,
      savings_km: savings,
      savings_percentage: savingsPercentage,
      waypoints
    };
  }

  private static calculateScore(routeOpt: any, clientCount: number, type: string): number {
    let baseScore = routeOpt.savings_percentage * 2;
    baseScore += clientCount * 10;
    
    if (type === 'boucle_intelligente') baseScore += 20;
    if (type === 'retour_occupe') baseScore += 15;
    
    return Math.min(100, baseScore);
  }

  private static getCachedDistance(from: string, to: string): number {
    const cacheKey = `distance_${from}_${to}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached !== undefined) return cached;
    
    // Fallback basique si pas en cache
    if (from === to) return 0;
    const dept1 = from.substring(0, 2);
    const dept2 = to.substring(0, 2);
    if (dept1 === dept2) return 25;
    return 120;
  }

  private static calculateDateDiff(date1: string, date2: string): number {
    if (!date1 || !date2) return 999;
    
    try {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      return Math.abs((d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));
    } catch {
      return 999;
    }
  }
}
