
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface Move {
  company_name: string;
  departure_city: string;
  arrival_city: string;
  departure_postal_code: string;
  arrival_postal_code: string;
  departure_date: string;
  move_reference?: string;
}

interface MoveCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  move: Move | null;
}

const SingleRouteMap = ({ move }: { move: Move }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      // Attendre que Google Maps soit disponible
      if (!window.google || !window.google.maps) {
        console.log('Google Maps pas encore chargé, attente...');
        return;
      }

      try {
        console.log('Initialisation de la carte pour trajet unique:', move.departure_postal_code, '->', move.arrival_postal_code);
        
        const geocoder = new google.maps.Geocoder();
        
        const departureQuery = `${move.departure_postal_code}, ${move.departure_city}, France`;
        const arrivalQuery = `${move.arrival_postal_code}, ${move.arrival_city}, France`;

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

        // Créer la carte
        const map = new google.maps.Map(mapRef.current, {
          zoom: 7,
          center: departureLocation,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
        });

        mapInstanceRef.current = map;

        // Nettoyer l'ancien renderer
        if (directionsRendererRef.current) {
          directionsRendererRef.current.setMap(null);
        }

        // Ajouter les marqueurs
        new google.maps.Marker({
          position: departureLocation,
          map: map,
          title: `Départ: ${move.departure_city}`,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
            scaledSize: new google.maps.Size(32, 32)
          },
          label: {
            text: move.move_reference || 'D',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold'
          }
        });

        new google.maps.Marker({
          position: arrivalLocation,
          map: map,
          title: `Arrivée: ${move.arrival_city}`,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(32, 32)
          },
          label: {
            text: move.move_reference || 'A',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold'
          }
        });

        // Ajouter la route
        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer();

        directionsRenderer.setOptions({
          polylineOptions: {
            strokeColor: '#2563eb',
            strokeWeight: 4,
            strokeOpacity: 0.8
          },
          suppressMarkers: true // On utilise nos propres marqueurs
        });

        directionsRenderer.setMap(map);
        directionsRendererRef.current = directionsRenderer;

        directionsService.route({
          origin: departureLocation,
          destination: arrivalLocation,
          travelMode: google.maps.TravelMode.DRIVING
        }, (result, status) => {
          if (status === 'OK' && result) {
            directionsRenderer.setDirections(result);
          }
        });

        // Ajuster la vue pour inclure les deux points
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(departureLocation);
        bounds.extend(arrivalLocation);
        map.fitBounds(bounds);

        console.log('Carte trajet unique initialisée avec succès');

      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la carte:', error);
      }
    };

    // Fonction pour charger le script Google Maps
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initMap();
        return;
      }

      if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
        const script = document.createElement('script');
        script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDgAn_xJ5IsZBJjlwLkMYhWP7DQXvoxK4Y&libraries=places';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          setTimeout(initMap, 100);
        };
        document.head.appendChild(script);
      } else {
        const checkGoogleMaps = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkGoogleMaps);
            initMap();
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkGoogleMaps);
        }, 10000);
      }
    };

    loadGoogleMaps();

    // Cleanup function
    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [move]);

  return <div ref={mapRef} className="h-96 w-full rounded-lg border" />;
};

export const MoveCardDialog = ({ open, onOpenChange, move }: MoveCardDialogProps) => {
  if (!move) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <span>Trajet : {move.company_name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-green-600 mb-2 flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                Départ
              </h3>
              <p className="text-sm">
                <strong>Ville:</strong> {move.departure_city}
              </p>
              <p className="text-sm">
                <strong>Code postal:</strong> {move.departure_postal_code}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-red-600 mb-2 flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                Arrivée
              </h3>
              <p className="text-sm">
                <strong>Ville:</strong> {move.arrival_city}
              </p>
              <p className="text-sm">
                <strong>Code postal:</strong> {move.arrival_postal_code}
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Date de départ:</strong> {new Date(move.departure_date).toLocaleDateString('fr-FR')}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Référence:</strong> {move.move_reference || `TRJ-${move.company_name}`}
            </p>
          </div>

          <SingleRouteMap move={move} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
