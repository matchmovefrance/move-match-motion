
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
  match_type: 'direct_outbound' | 'direct_return' | 'pickup_on_route' | 'delivery_on_route';
  distance_km: number;
  date_diff_days: number;
  volume_compatible: boolean;
  available_volume_after: number;
  match_score: number;
  is_valid: boolean;
  match_reference: string;
  explanation: string;
}

export class MovingMatchingService {
  private static readonly MAX_DISTANCE_KM = 100;
  private static readonly MAX_DATE_DIFF_DAYS = 7;
  private static readonly ROUTE_TOLERANCE_KM = 50; // Tolérance pour les trajets intermédiaires

  /**
   * Trouve tous les matchs possibles pour un client donné
   */
  public static async findMatchesForClient(client: MovingClient): Promise<MatchResult[]> {
    console.log(`🔍 Recherche matchs professionnels pour client ${client.name}`);
    
    // Validation des données obligatoires
    if (!client.departure_postal_code?.trim() || !client.arrival_postal_code?.trim()) {
      console.log('❌ Codes postaux manquants pour le client');
      return [];
    }

    if (!client.departure_city?.trim() || !client.arrival_city?.trim()) {
      console.log('❌ Villes manquantes pour le client');
      return [];
    }

    if (!client.desired_date?.trim()) {
      console.log('❌ Date souhaitée manquante pour le client');
      return [];
    }
    
    // Récupérer tous les trajets confirmés disponibles  
    const { data: moves, error } = await supabase
      .from('confirmed_moves')
      .select('*')
      .eq('status', 'confirmed')
      .gte('available_volume', client.estimated_volume || 1);

    if (error || !moves) {
      console.error('❌ Erreur récupération trajets:', error);
      return [];
    }

    // Exclure les trajets déjà acceptés par ce client
    const { data: existingMatches } = await supabase
      .from('move_matches')
      .select('move_id')
      .eq('client_id', client.id)
      .eq('match_type', 'accepted_match');

    const excludedMoveIds = existingMatches?.map(m => m.move_id) || [];
    const availableMoves = moves.filter(move => !excludedMoveIds.includes(move.id));

    console.log(`📦 ${availableMoves.length} trajets disponibles à analyser`);

    // Analyser chaque trajet
    const matches: MatchResult[] = [];
    
    for (const move of availableMoves) {
      const moveMatches = await this.analyzeMovingRoute(client, move);
      matches.push(...moveMatches);
    }

    // Trier par score (meilleur score = plus faible valeur)
    matches.sort((a, b) => a.match_score - b.match_score);

    console.log(`✅ ${matches.length} matchs trouvés (${matches.filter(m => m.is_valid).length} valides)`);
    return matches;
  }

  /**
   * Analyse un trajet pour trouver toutes les correspondances possibles
   */
  private static async analyzeMovingRoute(client: MovingClient, move: MovingRoute): Promise<MatchResult[]> {
    const matches: MatchResult[] = [];

    try {
      // 1. Match direct aller (client même trajet que déménageur)
      const directMatch = await this.checkDirectMatch(client, move, 'outbound');
      if (directMatch) matches.push(directMatch);

      // 2. Match direct retour (client fait le trajet inverse du déménageur)
      const returnMatch = await this.checkDirectMatch(client, move, 'return');
      if (returnMatch) matches.push(returnMatch);

      // 3. Match sur trajet (client pris en cours de route)
      const routeMatch = await this.checkRouteMatch(client, move);
      if (routeMatch) matches.push(routeMatch);

    } catch (error) {
      console.error(`❌ Erreur analyse trajet ${move.id}:`, error);
    }

    return matches;
  }

  /**
   * Vérifie un match direct (même trajet ou trajet retour)
   */
  private static async checkDirectMatch(
    client: MovingClient, 
    move: MovingRoute, 
    direction: 'outbound' | 'return'
  ): Promise<MatchResult | null> {
    
    let clientDeparture: string, clientArrival: string;
    let moveDeparture: string, moveArrival: string;
    let matchType: MatchResult['match_type'];
    let explanation: string;

    if (direction === 'outbound') {
      // Match direct aller
      clientDeparture = client.departure_postal_code!;
      clientArrival = client.arrival_postal_code!;
      moveDeparture = move.departure_postal_code;
      moveArrival = move.arrival_postal_code;
      matchType = 'direct_outbound';
      explanation = 'Trajet identique au déménageur';
    } else {
      // Match direct retour
      clientDeparture = client.departure_postal_code!;
      clientArrival = client.arrival_postal_code!;
      moveDeparture = move.arrival_postal_code; // Inversé
      moveArrival = move.departure_postal_code; // Inversé
      matchType = 'direct_return';
      explanation = 'Trajet retour du déménageur';
    }

    // Calculer les distances
    const [departureDistance, arrivalDistance] = await Promise.all([
      this.calculateDistance(clientDeparture, moveDeparture, client.departure_city, move.departure_city),
      this.calculateDistance(clientArrival, moveArrival, client.arrival_city, move.arrival_city)
    ]);

    const totalDistance = departureDistance + arrivalDistance;

    // Vérifier si c'est un match valide
    const isValidDistance = totalDistance <= this.MAX_DISTANCE_KM;
    const dateDiff = this.calculateDateDifference(client.desired_date!, move.departure_date);
    const isValidDate = dateDiff <= this.MAX_DATE_DIFF_DAYS;
    const volumeCompatible = (client.estimated_volume || 0) <= move.available_volume;

    const isValid = isValidDistance && isValidDate && volumeCompatible;

    if (!isValid && totalDistance > this.MAX_DISTANCE_KM) {
      return null; // Ne pas retourner les matchs trop éloignés
    }

    const matchScore = this.calculateMatchScore(totalDistance, dateDiff, volumeCompatible);

    return {
      client,
      move,
      match_type: matchType,
      distance_km: Math.round(totalDistance),
      date_diff_days: Math.round(dateDiff),
      volume_compatible: volumeCompatible,
      available_volume_after: move.available_volume - (client.estimated_volume || 0),
      match_score: matchScore,
      is_valid: isValid,
      match_reference: `MATCH-${client.id}-${move.id}`,
      explanation
    };
  }

  /**
   * Vérifie un match sur trajet (client pris en cours de route)
   */
  private static async checkRouteMatch(client: MovingClient, move: MovingRoute): Promise<MatchResult | null> {
    // Calculer si le client peut être pris en cours de route
    const [
      moveStartToClientStart,
      clientStartToClientEnd,
      clientEndToMoveEnd,
      directMoveDistance
    ] = await Promise.all([
      this.calculateDistance(move.departure_postal_code, client.departure_postal_code!, move.departure_city, client.departure_city),
      this.calculateDistance(client.departure_postal_code!, client.arrival_postal_code!, client.departure_city, client.arrival_city),
      this.calculateDistance(client.arrival_postal_code!, move.arrival_postal_code, client.arrival_city, move.arrival_city),
      this.calculateDistance(move.departure_postal_code, move.arrival_postal_code, move.departure_city, move.arrival_city)
    ]);

    const totalDetourDistance = moveStartToClientStart + clientStartToClientEnd + clientEndToMoveEnd;
    const detourExtra = totalDetourDistance - directMoveDistance;

    // Le détour ne doit pas dépasser la tolérance
    const isValidDetour = detourExtra <= this.ROUTE_TOLERANCE_KM;
    const dateDiff = this.calculateDateDifference(client.desired_date!, move.departure_date);
    const isValidDate = dateDiff <= this.MAX_DATE_DIFF_DAYS;
    const volumeCompatible = (client.estimated_volume || 0) <= move.available_volume;

    const isValid = isValidDetour && isValidDate && volumeCompatible;

    if (!isValid && detourExtra > this.ROUTE_TOLERANCE_KM) {
      return null; // Ne pas retourner les détours trop importants
    }

    const matchScore = this.calculateMatchScore(detourExtra, dateDiff, volumeCompatible) + 50; // Pénalité pour détour

    const matchType = moveStartToClientStart < clientEndToMoveEnd ? 'pickup_on_route' : 'delivery_on_route';

    return {
      client,
      move,
      match_type: matchType,
      distance_km: Math.round(detourExtra),
      date_diff_days: Math.round(dateDiff),
      volume_compatible: volumeCompatible,
      available_volume_after: move.available_volume - (client.estimated_volume || 0),
      match_score: matchScore,
      is_valid: isValid,
      match_reference: `MATCH-${client.id}-${move.id}`,
      explanation: `Détour de ${Math.round(detourExtra)}km sur le trajet`
    };
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
      console.warn(`⚠️ Erreur calcul distance ${postal1}-${postal2}:`, error);
      return this.getFallbackDistance(postal1, postal2);
    }
  }

  /**
   * Distance de fallback basée sur les codes postaux
   */
  private static getFallbackDistance(postal1: string, postal2: string): number {
    const dept1 = parseInt(postal1.substring(0, 2));
    const dept2 = parseInt(postal2.substring(0, 2));
    return Math.abs(dept1 - dept2) * 50; // Approximation
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
   * Calcule un score de match (plus bas = meilleur)
   */
  private static calculateMatchScore(distance: number, dateDiff: number, volumeOk: boolean): number {
    let score = distance + (dateDiff * 10);
    if (!volumeOk) score += 1000; // Pénalité importante si volume incompatible
    return score;
  }

  /**
   * Trouve tous les matchs pour l'onglet matching
   */
  public static async findAllMatches(): Promise<MatchResult[]> {
    console.log('🔍 Recherche tous les matchs possibles');

    // Récupérer tous les clients en attente
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .in('status', ['pending', 'confirmed'])
      .not('departure_postal_code', 'is', null)
      .not('arrival_postal_code', 'is', null)
      .not('is_matched', 'eq', true);

    if (clientsError || !clients) {
      console.error('❌ Erreur récupération clients:', clientsError);
      return [];
    }

    console.log(`👥 ${clients.length} clients à analyser`);

    // Traiter chaque client
    const allMatches: MatchResult[] = [];
    
    for (const client of clients) {
      const clientMatches = await this.findMatchesForClient(client);
      allMatches.push(...clientMatches);
    }

    // Filtrer les matchs valides uniquement
    const validMatches = allMatches.filter(match => match.is_valid);
    
    console.log(`✅ ${validMatches.length} matchs valides trouvés sur ${allMatches.length} analysés`);
    
    return validMatches;
  }
}
