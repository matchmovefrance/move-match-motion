import { supabase } from '@/integrations/supabase/client';
import { loadGoogleMapsScript } from '@/lib/google-maps-config';
import { DistanceCalculator } from './PricingEngine/DistanceCalculator';
import { PricingModelGenerator, PricingModel } from './PricingEngine/PricingModelGenerator';

interface Supplier {
  id: string;
  mover_name: string;
  company_name: string;
  contact_email: string;
  contact_phone: string;
  pricing_model: PricingModel;
}

interface ClientRequest {
  id: number;
  name: string;
  email: string;
  departure_city: string;
  departure_postal_code: string;
  arrival_city: string;
  arrival_postal_code: string;
  estimated_volume: number;
  desired_date: string;
  quote_amount?: number;
}

export class PricingEngine {
  private static instance: PricingEngine;
  private suppliers: Supplier[] = [];
  private isInitialized = false;
  private distanceCalculator = new DistanceCalculator();
  private pricingModelGenerator = new PricingModelGenerator();

  static getInstance(): PricingEngine {
    if (!PricingEngine.instance) {
      PricingEngine.instance = new PricingEngine();
    }
    return PricingEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🔧 Initialisation du moteur de pricing avec Google Maps API...');
    
    try {
      await loadGoogleMapsScript();
      console.log('✅ Google Maps API chargée');
    } catch (error) {
      console.error('❌ Erreur chargement Google Maps API:', error);
    }
    
    const { data: movesData } = await supabase
      .from('confirmed_moves')
      .select('mover_id, mover_name, company_name, contact_email, contact_phone')
      .not('mover_id', 'is', null);

    if (!movesData) {
      console.warn('⚠️ Aucun prestataire trouvé');
      return;
    }

    const uniqueSuppliersMap = new Map();
    
    movesData.forEach((move) => {
      const key = `${move.mover_name}-${move.company_name}`;
      if (!uniqueSuppliersMap.has(key)) {
        const pricingModel = this.pricingModelGenerator.createConsistentPricingModel(move.company_name);
        
        uniqueSuppliersMap.set(key, {
          id: `supplier-${move.mover_id}`,
          mover_name: move.mover_name,
          company_name: move.company_name,
          contact_email: move.contact_email,
          contact_phone: move.contact_phone,
          pricing_model: pricingModel
        });
      }
    });
    
    this.suppliers = Array.from(uniqueSuppliersMap.values());
    this.isInitialized = true;
    
    console.log(`✅ Moteur initialisé avec ${this.suppliers.length} prestataires et Google Maps API`);
  }

  async calculatePrice(client: ClientRequest, supplier: Supplier): Promise<{
    supplierPrice: number;
    matchMoveMargin: number;
    finalPrice: number;
    breakdown: any;
  }> {
    const { pricing_model } = supplier;
    
    const exactDistance = await this.distanceCalculator.getDistanceFromGoogleMaps(
      client.departure_postal_code,
      client.departure_city,
      client.arrival_postal_code,
      client.arrival_city
    );
    
    let supplierPrice = pricing_model.basePrice;
    
    supplierPrice += client.estimated_volume * pricing_model.volumeRate;
    
    const distanceRate = client.estimated_volume > 20 ? 
      pricing_model.distanceRateHighVolume : 
      pricing_model.distanceRate;
    supplierPrice += exactDistance * distanceRate;
    
    supplierPrice += Math.max(1, Math.floor(client.estimated_volume / 8)) * pricing_model.floorRate;
    supplierPrice += Math.floor(client.estimated_volume * 2.5) * (pricing_model.packingRate + pricing_model.unpackingRate);
    supplierPrice += Math.floor(client.estimated_volume / 4) * (pricing_model.dismantleRate + pricing_model.reassembleRate);
    
    if (8 + Math.floor(client.estimated_volume / 5) > pricing_model.carryingDistanceThreshold) {
      supplierPrice += pricing_model.carryingDistanceFee;
    }
    
    if (client.estimated_volume > 15) {
      supplierPrice += pricing_model.heavyItemsFee;
    }
    
    if (client.estimated_volume > pricing_model.volumeSupplementThreshold1) {
      supplierPrice += pricing_model.volumeSupplementFee1;
    }
    if (client.estimated_volume > pricing_model.volumeSupplementThreshold2) {
      supplierPrice += pricing_model.volumeSupplementFee2;
    }
    
    if (Math.max(1, Math.floor(client.estimated_volume / 8)) > pricing_model.furnitureLiftThreshold) {
      supplierPrice += pricing_model.furnitureLiftFee;
    }
    
    if (pricing_model.parkingFeeEnabled) {
      supplierPrice += pricing_model.parkingFeeAmount;
    }
    
    supplierPrice *= pricing_model.timeMultiplier;
    supplierPrice = Math.max(supplierPrice, pricing_model.minimumPrice);
    
    const matchMoveMargin = (supplierPrice * pricing_model.matchMoveMargin) / 100;
    const finalPrice = supplierPrice + matchMoveMargin;
    
    const breakdown = {
      basePrice: pricing_model.basePrice,
      volumeCost: client.estimated_volume * pricing_model.volumeRate,
      distanceCost: exactDistance * distanceRate,
      exactDistance: exactDistance,
      floorsCost: Math.max(1, Math.floor(client.estimated_volume / 8)) * pricing_model.floorRate,
      packingCost: Math.floor(client.estimated_volume * 2.5) * (pricing_model.packingRate + pricing_model.unpackingRate),
      furnitureCost: Math.floor(client.estimated_volume / 4) * (pricing_model.dismantleRate + pricing_model.reassembleRate),
      estimatedFloors: Math.max(1, Math.floor(client.estimated_volume / 8)),
      packingBoxes: Math.floor(client.estimated_volume * 2.5),
      furnitureItems: Math.floor(client.estimated_volume / 4),
      hasHeavyItems: client.estimated_volume > 15,
      carryingDistance: 8 + Math.floor(client.estimated_volume / 5),
      marginPercentage: pricing_model.matchMoveMargin,
      estimatedVolume: client.estimated_volume
    };
    
    console.log(`💰 ${supplier.company_name} pour ${client.name}:`);
    console.log(`   🗺️ Distance exacte Google Maps: ${exactDistance}km`);
    console.log(`   📊 Prix prestataire: ${Math.round(supplierPrice)}€`);
    console.log(`   💎 Marge MatchMove: ${pricing_model.matchMoveMargin.toFixed(1)}% (+${Math.round(matchMoveMargin)}€)`);
    console.log(`   🎯 Prix final: ${Math.round(finalPrice)}€`);
    console.log(`   🔍 Prix original client: ${client.quote_amount || 'Non défini'}€`);
    
    return {
      supplierPrice: Math.round(supplierPrice),
      matchMoveMargin: Math.round(matchMoveMargin),
      finalPrice: Math.round(finalPrice),
      breakdown
    };
  }

  getSuppliers(): Supplier[] {
    return this.suppliers;
  }

  async generateQuotesForClient(client: ClientRequest): Promise<any[]> {
    await this.initialize();
    
    const quotes = [];
    
    for (const supplier of this.suppliers) {
      const pricing = await this.calculatePrice(client, supplier);
      
      quotes.push({
        id: `quote-${client.id}-${supplier.id}-${Date.now()}`,
        client_id: client.id,
        client_name: client.name,
        client_email: client.email,
        departure_city: client.departure_city,
        arrival_city: client.arrival_city,
        estimated_volume: client.estimated_volume,
        desired_date: client.desired_date,
        supplier_id: supplier.id,
        supplier_name: supplier.mover_name,
        supplier_company: supplier.company_name,
        calculated_price: pricing.finalPrice,
        supplier_price: pricing.supplierPrice,
        matchmove_margin: pricing.matchMoveMargin,
        original_quote_amount: client.quote_amount,
        pricing_breakdown: pricing.breakdown,
        rank: 0
      });
    }
    
    quotes.sort((a, b) => a.calculated_price - b.calculated_price);
    quotes.forEach((quote, index) => {
      quote.rank = index + 1;
    });
    
    return quotes.slice(0, 3);
  }
}

export const pricingEngine = PricingEngine.getInstance();
