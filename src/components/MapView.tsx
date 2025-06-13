import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Map, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
}

interface MatchRoutes {
  client: {
    departure_postal_code: string;
    arrival_postal_code: string;
    departure_city: string;
    arrival_city: string;
    name: string;
  };
  move: {
    departure_postal_code: string;
    arrival_postal_code: string;
    departure_city: string;
    arrival_city: string;
    company_name: string;
  };
}

// Composant pour afficher les routes d'un match
const MatchRoutesGoogleMap = ({ matchRoutes }: { matchRoutes: MatchRoutes }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      // Attendre que Google Maps soit disponible
      if (!window.google || !window.google.maps) {
        console.log('Google Maps pas encore chargé, attente...');
        return;
      }

      try {
        console.log('Initialisation de la carte pour match avec 2 trajets');
        
        const geocoder = new google.maps.Geocoder();
        const bounds = new google.maps.LatLngBounds();
        let hasAddedBounds = false;

        // Créer la carte
        const map = new google.maps.Map(mapRef.current, {
          zoom: 7,
          center: { lat: 46.603354, lng: 1.888334 }, // Centre de la France
          mapTypeId: google.maps.MapTypeId.ROADMAP,
        });

        // Traiter le trajet client (en bleu)
        const clientDepartureQuery = `${matchRoutes.client.departure_postal_code}, ${matchRoutes.client.departure_city}, France`;
        const clientArrivalQuery = `${matchRoutes.client.arrival_postal_code}, ${matchRoutes.client.arrival_city}, France`;

        // Traiter le trajet déménageur (en rouge)
        const moveDepartureQuery = `${matchRoutes.move.departure_postal_code}, ${matchRoutes.move.departure_city}, France`;
        const moveArrivalQuery = `${matchRoutes.move.arrival_postal_code}, ${matchRoutes.move.arrival_city}, France`;

        console.log('🗺️ Géocodage des adresses pour match:', {
          client: { from: clientDepartureQuery, to: clientArrivalQuery },
          move: { from: moveDepartureQuery, to: moveArrivalQuery }
        });

        try {
          // Géocoder toutes les adresses
          const [clientDepartureResult, clientArrivalResult, moveDepartureResult, moveArrivalResult] = await Promise.all([
            new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
              geocoder.geocode({ address: clientDepartureQuery }, (results, status) => {
                if (status === 'OK' && results) resolve(results);
                else reject(new Error(`Geocoding failed for client departure: ${status}`));
              });
            }),
            new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
              geocoder.geocode({ address: clientArrivalQuery }, (results, status) => {
                if (status === 'OK' && results) resolve(results);
                else reject(new Error(`Geocoding failed for client arrival: ${status}`));
              });
            }),
            new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
              geocoder.geocode({ address: moveDepartureQuery }, (results, status) => {
                if (status === 'OK' && results) resolve(results);
                else reject(new Error(`Geocoding failed for move departure: ${status}`));
              });
            }),
            new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
              geocoder.geocode({ address: moveArrivalQuery }, (results, status) => {
                if (status === 'OK' && results) resolve(results);
                else reject(new Error(`Geocoding failed for move arrival: ${status}`));
              });
            })
          ]);

          // Récupérer les positions
          const clientDepartureLocation = clientDepartureResult[0].geometry.location;
          const clientArrivalLocation = clientArrivalResult[0].geometry.location;
          const moveDepartureLocation = moveDepartureResult[0].geometry.location;
          const moveArrivalLocation = moveArrivalResult[0].geometry.location;

          console.log('✅ Positions géocodées avec succès');

          // Ajouter toutes les positions aux bounds
          bounds.extend(clientDepartureLocation);
          bounds.extend(clientArrivalLocation);
          bounds.extend(moveDepartureLocation);
          bounds.extend(moveArrivalLocation);
          hasAddedBounds = true;

          // Ajouter les marqueurs pour le trajet client (bleu)
          new google.maps.Marker({
            position: clientDepartureLocation,
            map: map,
            title: `Client - Départ: ${matchRoutes.client.departure_city}`,
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new google.maps.Size(32, 32)
            },
            label: {
              text: 'C',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold'
            }
          });

          new google.maps.Marker({
            position: clientArrivalLocation,
            map: map,
            title: `Client - Arrivée: ${matchRoutes.client.arrival_city}`,
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new google.maps.Size(32, 32)
            },
            label: {
              text: 'C',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold'
            }
          });

          // Ajouter les marqueurs pour le trajet déménageur (rouge)
          new google.maps.Marker({
            position: moveDepartureLocation,
            map: map,
            title: `Déménageur - Départ: ${matchRoutes.move.departure_city}`,
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new google.maps.Size(32, 32)
            },
            label: {
              text: 'D',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold'
            }
          });

          new google.maps.Marker({
            position: moveArrivalLocation,
            map: map,
            title: `Déménageur - Arrivée: ${matchRoutes.move.arrival_city}`,
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new google.maps.Size(32, 32)
            },
            label: {
              text: 'D',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold'
            }
          });

          // Créer la route client (bleu)
          const clientDirectionsService = new google.maps.DirectionsService();
          const clientDirectionsRenderer = new google.maps.DirectionsRenderer();

          clientDirectionsRenderer.setOptions({
            polylineOptions: {
              strokeColor: '#2563eb', // Bleu
              strokeWeight: 5,
              strokeOpacity: 0.8
            },
            suppressMarkers: true // On utilise nos propres marqueurs
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

          // Créer la route déménageur (rouge)
          const moveDirectionsService = new google.maps.DirectionsService();
          const moveDirectionsRenderer = new google.maps.DirectionsRenderer();

          moveDirectionsRenderer.setOptions({
            polylineOptions: {
              strokeColor: '#dc2626', // Rouge
              strokeWeight: 5,
              strokeOpacity: 0.8
            },
            suppressMarkers: true // On utilise nos propres marqueurs
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

          // Ajuster la vue pour inclure tous les points
          if (hasAddedBounds) {
            map.fitBounds(bounds);
          }

          console.log('✅ Carte match avec 2 trajets initialisée avec succès');

        } catch (error) {
          console.error('❌ Erreur lors du géocodage:', error);
        }

      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la carte:', error);
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
  }, [matchRoutes]);

  return <div ref={mapRef} className="h-96 w-full rounded-lg border" />;
};

// Composant pour afficher une seule route
const SingleRouteGoogleMap = ({ item }: { item: FilteredItem }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      // Attendre que Google Maps soit disponible
      if (!window.google || !window.google.maps) {
        console.log('Google Maps pas encore chargé, attente...');
        return;
      }

      try {
        console.log('Initialisation de la carte pour:', item.departure_postal_code, '->', item.arrival_postal_code);
        
        const geocoder = new google.maps.Geocoder();
        
        // Géocoder les adresses de départ et d'arrivée
        const departureQuery = `${item.departure_postal_code}, ${item.departure_city}, France`;
        const arrivalQuery = `${item.arrival_postal_code}, ${item.arrival_city}, France`;

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

        console.log('Carte créée');

        // Ajouter les marqueurs
        new google.maps.Marker({
          position: departureLocation,
          map: map,
          title: `Départ: ${item.departure_city}`,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
            scaledSize: new google.maps.Size(32, 32)
          }
        });

        new google.maps.Marker({
          position: arrivalLocation,
          map: map,
          title: `Arrivée: ${item.arrival_city}`,
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
  }, [item]);

  return <div ref={mapRef} className="h-96 w-full rounded-lg border" />;
};

const MapView = () => {
  const { toast } = useToast();
  const [referenceFilter, setReferenceFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<FilteredItem | null>(null);
  const [matchRoutes, setMatchRoutes] = useState<MatchRoutes | null>(null);
  const [loading, setLoading] = useState(false);

  const searchByReference = async () => {
    if (referenceFilter.length < 3) {
      toast({
        title: "Référence trop courte",
        description: "Veuillez saisir au moins 3 caractères",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const cleanRef = referenceFilter.toUpperCase().trim();
      let foundItem: FilteredItem | null = null;
      let foundMatchRoutes: MatchRoutes | null = null;

      console.log('🔍 Recherche de référence:', cleanRef);

      // Rechercher dans les clients (format CLI-XXXXXX)
      if (cleanRef.startsWith('CLI-')) {
        const idStr = cleanRef.replace('CLI-', '');
        const id = parseInt(idStr);
        
        if (!isNaN(id)) {
          console.log('🔍 Recherche client ID:', id);
          
          const { data: client, error } = await supabase
            .from('clients')
            .select('id, name, desired_date, departure_postal_code, arrival_postal_code, departure_city, arrival_city, client_reference')
            .eq('id', id)
            .single();

          if (!error && client) {
            foundItem = {
              id: client.id,
              type: 'client',
              reference: `CLI-${String(client.id).padStart(6, '0')}`,
              name: client.name || 'Client',
              date: client.desired_date ? new Date(client.desired_date).toLocaleDateString('fr-FR') : '',
              details: `${client.departure_postal_code} → ${client.arrival_postal_code}`,
              departure_postal_code: client.departure_postal_code,
              arrival_postal_code: client.arrival_postal_code,
              departure_city: client.departure_city,
              arrival_city: client.arrival_city
            };
            console.log('✅ Client trouvé:', foundItem);
          }
        }
      }

      // Rechercher dans les trajets (format TRJ-XXXXXX)
      if (!foundItem && cleanRef.startsWith('TRJ-')) {
        const idStr = cleanRef.replace('TRJ-', '');
        const id = parseInt(idStr);
        
        if (!isNaN(id)) {
          console.log('🔍 Recherche trajet ID:', id);
          
          const { data: move, error } = await supabase
            .from('confirmed_moves')
            .select('id, company_name, departure_date, departure_postal_code, arrival_postal_code, departure_city, arrival_city')
            .eq('id', id)
            .single();

          if (!error && move) {
            foundItem = {
              id: move.id,
              type: 'move',
              reference: `TRJ-${String(move.id).padStart(6, '0')}`,
              name: move.company_name || 'Déménageur',
              date: move.departure_date ? new Date(move.departure_date).toLocaleDateString('fr-FR') : '',
              details: `${move.departure_postal_code} → ${move.arrival_postal_code}`,
              departure_postal_code: move.departure_postal_code,
              arrival_postal_code: move.arrival_postal_code,
              departure_city: move.departure_city,
              arrival_city: move.arrival_city,
              company_name: move.company_name
            };
            console.log('✅ Trajet trouvé:', foundItem);
          }
        }
      }

      // Rechercher dans les matchs avec les deux trajets (format MTH-XXXXXX)
      if (!foundItem && cleanRef.startsWith('MTH-')) {
        const idStr = cleanRef.replace('MTH-', '');
        const id = parseInt(idStr);
        
        if (!isNaN(id)) {
          console.log('🔍 RECHERCHE MATCH ID:', id);
          
          // Étape 1: Récupérer le match avec client_id et move_id
          const { data: matchData, error: matchError } = await supabase
            .from('move_matches')
            .select('id, created_at, client_id, move_id')
            .eq('id', id)
            .single();

          console.log('🔍 RÉSULTAT MATCH:', { matchData, matchError });

          if (!matchError && matchData) {
            console.log('🔍 MATCH TROUVÉ - client_id:', matchData.client_id, 'move_id:', matchData.move_id);

            // Étape 2: Récupérer les données client séparément
            const { data: clientData, error: clientError } = await supabase
              .from('clients')
              .select('id, name, departure_postal_code, arrival_postal_code, departure_city, arrival_city')
              .eq('id', matchData.client_id)
              .single();

            console.log('🔍 RÉSULTAT CLIENT:', { clientData, clientError });

            // Étape 3: Récupérer les données trajet séparément
            const { data: moveData, error: moveError } = await supabase
              .from('confirmed_moves')
              .select('id, company_name, departure_postal_code, arrival_postal_code, departure_city, arrival_city')
              .eq('id', matchData.move_id)
              .single();

            console.log('🔍 RÉSULTAT TRAJET:', { moveData, moveError });

            // Étape 4: Vérifier qu'on a les deux jeux de données
            if (!clientError && !moveError && clientData && moveData) {
              console.log('✅ DONNÉES COMPLÈTES TROUVÉES');
              
              foundItem = {
                id: matchData.id,
                type: 'match',
                reference: `MTH-${String(matchData.id).padStart(6, '0')}`,
                name: `${clientData.name || 'Client'} ↔ ${moveData.company_name || 'Déménageur'}`,
                date: matchData.created_at ? new Date(matchData.created_at).toLocaleDateString('fr-FR') : '',
                details: `Client: ${clientData.departure_postal_code || ''} → ${clientData.arrival_postal_code || ''} | Déménageur: ${moveData.departure_postal_code || ''} → ${moveData.arrival_postal_code || ''}`,
                departure_postal_code: clientData.departure_postal_code,
                arrival_postal_code: clientData.arrival_postal_code,
                departure_city: clientData.departure_city,
                arrival_city: clientData.arrival_city,
                company_name: moveData.company_name
              };

              // Créer les données pour les deux trajets
              foundMatchRoutes = {
                client: {
                  departure_postal_code: clientData.departure_postal_code || '',
                  arrival_postal_code: clientData.arrival_postal_code || '',
                  departure_city: clientData.departure_city || '',
                  arrival_city: clientData.arrival_city || '',
                  name: clientData.name || 'Client'
                },
                move: {
                  departure_postal_code: moveData.departure_postal_code || '',
                  arrival_postal_code: moveData.arrival_postal_code || '',
                  departure_city: moveData.departure_city || '',
                  arrival_city: moveData.arrival_city || '',
                  company_name: moveData.company_name || 'Déménageur'
                }
              };

              console.log('✅ MATCH CRÉÉ:', foundItem);
              console.log('🗺️ ROUTES MATCH:', foundMatchRoutes);
            } else {
              console.error('❌ ERREUR RÉCUPÉRATION DONNÉES:', { 
                clientError, 
                moveError,
                clientFound: !!clientData,
                moveFound: !!moveData
              });
            }
          } else {
            console.error('❌ MATCH NON TROUVÉ:', { matchError, searchId: id });
          }
        }
      }

      if (foundItem) {
        setSelectedItem(foundItem);
        setMatchRoutes(foundMatchRoutes);
        console.log('✅ Référence trouvée et affichée:', foundItem.reference);
        
        if (foundMatchRoutes) {
          toast({
            title: "Match trouvé",
            description: `${foundItem.reference} affiché avec les trajets client (bleu) et déménageur (rouge)`,
          });
        } else {
          toast({
            title: "Référence trouvée",
            description: `${foundItem.reference} affiché sur la carte`,
          });
        }
      } else {
        console.log('❌ Référence non trouvée:', cleanRef);
        toast({
          title: "Référence non trouvée",
          description: `Aucun élément trouvé pour la référence ${cleanRef}`,
          variant: "destructive",
        });
        setSelectedItem(null);
        setMatchRoutes(null);
      }
    } catch (error) {
      console.error('❌ Error searching by reference:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rechercher la référence",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearFilter = () => {
    setReferenceFilter('');
    setSelectedItem(null);
    setMatchRoutes(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchByReference();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Map className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Carte des trajets</h1>
          </div>
          {selectedItem && (
            <Button variant="outline" onClick={clearFilter}>
              <X className="h-4 w-4 mr-2" />
              Effacer la sélection
            </Button>
          )}
        </div>

        {/* Interface de recherche par référence */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Search className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Rechercher par référence</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Saisissez CLI-000001, TRJ-000001 ou MTH-000001..."
                value={referenceFilter}
                onChange={(e) => setReferenceFilter(e.target.value)}
                onKeyPress={handleKeyPress}
                className="h-12 text-base"
              />
              <p className="text-sm text-gray-500 mt-2">
                Formats acceptés : CLI-XXXXXX (clients), TRJ-XXXXXX (trajets), MTH-XXXXXX (matchs)
              </p>
              {selectedItem?.type === 'match' && (
                <p className="text-sm text-blue-600 mt-1">
                  Les matchs affichent le trajet client (bleu) et le trajet déménageur (rouge)
                </p>
              )}
            </div>
            
            <Button 
              onClick={searchByReference}
              disabled={loading || referenceFilter.length < 3}
              className="h-12 px-6"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Recherche...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Rechercher
                </>
              )}
            </Button>
          </div>

          {/* Résultat de la recherche */}
          {selectedItem && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 font-medium">
                    {selectedItem.reference}
                  </Badge>
                  <div>
                    <span className="font-medium text-gray-900">{selectedItem.name}</span>
                    <div className="text-sm text-gray-600">
                      {selectedItem.details} • {selectedItem.date}
                    </div>
                    {selectedItem.type === 'match' && (
                      <div className="text-sm text-blue-600 mt-1 flex items-center space-x-4">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-600 rounded-full mr-1"></div>
                          <span>Trajet Client</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-600 rounded-full mr-1"></div>
                          <span>Trajet Déménageur</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <Button variant="ghost" onClick={clearFilter} size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Affichage de la carte */}
        {selectedItem ? (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold text-lg mb-4 text-gray-800">
              Trajet: {selectedItem.reference}
              {selectedItem.type === 'match' && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  (Client en bleu, Déménageur en rouge)
                </span>
              )}
            </h3>
            {matchRoutes ? (
              <MatchRoutesGoogleMap matchRoutes={matchRoutes} />
            ) : selectedItem.departure_postal_code && selectedItem.arrival_postal_code ? (
              <SingleRouteGoogleMap item={selectedItem} />
            ) : (
              <div className="h-96 bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-center">
                  <Map className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Données incomplètes</h3>
                  <p className="text-gray-500 mb-1">Impossible d'afficher la carte pour {selectedItem.reference}</p>
                  <p className="text-sm text-gray-400">
                    Codes postaux de départ et d'arrivée requis
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-96 bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
            <div className="text-center">
              <Map className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun trajet sélectionné</h3>
              <p className="text-gray-500 mb-1">Utilisez la recherche ci-dessus pour afficher un trajet</p>
              <p className="text-sm text-gray-400">
                Les matchs (MTH-XXXXXX) affichent les trajets client et déménageur
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MapView;
