
import { useEffect, useRef } from 'react';
import { useGoogleMapsDistance } from '@/hooks/useGoogleMapsDistance';

interface GoogleMapRouteProps {
  move: {
    departure_postal_code: string;
    arrival_postal_code: string;
    departure_city: string;
    arrival_city: string;
    company_name: string;
  };
}

const GoogleMapRoute = ({ move }: GoogleMapRouteProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  const { distance, isLoading } = useGoogleMapsDistance({
    departurePostalCode: move.departure_postal_code,
    arrivalPostalCode: move.arrival_postal_code,
    departureCity: move.departure_city,
    arrivalCity: move.arrival_city,
    enabled: true
  });

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || !window.google) return;

      try {
        const geocoder = new google.maps.Geocoder();
        
        // Géocoder les adresses de départ et d'arrivée
        const departureQuery = `${move.departure_postal_code}, ${move.departure_city}, France`;
        const arrivalQuery = `${move.arrival_postal_code}, ${move.arrival_city}, France`;

        const [departureResult, arrivalResult] = await Promise.all([
          new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
            geocoder.geocode({ address: departureQuery }, (results, status) => {
              if (status === 'OK' && results) resolve(results);
              else reject(new Error('Geocoding failed for departure'));
            });
          }),
          new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
            geocoder.geocode({ address: arrivalQuery }, (results, status) => {
              if (status === 'OK' && results) resolve(results);
              else reject(new Error('Geocoding failed for arrival'));
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

        // Ajouter les marqueurs
        new google.maps.Marker({
          position: departureLocation,
          map: map,
          title: `Départ: ${move.departure_city}`,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
            scaledSize: new google.maps.Size(32, 32)
          }
        });

        new google.maps.Marker({
          position: arrivalLocation,
          map: map,
          title: `Arrivée: ${move.arrival_city}`,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(32, 32)
          }
        });

        // Ajouter la route
        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer({
          strokeColor: '#2563eb',
          strokeWeight: 4,
          strokeOpacity: 0.8
        });

        directionsRenderer.setMap(map);

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

      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la carte:', error);
      }
    };

    if (window.google) {
      initMap();
    } else {
      // Attendre que Google Maps soit chargé
      const checkGoogleMaps = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogleMaps);
          initMap();
        }
      }, 100);

      return () => clearInterval(checkGoogleMaps);
    }
  }, [move]);

  if (isLoading) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div ref={mapRef} className="h-96 w-full rounded-lg" />
      {distance && (
        <div className="text-sm text-gray-600 text-center">
          Distance: {distance}km
        </div>
      )}
    </div>
  );
};

export default GoogleMapRoute;
