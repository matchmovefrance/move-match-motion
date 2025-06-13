
import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  id: number;
  type: 'client' | 'move' | 'match';
  reference: string;
  name: string;
  date: string;
  details: string;
  departure_postal_code?: string;
  arrival_postal_code?: string;
  departure_city?: string;
  arrival_city?: string;
  company_name?: string;
}

export interface MatchRoutes {
  client: {
    departure_postal_code: string;
    arrival_postal_code: string;
    departure_city: string;
    arrival_city: string;
    name: string;
  };
  move: {
    departure_postal_code: string;
    arrival_postal_code: string;
    departure_city: string;
    arrival_city: string;
    company_name: string;
  };
}

export class MapSearchEngine {
  static async searchByReference(reference: string): Promise<{
    item: SearchResult | null;
    matchRoutes: MatchRoutes | null;
    error?: string;
  }> {
    const cleanRef = reference.toUpperCase().trim();
    console.log(`🔍 RECHERCHE MOTEUR: ${cleanRef}`);

    try {
      // CLIENT SEARCH
      if (cleanRef.startsWith('CLI-')) {
        return await this.searchClient(cleanRef);
      }

      // MOVE SEARCH  
      if (cleanRef.startsWith('TRJ-')) {
        return await this.searchMove(cleanRef);
      }

      // MATCH SEARCH
      if (cleanRef.startsWith('MTH-')) {
        return await this.searchMatch(cleanRef);
      }

      return {
        item: null,
        matchRoutes: null,
        error: `Format de référence non reconnu: ${cleanRef}`
      };

    } catch (error) {
      console.error('❌ ERREUR MOTEUR RECHERCHE:', error);
      return {
        item: null,
        matchRoutes: null,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  private static async searchClient(reference: string): Promise<{
    item: SearchResult | null;
    matchRoutes: MatchRoutes | null;
    error?: string;
  }> {
    const idStr = reference.replace('CLI-', '');
    const id = parseInt(idStr);
    
    if (isNaN(id)) {
      throw new Error(`ID client invalide: ${idStr}`);
    }

    console.log(`🔍 RECHERCHE CLIENT ID: ${id}`);

    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ ERREUR CLIENT:', error);
      throw new Error(`Client ${id} introuvable`);
    }

    if (!client.departure_postal_code || !client.arrival_postal_code) {
      throw new Error(`Données incomplètes pour client ${id}`);
    }

    const foundItem: SearchResult = {
      id: client.id,
      type: 'client',
      reference: `CLI-${String(client.id).padStart(6, '0')}`,
      name: client.name || 'Client',
      date: client.desired_date ? new Date(client.desired_date).toLocaleDateString('fr-FR') : '',
      details: `${client.departure_postal_code} → ${client.arrival_postal_code}`,
      departure_postal_code: client.departure_postal_code,
      arrival_postal_code: client.arrival_postal_code,
      departure_city: client.departure_city,
      arrival_city: client.arrival_city
    };

    console.log(`✅ CLIENT TROUVÉ:`, foundItem);
    return { item: foundItem, matchRoutes: null };
  }

  private static async searchMove(reference: string): Promise<{
    item: SearchResult | null;
    matchRoutes: MatchRoutes | null;
    error?: string;
  }> {
    const idStr = reference.replace('TRJ-', '');
    const id = parseInt(idStr);
    
    if (isNaN(id)) {
      throw new Error(`ID trajet invalide: ${idStr}`);
    }

    console.log(`🔍 RECHERCHE TRAJET ID: ${id}`);

    const { data: move, error } = await supabase
      .from('confirmed_moves')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ ERREUR TRAJET:', error);
      throw new Error(`Trajet ${id} introuvable`);
    }

    if (!move.departure_postal_code || !move.arrival_postal_code) {
      throw new Error(`Données incomplètes pour trajet ${id}`);
    }

    const foundItem: SearchResult = {
      id: move.id,
      type: 'move',
      reference: `TRJ-${String(move.id).padStart(6, '0')}`,
      name: move.company_name || 'Déménageur',
      date: move.departure_date ? new Date(move.departure_date).toLocaleDateString('fr-FR') : '',
      details: `${move.departure_postal_code} → ${move.arrival_postal_code}`,
      departure_postal_code: move.departure_postal_code,
      arrival_postal_code: move.arrival_postal_code,
      departure_city: move.departure_city,
      arrival_city: move.arrival_city,
      company_name: move.company_name
    };

    console.log(`✅ TRAJET TROUVÉ:`, foundItem);
    return { item: foundItem, matchRoutes: null };
  }

  private static async searchMatch(reference: string): Promise<{
    item: SearchResult | null;
    matchRoutes: MatchRoutes | null;
    error?: string;
  }> {
    const idStr = reference.replace('MTH-', '');
    const id = parseInt(idStr);
    
    if (isNaN(id)) {
      throw new Error(`ID match invalide: ${idStr}`);
    }

    console.log(`🔍 RECHERCHE MATCH ID: ${id}`);

    // Étape 1: Récupérer le match
    const { data: match, error: matchError } = await supabase
      .from('move_matches')
      .select('id, created_at, client_id, move_id')
      .eq('id', id)
      .single();

    if (matchError) {
      console.error('❌ MATCH NON TROUVÉ:', matchError);
      throw new Error(`Match ${id} introuvable`);
    }

    console.log(`✅ MATCH TROUVÉ:`, match);

    // Étape 2: Récupérer les données en parallèle
    const [clientResult, moveResult] = await Promise.all([
      supabase
        .from('clients')
        .select('name, departure_postal_code, arrival_postal_code, departure_city, arrival_city')
        .eq('id', match.client_id)
        .single(),
      supabase
        .from('confirmed_moves')
        .select('company_name, departure_postal_code, arrival_postal_code, departure_city, arrival_city')
        .eq('id', match.move_id)
        .single()
    ]);

    if (clientResult.error) {
      console.error('❌ CLIENT DONNÉES MANQUANTES:', clientResult.error);
      throw new Error(`Données client ${match.client_id} manquantes`);
    }

    if (moveResult.error) {
      console.error('❌ MOVE DONNÉES MANQUANTES:', moveResult.error);
      throw new Error(`Données trajet ${match.move_id} manquantes`);
    }

    const client = clientResult.data;
    const move = moveResult.data;

    // Étape 3: Validation des données
    if (!client.departure_postal_code || !client.arrival_postal_code || 
        !move.departure_postal_code || !move.arrival_postal_code) {
      console.error('❌ CODES POSTAUX MANQUANTS:', { client, move });
      throw new Error('Codes postaux manquants pour afficher les trajets');
    }

    // Étape 4: Créer les objets de résultat
    const foundItem: SearchResult = {
      id: match.id,
      type: 'match',
      reference: `MTH-${String(match.id).padStart(6, '0')}`,
      name: `${client.name} ↔ ${move.company_name}`,
      date: match.created_at ? new Date(match.created_at).toLocaleDateString('fr-FR') : '',
      details: `Client: ${client.departure_postal_code} → ${client.arrival_postal_code} | Déménageur: ${move.departure_postal_code} → ${move.arrival_postal_code}`,
      departure_postal_code: client.departure_postal_code,
      arrival_postal_code: client.arrival_postal_code,
      departure_city: client.departure_city,
      arrival_city: client.arrival_city,
      company_name: move.company_name
    };

    const foundMatchRoutes: MatchRoutes = {
      client: {
        departure_postal_code: client.departure_postal_code,
        arrival_postal_code: client.arrival_postal_code,
        departure_city: client.departure_city || '',
        arrival_city: client.arrival_city || '',
        name: client.name
      },
      move: {
        departure_postal_code: move.departure_postal_code,
        arrival_postal_code: move.arrival_postal_code,
        departure_city: move.departure_city || '',
        arrival_city: move.arrival_city || '',
        company_name: move.company_name
      }
    };

    console.log(`✅ MATCH COMPLET CRÉÉ:`, foundItem);
    console.log(`🗺️ ROUTES MATCH:`, foundMatchRoutes);

    return { item: foundItem, matchRoutes: foundMatchRoutes };
  }
}
