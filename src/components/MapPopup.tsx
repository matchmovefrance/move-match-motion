
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Map, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface FilteredItem {
  id: number;
  type: 'client' | 'move' | 'match';
  reference: string;
  name: string;
  date: string;
  details: string;
  departure_postal_code?: string;
  arrival_postal_code?: string;
  departure_city?: string;
  arrival_city?: string;
  company_name?: string;
  color?: string;
}

const ROUTE_COLORS = [
  '#2563eb', // blue
  '#dc2626', // red
  '#16a34a', // green
  '#ca8a04', // yellow
  '#9333ea', // purple
  '#ea580c', // orange
  '#0891b2', // cyan
  '#be185d', // pink
];

// Composant carte pour popup
const MapDisplay = ({ items }: { items: FilteredItem[] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRenderers = useRef<google.maps.DirectionsRenderer[]>([]);

  useEffect(() => {
    const initMap = async () => {
      console.log('Initialisation MapPopup avec:', items.length, 'éléments');
      
      if (!mapRef.current) {
        console.log('mapRef.current est null');
        return;
      }

      // Attendre que Google Maps soit disponible
      if (!window.google || !window.google.maps) {
        console.log('Google Maps pas encore chargé');
        return;
      }

      try {
        const geocoder = new google.maps.Geocoder();
        const bounds = new google.maps.LatLngBounds();
        let hasAddedBounds = false;

        // Créer la carte
        const map = new google.maps.Map(mapRef.current, {
          zoom: 7,
          center: { lat: 46.603354, lng: 1.888334 }, // Centre de la France
          mapTypeId: google.maps.MapTypeId.ROADMAP,
        });

        mapInstanceRef.current = map;

        // Nettoyer les anciens renderers
        directionsRenderers.current.forEach(renderer => renderer.setMap(null));
        directionsRenderers.current = [];

        // Traiter chaque trajet
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          
          if (!item.departure_postal_code || !item.arrival_postal_code) {
            console.log(`Skipping item ${item.reference} - missing postal codes`);
            continue;
          }

          const departureQuery = `${item.departure_postal_code}, ${item.departure_city || ''}, France`;
          const arrivalQuery = `${item.arrival_postal_code}, ${item.arrival_city || ''}, France`;

          try {
            const [departureResult, arrivalResult] = await Promise.all([
              new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
                geocoder.geocode({ address: departureQuery }, (results, status) => {
                  if (status === 'OK' && results) resolve(results);
                  else reject(new Error(`Geocoding failed for departure: ${status}`));
                });
              }),
              new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
                geocoder.geocode({ address: arrivalQuery }, (results, status) => {
                  if (status === 'OK' && results) resolve(results);
                  else reject(new Error(`Geocoding failed for arrival: ${status}`));
                });
              })
            ]);

            const departureLocation = departureResult[0].geometry.location;
            const arrivalLocation = arrivalResult[0].geometry.location;

            // Ajouter les positions aux bounds
            bounds.extend(departureLocation);
            bounds.extend(arrivalLocation);
            hasAddedBounds = true;

            // Ajouter les marqueurs
            new google.maps.Marker({
              position: departureLocation,
              map: map,
              title: `${item.reference} - Départ: ${item.departure_city || item.departure_postal_code}`,
              icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                scaledSize: new google.maps.Size(32, 32)
              }
            });

            new google.maps.Marker({
              position: arrivalLocation,
              map: map,
              title: `${item.reference} - Arrivée: ${item.arrival_city || item.arrival_postal_code}`,
              icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new google.maps.Size(32, 32)
              }
            });

            // Ajouter la route
            const directionsService = new google.maps.DirectionsService();
            const directionsRenderer = new google.maps.DirectionsRenderer();

            directionsRenderer.setOptions({
              polylineOptions: {
                strokeColor: item.color || ROUTE_COLORS[i % ROUTE_COLORS.length],
                strokeWeight: 4,
                strokeOpacity: 0.8
              },
              suppressMarkers: true // On utilise nos propres marqueurs
            });

            directionsRenderer.setMap(map);
            directionsRenderers.current.push(directionsRenderer);

            directionsService.route({
              origin: departureLocation,
              destination: arrivalLocation,
              travelMode: google.maps.TravelMode.DRIVING
            }, (result, status) => {
              if (status === 'OK' && result) {
                directionsRenderer.setDirections(result);
              }
            });

          } catch (error) {
            console.error(`Erreur pour le trajet ${item.reference}:`, error);
          }
        }

        // Ajuster la vue pour inclure tous les points
        if (hasAddedBounds) {
          map.fitBounds(bounds);
        }

        console.log('Carte popup initialisée avec succès');

      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la carte popup:', error);
      }
    };

    // Délai pour s'assurer que le composant est monté et le DOM prêt
    const timeout = setTimeout(() => {
      initMap();
    }, 200);

    // Cleanup function
    return () => {
      clearTimeout(timeout);
      directionsRenderers.current.forEach(renderer => renderer.setMap(null));
      directionsRenderers.current = [];
    };
  }, [items]);

  return <div ref={mapRef} className="h-96 w-full rounded-lg border" />;
};

interface MapPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: FilteredItem[];
  title: string;
}

const MapPopup = ({ open, onOpenChange, items, title }: MapPopupProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Map className="h-5 w-5 text-blue-600" />
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Résumé des éléments */}
          {items.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-800">Références affichées :</h3>
              <div className="flex flex-wrap gap-2">
                {items.map((item) => (
                  <div key={item.reference} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <Badge variant="secondary" className="font-medium">
                      {item.reference}
                    </Badge>
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">{item.name}</span>
                      <div className="text-gray-600">
                        {item.details} • {item.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Affichage de la carte */}
          {items.length > 0 && items.some(item => item.departure_postal_code && item.arrival_postal_code) ? (
            <div>
              <h3 className="font-semibold text-lg mb-4 text-gray-800">
                Carte des trajets ({items.length} trajet{items.length > 1 ? 's' : ''})
              </h3>
              <MapDisplay items={items} />
            </div>
          ) : (
            <div className="h-96 bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              <div className="text-center">
                <Map className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">Données incomplètes</h3>
                <p className="text-gray-500 mb-1">Impossible d'afficher la carte</p>
                <p className="text-sm text-gray-400">
                  Codes postaux de départ et d'arrivée requis
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MapPopup;
