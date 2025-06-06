
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Move {
  id: number;
  departure_city: string;
  departure_postal_code: string;
  arrival_city: string;
  arrival_postal_code: string;
  departure_date: string;
  status: string;
  company_name?: string;
  departure_lat?: number;
  departure_lng?: number;
  arrival_lat?: number;
  arrival_lng?: number;
  match_status?: string;
  total_price?: number;
  created_at: string;
  real_distance_km?: number;
  real_duration_minutes?: number;
}

interface ClientRequest {
  id: number;
  departure_city: string;
  departure_postal_code: string;
  arrival_city: string;
  arrival_postal_code: string;
  desired_date: string;
  status: string;
  name?: string;
  departure_lat?: number;
  departure_lng?: number;
  arrival_lat?: number;
  arrival_lng?: number;
  estimated_volume?: number;
  created_at: string;
  real_distance_km?: number;
  real_duration_minutes?: number;
}

export const useMapData = () => {
  const [activeMoves, setActiveMoves] = useState<Move[]>([]);
  const [activeClientRequests, setActiveClientRequests] = useState<ClientRequest[]>([]);
  const [allMoves, setAllMoves] = useState<Move[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  const geocodeAddress = useCallback(async (address: string): Promise<{ lat: number; lng: number }> => {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await new Promise<google.maps.GeocoderResponse>((resolve, reject) => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results) {
            resolve({ results, status });
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });
      
      const location = response.results[0].geometry.location;
      return {
        lat: location.lat(),
        lng: location.lng()
      };
    } catch (error) {
      console.error('Erreur de géocodage:', error);
      return { lat: 46.603354, lng: 1.888334 };
    }
  }, []);

  const loadData = useCallback(async () => {
    if (loadedRef.current) return; // Prevent multiple loads
    
    try {
      setLoading(true);
      loadedRef.current = true;
      
      // Load confirmed moves
      const { data: movesData, error: movesError } = await supabase
        .from('confirmed_moves')
        .select('*')
        .order('departure_date', { ascending: false })
        .limit(20); // Limit for performance

      if (movesError) throw movesError;

      // Load active client requests
      const { data: clientRequestsData, error: clientRequestsError } = await supabase
        .from('client_requests')
        .select('*')
        .neq('status', 'confirmed')
        .order('desired_date', { ascending: false })
        .limit(20); // Limit for performance

      if (clientRequestsError) throw clientRequestsError;

      if (movesData && movesData.length > 0) {
        const activeMovesData = movesData.filter(move => move.status !== 'termine');
        
        // Geocode only first 3 active moves for ultra performance
        const activeMovesWithCoords: Move[] = [];
        
        for (const move of activeMovesData.slice(0, 3)) {
          const departureAddress = `${move.departure_postal_code} ${move.departure_city}, France`;
          const arrivalAddress = `${move.arrival_postal_code} ${move.arrival_city}, France`;
          
          const [departure, arrival] = await Promise.all([
            geocodeAddress(departureAddress),
            geocodeAddress(arrivalAddress)
          ]);
          
          activeMovesWithCoords.push({
            ...move,
            departure_lat: departure.lat,
            departure_lng: departure.lng,
            arrival_lat: arrival.lat,
            arrival_lng: arrival.lng
          });
        }
        
        setActiveMoves(activeMovesWithCoords);
        setAllMoves(movesData);
      } else {
        setActiveMoves([]);
        setAllMoves([]);
      }

      if (clientRequestsData && clientRequestsData.length > 0) {
        // Geocode only first 3 client requests for ultra performance
        const activeClientRequestsWithCoords: ClientRequest[] = [];
        
        for (const request of clientRequestsData.slice(0, 3)) {
          const departureAddress = `${request.departure_postal_code} ${request.departure_city}, France`;
          const arrivalAddress = `${request.arrival_postal_code} ${request.arrival_city}, France`;
          
          const [departure, arrival] = await Promise.all([
            geocodeAddress(departureAddress),
            geocodeAddress(arrivalAddress)
          ]);
          
          activeClientRequestsWithCoords.push({
            ...request,
            departure_lat: departure.lat,
            departure_lng: departure.lng,
            arrival_lat: arrival.lat,
            arrival_lng: arrival.lng
          });
        }
        
        setActiveClientRequests(activeClientRequestsWithCoords);
      } else {
        setActiveClientRequests([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  }, [geocodeAddress]);

  const refreshData = useCallback(() => {
    loadedRef.current = false;
    setLoading(true);
    loadData();
  }, [loadData]);

  return {
    activeMoves,
    activeClientRequests,
    allMoves,
    loading,
    loadData,
    refreshData
  };
};
