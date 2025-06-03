
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Move {
  id: number;
  departure_city: string;
  departure_postal_code: string;
  arrival_city: string;
  arrival_postal_code: string;
  departure_date: string;
  status_custom: string;
}

interface ClientRequest {
  id: number;
  departure_city: string;
  departure_postal_code: string;
  arrival_city: string;
  arrival_postal_code: string;
  desired_date: string;
  status_custom: string;
}

const GoogleMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [clientRequests, setClientRequests] = useState<ClientRequest[]>([]);

  const GOOGLE_MAPS_API_KEY = 'AIzaSyDgAn_xJ5IsZBJjlwLkMYhWP7DQXvoxK4Y';

  useEffect(() => {
    loadGoogleMapsScript();
    fetchMoves();
    fetchClientRequests();
  }, []);

  const loadGoogleMapsScript = () => {
    if (window.google) {
      initializeMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initializeMap;
    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!mapRef.current) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: { lat: 46.603354, lng: 1.888334 }, // Center of France
      zoom: 6,
      styles: [
        {
          featureType: 'all',
          elementType: 'geometry.fill',
          stylers: [{ weight: '2.00' }]
        },
        {
          featureType: 'all',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#9c9c9c' }]
        }
      ]
    });

    setMap(mapInstance);
  };

  const fetchMoves = async () => {
    try {
      const { data, error } = await supabase
        .from('confirmed_moves')
        .select('*')
        .eq('status_custom', 'en_cours');

      if (error) throw error;
      setMoves(data || []);
    } catch (error) {
      console.error('Error fetching moves:', error);
    }
  };

  const fetchClientRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('client_requests')
        .select('*')
        .eq('status_custom', 'en_cours');

      if (error) throw error;
      setClientRequests(data || []);
    } catch (error) {
      console.error('Error fetching client requests:', error);
    }
  };

  const geocodeAddress = (postalCode: string, city: string): Promise<google.maps.LatLng | null> => {
    return new Promise((resolve) => {
      if (!window.google) {
        resolve(null);
        return;
      }

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { address: `${postalCode} ${city}, France` },
        (results, status) => {
          if (status === 'OK' && results && results[0]) {
            resolve(results[0].geometry.location);
          } else {
            resolve(null);
          }
        }
      );
    });
  };

  const addMarkers = async () => {
    if (!map) return;

    // Clear existing markers
    // Add markers for confirmed moves (blue)
    for (const move of moves) {
      const departureLocation = await geocodeAddress(
        move.departure_postal_code,
        move.departure_city
      );
      const arrivalLocation = await geocodeAddress(
        move.arrival_postal_code,
        move.arrival_city
      );

      if (departureLocation) {
        new google.maps.Marker({
          position: departureLocation,
          map: map,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%234F46E5"><circle cx="12" cy="12" r="10"/></svg>',
            scaledSize: new google.maps.Size(20, 20)
          },
          title: `Départ: ${move.departure_city} (${new Date(move.departure_date).toLocaleDateString('fr-FR')})`
        });
      }

      if (arrivalLocation) {
        new google.maps.Marker({
          position: arrivalLocation,
          map: map,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%231E40AF"><circle cx="12" cy="12" r="10"/></svg>',
            scaledSize: new google.maps.Size(20, 20)
          },
          title: `Arrivée: ${move.arrival_city}`
        });
      }

      // Draw line between departure and arrival
      if (departureLocation && arrivalLocation) {
        new google.maps.Polyline({
          path: [departureLocation, arrivalLocation],
          geodesic: true,
          strokeColor: '#4F46E5',
          strokeOpacity: 1.0,
          strokeWeight: 2,
          map: map
        });
      }
    }

    // Add markers for client requests (green)
    for (const request of clientRequests) {
      const departureLocation = await geocodeAddress(
        request.departure_postal_code,
        request.departure_city
      );
      const arrivalLocation = await geocodeAddress(
        request.arrival_postal_code,
        request.arrival_city
      );

      if (departureLocation) {
        new google.maps.Marker({
          position: departureLocation,
          map: map,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2310B981"><circle cx="12" cy="12" r="10"/></svg>',
            scaledSize: new google.maps.Size(20, 20)
          },
          title: `Demande départ: ${request.departure_city} (${new Date(request.desired_date).toLocaleDateString('fr-FR')})`
        });
      }

      if (arrivalLocation) {
        new google.maps.Marker({
          position: arrivalLocation,
          map: map,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23059669"><circle cx="12" cy="12" r="10"/></svg>',
            scaledSize: new google.maps.Size(20, 20)
          },
          title: `Demande arrivée: ${request.arrival_city}`
        });
      }

      // Draw dashed line for client requests
      if (departureLocation && arrivalLocation) {
        new google.maps.Polyline({
          path: [departureLocation, arrivalLocation],
          geodesic: true,
          strokeColor: '#10B981',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          map: map,
          icons: [{
            icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 },
            offset: '0',
            repeat: '20px'
          }]
        });
      }
    }
  };

  useEffect(() => {
    if (map && moves.length > 0 && clientRequests.length > 0) {
      addMarkers();
    }
  }, [map, moves, clientRequests]);

  return (
    <div className="w-full h-96 rounded-lg shadow-lg border border-gray-200">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      <div className="mt-4 flex justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
          <span>Trajets confirmés</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span>Demandes clients</span>
        </div>
      </div>
    </div>
  );
};

export default GoogleMap;
