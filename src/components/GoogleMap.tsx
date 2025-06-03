
import React, { useEffect, useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { supabase } from '@/integrations/supabase/client';

// Types pour TypeScript
interface Move {
  id: number;
  departure_city: string;
  departure_postal_code: string;
  arrival_city: string;
  arrival_postal_code: string;
  departure_date: string;
  status: string;
  status_custom?: 'en_cours' | 'termine';
  departure_lat?: number;
  departure_lng?: number;
  arrival_lat?: number;
  arrival_lng?: number;
}

interface Mover {
  id: number;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  lat?: number;
  lng?: number;
}

const containerStyle = {
  width: '100%',
  height: '600px'
};

const center = {
  lat: 46.603354, // Centre sur la France
  lng: 1.888334
};

const GoogleMapComponent: React.FC = () => {
  const [moves, setMoves] = useState<Move[]>([]);
  const [movers, setMovers] = useState<Mover[]>([]);
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const [selectedMover, setSelectedMover] = useState<Mover | null>(null);
  const [loading, setLoading] = useState(true);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Fonction pour géocoder un code postal
  const geocodePostalCode = async (postalCode: string, city: string): Promise<{ lat: number; lng: number }> => {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await new Promise<google.maps.GeocoderResponse>((resolve, reject) => {
        geocoder.geocode({ address: `${postalCode} ${city}, France` }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            resolve(results);
          } else {
            reject(new Error('Geocode failed'));
          }
        });
      });
      
      return {
        lat: response[0].geometry.location.lat(),
        lng: response[0].geometry.location.lng()
      };
    } catch (error) {
      console.error('Erreur de géocodage:', error);
      // Retourne une position par défaut si le géocodage échoue
      return center;
    }
  };

  // Charger les données depuis Supabase
  const loadData = useCallback(async () => {
    setLoading(true);
    
    try {
      // Récupérer les déménagements
      const { data: movesData } = await supabase
        .from('confirmed_moves')
        .select('id, departure_city, departure_postal_code, arrival_city, arrival_postal_code, departure_date, status, status_custom');
      
      if (movesData) {
        // Géocoder les adresses de départ et d'arrivée
        const movesWithCoords = await Promise.all(movesData.map(async (move) => {
          const departure = await geocodePostalCode(move.departure_postal_code, move.departure_city);
          const arrival = await geocodePostalCode(move.arrival_postal_code, move.arrival_city);
          return {
            ...move,
            departure_lat: departure.lat,
            departure_lng: departure.lng,
            arrival_lat: arrival.lat,
            arrival_lng: arrival.lng
          };
        }));
        setMoves(movesWithCoords);
      }

      // Récupérer les déménageurs
      const { data: moversData } = await supabase
        .from('movers')
        .select('id, name, company_name, email, phone');
      
      if (moversData) {
        // Pour simplifier, on place les déménageurs au centre de la France
        // Dans une vraie app, vous voudriez géocoder leurs adresses
        setMovers(moversData.map(mover => ({
          ...mover,
          lat: center.lat + (Math.random() * 2 - 1), // Un peu d'aléatoire pour la démo
          lng: center.lng + (Math.random() * 2 - 1)
        })));
      }
    } catch (error) {
      console.error('Erreur de chargement des données:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Gérer le chargement de la carte
  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  // Gérer la déconnexion de la carte
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Chargement de la carte...</div>;
  }

  return (
    <div className="w-full rounded-lg shadow-lg overflow-hidden">
      <LoadScript googleMapsApiKey="AIzaSyDgAn_xJ5IsZBJjlwLkMYhWP7DQXvoxK4Y">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={6}
          onLoad={onLoad}
          onUnmount={onUnmount}
        >
          {/* Marqueurs de départ (verts) */}
          {moves.map((move) => (
            <React.Fragment key={`departure-${move.id}`}>
              <Marker
                position={{ lat: move.departure_lat || 0, lng: move.departure_lng || 0 }}
                icon={{
                  url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                  scaledSize: new window.google.maps.Size(32, 32)
                }}
                onClick={() => setSelectedMove(move)}
              />
              
              {/* Marqueurs d'arrivée (rouges) */}
              <Marker
                position={{ lat: move.arrival_lat || 0, lng: move.arrival_lng || 0 }}
                icon={{
                  url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                  scaledSize: new window.google.maps.Size(32, 32)
                }}
              />
              
              {/* Lignes de trajet (bleues) */}
              <Polyline
                path={[
                  { lat: move.departure_lat || 0, lng: move.departure_lng || 0 },
                  { lat: move.arrival_lat || 0, lng: move.arrival_lng || 0 }
                ]}
                options={{
                  strokeColor: '#3B82F6',
                  strokeOpacity: 0.8,
                  strokeWeight: 3
                }}
              />
            </React.Fragment>
          ))}
          
          {/* Marqueurs des déménageurs (violets) */}
          {movers.map((mover) => (
            <Marker
              key={`mover-${mover.id}`}
              position={{ lat: mover.lat || 0, lng: mover.lng || 0 }}
              icon={{
                url: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png',
                scaledSize: new window.google.maps.Size(32, 32)
              }}
              onClick={() => setSelectedMover(mover)}
            />
          ))}
          
          {/* InfoWindow pour les déménagements */}
          {selectedMove && (
            <InfoWindow
              position={{
                lat: selectedMove.departure_lat || 0,
                lng: selectedMove.departure_lng || 0
              }}
              onCloseClick={() => setSelectedMove(null)}
            >
              <div className="p-2">
                <h3 className="font-bold text-lg">Déménagement #{selectedMove.id}</h3>
                <p><strong>De:</strong> {selectedMove.departure_postal_code} {selectedMove.departure_city}</p>
                <p><strong>À:</strong> {selectedMove.arrival_postal_code} {selectedMove.arrival_city}</p>
                <p><strong>Date:</strong> {new Date(selectedMove.departure_date).toLocaleDateString('fr-FR')}</p>
                <p><strong>Statut:</strong> {selectedMove.status_custom || selectedMove.status}</p>
              </div>
            </InfoWindow>
          )}
          
          {/* InfoWindow pour les déménageurs */}
          {selectedMover && (
            <InfoWindow
              position={{
                lat: selectedMover.lat || 0,
                lng: selectedMover.lng || 0
              }}
              onCloseClick={() => setSelectedMover(null)}
            >
              <div className="p-2">
                <h3 className="font-bold text-lg">{selectedMover.company_name}</h3>
                <p><strong>Contact:</strong> {selectedMover.name}</p>
                <p><strong>Email:</strong> {selectedMover.email}</p>
                <p><strong>Téléphone:</strong> {selectedMover.phone}</p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default GoogleMapComponent;
