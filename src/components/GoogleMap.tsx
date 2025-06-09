import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { loadGoogleMapsScript } from '@/lib/google-maps-config';
import { MapPin, Truck, Navigation, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import StatusToggle from './StatusToggle';

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
}

const GoogleMapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeMoves, setActiveMoves] = useState<Move[]>([]);
  const [activeClientRequests, setActiveClientRequests] = useState<ClientRequest[]>([]);
  const [allMoves, setAllMoves] = useState<Move[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

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

  // Fonction améliorée pour calculer la distance réelle entre un client et un trajet fournisseur
  const calculateRealDistanceToRoute = async (
    clientDepartureCoords: { lat: number; lng: number },
    clientArrivalCoords: { lat: number; lng: number },
    moverDepartureCoords: { lat: number; lng: number },
    moverArrivalCoords: { lat: number; lng: number }
  ): Promise<number> => {
    try {
      if (!window.google?.maps) {
        console.warn('Google Maps API non disponible, utilisation du calcul de distance basique');
        return calculateDistanceToLine(
          clientDepartureCoords.lat,
          clientDepartureCoords.lng,
          moverDepartureCoords.lat,
          moverDepartureCoords.lng,
          moverArrivalCoords.lat,
          moverArrivalCoords.lng
        );
      }

      const directionsService = new google.maps.DirectionsService();
      
      // Obtenir l'itinéraire détaillé du fournisseur avec plus de détails
      const routeResult = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        directionsService.route({
          origin: new google.maps.LatLng(moverDepartureCoords.lat, moverDepartureCoords.lng),
          destination: new google.maps.LatLng(moverArrivalCoords.lat, moverArrivalCoords.lng),
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          region: 'FR',
          avoidHighways: false,
          avoidTolls: false
        }, (result, status) => {
          if (status === 'OK' && result) {
            resolve(result);
          } else {
            reject(new Error(`Directions failed: ${status}`));
          }
        });
      });

      if (!routeResult.routes || routeResult.routes.length === 0) {
        throw new Error('Aucun itinéraire trouvé');
      }

      const route = routeResult.routes[0];
      
      // Utiliser les étapes détaillées de l'itinéraire pour une meilleure précision
      const allRoutePoints: google.maps.LatLng[] = [];
      
      // Ajouter tous les points de toutes les étapes
      route.legs.forEach(leg => {
        leg.steps.forEach(step => {
          // Ajouter le point de départ de l'étape
          allRoutePoints.push(step.start_location);
          
          // Ajouter des points intermédiaires basés sur la géométrie polyline
          if (step.path && step.path.length > 0) {
            step.path.forEach(point => {
              allRoutePoints.push(point);
            });
          }
          
          // Ajouter le point de fin de l'étape
          allRoutePoints.push(step.end_location);
        });
      });

      // Si pas de points détaillés, utiliser le chemin global
      if (allRoutePoints.length === 0 && route.overview_path) {
        allRoutePoints.push(...route.overview_path);
      }

      if (allRoutePoints.length === 0) {
        throw new Error('Aucun point trouvé sur l\'itinéraire');
      }

      console.log(`Analyse de ${allRoutePoints.length} points sur l'itinéraire du fournisseur`);

      // Calculer la distance minimale pour le départ ET l'arrivée du client
      let minDistanceFromClientDeparture = Infinity;
      let minDistanceFromClientArrival = Infinity;
      let bestPointForDeparture: google.maps.LatLng | null = null;
      let bestPointForArrival: google.maps.LatLng | null = null;

      // Analyser chaque point de l'itinéraire
      allRoutePoints.forEach((routePoint, index) => {
        // Distance du point de départ client à ce point de l'itinéraire
        const distFromClientDeparture = calculateHaversineDistance(
          clientDepartureCoords.lat,
          clientDepartureCoords.lng,
          routePoint.lat(),
          routePoint.lng()
        );
        
        // Distance du point d'arrivée client à ce point de l'itinéraire
        const distFromClientArrival = calculateHaversineDistance(
          clientArrivalCoords.lat,
          clientArrivalCoords.lng,
          routePoint.lat(),
          routePoint.lng()
        );
        
        if (distFromClientDeparture < minDistanceFromClientDeparture) {
          minDistanceFromClientDeparture = distFromClientDeparture;
          bestPointForDeparture = routePoint;
        }
        
        if (distFromClientArrival < minDistanceFromClientArrival) {
          minDistanceFromClientArrival = distFromClientArrival;
          bestPointForArrival = routePoint;
        }
      });

      // Calculer aussi la distance entre les points optimaux trouvés
      let routeDistanceBetweenOptimalPoints = 0;
      if (bestPointForDeparture && bestPointForArrival) {
        routeDistanceBetweenOptimalPoints = calculateHaversineDistance(
          bestPointForDeparture.lat(),
          bestPointForDeparture.lng(),
          bestPointForArrival.lat(),
          bestPointForArrival.lng()
        );
      }

      // La distance finale est la somme des détours nécessaires
      // Plus la distance entre les deux points optimaux sur l'itinéraire
      const totalDetourDistance = minDistanceFromClientDeparture + minDistanceFromClientArrival + routeDistanceBetweenOptimalPoints;
      
      console.log(`Distance optimisée calculée: 
        - Détour départ client: ${Math.round(minDistanceFromClientDeparture)}km
        - Détour arrivée client: ${Math.round(minDistanceFromClientArrival)}km  
        - Distance entre points optimaux: ${Math.round(routeDistanceBetweenOptimalPoints)}km
        - Total: ${Math.round(totalDetourDistance)}km`);
      
      // Retourner la distance de détour la plus significative (mais pas la somme totale qui serait trop pessimiste)
      const finalDistance = Math.max(minDistanceFromClientDeparture, minDistanceFromClientArrival);
      
      return finalDistance;

    } catch (error) {
      console.error('Erreur lors du calcul de distance avec Google Maps:', error);
      
      // Fallback vers le calcul de distance géométrique
      return calculateDistanceToLine(
        clientDepartureCoords.lat,
        clientDepartureCoords.lng,
        moverDepartureCoords.lat,
        moverDepartureCoords.lng,
        moverArrivalCoords.lat,
        moverArrivalCoords.lng
      );
    }
  };

  // Fonction pour calculer la distance haversine entre deux points
  const calculateHaversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Rayon de la Terre en kilomètres
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Fonction pour calculer la distance minimale d'un point à une ligne (trajet) - Fallback
  const calculateDistanceToLine = (pointLat: number, pointLng: number, line1Lat: number, line1Lng: number, line2Lat: number, line2Lng: number): number => {
    // Conversion des degrés en radians
    const toRad = (deg: number) => deg * (Math.PI / 180);
    
    // Rayon de la Terre en km
    const R = 6371;
    
    // Coordonnées du point
    const px = toRad(pointLat);
    const py = toRad(pointLng);
    
    // Coordonnées de la ligne (segment)
    const x1 = toRad(line1Lat);
    const y1 = toRad(line1Lng);
    const x2 = toRad(line2Lat);
    const y2 = toRad(line2Lng);
    
    // Si c'est un point (pas une ligne)
    if (Math.abs(x2 - x1) < 0.0001 && Math.abs(y2 - y1) < 0.0001) {
      // Distance entre deux points sur une sphère (formule haversine)
      const dLat = px - x1;
      const dLng = py - y1;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(x1) * Math.cos(px) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }
    
    // Vecteur de la ligne
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    // Projection du point sur la ligne
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
    
    // Point le plus proche sur la ligne
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    
    // Distance entre le point et le point le plus proche sur la ligne
    const dLat = px - closestX;
    const dLng = py - closestY;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(closestX) * Math.cos(px) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  };

  // Charger toutes les données de déménagement et demandes clients
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Charger les déménagements confirmés
      const { data: movesData, error: movesError } = await supabase
        .from('confirmed_moves')
        .select('*')
        .order('departure_date', { ascending: false });

      if (movesError) throw movesError;

      // Charger les demandes clients actives
      const { data: clientRequestsData, error: clientRequestsError } = await supabase
        .from('client_requests')
        .select('*')
        .neq('status', 'confirmed')
        .order('desired_date', { ascending: false });

      if (clientRequestsError) throw clientRequestsError;

      if (movesData && movesData.length > 0) {
        // Séparer les trajets actifs (non terminés) des trajets terminés
        const activeMovesData = movesData.filter(move => move.status !== 'termine');
        
        // Géocoder seulement les trajets actifs pour la carte
        const activeMovesWithCoords: Move[] = [];
        
        for (const move of activeMovesData.slice(0, 10)) {
          const departureAddress = `${move.departure_postal_code} ${move.departure_city}, France`;
          const arrivalAddress = `${move.arrival_postal_code} ${move.arrival_city}, France`;
          
          const [departure, arrival] = await Promise.all([
            geocodeAddress(departureAddress),
            geocodeAddress(arrivalAddress)
          ]);
          
          activeMovesWithCoords.push({
            ...move,
            departure_lat: departure.lat,
            departure_lng: departure.lng,
            arrival_lat: arrival.lat,
            arrival_lng: arrival.lng
          });
        }
        
        setActiveMoves(activeMovesWithCoords);
        setAllMoves(movesData);
      } else {
        setActiveMoves([]);
        setAllMoves([]);
      }

      if (clientRequestsData && clientRequestsData.length > 0) {
        // Géocoder les demandes clients actives
        const activeClientRequestsWithCoords: ClientRequest[] = [];
        
        for (const request of clientRequestsData.slice(0, 10)) {
          const departureAddress = `${request.departure_postal_code} ${request.departure_city}, France`;
          const arrivalAddress = `${request.arrival_postal_code} ${request.arrival_city}, France`;
          
          const [departure, arrival] = await Promise.all([
            geocodeAddress(departureAddress),
            geocodeAddress(arrivalAddress)
          ]);
          
          activeClientRequestsWithCoords.push({
            ...request,
            departure_lat: departure.lat,
            departure_lng: departure.lng,
            arrival_lat: arrival.lat,
            arrival_lng: arrival.lng
          });
        }
        
        setActiveClientRequests(activeClientRequestsWithCoords);
      } else {
        setActiveClientRequests([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setError('Impossible de charger les données');
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

  // Ajouter les marqueurs et trajets pour les déménagements confirmés et demandes clients
  const addMarkersAndRoutes = useCallback(async () => {
    if (!map) return;

    // Ajouter les trajets de déménageurs confirmés (bleu)
    activeMoves.forEach((move, index) => {
      if (!move.departure_lat || !move.departure_lng || !move.arrival_lat || !move.arrival_lng) return;

      // Marqueur de départ (vert)
      const departureMarker = new google.maps.Marker({
        position: { lat: move.departure_lat, lng: move.departure_lng },
        map: map,
        title: `Déménagement #${move.id} - Départ: ${move.departure_city}`,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
          scaledSize: new google.maps.Size(32, 32)
        }
      });

      // Marqueur d'arrivée (rouge)
      new google.maps.Marker({
        position: { lat: move.arrival_lat, lng: move.arrival_lng },
        map: map,
        title: `Déménagement #${move.id} - Arrivée: ${move.arrival_city}`,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new google.maps.Size(32, 32)
        }
      });

      // Ligne de trajet déménageur (bleu)
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

      // InfoWindow pour les détails du déménagement
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 200px;">
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
    });

    // Ajouter les trajets de demandes clients (orange) avec calcul de distance optimisé
    for (const [index, request] of activeClientRequests.entries()) {
      if (!request.departure_lat || !request.departure_lng || !request.arrival_lat || !request.arrival_lng) continue;

      // Calculer la distance minimale à tous les trajets de déménageurs avec l'algorithme optimisé
      let minDistance = Infinity;
      let closestMove: Move | null = null;
      let bestMatchDetails = '';

      for (const move of activeMoves) {
        if (move.departure_lat && move.departure_lng && move.arrival_lat && move.arrival_lng) {
          try {
            const distance = await calculateRealDistanceToRoute(
              { lat: request.departure_lat!, lng: request.departure_lng! },
              { lat: request.arrival_lat!, lng: request.arrival_lng! },
              { lat: move.departure_lat, lng: move.departure_lng },
              { lat: move.arrival_lat, lng: move.arrival_lng }
            );
            
            if (distance < minDistance) {
              minDistance = distance;
              closestMove = move;
              bestMatchDetails = `Meilleur match avec trajet #${move.id} (${move.company_name || 'N/A'})`;
            }
            
            console.log(`Client #${request.id} -> Trajet #${move.id}: distance optimisée = ${Math.round(distance)}km`);
          } catch (error) {
            console.error(`Erreur lors du calcul de distance pour le client ${request.id} et le trajet ${move.id}:`, error);
          }
        }
      }

      // Marqueur de départ client (jaune)
      const clientDepartureMarker = new google.maps.Marker({
        position: { lat: request.departure_lat, lng: request.departure_lng },
        map: map,
        title: `Demande Client #${request.id} - Départ: ${request.departure_city}`,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
          scaledSize: new google.maps.Size(28, 28)
        }
      });

      // Marqueur d'arrivée client (orange)
      new google.maps.Marker({
        position: { lat: request.arrival_lat, lng: request.arrival_lng },
        map: map,
        title: `Demande Client #${request.id} - Arrivée: ${request.arrival_city}`,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
          scaledSize: new google.maps.Size(28, 28)
        }
      });

      // Ligne de trajet client (orange)
      new google.maps.Polyline({
        path: [
          { lat: request.departure_lat, lng: request.departure_lng },
          { lat: request.arrival_lat, lng: request.arrival_lng }
        ],
        geodesic: true,
        strokeColor: '#F97316',
        strokeOpacity: 0.7,
        strokeWeight: 2,
        map: map
      });

      // InfoWindow pour les détails de la demande client avec distance optimisée
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
              <strong>Volume:</strong> ${request.estimated_volume || 'N/A'} m³
            </p>
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>Statut:</strong> ${request.status}
            </p>
            ${minDistance !== Infinity ? `
              <div style="margin: 8px 0; padding: 6px; background: ${minDistance <= 50 ? '#ecfdf5' : minDistance <= 100 ? '#fef3c7' : '#fef2f2'}; border-radius: 4px;">
                <p style="margin: 0; font-size: 12px; color: ${minDistance <= 50 ? '#10b981' : minDistance <= 100 ? '#f59e0b' : '#ef4444'}; font-weight: bold;">
                  <strong>Distance optimisée:</strong> ${Math.round(minDistance)}km
                </p>
                <p style="margin: 2px 0 0 0; font-size: 10px; color: #6b7280;">
                  ${bestMatchDetails}
                </p>
              </div>
            ` : ''}
          </div>
        `
      });

      clientDepartureMarker.addListener('click', () => {
        clientInfoWindow.open(map, clientDepartureMarker);
      });
    }

    // Ajuster la vue pour inclure tous les marqueurs
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
  }, [map, activeMoves, activeClientRequests]);

  const handleStatusChange = async (moveId: number, newStatus: 'en_cours' | 'termine') => {
    try {
      const { error } = await supabase
        .from('confirmed_moves')
        .update({ status: newStatus })
        .eq('id', moveId);

      if (error) throw error;

      // Recharger les données pour mettre à jour la carte et la liste
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'termine':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Terminé</Badge>;
      case 'en_cours':
        return <Badge className="bg-orange-100 text-orange-800"><Clock className="h-3 w-3 mr-1" />En cours</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="h-3 w-3 mr-1" />Confirmé</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getMatchStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Accepté</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Non défini</Badge>;
    }
  };

  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  useEffect(() => {
    if (map) {
      loadData();
    }
  }, [map, loadData]);

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
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showHistory ? 'Masquer l\'historique' : 'Afficher l\'historique'}
          </button>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Départ déménageur</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Arrivée déménageur</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-0.5 bg-blue-500"></div>
              <span>Trajet déménageur</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Départ client</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>Arrivée client</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-0.5 bg-orange-500"></div>
              <span>Trajet client</span>
            </div>
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

      {(activeMoves.length > 0 || activeClientRequests.length > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Truck className="h-5 w-5 text-blue-600" />
            <span className="text-blue-800 font-medium">
              {activeMoves.length} trajet{activeMoves.length > 1 ? 's' : ''} déménageur{activeMoves.length > 1 ? 's' : ''} et {activeClientRequests.length} demande{activeClientRequests.length > 1 ? 's' : ''} client{activeClientRequests.length > 1 ? 's' : ''} affichés sur la carte
            </span>
          </div>
        </div>
      )}

      {/* Liste des trajets avec historique */}
      {showHistory && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Historique des trajets
            </h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Compagnie</TableHead>
                  <TableHead>Départ</TableHead>
                  <TableHead>Arrivée</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Match</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allMoves.map((move) => (
                  <TableRow key={move.id}>
                    <TableCell className="font-medium">#{move.id}</TableCell>
                    <TableCell>{move.company_name || 'N/A'}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{move.departure_city}</div>
                        <div className="text-sm text-gray-500">{move.departure_postal_code}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{move.arrival_city}</div>
                        <div className="text-sm text-gray-500">{move.arrival_postal_code}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(move.departure_date).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>{getStatusBadge(move.status)}</TableCell>
                    <TableCell>{getMatchStatusBadge(move.match_status)}</TableCell>
                    <TableCell>
                      {move.total_price ? `${move.total_price.toLocaleString()}€` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <StatusToggle
                        status={move.status}
                        onStatusChange={(newStatus) => handleStatusChange(move.id, newStatus)}
                        disabled={move.status === 'termine'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapComponent;
