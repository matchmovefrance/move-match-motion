
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, MapPin, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Move {
  id: string;
  departure_city: string;
  arrival_city: string;
  departure_postal_code: string;
  arrival_postal_code: string;
  status: string;
  pickup_lat?: number;
  pickup_lng?: number;
  delivery_lat?: number;
  delivery_lng?: number;
}

interface Mover {
  id: string;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  lat?: number;
  lng?: number;
}

const GoogleMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const [moves, setMoves] = useState<Move[]>([]);
  const [movers, setMovers] = useState<Mover[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoogleMapsScript();
  }, []);

  const loadGoogleMapsScript = () => {
    if (window.google && window.google.maps) {
      console.log('Google Maps already loaded');
      initializeMap();
      return;
    }

    console.log('Loading Google Maps script...');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDgAn_xJ5IsZBJjlwLkMYhWP7DQXvoxK4Y&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google Maps script loaded successfully');
      initializeMap();
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps script');
      setLoading(false);
    };
    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.google || !window.google.maps) {
      console.error('Map container or Google Maps not available');
      setLoading(false);
      return;
    }

    console.log('Initializing Google Maps...');
    
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 48.8566, lng: 2.3522 }, // Paris
      zoom: 12,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    mapInstanceRef.current = map;
    setLoading(false);
    fetchData();
  };

  const fetchData = async () => {
    try {
      console.log('Fetching moves and movers...');
      
      const [movesResponse, moversResponse] = await Promise.all([
        supabase.from('confirmed_moves').select('*'),
        supabase.from('movers').select('*')
      ]);

      if (movesResponse.error) {
        console.error('Error fetching moves:', movesResponse.error);
      } else {
        const transformedMoves: Move[] = (movesResponse.data || []).map(move => ({
          id: move.id.toString(),
          departure_city: move.departure_city,
          arrival_city: move.arrival_city,
          departure_postal_code: move.departure_postal_code,
          arrival_postal_code: move.arrival_postal_code,
          status: move.status,
          pickup_lat: 48.8566 + (Math.random() - 0.5) * 0.1,
          pickup_lng: 2.3522 + (Math.random() - 0.5) * 0.1,
          delivery_lat: 48.8566 + (Math.random() - 0.5) * 0.1,
          delivery_lng: 2.3522 + (Math.random() - 0.5) * 0.1
        }));
        setMoves(transformedMoves);
        console.log('Moves fetched:', transformedMoves.length);
      }

      if (moversResponse.error) {
        console.error('Error fetching movers:', moversResponse.error);
      } else {
        const transformedMovers: Mover[] = (moversResponse.data || []).map(mover => ({
          id: mover.id.toString(),
          name: mover.name,
          company_name: mover.company_name,
          email: mover.email,
          phone: mover.phone,
          lat: 48.8566 + (Math.random() - 0.5) * 0.2,
          lng: 2.3522 + (Math.random() - 0.5) * 0.2
        }));
        setMovers(transformedMovers);
        console.log('Movers fetched:', transformedMovers.length);
      }

      if (movesResponse.data && moversResponse.data) {
        const transformedMoves: Move[] = (movesResponse.data || []).map(move => ({
          id: move.id.toString(),
          departure_city: move.departure_city,
          arrival_city: move.arrival_city,
          departure_postal_code: move.departure_postal_code,
          arrival_postal_code: move.arrival_postal_code,
          status: move.status,
          pickup_lat: 48.8566 + (Math.random() - 0.5) * 0.1,
          pickup_lng: 2.3522 + (Math.random() - 0.5) * 0.1,
          delivery_lat: 48.8566 + (Math.random() - 0.5) * 0.1,
          delivery_lng: 2.3522 + (Math.random() - 0.5) * 0.1
        }));

        const transformedMovers: Mover[] = (moversResponse.data || []).map(mover => ({
          id: mover.id.toString(),
          name: mover.name,
          company_name: mover.company_name,
          email: mover.email,
          phone: mover.phone,
          lat: 48.8566 + (Math.random() - 0.5) * 0.2,
          lng: 2.3522 + (Math.random() - 0.5) * 0.2
        }));

        updateMapMarkers(transformedMoves, transformedMovers);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const updateMapMarkers = (movesData: Move[], moversData: Mover[]) => {
    if (!mapInstanceRef.current || !window.google) return;

    // Clear existing markers and polylines
    markersRef.current.forEach(marker => {
      if (marker && typeof marker.setMap === 'function') {
        marker.setMap(null);
      }
    });
    polylinesRef.current.forEach(polyline => {
      if (polyline && typeof polyline.setMap === 'function') {
        polyline.setMap(null);
      }
    });
    markersRef.current = [];
    polylinesRef.current = [];

    // Add move markers
    movesData.forEach((move) => {
      if (move.pickup_lat && move.pickup_lng) {
        const pickupMarker = new google.maps.Marker({
          position: { lat: move.pickup_lat, lng: move.pickup_lng },
          map: mapInstanceRef.current,
          title: `Pickup: ${move.departure_city}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="8" fill="#10B981" stroke="white" stroke-width="2"/>
                <text x="10" y="14" font-family="Arial" font-size="12" fill="white" text-anchor="middle">P</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(20, 20)
          }
        });

        const pickupInfoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-2">
              <h3 class="font-bold text-green-600">Pickup Point</h3>
              <p class="text-sm">${move.departure_city}</p>
              <p class="text-xs text-gray-600">Status: ${move.status}</p>
            </div>
          `
        });

        pickupMarker.addListener('click', () => {
          pickupInfoWindow.open(mapInstanceRef.current, pickupMarker);
        });

        markersRef.current.push(pickupMarker);
      }

      if (move.delivery_lat && move.delivery_lng) {
        const deliveryMarker = new google.maps.Marker({
          position: { lat: move.delivery_lat, lng: move.delivery_lng },
          map: mapInstanceRef.current,
          title: `Delivery: ${move.arrival_city}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="8" fill="#EF4444" stroke="white" stroke-width="2"/>
                <text x="10" y="14" font-family="Arial" font-size="12" fill="white" text-anchor="middle">D</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(20, 20)
          }
        });

        const deliveryInfoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-2">
              <h3 class="font-bold text-red-600">Delivery Point</h3>
              <p class="text-sm">${move.arrival_city}</p>
              <p class="text-xs text-gray-600">Status: ${move.status}</p>
            </div>
          `
        });

        deliveryMarker.addListener('click', () => {
          deliveryInfoWindow.open(mapInstanceRef.current, deliveryMarker);
        });

        markersRef.current.push(deliveryMarker);
      }

      // Add line between pickup and delivery
      if (move.pickup_lat && move.pickup_lng && move.delivery_lat && move.delivery_lng) {
        const path = [
          { lat: move.pickup_lat, lng: move.pickup_lng },
          { lat: move.delivery_lat, lng: move.delivery_lng }
        ];

        const polyline = new google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: '#3B82F6',
          strokeOpacity: 0.6,
          strokeWeight: 2,
          map: mapInstanceRef.current
        });

        polylinesRef.current.push(polyline);
      }
    });

    // Add mover markers
    moversData.forEach((mover) => {
      if (mover.lat && mover.lng) {
        const moverMarker = new google.maps.Marker({
          position: { lat: mover.lat, lng: mover.lng },
          map: mapInstanceRef.current,
          title: `Mover: ${mover.name}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#8B5CF6" stroke="white" stroke-width="2"/>
                <path d="M16 8L8 8L8 16L16 16L16 12L20 12L20 10L16 10L16 8Z" fill="white"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24)
          }
        });

        const moverInfoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-3">
              <h3 class="font-bold text-purple-600 flex items-center">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"/>
                </svg>
                ${mover.name}
              </h3>
              <p class="text-sm">${mover.company_name}</p>
              <p class="text-xs text-gray-600">${mover.email}</p>
              <p class="text-xs text-gray-600">${mover.phone}</p>
            </div>
          `
        });

        moverMarker.addListener('click', () => {
          moverInfoWindow.open(mapInstanceRef.current, moverMarker);
        });

        markersRef.current.push(moverMarker);
      }
    });

    console.log(`Added ${markersRef.current.length} markers and ${polylinesRef.current.length} polylines to map`);
  };

  const handleRefresh = () => {
    console.log('Refreshing map data...');
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-blue-600" />
          Carte des Déménagements
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Pickup ({moves.filter(m => m.pickup_lat && m.pickup_lng).length})</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Delivery ({moves.filter(m => m.delivery_lat && m.delivery_lng).length})</span>
            </div>
            <div className="flex items-center space-x-1">
              <Truck className="w-3 h-3 text-purple-600" />
              <span>Déménageurs ({movers.filter(m => m.lat && m.lng).length})</span>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualiser</span>
          </Button>
        </div>
      </div>
      
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Chargement de la carte...</span>
            </div>
          </div>
        )}
        <div
          ref={mapRef}
          className="w-full h-96 bg-gray-200 rounded-lg border border-gray-300"
        />
      </div>
    </div>
  );
};

export default GoogleMap;
