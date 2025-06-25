import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GoogleMap, useJSApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Users, Package, Calendar, Truck } from 'lucide-react';

interface Client {
  id: number;
  name: string;
  client_reference?: string;
  departure_postal_code: string;
  arrival_postal_code: string;
  departure_city?: string;
  arrival_city?: string;
  desired_date: string;
  estimated_volume: number;
  flexible_dates?: boolean;
  flexibility_days?: number;
  status?: string;
  match_status?: string;
  departure_address?: string;
  arrival_address?: string;
  budget_min?: number;
  budget_max?: number;
  special_requirements?: string;
}

interface ConfirmedMove {
  id: number;
  company_name: string;
  departure_postal_code: string;
  arrival_postal_code: string;
  departure_date: string;
  max_volume: number;
  used_volume: number;
  available_volume: number;
  status: string;
  move_reference?: string;
  departure_city?: string;
  arrival_city?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const libraries = ['places'];

interface MapViewProps {
  clients: Client[];
  moves: ConfirmedMove[];
}

const MapView: React.FC<MapViewProps> = ({ clients, moves }) => {
  const { isLoaded, loadError } = useJSApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries,
  });

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [selectedMove, setSelectedMove] = useState<ConfirmedMove | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const calculateRoute = useCallback(async (move: ConfirmedMove) => {
    if (!move.departure_postal_code || !move.arrival_postal_code) {
      console.warn('Codes postaux manquants pour le trajet:', move.id);
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: move.departure_postal_code + ', France',
        destination: move.arrival_postal_code + ', France',
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          setDirections(result);
          setSelectedMove(move);
        } else {
          console.error(`error fetching directions ${status}`);
        }
      }
    );
  }, []);

  useEffect(() => {
    if (moves.length > 0 && isLoaded) {
      calculateRoute(moves[0]);
    }
  }, [moves, isLoaded, calculateRoute]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  if (loadError) {
    return <div>Erreur de chargement de Google Maps.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <span>Carte des Déménagements</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoaded ? (
          <div className="space-y-4">
            <div style={mapContainerStyle}>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={6}
                center={{ lat: 46.603354, lng: 1.888334 }}
                onLoad={onMapLoad}
              >
                {clients.map((client) => (
                  <Marker
                    key={client.id}
                    position={{
                      lat: parseFloat(client.departure_postal_code.substring(0, 2)) + parseFloat(client.departure_postal_code.substring(2, 5)) / 1000,
                      lng: parseFloat(client.departure_postal_code.substring(0, 2)) * 0.5,
                    }}
                    title={client.name}
                  />
                ))}
                {moves.map((move) => (
                  <Marker
                    key={move.id}
                    position={{
                      lat: parseFloat(move.departure_postal_code.substring(0, 2)) + parseFloat(move.departure_postal_code.substring(2, 5)) / 1000,
                      lng: parseFloat(move.departure_postal_code.substring(0, 2)) * 0.5,
                    }}
                    title={move.company_name}
                    onClick={() => calculateRoute(move)}
                  />
                ))}
                {directions && selectedMove && (
                  <DirectionsRenderer
                    directions={directions}
                    options={{
                      polylineOptions: {
                        strokeColor: "#4CAF50",
                        strokeOpacity: 0.8,
                        strokeWeight: 5,
                      },
                      suppressMarkers: true,
                    }}
                  />
                )}
              </GoogleMap>
            </div>

            {selectedMove && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Truck className="h-5 w-5 text-green-600" />
                    <span>Trajet Sélectionné</span>
                    <Badge variant="outline" className="font-mono">
                      {selectedMove.move_reference || `TRJ-${selectedMove.id}`}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <span><strong>Départ:</strong> {selectedMove.departure_postal_code}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-red-600" />
                      <span><strong>Arrivée:</strong> {selectedMove.arrival_postal_code}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <span><strong>Date:</strong> {new Date(selectedMove.departure_date).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-orange-600" />
                      <span><strong>Volume Max:</strong> {selectedMove.max_volume}m³</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span><strong>Clients:</strong> {selectedMove.number_of_clients || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div>Chargement de la carte...</div>
        )}
      </CardContent>
    </Card>
  );
};

export default MapView;
