
import { useCallback, useRef } from 'react';

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
  const directionsRenderersRef = useRef<google.maps.DirectionsRenderer[]>([]);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const clearMapElements = useCallback(() => {
    // Clear existing renderers
    directionsRenderersRef.current.forEach(renderer => {
      renderer.setMap(null);
    });
    directionsRenderersRef.current = [];

    // Clear existing markers
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];
  }, []);

  const calculateRealRoute = useCallback(async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<google.maps.DirectionsResult | null> => {
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

      return response;
    } catch (error) {
      console.error('Erreur lors du calcul de la route:', error);
      return null;
    }
  }, []);

  const addMarkersAndRoutes = useCallback(async (
    activeMoves: Move[],
    activeClientRequests: ClientRequest[]
  ) => {
    if (!map) return;

    // Clear existing elements
    clearMapElements();

    const allPoints: google.maps.LatLng[] = [];

    // Add mover routes (blue) - limit to 3 for performance
    for (const move of activeMoves.slice(0, 3)) {
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
      const arrivalMarker = new google.maps.Marker({
        position: { lat: move.arrival_lat, lng: move.arrival_lng },
        map: map,
        title: `Déménagement #${move.id} - Arrivée: ${move.arrival_city}`,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new google.maps.Size(32, 32)
        }
      });

      markersRef.current.push(departureMarker, arrivalMarker);
      allPoints.push(
        new google.maps.LatLng(move.departure_lat, move.departure_lng),
        new google.maps.LatLng(move.arrival_lat, move.arrival_lng)
      );

      // Calculate and display real route
      const routeData = await calculateRealRoute(
        { lat: move.departure_lat, lng: move.departure_lng },
        { lat: move.arrival_lat, lng: move.arrival_lng }
      );

      if (routeData) {
        const directionsRenderer = new google.maps.DirectionsRenderer({
          map: map,
          directions: routeData,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#3B82F6',
            strokeOpacity: 0.8,
            strokeWeight: 4
          }
        });

        directionsRenderersRef.current.push(directionsRenderer);
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

    // Add client request routes (orange) - limit to 3 for performance
    for (const request of activeClientRequests.slice(0, 3)) {
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
      const clientArrivalMarker = new google.maps.Marker({
        position: { lat: request.arrival_lat, lng: request.arrival_lng },
        map: map,
        title: `Demande Client #${request.id} - Arrivée: ${request.arrival_city}`,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
          scaledSize: new google.maps.Size(28, 28)
        }
      });

      markersRef.current.push(clientDepartureMarker, clientArrivalMarker);
      allPoints.push(
        new google.maps.LatLng(request.departure_lat, request.departure_lng),
        new google.maps.LatLng(request.arrival_lat, request.arrival_lng)
      );

      // Calculate and display real route for client
      const routeData = await calculateRealRoute(
        { lat: request.departure_lat, lng: request.departure_lng },
        { lat: request.arrival_lat, lng: request.arrival_lng }
      );

      if (routeData) {
        const directionsRenderer = new google.maps.DirectionsRenderer({
          map: map,
          directions: routeData,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#F97316',
            strokeOpacity: 0.7,
            strokeWeight: 3
          }
        });

        directionsRenderersRef.current.push(directionsRenderer);
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

    // Fit bounds to show all markers
    if (allPoints.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      allPoints.forEach(point => {
        bounds.extend(point);
      });
      map.fitBounds(bounds);
    }
  }, [map, calculateRealRoute, clearMapElements]);

  return { addMarkersAndRoutes, clearMapElements };
};
