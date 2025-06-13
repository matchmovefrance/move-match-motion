
import { loadGoogleMapsScript } from '@/lib/google-maps-config';

export interface MapLocation {
  departure_postal_code: string;
  arrival_postal_code: string;
  departure_city?: string;
  arrival_city?: string;
}

export interface MatchMapLocations {
  client: MapLocation & { name: string };
  move: MapLocation & { company_name: string };
}

export class GoogleMapsService {
  static async initializeMap(container: HTMLElement): Promise<google.maps.Map> {
    await loadGoogleMapsScript();
    
    if (!window.google?.maps) {
      throw new Error('Google Maps API non disponible');
    }

    const map = new google.maps.Map(container, {
      zoom: 7,
      center: { lat: 46.603354, lng: 1.888334 }, // Centre de la France
      mapTypeId: google.maps.MapTypeId.ROADMAP,
    });

    console.log('✅ Carte Google Maps initialisée');
    return map;
  }

  static async displaySingleRoute(map: google.maps.Map, location: MapLocation): Promise<void> {
    console.log('🗺️ Affichage route simple:', location);

    const geocoder = new google.maps.Geocoder();
    
    const departureQuery = `${location.departure_postal_code}, ${location.departure_city || ''}, France`;
    const arrivalQuery = `${location.arrival_postal_code}, ${location.arrival_city || ''}, France`;

    try {
      const [departureResult, arrivalResult] = await Promise.all([
        this.geocodeAddress(geocoder, departureQuery),
        this.geocodeAddress(geocoder, arrivalQuery)
      ]);

      const departureLocation = departureResult[0].geometry.location;
      const arrivalLocation = arrivalResult[0].geometry.location;

      // Marqueurs
      new google.maps.Marker({
        position: departureLocation,
        map: map,
        title: `Départ: ${location.departure_city || location.departure_postal_code}`,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
          scaledSize: new google.maps.Size(32, 32)
        }
      });

      new google.maps.Marker({
        position: arrivalLocation,
        map: map,
        title: `Arrivée: ${location.arrival_city || location.arrival_postal_code}`,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new google.maps.Size(32, 32)
        }
      });

      // Route
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
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
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);
          console.log('✅ Route simple affichée');
        } else {
          console.error('❌ Erreur affichage route:', status);
        }
      });

      // Ajuster la vue
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(departureLocation);
      bounds.extend(arrivalLocation);
      map.fitBounds(bounds);

    } catch (error) {
      console.error('❌ Erreur affichage route simple:', error);
      throw error;
    }
  }

  static async displayMatchRoutes(map: google.maps.Map, locations: MatchMapLocations): Promise<void> {
    console.log('🗺️ Affichage routes match:', locations);

    const geocoder = new google.maps.Geocoder();
    
    const clientDepartureQuery = `${locations.client.departure_postal_code}, ${locations.client.departure_city}, France`;
    const clientArrivalQuery = `${locations.client.arrival_postal_code}, ${locations.client.arrival_city}, France`;
    const moveDepartureQuery = `${locations.move.departure_postal_code}, ${locations.move.departure_city}, France`;
    const moveArrivalQuery = `${locations.move.arrival_postal_code}, ${locations.move.arrival_city}, France`;

    try {
      const [clientDepartureResult, clientArrivalResult, moveDepartureResult, moveArrivalResult] = await Promise.all([
        this.geocodeAddress(geocoder, clientDepartureQuery),
        this.geocodeAddress(geocoder, clientArrivalQuery),
        this.geocodeAddress(geocoder, moveDepartureQuery),
        this.geocodeAddress(geocoder, moveArrivalQuery)
      ]);

      const clientDepartureLocation = clientDepartureResult[0].geometry.location;
      const clientArrivalLocation = clientArrivalResult[0].geometry.location;
      const moveDepartureLocation = moveDepartureResult[0].geometry.location;
      const moveArrivalLocation = moveArrivalResult[0].geometry.location;

      // Marqueurs client (bleus)
      new google.maps.Marker({
        position: clientDepartureLocation,
        map: map,
        title: `Client - Départ: ${locations.client.departure_city}`,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          scaledSize: new google.maps.Size(32, 32)
        },
        label: { text: 'C', color: 'white', fontSize: '14px', fontWeight: 'bold' }
      });

      new google.maps.Marker({
        position: clientArrivalLocation,
        map: map,
        title: `Client - Arrivée: ${locations.client.arrival_city}`,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          scaledSize: new google.maps.Size(32, 32)
        },
        label: { text: 'C', color: 'white', fontSize: '14px', fontWeight: 'bold' }
      });

      // Marqueurs déménageur (rouges)
      new google.maps.Marker({
        position: moveDepartureLocation,
        map: map,
        title: `Déménageur - Départ: ${locations.move.departure_city}`,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new google.maps.Size(32, 32)
        },
        label: { text: 'D', color: 'white', fontSize: '14px', fontWeight: 'bold' }
      });

      new google.maps.Marker({
        position: moveArrivalLocation,
        map: map,
        title: `Déménageur - Arrivée: ${locations.move.arrival_city}`,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new google.maps.Size(32, 32)
        },
        label: { text: 'D', color: 'white', fontSize: '14px', fontWeight: 'bold' }
      });

      // Route client (bleue)
      const clientDirectionsService = new google.maps.DirectionsService();
      const clientDirectionsRenderer = new google.maps.DirectionsRenderer({
        polylineOptions: {
          strokeColor: '#2563eb',
          strokeWeight: 5,
          strokeOpacity: 0.8
        },
        suppressMarkers: true
      });

      clientDirectionsRenderer.setMap(map);

      clientDirectionsService.route({
        origin: clientDepartureLocation,
        destination: clientArrivalLocation,
        travelMode: google.maps.TravelMode.DRIVING
      }, (result, status) => {
        if (status === 'OK' && result) {
          clientDirectionsRenderer.setDirections(result);
          console.log('✅ Route client (bleue) affichée');
        }
      });

      // Route déménageur (rouge)
      const moveDirectionsService = new google.maps.DirectionsService();
      const moveDirectionsRenderer = new google.maps.DirectionsRenderer({
        polylineOptions: {
          strokeColor: '#dc2626',
          strokeWeight: 5,
          strokeOpacity: 0.8
        },
        suppressMarkers: true
      });

      moveDirectionsRenderer.setMap(map);

      moveDirectionsService.route({
        origin: moveDepartureLocation,
        destination: moveArrivalLocation,
        travelMode: google.maps.TravelMode.DRIVING
      }, (result, status) => {
        if (status === 'OK' && result) {
          moveDirectionsRenderer.setDirections(result);
          console.log('✅ Route déménageur (rouge) affichée');
        }
      });

      // Ajuster la vue
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(clientDepartureLocation);
      bounds.extend(clientArrivalLocation);
      bounds.extend(moveDepartureLocation);
      bounds.extend(moveArrivalLocation);
      map.fitBounds(bounds);

      console.log('✅ Routes match affichées');

    } catch (error) {
      console.error('❌ Erreur affichage routes match:', error);
      throw error;
    }
  }

  private static geocodeAddress(geocoder: google.maps.Geocoder, address: string): Promise<google.maps.GeocoderResult[]> {
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results) {
          resolve(results);
        } else {
          reject(new Error(`Geocoding failed for ${address}: ${status}`));
        }
      });
    });
  }
}
