
import { supabase } from '@/integrations/supabase/client';

// Interface for client data from the unified clients table
interface Client {
  id: number;
  name: string;
  email: string;
  departure_city: string;
  departure_postal_code: string;
  arrival_city: string;
  arrival_postal_code: string;
  estimated_volume: number;
  desired_date: string;
  client_reference?: string;
  quote_amount?: number;
}

// Interface for supplier data
interface Supplier {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  pricing_model: any;
  is_active: boolean;
}

// Interface for generated quote
interface GeneratedQuote {
  id: string;
  client_id: number;
  client_name: string;
  client_email: string;
  departure_city: string;
  arrival_city: string;
  estimated_volume: number;
  desired_date: string;
  supplier_id: string;
  supplier_name: string;
  supplier_company: string;
  calculated_price: number;
  supplier_price: number;
  matchmove_margin: number;
  original_quote_amount?: number;
  pricing_breakdown?: any;
  rank: number;
}

class PricingEngine {
  private googleMapsApiKey = 'AIzaSyA4qQbW8iBb1zUGW8XvKYeKzT7E8bZdY9A';

  async getExactDistance(fromPostal: string, toPostal: string): Promise<number> {
    try {
      console.log(`🗺️ Calcul distance exacte Google Maps: ${fromPostal} -> ${toPostal}`);
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${fromPostal},France&destinations=${toPostal},France&units=metric&key=${this.googleMapsApiKey}&mode=driving`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
        const distanceInMeters = data.rows[0].elements[0].distance.value;
        const distanceInKm = Math.round(distanceInMeters / 1000);
        console.log(`✅ Distance Google Maps: ${distanceInKm}km`);
        return distanceInKm;
      } else {
        console.warn('⚠️ Google Maps API error, using fallback calculation');
        return this.calculateFallbackDistance(fromPostal, toPostal);
      }
    } catch (error) {
      console.error('❌ Error with Google Maps API:', error);
      return this.calculateFallbackDistance(fromPostal, toPostal);
    }
  }

  private calculateFallbackDistance(postal1: string, postal2: string): number {
    // Fallback calculation based on postal codes
    const lat1 = parseFloat(postal1.substring(0, 2)) + parseFloat(postal1.substring(2, 5)) / 1000;
    const lon1 = parseFloat(postal1.substring(0, 2)) * 0.5;
    const lat2 = parseFloat(postal2.substring(0, 2)) + parseFloat(postal2.substring(2, 5)) / 1000;
    const lon2 = parseFloat(postal2.substring(0, 2)) * 0.5;
    
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return Math.round(R * c);
  }

  private calculatePrice(distance: number, volume: number, supplier: Supplier): { supplierPrice: number; margin: number; finalPrice: number } {
    const basePrice = distance * 1.2 + volume * 45;
    
    const supplierModel = supplier.pricing_model || {};
    const pricePerKm = supplierModel.price_per_km || 1.2;
    const pricePerM3 = supplierModel.price_per_m3 || 45;
    const baseMargin = supplierModel.base_margin || 0.15;
    
    const supplierPrice = Math.round(distance * pricePerKm + volume * pricePerM3);
    const margin = Math.round(supplierPrice * baseMargin);
    const finalPrice = supplierPrice + margin;
    
    return { supplierPrice, margin, finalPrice };
  }

  async loadActiveSuppliers(): Promise<Supplier[]> {
    try {
      console.log('🔄 Chargement des prestataires actifs...');
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      
      console.log('✅ Prestataires chargés:', suppliers?.length || 0);
      return suppliers || [];
    } catch (error) {
      console.error('❌ Erreur chargement prestataires:', error);
      return [];
    }
  }

  async generateQuotesForClient(client: Client): Promise<GeneratedQuote[]> {
    try {
      console.log(`💰 Génération devis pour client ${client.name} (${client.client_reference})`);
      
      const suppliers = await this.loadActiveSuppliers();
      if (suppliers.length === 0) {
        console.warn('⚠️ Aucun prestataire actif trouvé');
        return [];
      }

      // Calculate exact distance using Google Maps
      const exactDistance = await this.getExactDistance(
        client.departure_postal_code,
        client.arrival_postal_code
      );

      const quotes: GeneratedQuote[] = [];

      for (const supplier of suppliers) {
        const pricing = this.calculatePrice(exactDistance, client.estimated_volume, supplier);
        
        const quote: GeneratedQuote = {
          id: `quote-${client.id}-${supplier.id}-${Date.now()}`,
          client_id: client.id,
          client_name: client.name,
          client_email: client.email,
          departure_city: client.departure_city,
          arrival_city: client.arrival_city,
          estimated_volume: client.estimated_volume,
          desired_date: client.desired_date,
          supplier_id: supplier.id,
          supplier_name: supplier.contact_name,
          supplier_company: supplier.company_name,
          calculated_price: pricing.finalPrice,
          supplier_price: pricing.supplierPrice,
          matchmove_margin: pricing.margin,
          original_quote_amount: client.quote_amount,
          pricing_breakdown: {
            exactDistance,
            marginPercentage: (pricing.margin / pricing.supplierPrice) * 100,
            estimatedVolume: client.estimated_volume,
            estimatedFloors: Math.ceil(client.estimated_volume / 15), // Estimation étages
            pricePerKm: 1.2,
            pricePerM3: 45
          },
          rank: 1
        };

        quotes.push(quote);
      }

      // Sort by price and assign ranks
      quotes.sort((a, b) => a.calculated_price - b.calculated_price);
      quotes.forEach((quote, index) => {
        quote.rank = index + 1;
      });

      console.log(`✅ ${quotes.length} devis générés avec distance exacte ${exactDistance}km`);
      return quotes;

    } catch (error) {
      console.error('❌ Erreur génération devis:', error);
      return [];
    }
  }
}

export const pricingEngine = new PricingEngine();
