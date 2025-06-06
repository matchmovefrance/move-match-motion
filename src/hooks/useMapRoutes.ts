
import { useCallback, useState } from 'react';

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
  match_status?: string;
  total_price?: number;
  created_at: string;
  real_distance_km?: number;
  real_duration_minutes?: number;
}

interface ClientRequest {
  id: number;
  departure_city: string;
  departure_postal_code: string;
  arrival_city: string;
  arrival_postal_code: string;
  desired_date: string;
  status: string;
  name?: string;
  departure_lat?: number;
  departure_lng?: number;
  arrival_lat?: number;
  arrival_lng?: number;
  estimated_volume?: number;
  created_at: string;
  real_distance_km?: number;
  real_duration_minutes?: number;
}

export const useMapRoutes = (map: google.maps.Map | null) => {
  const [directionsRenderers, setDirectionsRenderers] = useState<google.maps.DirectionsRenderer[]>([]);

  const calculateRealRoute = async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<{ distance: number; duration: number; route: google.maps.DirectionsResult | null }> => {
    try {
      const directionsService = new google.maps.DirectionsService();

      const response = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route(
          {
            origin: new google.maps.LatLng(origin.lat, origin.lng),
            destination: new google.maps.LatLng(destination.lat, destination.lng),
            travelMode: google.maps.TravelMode.DRIVING,
            optimizeWaypoints: true,
            avoidHighways: false,
            avoidTolls: false
          },
          (result, status) => {
            if (status === 'OK' && result) {
              resolve(result);
            } else {
              reject(new Error(`Directions request failed: ${status}`));
            }
          }
        );
      });

      const route = response.routes[0];
      const leg = route.legs[0];
      
      return {
        distance: Math.round(leg.distance!.value / 1000),
        duration: Math.round(leg.duration!.value / 60),
        route: response
      };
    } catch (error) {
      console.error('Erreur lors du calcul de la route:', error);
      return {
        distance: 0,
        duration: 0,
        route: null
      };
    }
  };

  const addMarkersAndRoutes = useCallback(async (
    activeMoves: Move[],
    activeClientRequests: ClientRequest[]
  ) => {
    if (!map) return;

    // Clear existing renderers
    directionsRenderers.forEach(renderer => {
      renderer.setMap(null);
    });
    setDirectionsRenderers([]);

    const newRenderers: google.maps.DirectionsRenderer[] = [];

    // Add mover routes (blue)
    for (const move of activeMoves) {
      if (!move.departure_lat || !move.departure_lng || !move.arrival_lat || !move.arrival_lng) continue;

      // Departure marker (green)
      const departureMarker = new google.maps.Marker({
        position: { lat: move.departure_lat, lng: move.departure_lng },
        map: map,
        title: `Déménagement #${move.id} - Départ: ${move.departure_city}`,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
          scaledSize: new google.maps.Size(32, 32)
        }
      });

      // Arrival marker (red)
      new google.maps.Marker({
        position: { lat: move.arrival_lat, lng: move.arrival_lng },
        map: map,
        title: `Déménagement #${move.id} - Arrivée: ${move.arrival_city}`,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new google.maps.Size(32, 32)
        }
      });

      // Calculate and display real route
      try {
        const routeData = await calculateRealRoute(
          { lat: move.departure_lat, lng: move.departure_lng },
          { lat: move.arrival_lat, lng: move.arrival_lng }
        );

        if (routeData.route) {
          const directionsRenderer = new google.maps.DirectionsRenderer({
            map: map,
            directions: routeData.route,
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: '#3B82F6',
              strokeOpacity: 0.8,
              strokeWeight: 4
            }
          });

          newRenderers.push(directionsRenderer);
        }
      } catch (error) {
        console.error('Erreur lors de l\'affichage de la route déménageur:', error);
      }

      // InfoWindow for move details
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #3B82F6;">
              🚛 ${move.company_name || 'Déménagement'} #${move.id}
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

      departureMarker.addListener('click', () => {
        infoWindow.open(map, departureMarker);
      });
    }

    // Add client request routes (orange)
    for (const request of activeClientRequests) {
      if (!request.departure_lat || !request.departure_lng || !request.arrival_lat || !request.arrival_lng) continue;

      // Client departure marker (yellow)
      const clientDepartureMarker = new google.maps.Marker({
        position: { lat: request.departure_lat, lng: request.departure_lng },
        map: map,
        title: `Demande Client #${request.id} - Départ: ${request.departure_city}`,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
          scaledSize: new google.maps.Size(28, 28)
        }
      });

      // Client arrival marker (orange)
      new google.maps.Marker({
        position: { lat: request.arrival_lat, lng: request.arrival_lng },
        map: map,
        title: `Demande Client #${request.id} - Arrivée: ${request.arrival_city}`,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
          scaledSize: new google.maps.Size(28, 28)
        }
      });

      // Calculate and display real route for client
      try {
        const routeData = await calculateRealRoute(
          { lat: request.departure_lat, lng: request.departure_lng },
          { lat: request.arrival_lat, lng: request.arrival_lng }
        );

        if (routeData.route) {
          const directionsRenderer = new google.maps.DirectionsRenderer({
            map: map,
            directions: routeData.route,
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: '#F97316',
              strokeOpacity: 0.7,
              strokeWeight: 3
            }
          });

          newRenderers.push(directionsRenderer);
        }
      } catch (error) {
        console.error('Erreur lors de l\'affichage de la route client:', error);
      }

      // InfoWindow for client request details
      const clientInfoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #F97316;">
              👤 Demande Client #${request.id}
            </h3>
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>Client:</strong> ${request.name || 'N/A'}
            </p>
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>De:</strong> ${request.departure_city} (${request.departure_postal_code})
            </p>
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>À:</strong> ${request.arrival_city} (${request.arrival_postal_code})
            </p>
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>Date souhaitée:</strong> ${new Date(request.desired_date).toLocaleDateString('fr-FR')}
            </p>
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>Volume:</strong> ${request.estimated_volume || 0} m³
            </p>
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>Statut:</strong> ${request.status}
            </p>
          </div>
        `
      });

      clientDepartureMarker.addListener('click', () => {
        clientInfoWindow.open(map, clientDepartureMarker);
      });
    }

    setDirectionsRenderers(newRenderers);

    // Fit bounds to show all markers
    const allPoints = [
      ...activeMoves.filter(move => move.departure_lat && move.departure_lng).map(move => ({ lat: move.departure_lat!, lng: move.departure_lng! })),
      ...activeMoves.filter(move => move.arrival_lat && move.arrival_lng).map(move => ({ lat: move.arrival_lat!, lng: move.arrival_lng! })),
      ...activeClientRequests.filter(request => request.departure_lat && request.departure_lng).map(request => ({ lat: request.departure_lat!, lng: request.departure_lng! })),
      ...activeClientRequests.filter(request => request.arrival_lat && request.arrival_lng).map(request => ({ lat: request.arrival_lat!, lng: request.arrival_lng! }))
    ];

    if (allPoints.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      allPoints.forEach(point => {
        bounds.extend(new google.maps.LatLng(point.lat, point.lng));
      });
      map.fitBounds(bounds);
    }
  }, [map, directionsRenderers]);

  return { addMarkersAndRoutes };
};
