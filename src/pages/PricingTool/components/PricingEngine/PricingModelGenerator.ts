
export interface PricingModel {
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

export class PricingModelGenerator {
  createConsistentPricingModel(companyName: string): PricingModel {
    const hash = this.hashString(companyName);
    const random = this.seededRandom(hash);
    
    return {
      basePrice: 140 + (random() * 60),
      volumeRate: 9 + (random() * 4),
      distanceRate: 0.9 + (random() * 0.3),
      distanceRateHighVolume: 1.9 + (random() * 0.4),
      floorRate: 45 + (random() * 15),
      packingRate: 4.5 + (random() * 2),
      unpackingRate: 4.5 + (random() * 2),
      dismantleRate: 18 + (random() * 8),
      reassembleRate: 18 + (random() * 8),
      carryingDistanceFee: 90 + (random() * 30),
      carryingDistanceThreshold: 9 + (random() * 3),
      heavyItemsFee: 180 + (random() * 70),
      volumeSupplementThreshold1: 19 + (random() * 3),
      volumeSupplementFee1: 130 + (random() * 40),
      volumeSupplementThreshold2: 28 + (random() * 4),
      volumeSupplementFee2: 150 + (random() * 50),
      furnitureLiftFee: 450 + (random() * 150),
      furnitureLiftThreshold: 3 + Math.floor(random() * 2),
      parkingFeeEnabled: random() > 0.6,
      parkingFeeAmount: random() > 0.6 ? 40 + (random() * 40) : 0,
      timeMultiplier: 0.95 + (random() * 0.2),
      minimumPrice: 190 + (random() * 30),
      matchMoveMargin: 38 + (random() * 12),
    };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private seededRandom(seed: number) {
    return function() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }
}
