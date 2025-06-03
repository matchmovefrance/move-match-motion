
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, User, Phone, Mail, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Move {
  id: number;
  departure_city: string;
  departure_postal_code: string;
  arrival_city: string;
  arrival_postal_code: string;
  departure_date: string;
  status_custom: string;
  mover_id: number;
  movers?: {
    name: string;
    company_name: string;
    email: string;
    phone: string;
  };
}

interface ClientRequest {
  id: number;
  departure_city: string;
  departure_postal_code: string;
  arrival_city: string;
  arrival_postal_code: string;
  desired_date: string;
  status_custom: string;
  client_id: number;
  clients?: {
    name: string;
    email: string;
    phone: string;
  };
}

const GoogleMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [clientRequests, setClientRequests] = useState<ClientRequest[]>([]);
  const [selectedMover, setSelectedMover] = useState<any>(null);
  const [showMoverInfo, setShowMoverInfo] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  const GOOGLE_MAPS_API_KEY = 'AIzaSyDgAn_xJ5IsZBJjlwLkMYhWP7DQXvoxK4Y';

  useEffect(() => {
    loadGoogleMapsScript();
    fetchMoves();
    fetchClientRequests();
  }, []);

  const loadGoogleMapsScript = () => {
    if (typeof google !== 'undefined' && google.maps) {
      console.log('Google Maps already loaded');
      setIsLoaded(true);
      initializeMap();
      return;
    }

    console.log('Loading Google Maps script...');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google Maps script loaded successfully');
      setIsLoaded(true);
      initializeMap();
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps script');
    };
    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!mapRef.current || typeof google === 'undefined') {
      console.error('Map container or Google Maps not available');
      return;
    }

    console.log('Initializing map...');
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
    console.log('Map initialized successfully');
  };

  const fetchMoves = async () => {
    try {
      console.log('Fetching moves...');
      const { data, error } = await supabase
        .from('confirmed_moves')
        .select(`
          *,
          movers (
            name,
            company_name,
            email,
            phone
          )
        `)
        .eq('status_custom', 'en_cours');

      if (error) throw error;
      console.log('Moves fetched:', data?.length || 0);
      setMoves(data || []);
    } catch (error) {
      console.error('Error fetching moves:', error);
    }
  };

  const fetchClientRequests = async () => {
    try {
      console.log('Fetching client requests...');
      const { data, error } = await supabase
        .from('client_requests')
        .select(`
          *,
          clients (
            name,
            email,
            phone
          )
        `)
        .eq('status_custom', 'en_cours');

      if (error) throw error;
      console.log('Client requests fetched:', data?.length || 0);
      setClientRequests(data || []);
    } catch (error) {
      console.error('Error fetching client requests:', error);
    }
  };

  const clearMapMarkers = () => {
    markersRef.current.forEach(marker => marker.setMap(null));
    polylinesRef.current.forEach(polyline => polyline.setMap(null));
    markersRef.current = [];
    polylinesRef.current = [];
  };

  const geocodeAddress = (postalCode: string, city: string): Promise<google.maps.LatLng | null> => {
    return new Promise((resolve) => {
      if (typeof google === 'undefined' || !google.maps) {
        console.error('Google Maps not available for geocoding');
        resolve(null);
        return;
      }

      const geocoder = new google.maps.Geocoder();
      const address = `${postalCode} ${city}, France`;
      
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          console.log(`Geocoded ${address} successfully`);
          resolve(results[0].geometry.location);
        } else {
          console.warn(`Geocoding failed for ${address}:`, status);
          resolve(null);
        }
      });
    });
  };

  const addMarkers = async () => {
    if (!map || typeof google === 'undefined') {
      console.error('Map or Google Maps not available for adding markers');
      return;
    }

    console.log('Adding markers for', moves.length, 'moves and', clientRequests.length, 'client requests');
    clearMapMarkers();

    // Add markers for confirmed moves (blue)
    for (const move of moves) {
      try {
        const departureLocation = await geocodeAddress(
          move.departure_postal_code,
          move.departure_city
        );
        const arrivalLocation = await geocodeAddress(
          move.arrival_postal_code,
          move.arrival_city
        );

        if (departureLocation) {
          const departureMarker = new google.maps.Marker({
            position: departureLocation,
            map: map,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%234F46E5"><circle cx="12" cy="12" r="10"/></svg>',
              scaledSize: new google.maps.Size(20, 20)
            },
            title: `Départ: ${move.departure_city} (${new Date(move.departure_date).toLocaleDateString('fr-FR')})`
          });

          departureMarker.addListener('click', () => {
            setSelectedMover(move.movers);
            setShowMoverInfo(true);
          });

          markersRef.current.push(departureMarker);
        }

        if (arrivalLocation) {
          const arrivalMarker = new google.maps.Marker({
            position: arrivalLocation,
            map: map,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%231E40AF"><circle cx="12" cy="12" r="10"/></svg>',
              scaledSize: new google.maps.Size(20, 20)
            },
            title: `Arrivée: ${move.arrival_city}`
          });

          arrivalMarker.addListener('click', () => {
            setSelectedMover(move.movers);
            setShowMoverInfo(true);
          });

          markersRef.current.push(arrivalMarker);
        }

        // Draw line between departure and arrival
        if (departureLocation && arrivalLocation) {
          const polyline = new google.maps.Polyline({
            path: [departureLocation, arrivalLocation],
            geodesic: true,
            strokeColor: '#4F46E5',
            strokeOpacity: 1.0,
            strokeWeight: 3,
            map: map
          });

          polylinesRef.current.push(polyline);
        }
      } catch (error) {
        console.error('Error processing move:', move, error);
      }
    }

    // Add markers for client requests (green)
    for (const request of clientRequests) {
      try {
        const departureLocation = await geocodeAddress(
          request.departure_postal_code,
          request.departure_city
        );
        const arrivalLocation = await geocodeAddress(
          request.arrival_postal_code,
          request.arrival_city
        );

        if (departureLocation) {
          const departureMarker = new google.maps.Marker({
            position: departureLocation,
            map: map,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2310B981"><circle cx="12" cy="12" r="10"/></svg>',
              scaledSize: new google.maps.Size(20, 20)
            },
            title: `Demande départ: ${request.departure_city} (${new Date(request.desired_date).toLocaleDateString('fr-FR')})`
          });

          markersRef.current.push(departureMarker);
        }

        if (arrivalLocation) {
          const arrivalMarker = new google.maps.Marker({
            position: arrivalLocation,
            map: map,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23059669"><circle cx="12" cy="12" r="10"/></svg>',
              scaledSize: new google.maps.Size(20, 20)
            },
            title: `Demande arrivée: ${request.arrival_city}`
          });

          markersRef.current.push(arrivalMarker);
        }

        // Draw dashed line for client requests
        if (departureLocation && arrivalLocation) {
          const polyline = new google.maps.Polyline({
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

          polylinesRef.current.push(polyline);
        }
      } catch (error) {
        console.error('Error processing client request:', request, error);
      }
    }

    console.log('Finished adding markers. Total markers:', markersRef.current.length);
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchMoves(), fetchClientRequests()]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (map && isLoaded && (moves.length > 0 || clientRequests.length > 0)) {
      console.log('Triggering marker addition...');
      addMarkers();
    }
  }, [map, moves, clientRequests, isLoaded]);

  if (!isLoaded) {
    return (
      <div className="w-full h-96 rounded-lg shadow-lg border border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 rounded-lg shadow-lg border border-gray-200 relative">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Refresh Button */}
      <div className="absolute top-4 left-4 z-10">
        <Button 
          variant="outline" 
          size="sm"
          onClick={refreshData}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>
      
      {/* Mover Info Modal */}
      {showMoverInfo && selectedMover && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200 z-10 min-w-64">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-gray-800">Déménageur</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowMoverInfo(false)}
            >
              ×
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-blue-600" />
              <span>{selectedMover.name}</span>
            </div>
            <div className="text-gray-600">{selectedMover.company_name}</div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <span>{selectedMover.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-blue-600" />
              <span>{selectedMover.phone}</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-4 flex justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
          <span>Trajets confirmés ({moves.length})</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span>Demandes clients ({clientRequests.length})</span>
        </div>
      </div>
    </div>
  );
};

export default GoogleMap;
