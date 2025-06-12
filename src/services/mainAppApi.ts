
import { supabase } from '@/integrations/supabase/client';

interface Opportunity {
  id: string;
  title: string;
  estimated_volume: number;
  departure_city: string;
  arrival_city: string;
}

interface Quote {
  id: string;
  supplier_id: string;
  supplier_name: string;
  amount: number;
  response_time: number;
}

class MainAppApi {
  private baseUrl = 'https://api.matchmove-main.com';
  private isAvailable = false;

  async testConnection(): Promise<boolean> {
    try {
      console.log('🔗 Test connexion MAIN APP...');
      
      // For demo purposes, simulate a connection test
      // In real implementation, this would make an actual HTTP request
      const simulatedResponse = Math.random() > 0.3; // 70% success rate for demo
      
      this.isAvailable = simulatedResponse;
      
      if (simulatedResponse) {
        console.log('✅ MAIN APP disponible');
      } else {
        console.log('❌ MAIN APP indisponible - mode fallback');
      }
      
      return simulatedResponse;
    } catch (error) {
      console.error('❌ Erreur test connexion MAIN APP:', error);
      this.isAvailable = false;
      return false;
    }
  }

  async requestQuotes(opportunity: Opportunity): Promise<Quote[]> {
    try {
      if (!this.isAvailable) {
        console.log('⚠️ MAIN APP indisponible, génération de devis de fallback...');
        return this.generateFallbackQuotes(opportunity);
      }

      console.log('📤 Demande de devis via MAIN APP pour:', opportunity.title);
      
      // In real implementation, this would make an HTTP request to the main app
      // For demo, we'll use fallback quotes
      return this.generateFallbackQuotes(opportunity);
      
    } catch (error) {
      console.error('❌ Erreur demande devis MAIN APP:', error);
      return this.generateFallbackQuotes(opportunity);
    }
  }

  private async generateFallbackQuotes(opportunity: Opportunity): Promise<Quote[]> {
    try {
      console.log('🔄 Génération devis de fallback...');
      
      // Load active suppliers from database
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select('id, company_name, contact_name, pricing_model')
        .eq('is_active', true)
        .limit(3);

      if (error) throw error;

      const fallbackQuotes: Quote[] = [];

      if (suppliers && suppliers.length > 0) {
        for (const supplier of suppliers) {
          // Simple pricing calculation for fallback
          const basePrice = opportunity.estimated_volume * 50;
          const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
          const amount = Math.round(basePrice * (1 + variation));
          
          fallbackQuotes.push({
            id: `fallback-${supplier.id}-${Date.now()}`,
            supplier_id: supplier.id,
            supplier_name: supplier.company_name,
            amount,
            response_time: Math.floor(Math.random() * 24) + 1 // 1-24 hours
          });
        }
      }

      console.log(`✅ ${fallbackQuotes.length} devis de fallback générés`);
      return fallbackQuotes;
      
    } catch (error) {
      console.error('❌ Erreur génération devis fallback:', error);
      return [];
    }
  }

  async submitQuoteResponse(quoteId: string, accepted: boolean, notes?: string): Promise<boolean> {
    try {
      console.log(`📤 Soumission réponse devis ${quoteId}:`, accepted ? 'ACCEPTÉ' : 'REFUSÉ');
      
      if (!this.isAvailable) {
        console.log('⚠️ MAIN APP indisponible, sauvegarde locale...');
        
        // Save locally when main app is unavailable
        const { error } = await supabase
          .from('quotes')
          .insert({
            id: quoteId,
            opportunity_id: 'local-opportunity',
            supplier_id: 'local-supplier',
            bid_amount: 0,
            status: accepted ? 'accepted' : 'rejected',
            notes: notes || '',
            created_by: (await supabase.auth.getUser()).data.user?.id
          });

        if (error) throw error;
        return true;
      }

      // In real implementation, this would send to main app
      return true;
      
    } catch (error) {
      console.error('❌ Erreur soumission réponse:', error);
      return false;
    }
  }

  getStatus(): { available: boolean; lastChecked: Date } {
    return {
      available: this.isAvailable,
      lastChecked: new Date()
    };
  }
}

export const mainAppApi = new MainAppApi();
