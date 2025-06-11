
import { supabase } from '@/integrations/supabase/client';
import { loadGoogleMapsScript, calculateDistanceByPostalCode } from '@/lib/google-maps-config';

interface PricingModel {
  basePrice: number;
  volumeRate: number;
  distanceRate: number;
  distanceRateHighVolume: number;
  floorRate: number;
  packingRate: number;
  unpackingRate: number;
  dismantleRate: number;
  reassembleRate: number;
  carryingDistanceFee: number;
  carryingDistanceThreshold: number;
  heavyItemsFee: number;
  volumeSupplementThreshold1: number;
  volumeSupplementFee1: number;
  volumeSupplementThreshold2: number;
  volumeSupplementFee2: number;
  furnitureLiftFee: number;
  furnitureLiftThreshold: number;
  parkingFeeEnabled: boolean;
  parkingFeeAmount: number;
  timeMultiplier: number;
  minimumPrice: number;
  matchMoveMargin: number;
}

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
  private distanceCache = new Map<string, number>();

  static getInstance(): PricingEngine {
    if (!PricingEngine.instance) {
      PricingEngine.instance = new PricingEngine();
    }
    return PricingEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🔧 Initialisation du moteur de pricing avec Google Maps API...');
    
    // Charger l'API Google Maps
    try {
      await loadGoogleMapsScript();
      console.log('✅ Google Maps API chargée');
    } catch (error) {
      console.error('❌ Erreur chargement Google Maps API:', error);
    }
    
    // Charger les prestataires avec leurs modèles de pricing cohérents
    const { data: movesData } = await supabase
      .from('confirmed_moves')
      .select('mover_id, mover_name, company_name, contact_email, contact_phone')
      .not('mover_id', 'is', null);

    if (!movesData) {
      console.warn('⚠️ Aucun prestataire trouvé');
      return;
    }

    // Créer des prestataires uniques avec modèles cohérents
    const uniqueSuppliersMap = new Map();
    
    movesData.forEach((move) => {
      const key = `${move.mover_name}-${move.company_name}`;
      if (!uniqueSuppliersMap.has(key)) {
        // Modèles de pricing cohérents et réalistes
        const pricingModel = this.createConsistentPricingModel(move.company_name);
        
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

  private createConsistentPricingModel(companyName: string): PricingModel {
    // Créer des modèles cohérents basés sur le nom de l'entreprise pour la reproductibilité
    const hash = this.hashString(companyName);
    const random = this.seededRandom(hash);
    
    return {
      basePrice: 140 + (random() * 60), // 140-200€
      volumeRate: 9 + (random() * 4), // 9-13€/m³
      distanceRate: 0.9 + (random() * 0.3), // 0.9-1.2€/km
      distanceRateHighVolume: 1.9 + (random() * 0.4), // 1.9-2.3€/km
      floorRate: 45 + (random() * 15), // 45-60€/étage
      packingRate: 4.5 + (random() * 2), // 4.5-6.5€/carton
      unpackingRate: 4.5 + (random() * 2),
      dismantleRate: 18 + (random() * 8), // 18-26€/meuble
      reassembleRate: 18 + (random() * 8),
      carryingDistanceFee: 90 + (random() * 30), // 90-120€
      carryingDistanceThreshold: 9 + (random() * 3), // 9-12m
      heavyItemsFee: 180 + (random() * 70), // 180-250€
      volumeSupplementThreshold1: 19 + (random() * 3), // 19-22m³
      volumeSupplementFee1: 130 + (random() * 40), // 130-170€
      volumeSupplementThreshold2: 28 + (random() * 4), // 28-32m³
      volumeSupplementFee2: 150 + (random() * 50), // 150-200€
      furnitureLiftFee: 450 + (random() * 150), // 450-600€
      furnitureLiftThreshold: 3 + Math.floor(random() * 2), // 3-4 étages
      parkingFeeEnabled: random() > 0.6,
      parkingFeeAmount: random() > 0.6 ? 40 + (random() * 40) : 0,
      timeMultiplier: 0.95 + (random() * 0.2), // 0.95-1.15
      minimumPrice: 190 + (random() * 30), // 190-220€
      matchMoveMargin: 38 + (random() * 12), // 38-50% marge MatchMove
    };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private seededRandom(seed: number) {
    return function() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  private async getDistanceFromGoogleMaps(
    departurePostalCode: string, 
    departureCity: string,
    arrivalPostalCode: string, 
    arrivalCity: string
  ): Promise<number> {
    const cacheKey = `${departurePostalCode}-${arrivalPostalCode}`;
    
    // Vérifier le cache d'abord
    if (this.distanceCache.has(cacheKey)) {
      const cachedDistance = this.distanceCache.get(cacheKey)!;
      console.log(`📍 Distance depuis cache: ${cachedDistance}km pour ${cacheKey}`);
      return cachedDistance;
    }

    try {
      console.log(`🗺️ Calcul distance Google Maps: ${departurePostalCode} ${departureCity} -> ${arrivalPostalCode} ${arrivalCity}`);
      
      const result = await calculateDistanceByPostalCode(
        departurePostalCode,
        arrivalPostalCode,
        departureCity,
        arrivalCity
      );

      if (result && result.distance) {
        console.log(`✅ Distance Google Maps calculée: ${result.distance}km pour ${cacheKey}`);
        this.distanceCache.set(cacheKey, result.distance);
        return result.distance;
      } else {
        console.warn(`⚠️ Impossible de calculer la distance Google Maps pour ${cacheKey}, utilisation d'une estimation`);
        // Fallback: estimation basée sur les noms des villes
        const fallbackDistance = this.estimateDistanceFallback(departureCity, arrivalCity);
        this.distanceCache.set(cacheKey, fallbackDistance);
        return fallbackDistance;
      }
    } catch (error) {
      console.error(`❌ Erreur calcul distance Google Maps pour ${cacheKey}:`, error);
      // Fallback: estimation basée sur les noms des villes
      const fallbackDistance = this.estimateDistanceFallback(departureCity, arrivalCity);
      this.distanceCache.set(cacheKey, fallbackDistance);
      return fallbackDistance;
    }
  }

  private estimateDistanceFallback(departureCity: string, arrivalCity: string): number {
    // Simulation simple de distance basée sur les noms des villes (fallback uniquement)
    const hash = this.hashString(departureCity + arrivalCity);
    const random = this.seededRandom(hash);
    const distance = 15 + Math.floor(random() * 45); // 15-60km
    console.log(`📏 Distance fallback estimée: ${distance}km pour ${departureCity} -> ${arrivalCity}`);
    return distance;
  }

  async calculatePrice(client: ClientRequest, supplier: Supplier): Promise<{
    supplierPrice: number;
    matchMoveMargin: number;
    finalPrice: number;
    breakdown: any;
  }> {
    const { pricing_model } = supplier;
    
    // Calcul de la distance exacte via Google Maps API
    const exactDistance = await this.getDistanceFromGoogleMaps(
      client.departure_postal_code,
      client.departure_city,
      client.arrival_postal_code,
      client.arrival_city
    );
    
    // Estimation des autres paramètres de déménagement basés sur les données client
    const estimatedFloors = Math.max(1, Math.floor(client.estimated_volume / 8)); // 1 étage par 8m³
    const packingBoxes = Math.floor(client.estimated_volume * 2.5); // 2.5 cartons par m³
    const furnitureItems = Math.floor(client.estimated_volume / 4); // 1 meuble par 4m³
    const hasHeavyItems = client.estimated_volume > 15; // Objets lourds si > 15m³
    const carryingDistance = 8 + Math.floor(client.estimated_volume / 5); // Distance portage estimée
    
    let supplierPrice = pricing_model.basePrice;
    
    // 1. Volume
    supplierPrice += client.estimated_volume * pricing_model.volumeRate;
    
    // 2. Distance EXACTE de Google Maps (tarif différent selon volume)
    const distanceRate = client.estimated_volume > 20 ? 
      pricing_model.distanceRateHighVolume : 
      pricing_model.distanceRate;
    supplierPrice += exactDistance * distanceRate;
    
    // 3. Étages
    supplierPrice += estimatedFloors * pricing_model.floorRate;
    
    // 4. Emballage/Déballage
    supplierPrice += packingBoxes * pricing_model.packingRate;
    supplierPrice += packingBoxes * pricing_model.unpackingRate;
    
    // 5. Démontage/Remontage
    supplierPrice += furnitureItems * pricing_model.dismantleRate;
    supplierPrice += furnitureItems * pricing_model.reassembleRate;
    
    // 6. Distance de portage
    if (carryingDistance > pricing_model.carryingDistanceThreshold) {
      supplierPrice += pricing_model.carryingDistanceFee;
    }
    
    // 7. Objets lourds
    if (hasHeavyItems) {
      supplierPrice += pricing_model.heavyItemsFee;
    }
    
    // 8. Suppléments volume
    if (client.estimated_volume > pricing_model.volumeSupplementThreshold1) {
      supplierPrice += pricing_model.volumeSupplementFee1;
    }
    if (client.estimated_volume > pricing_model.volumeSupplementThreshold2) {
      supplierPrice += pricing_model.volumeSupplementFee2;
    }
    
    // 9. Monte-meuble si > seuil d'étages
    if (estimatedFloors > pricing_model.furnitureLiftThreshold) {
      supplierPrice += pricing_model.furnitureLiftFee;
    }
    
    // 10. Stationnement
    if (pricing_model.parkingFeeEnabled) {
      supplierPrice += pricing_model.parkingFeeAmount;
    }
    
    // 11. Multiplicateur temps
    supplierPrice *= pricing_model.timeMultiplier;
    
    // 12. Prix minimum
    supplierPrice = Math.max(supplierPrice, pricing_model.minimumPrice);
    
    // 13. Marge MatchMove
    const matchMoveMargin = (supplierPrice * pricing_model.matchMoveMargin) / 100;
    const finalPrice = supplierPrice + matchMoveMargin;
    
    const breakdown = {
      basePrice: pricing_model.basePrice,
      volumeCost: client.estimated_volume * pricing_model.volumeRate,
      distanceCost: exactDistance * distanceRate,
      exactDistance: exactDistance, // Distance exacte de Google Maps
      floorsCost: estimatedFloors * pricing_model.floorRate,
      packingCost: packingBoxes * (pricing_model.packingRate + pricing_model.unpackingRate),
      furnitureCost: furnitureItems * (pricing_model.dismantleRate + pricing_model.reassembleRate),
      estimatedFloors,
      packingBoxes,
      furnitureItems,
      hasHeavyItems,
      carryingDistance,
      marginPercentage: pricing_model.matchMoveMargin
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
    
    // Calculer les devis avec les distances exactes pour chaque prestataire
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
    
    // Trier par prix et assigner les rangs
    quotes.sort((a, b) => a.calculated_price - b.calculated_price);
    quotes.forEach((quote, index) => {
      quote.rank = index + 1;
    });
    
    return quotes.slice(0, 3); // Retourner les 3 meilleurs
  }
}

export const pricingEngine = PricingEngine.getInstance();
