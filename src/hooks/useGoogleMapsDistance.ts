
import { useState, useEffect } from 'react';
import { loadGoogleMapsScript, calculateDistanceByPostalCode } from '@/lib/google-maps-config';

interface UseGoogleMapsDistanceProps {
  departurePostalCode?: string;
  arrivalPostalCode?: string;
  departureCity?: string;
  arrivalCity?: string;
  enabled?: boolean;
}

interface DistanceResult {
  distance: number | null;
  duration: number | null;
  distanceText: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useGoogleMapsDistance = ({
  departurePostalCode,
  arrivalPostalCode,
  departureCity,
  arrivalCity,
  enabled = true
}: UseGoogleMapsDistanceProps): DistanceResult => {
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [distanceText, setDistanceText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculateDistance = async () => {
      if (!enabled || !departurePostalCode || !arrivalPostalCode) {
        setDistance(null);
        setDuration(null);
        setDistanceText(null);
        setError(null);
        return;
      }

      console.log(`🚀 Hook useGoogleMapsDistance: Calcul pour ${departurePostalCode} -> ${arrivalPostalCode}`);
      
      setIsLoading(true);
      setError(null);

      try {
        await loadGoogleMapsScript();
        
        const result = await calculateDistanceByPostalCode(
          departurePostalCode,
          arrivalPostalCode,
          departureCity,
          arrivalCity
        );

        if (result) {
          console.log(`✅ Hook useGoogleMapsDistance: Résultat reçu`);
          console.log(`   - Distance: ${result.distance}km`);
          console.log(`   - Distance text: ${result.distanceText}`);
          console.log(`   - Durée: ${result.duration}min`);
          
          setDistance(result.distance);
          setDuration(result.duration);
          setDistanceText(result.distanceText);
          console.log(`🎯 Distance calculée: ${result.distance}km (${result.distanceText}) entre ${departurePostalCode} et ${arrivalPostalCode}`);
        } else {
          console.warn(`❌ Hook useGoogleMapsDistance: Aucun résultat`);
          setError('Impossible de calculer la distance');
          setDistance(null);
          setDuration(null);
          setDistanceText(null);
        }
      } catch (err) {
        console.error('❌ Hook useGoogleMapsDistance: Erreur lors du calcul de distance:', err);
        setError('Erreur lors du calcul de distance');
        setDistance(null);
        setDuration(null);
        setDistanceText(null);
      } finally {
        setIsLoading(false);
      }
    };

    calculateDistance();
  }, [departurePostalCode, arrivalPostalCode, departureCity, arrivalCity, enabled]);

  return {
    distance,
    duration,
    distanceText,
    isLoading,
    error
  };
};
