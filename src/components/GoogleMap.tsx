
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { loadGoogleMapsScript } from '@/lib/google-maps-config';
import { MapPin, Truck, Navigation } from 'lucide-react';

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
}

const GoogleMapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour géocoder une adresse
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number }> => {
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
      // Retourner des coordonnées par défaut pour la France
      return { lat: 46.603354, lng: 1.888334 };
    }
  };

  // Charger les données de déménagement
  const loadMoves = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('confirmed_moves')
        .select('*')
        .order('departure_date', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Géocoder les adresses
        const movesWithCoords: Move[] = [];
        
        for (const move of data.slice(0, 10)) { // Limiter à 10 pour éviter les quotas API
          const departureAddress = `${move.departure_postal_code} ${move.departure_city}, France`;
          const arrivalAddress = `${move.arrival_postal_code} ${move.arrival_city}, France`;
          
          const [departure, arrival] = await Promise.all([
            geocodeAddress(departureAddress),
            geocodeAddress(arrivalAddress)
          ]);
          
          movesWithCoords.push({
            ...move,
            departure_lat: departure.lat,
            departure_lng: departure.lng,
            arrival_lat: arrival.lat,
            arrival_lng: arrival.lng
          });
        }
        
        setMoves(movesWithCoords);
      } else {
        setMoves([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des déménagements:', error);
      setError('Impossible de charger les données de déménagement');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialiser la carte
  const initializeMap = useCallback(async () => {
    if (!mapRef.current) return;

    try {
      await loadGoogleMapsScript();
      
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: 46.603354, lng: 1.888334 }, // Centre de la France
        zoom: 6,
        styles: [
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#e9e9e9' }, { lightness: 17 }]
          },
          {
            featureType: 'landscape',
            elementType: 'geometry',
            stylers: [{ color: '#f5f5f5' }, { lightness: 20 }]
          }
        ]
      });

      setMap(mapInstance);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la carte:', error);
      setError('Impossible de charger Google Maps');
    }
  }, []);

  // Ajouter les marqueurs et trajets sur la carte
  const addMarkersAndRoutes = useCallback(() => {
    if (!map || moves.length === 0) return;

    // Nettoyer les marqueurs existants (optionnel - Google Maps gère automatiquement)
    
    moves.forEach((move, index) => {
      if (!move.departure_lat || !move.departure_lng || !move.arrival_lat || !move.arrival_lng) return;

      // Marqueur de départ (vert)
      new google.maps.Marker({
        position: { lat: move.departure_lat, lng: move.departure_lng },
        map: map,
        title: `Départ: ${move.departure_city}`,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
          scaledSize: new google.maps.Size(32, 32)
        }
      });

      // Marqueur d'arrivée (rouge)
      new google.maps.Marker({
        position: { lat: move.arrival_lat, lng: move.arrival_lng },
        map: map,
        title: `Arrivée: ${move.arrival_city}`,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new google.maps.Size(32, 32)
        }
      });

      // Ligne de trajet
      new google.maps.Polyline({
        path: [
          { lat: move.departure_lat, lng: move.departure_lng },
          { lat: move.arrival_lat, lng: move.arrival_lng }
        ],
        geodesic: true,
        strokeColor: '#3B82F6',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map: map
      });

      // InfoWindow pour les détails
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">
              ${move.company_name || 'Déménagement'} #${move.id}
            </h3>
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>De:</strong> ${move.departure_city} (${move.departure_postal_code})
            </p>
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>À:</strong> ${move.arrival_city} (${move.arrival_postal_code})
            </p>
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>Date:</strong> ${new Date(move.departure_date).toLocaleDateString('fr-FR')}
            </p>
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>Statut:</strong> ${move.status}
            </p>
          </div>
        `
      });

      // Ajouter le clic sur le marqueur de départ pour afficher les infos
      const departureMarker = new google.maps.Marker({
        position: { lat: move.departure_lat, lng: move.departure_lng },
        map: map,
        title: `Déménagement #${move.id}`,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
          scaledSize: new google.maps.Size(32, 32)
        }
      });

      departureMarker.addListener('click', () => {
        infoWindow.open(map, departureMarker);
      });
    });

    // Ajuster la vue pour inclure tous les marqueurs
    if (moves.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      moves.forEach(move => {
        if (move.departure_lat && move.departure_lng) {
          bounds.extend(new google.maps.LatLng(move.departure_lat, move.departure_lng));
        }
        if (move.arrival_lat && move.arrival_lng) {
          bounds.extend(new google.maps.LatLng(move.arrival_lat, move.arrival_lng));
        }
      });
      map.fitBounds(bounds);
    }
  }, [map, moves]);

  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  useEffect(() => {
    if (map) {
      loadMoves();
    }
  }, [map, loadMoves]);

  useEffect(() => {
    addMarkersAndRoutes();
  }, [addMarkersAndRoutes]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg">
        <MapPin className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
        <p className="text-gray-600 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Navigation className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Carte des trajets</h2>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Départ</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Arrivée</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-0.5 bg-blue-500"></div>
            <span>Trajet</span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Chargement de la carte et des trajets...</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div 
          ref={mapRef} 
          className="w-full h-96"
          style={{ minHeight: '600px' }}
        />
      </div>

      {moves.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Truck className="h-5 w-5 text-blue-600" />
            <span className="text-blue-800 font-medium">
              {moves.length} trajet{moves.length > 1 ? 's' : ''} affiché{moves.length > 1 ? 's' : ''} sur la carte
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapComponent;
