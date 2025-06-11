
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculateDistance = async () => {
      if (!enabled || !departurePostalCode || !arrivalPostalCode) {
        setDistance(null);
        setDuration(null);
        setError(null);
        return;
      }

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
          setDistance(result.distance);
          setDuration(result.duration);
          console.log(`Distance calculée: ${result.distance}km entre ${departurePostalCode} et ${arrivalPostalCode}`);
        } else {
          setError('Impossible de calculer la distance');
          setDistance(null);
          setDuration(null);
        }
      } catch (err) {
        console.error('Erreur lors du calcul de distance:', err);
        setError('Erreur lors du calcul de distance');
        setDistance(null);
        setDuration(null);
      } finally {
        setIsLoading(false);
      }
    };

    calculateDistance();
  }, [departurePostalCode, arrivalPostalCode, departureCity, arrivalCity, enabled]);

  return {
    distance,
    duration,
    isLoading,
    error
  };
};
