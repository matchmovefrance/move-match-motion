
import { supabase } from '@/integrations/supabase/client';

// Configuration pour la MAIN APP
const MAIN_APP_URL = import.meta.env.VITE_MAIN_API_URL || 'https://your-main-app.com';

interface AuthToken {
  token: string;
  expiresAt: number;
}

class MainAppApiService {
  private authToken: AuthToken | null = null;

  /**
   * Obtient un token d'authentification sécurisé
   */
  private async getAuthToken(): Promise<string> {
    try {
      // Vérifier si le token est encore valide
      if (this.authToken && this.authToken.expiresAt > Date.now()) {
        return this.authToken.token;
      }

      // Obtenir le token Supabase actuel
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Non authentifié - session Supabase manquante');
      }

      // Echanger le token Supabase contre un token MAIN APP
      const response = await fetch(`${MAIN_APP_URL}/api/v1/auth/exchange-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          source: 'pricing-tool',
          supabase_token: session.access_token
        })
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      const tokenData = await response.json();
      
      this.authToken = {
        token: tokenData.access_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000)
      };

      console.log('✅ Token MAIN APP obtenu avec succès');
      return this.authToken.token;
    } catch (error) {
      console.error('❌ Erreur lors de l\'obtention du token MAIN APP:', error);
      throw error;
    }
  }

  /**
   * Récupère les clients actifs depuis la MAIN APP
   */
  async fetchClients(): Promise<any[]> {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${MAIN_APP_URL}/api/v1/clients/active`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Source': 'pricing-tool'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Clients fetch failed: ${response.status} - ${response.statusText}`);
      }

      const clients = await response.json();
      
      console.log('🏢 Clients MAIN APP chargés:', clients.length);
      if (clients.length > 0) {
        console.log('📋 Premier client MAIN APP:', clients[0]);
      }

      return clients;
    } catch (error) {
      console.error('❌ Erreur lors du chargement des clients MAIN APP:', error);
      // Fallback: utiliser les clients locaux si la MAIN APP est indisponible
      return this.getFallbackClients();
    }
  }

  /**
   * Récupère les prestataires actifs depuis la MAIN APP
   */
  async fetchSuppliers(): Promise<any[]> {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${MAIN_APP_URL}/api/v1/suppliers/active`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Source': 'pricing-tool'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Suppliers fetch failed: ${response.status} - ${response.statusText}`);
      }

      const suppliers = await response.json();
      
      console.log('🚚 Prestataires MAIN APP chargés:', suppliers.length);
      if (suppliers.length > 0) {
        console.log('🚚 Premier prestataire MAIN APP:', suppliers[0]);
      }

      return suppliers;
    } catch (error) {
      console.error('❌ Erreur lors du chargement des prestataires MAIN APP:', error);
      // Fallback: utiliser les fournisseurs locaux si la MAIN APP est indisponible
      return this.getFallbackSuppliers();
    }
  }

  /**
   * Envoie une demande de devis aux prestataires via la MAIN APP
   */
  async requestQuotes(opportunityData: any): Promise<any[]> {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${MAIN_APP_URL}/api/v1/quotes/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Source': 'pricing-tool'
        },
        credentials: 'include',
        body: JSON.stringify({
          opportunity: opportunityData,
          timestamp: new Date().toISOString(),
          source: 'pricing-tool'
        })
      });

      if (!response.ok) {
        throw new Error(`Quote request failed: ${response.status} - ${response.statusText}`);
      }

      const quotes = await response.json();
      
      console.log('💰 Devis MAIN APP reçus:', quotes.length);
      
      return quotes;
    } catch (error) {
      console.error('❌ Erreur lors de la demande de devis MAIN APP:', error);
      // Fallback: simuler des devis si la MAIN APP est indisponible
      return this.getFallbackQuotes(opportunityData);
    }
  }

  /**
   * Données de fallback pour les clients si la MAIN APP est indisponible
   */
  private async getFallbackClients(): Promise<any[]> {
    console.log('⚠️ Mode fallback - utilisation des clients locaux');
    
    // Récupérer les clients depuis Supabase local
    const { data: localClients, error } = await supabase
      .from('clients')
      .select('*')
      .limit(10);

    if (error) {
      console.error('Erreur fallback clients:', error);
      return [];
    }

    return localClients || [];
  }

  /**
   * Données de fallback pour les fournisseurs si la MAIN APP est indisponible
   */
  private async getFallbackSuppliers(): Promise<any[]> {
    console.log('⚠️ Mode fallback - utilisation des fournisseurs locaux');
    
    // Récupérer les fournisseurs depuis Supabase local
    const { data: localSuppliers, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .limit(10);

    if (error) {
      console.error('Erreur fallback fournisseurs:', error);
      return [];
    }

    return localSuppliers || [];
  }

  /**
   * Génère des devis simulés si la MAIN APP est indisponible
   */
  private getFallbackQuotes(opportunityData: any): any[] {
    console.log('⚠️ Mode fallback - génération de devis simulés');
    
    const mockQuotes = [
      {
        id: 'fallback-1',
        supplier_name: 'Transport Express Local',
        price: Math.round(opportunityData.estimated_volume * (90 + Math.random() * 30)),
        estimated_duration: '2-3 jours',
        includes_packing: true,
        includes_insurance: true,
        rating: 4.5,
        source: 'fallback'
      },
      {
        id: 'fallback-2',
        supplier_name: 'Déménagement Pro Local',
        price: Math.round(opportunityData.estimated_volume * (85 + Math.random() * 35)),
        estimated_duration: '1-2 jours',
        includes_packing: false,
        includes_insurance: true,
        rating: 4.2,
        source: 'fallback'
      }
    ];

    return mockQuotes;
  }

  /**
   * Test de connectivité avec la MAIN APP
   */
  async testConnection(): Promise<boolean> {
    try {
      // Créer un AbortController pour gérer le timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${MAIN_APP_URL}/api/v1/health`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const isHealthy = response.ok;
      console.log(`🔗 Test connexion MAIN APP: ${isHealthy ? 'OK' : 'FAILED'}`);
      
      return isHealthy;
    } catch (error) {
      console.error('❌ MAIN APP indisponible:', error);
      return false;
    }
  }
}

// Instance singleton
export const mainAppApi = new MainAppApiService();

// Export pour les tests
export { MainAppApiService };
