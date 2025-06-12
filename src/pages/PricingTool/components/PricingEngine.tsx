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

// Interface for supplier data with pricing model
interface Supplier {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  pricing_model: any;
  is_active: boolean;
}

// Interface for pricing model
interface PricingModel {
  basePrice?: number;
  volumeRate?: number;
  distanceRate?: number;
  minimumPrice?: number;
  floorRate?: number;
  packingRate?: number;
  heavyItemsFee?: number;
  carryingDistanceFee?: number;
  volumeSupplementFee1?: number;
  volumeSupplementThreshold1?: number;
  timeMultiplier?: number;
  matchMoveMargin?: number;
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
  quote_type?: 'competitive' | 'standard' | 'premium';
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

  private calculateSupplierPrice(distance: number, volume: number, supplier: Supplier): number {
    console.log(`💰 Calcul prix prestataire ${supplier.company_name} avec modèle de tarification`);
    
    // Safely parse pricing model
    const pricingModel: PricingModel = this.parsePricingModel(supplier.pricing_model);
    console.log(`📊 Modèle de tarification prestataire:`, pricingModel);
    
    // Utiliser les vraies variables du modèle de tarification du prestataire
    const basePrice = pricingModel.basePrice || 150;
    const volumeRate = pricingModel.volumeRate || 12;
    const distanceRate = pricingModel.distanceRate || 1.2;
    const minimumPrice = pricingModel.minimumPrice || 200;
    
    // Variables supplémentaires du modèle de tarification
    const floorRate = pricingModel.floorRate || 45;
    const packingRate = pricingModel.packingRate || 4.5;
    const heavyItemsFee = pricingModel.heavyItemsFee || 180;
    const carryingDistanceFee = pricingModel.carryingDistanceFee || 90;
    const volumeSupplementFee1 = pricingModel.volumeSupplementFee1 || 130;
    const volumeSupplementThreshold1 = pricingModel.volumeSupplementThreshold1 || 20;
    const timeMultiplier = pricingModel.timeMultiplier || 1.0;
    
    console.log(`📋 Variables tarification: basePrice=${basePrice}€, volumeRate=${volumeRate}€/m³, distanceRate=${distanceRate}€/km`);
    
    // Calcul du prix de base
    let supplierPrice = basePrice + (volume * volumeRate) + (distance * distanceRate);
    
    // Calcul des étages estimés (1 étage par 15m³)
    const estimatedFloors = Math.ceil(volume / 15);
    if (estimatedFloors > 1) {
      supplierPrice += (estimatedFloors - 1) * floorRate;
      console.log(`🏢 Supplément étages: ${estimatedFloors - 1} étages x ${floorRate}€ = ${(estimatedFloors - 1) * floorRate}€`);
    }
    
    // Supplément volume important
    if (volume > volumeSupplementThreshold1) {
      supplierPrice += volumeSupplementFee1;
      console.log(`📦 Supplément gros volume: +${volumeSupplementFee1}€`);
    }
    
    // Appliquer le multiplicateur de temps
    supplierPrice *= timeMultiplier;
    
    // Assurer le prix minimum
    supplierPrice = Math.max(supplierPrice, minimumPrice);
    
    const finalSupplierPrice = Math.round(supplierPrice);
    console.log(`✅ Prix prestataire calculé: ${finalSupplierPrice}€`);
    
    return finalSupplierPrice;
  }

  private parsePricingModel(pricingModel: any): PricingModel {
    // Handle different types of pricing model data
    if (!pricingModel) return {};
    
    if (typeof pricingModel === 'string') {
      try {
        return JSON.parse(pricingModel);
      } catch (error) {
        console.warn('Error parsing pricing model string:', error);
        return {};
      }
    }
    
    if (typeof pricingModel === 'object' && pricingModel !== null) {
      return pricingModel as PricingModel;
    }
    
    return {};
  }

  private applyMatchMoveMargin(supplierPrice: number, supplier: Supplier): { margin: number; finalPrice: number; marginPercentage: number } {
    console.log(`📊 Application marge MatchMove sur prix prestataire: ${supplierPrice}€`);
    
    // Safely parse pricing model to get matchMoveMargin
    const pricingModel: PricingModel = this.parsePricingModel(supplier.pricing_model);
    
    // Utiliser la marge du prestataire ou 40% par défaut
    const marginPercentage = pricingModel.matchMoveMargin || 40;
    
    console.log(`🎯 Marge MatchMove appliquée: ${marginPercentage}%`);
    
    const margin = Math.round(supplierPrice * (marginPercentage / 100));
    const finalPrice = supplierPrice + margin;
    
    console.log(`💰 Détail calcul: Prix prestataire ${supplierPrice}€ + Marge ${margin}€ (${marginPercentage}%) = Prix final ${finalPrice}€`);
    
    return { margin, finalPrice, marginPercentage };
  }

  async loadActiveSuppliers(): Promise<Supplier[]> {
    try {
      console.log('🔄 Chargement des prestataires actifs avec modèles de tarification...');
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      
      console.log('✅ Prestataires chargés:', suppliers?.length || 0);
      console.log('📋 Modèles de tarification:', suppliers?.map(s => ({ 
        company: s.company_name, 
        hasPricingModel: !!s.pricing_model,
        matchMoveMargin: this.parsePricingModel(s.pricing_model).matchMoveMargin || 'non définie'
      })));
      
      return suppliers || [];
    } catch (error) {
      console.error('❌ Erreur chargement prestataires:', error);
      return [];
    }
  }

  async generateQuotesForClient(client: Client): Promise<GeneratedQuote[]> {
    try {
      console.log(`💰 Génération de 3 devis pour client ${client.name} avec modèles de tarification exacts`);
      
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
      const quoteTypes: Array<'competitive' | 'standard' | 'premium'> = ['competitive', 'standard', 'premium'];

      // Générer les devis en utilisant les vrais modèles de tarification
      if (suppliers.length >= 3) {
        // Utiliser 3 prestataires différents
        for (let i = 0; i < 3; i++) {
          const supplier = suppliers[i];
          const quoteType = quoteTypes[i];
          
          console.log(`📊 Génération devis ${i + 1}/3 pour prestataire: ${supplier.company_name} (type: ${quoteType})`);
          
          // Calculer le prix du prestataire avec son modèle exact
          let supplierPrice = this.calculateSupplierPrice(exactDistance, client.estimated_volume, supplier);
          
          // Appliquer une variation selon le type de devis
          switch (quoteType) {
            case 'competitive':
              supplierPrice = Math.round(supplierPrice * 0.95); // -5% pour être compétitif
              break;
            case 'standard':
              // Prix normal, pas de modification
              break;
            case 'premium':
              supplierPrice = Math.round(supplierPrice * 1.10); // +10% pour premium
              break;
          }
          
          // Appliquer la marge MatchMove (40% par défaut ou celle du prestataire)
          const { margin, finalPrice, marginPercentage } = this.applyMatchMoveMargin(supplierPrice, supplier);
          
          const pricingModel: PricingModel = this.parsePricingModel(supplier.pricing_model);
          
          const quote: GeneratedQuote = {
            id: `quote-${client.id}-${supplier.id}-${quoteType}-${Date.now()}-${i}`,
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
            calculated_price: finalPrice,
            supplier_price: supplierPrice,
            matchmove_margin: margin,
            original_quote_amount: client.quote_amount,
            quote_type: quoteType,
            pricing_breakdown: {
              exactDistance,
              marginPercentage,
              estimatedVolume: client.estimated_volume,
              estimatedFloors: Math.ceil(client.estimated_volume / 15),
              supplierPricingModel: pricingModel,
              basePrice: pricingModel.basePrice || 150,
              volumeRate: pricingModel.volumeRate || 12,
              distanceRate: pricingModel.distanceRate || 1.2,
              matchMoveMarginUsed: marginPercentage,
              quoteType: quoteType,
              calculationDetails: {
                baseCalculation: (pricingModel.basePrice || 150) + 
                               (client.estimated_volume * (pricingModel.volumeRate || 12)) + 
                               (exactDistance * (pricingModel.distanceRate || 1.2)),
                finalSupplierPrice: supplierPrice,
                marginAmount: margin,
                finalClientPrice: finalPrice
              }
            },
            rank: i + 1
          };

          quotes.push(quote);
        }
      } else {
        // Si moins de 3 prestataires, utiliser le même prestataire avec différentes stratégies
        const supplier = suppliers[0];
        
        for (let i = 0; i < 3; i++) {
          const quoteType = quoteTypes[i];
          
          console.log(`📊 Génération devis ${i + 1}/3 avec même prestataire: ${supplier.company_name} (type: ${quoteType})`);
          
          let supplierPrice = this.calculateSupplierPrice(exactDistance, client.estimated_volume, supplier);
          
          // Appliquer une variation selon le type de devis
          switch (quoteType) {
            case 'competitive':
              supplierPrice = Math.round(supplierPrice * 0.95);
              break;
            case 'standard':
              // Prix normal
              break;
            case 'premium':
              supplierPrice = Math.round(supplierPrice * 1.10);
              break;
          }
          
          const { margin, finalPrice, marginPercentage } = this.applyMatchMoveMargin(supplierPrice, supplier);
          
          const pricingModel: PricingModel = this.parsePricingModel(supplier.pricing_model);
          
          const quote: GeneratedQuote = {
            id: `quote-${client.id}-${supplier.id}-${quoteType}-${Date.now()}-${i}`,
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
            calculated_price: finalPrice,
            supplier_price: supplierPrice,
            matchmove_margin: margin,
            original_quote_amount: client.quote_amount,
            quote_type: quoteType,
            pricing_breakdown: {
              exactDistance,
              marginPercentage,
              estimatedVolume: client.estimated_volume,
              estimatedFloors: Math.ceil(client.estimated_volume / 15),
              supplierPricingModel: pricingModel,
              basePrice: pricingModel.basePrice || 150,
              volumeRate: pricingModel.volumeRate || 12,
              distanceRate: pricingModel.distanceRate || 1.2,
              matchMoveMarginUsed: marginPercentage,
              quoteType: quoteType,
              calculationDetails: {
                baseCalculation: (pricingModel.basePrice || 150) + 
                               (client.estimated_volume * (pricingModel.volumeRate || 12)) + 
                               (exactDistance * (pricingModel.distanceRate || 1.2)),
                finalSupplierPrice: supplierPrice,
                marginAmount: margin,
                finalClientPrice: finalPrice
              }
            },
            rank: i + 1
          };

          quotes.push(quote);
        }
      }

      // Trier par prix pour avoir les meilleurs prix en premier
      quotes.sort((a, b) => a.calculated_price - b.calculated_price);
      
      // Réassigner les rangs après tri
      quotes.forEach((quote, index) => {
        quote.rank = index + 1;
      });

      console.log(`✅ 3 devis générés avec modèles de tarification exacts:`);
      quotes.forEach(q => {
        console.log(`  ${q.rank}. ${q.supplier_company} - ${q.calculated_price}€ (marge: ${q.pricing_breakdown?.marginPercentage}%, type: ${q.quote_type})`);
      });
      
      return quotes;

    } catch (error) {
      console.error('❌ Erreur génération devis:', error);
      return [];
    }
  }
}

export const pricingEngine = new PricingEngine();
