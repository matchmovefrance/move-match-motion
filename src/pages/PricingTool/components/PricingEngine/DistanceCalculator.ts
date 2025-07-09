
import { loadGoogleMapsScript, calculateDistanceByPostalCode } from '@/lib/google-maps-config';

export class DistanceCalculator {
  private distanceCache = new Map<string, number>();

  // Méthode pour vider le cache si nécessaire
  public clearCache(): void {
    this.distanceCache.clear();
    console.log('🗑️ Cache des distances vidé');
  }

  async getDistanceFromGoogleMaps(
    departurePostalCode: string, 
    departureCity: string,
    arrivalPostalCode: string, 
    arrivalCity: string
  ): Promise<number> {
    const cacheKey = `${departurePostalCode}-${arrivalPostalCode}`;
    
    if (this.distanceCache.has(cacheKey)) {
      const cachedDistance = this.distanceCache.get(cacheKey)!;
      console.log(`📍 Distance depuis cache: ${cachedDistance}km pour ${cacheKey}`);
      return cachedDistance;
    }

    console.log(`🗺️ Calcul distance Google Maps: ${departurePostalCode} ${departureCity} -> ${arrivalPostalCode} ${arrivalCity}`);
    
    try {
      // Charger le script Google Maps d'abord
      await loadGoogleMapsScript();
      
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
        console.warn(`⚠️ Impossible de calculer la distance Google Maps pour ${cacheKey}`);
        // Ne pas utiliser de fallback, retourner 0 pour indiquer l'échec
        return 0;
      }
    } catch (error) {
      console.error(`❌ Erreur calcul distance Google Maps pour ${cacheKey}:`, error);
      // Ne pas utiliser de fallback, retourner 0 pour indiquer l'échec
      return 0;
    }
  }

  private estimateDistanceFallback(departureCity: string, arrivalCity: string): number {
    // Estimation plus réaliste pour les distances en France
    const hash = this.hashString(departureCity + arrivalCity);
    const random = this.seededRandom(hash);
    // Distance entre 10 et 50 km pour éviter les estimations trop élevées
    const distance = 10 + Math.floor(random() * 40);
    console.log(`📏 Distance fallback estimée: ${distance}km pour ${departureCity} -> ${arrivalCity}`);
    return distance;
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
