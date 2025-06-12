
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
      if (!mapRef.current) return;

      // Attendre que Google Maps soit disponible
      if (!window.google || !window.google.maps) {
        console.log('Google Maps pas encore chargé, attente...');
        return;
      }

      try {
        console.log('Initialisation de la carte pour:', move.departure_postal_code, '->', move.arrival_postal_code);
        
        const geocoder = new google.maps.Geocoder();
        
        // Géocoder les adresses de départ et d'arrivée
        const departureQuery = `${move.departure_postal_code}, ${move.departure_city}, France`;
        const arrivalQuery = `${move.arrival_postal_code}, ${move.arrival_city}, France`;

        console.log('Géocodage:', departureQuery, arrivalQuery);

        const [departureResult, arrivalResult] = await Promise.all([
          new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
            geocoder.geocode({ address: departureQuery }, (results, status) => {
              console.log('Résultat géocodage départ:', status, results);
              if (status === 'OK' && results) resolve(results);
              else reject(new Error(`Geocoding failed for departure: ${status}`));
            });
          }),
          new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
            geocoder.geocode({ address: arrivalQuery }, (results, status) => {
              console.log('Résultat géocodage arrivée:', status, results);
              if (status === 'OK' && results) resolve(results);
              else reject(new Error(`Geocoding failed for arrival: ${status}`));
            });
          })
        ]);

        const departureLocation = departureResult[0].geometry.location;
        const arrivalLocation = arrivalResult[0].geometry.location;

        console.log('Positions trouvées:', departureLocation.toString(), arrivalLocation.toString());

        // Créer la carte
        const map = new google.maps.Map(mapRef.current, {
          zoom: 7,
          center: departureLocation,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
        });

        mapInstanceRef.current = map;
        console.log('Carte créée');

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

        console.log('Marqueurs ajoutés');

        // Ajouter la route
        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer();

        // Configurer les options de style après la création
        directionsRenderer.setOptions({
          polylineOptions: {
            strokeColor: '#2563eb',
            strokeWeight: 4,
            strokeOpacity: 0.8
          }
        });

        directionsRenderer.setMap(map);

        directionsService.route({
          origin: departureLocation,
          destination: arrivalLocation,
          travelMode: google.maps.TravelMode.DRIVING
        }, (result, status) => {
          console.log('Résultat directions:', status, result);
          if (status === 'OK' && result) {
            directionsRenderer.setDirections(result);
            console.log('Route affichée');
          } else {
            console.error('Erreur directions:', status);
          }
        });

        // Ajuster la vue pour inclure les deux points
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(departureLocation);
        bounds.extend(arrivalLocation);
        map.fitBounds(bounds);

        console.log('Carte initialisée avec succès');

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

      // Créer le script Google Maps s'il n'existe pas
      if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
        const script = document.createElement('script');
        script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDgAn_xJ5IsZBJjlwLkMYhWP7DQXvoxK4Y&libraries=places';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          console.log('Script Google Maps chargé');
          setTimeout(initMap, 100); // Petit délai pour s'assurer que tout est prêt
        };
        script.onerror = () => {
          console.error('Erreur de chargement du script Google Maps');
        };
        document.head.appendChild(script);
      } else {
        // Script déjà présent, attendre qu'il soit prêt
        const checkGoogleMaps = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkGoogleMaps);
            initMap();
          }
        }, 100);

        // Timeout après 10 secondes
        setTimeout(() => {
          clearInterval(checkGoogleMaps);
          console.error('Timeout: Google Maps non disponible après 10 secondes');
        }, 10000);
      }
    };

    loadGoogleMaps();
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
      <div ref={mapRef} className="h-96 w-full rounded-lg border" />
      {distance && (
        <div className="text-sm text-gray-600 text-center">
          Distance: {distance}km
        </div>
      )}
    </div>
  );
};

export default GoogleMapRoute;
