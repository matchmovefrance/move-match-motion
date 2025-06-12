
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Map, Search, X, Filter, Plus, Trash2 } from 'lucide-react';
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

// Composant pour afficher plusieurs routes
const MultipleRoutesGoogleMap = ({ items }: { items: FilteredItem[] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRenderers = useRef<google.maps.DirectionsRenderer[]>([]);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      // Attendre que Google Maps soit disponible
      if (!window.google || !window.google.maps) {
        console.log('Google Maps pas encore chargé, attente...');
        return;
      }

      try {
        console.log('Initialisation de la carte pour plusieurs trajets:', items.length);
        
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
          
          if (!item.departure_postal_code || !item.arrival_postal_code) continue;

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
              },
              label: {
                text: item.reference,
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold'
              }
            });

            new google.maps.Marker({
              position: arrivalLocation,
              map: map,
              title: `${item.reference} - Arrivée: ${item.arrival_city || item.arrival_postal_code}`,
              icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new google.maps.Size(32, 32)
              },
              label: {
                text: item.reference,
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

        console.log('Carte multi-trajets initialisée avec succès');

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
      directionsRenderers.current.forEach(renderer => renderer.setMap(null));
      directionsRenderers.current = [];
    };
  }, [items]);

  return <div ref={mapRef} className="h-96 w-full rounded-lg border" />;
};

const GoogleMap = () => {
  const { toast } = useToast();
  const [referenceFilters, setReferenceFilters] = useState(['']);
  const [selectedItems, setSelectedItems] = useState<FilteredItem[]>([]);
  const [loading, setLoading] = useState(false);

  const addReferenceField = () => {
    if (referenceFilters.length < 8) {
      setReferenceFilters([...referenceFilters, '']);
    }
  };

  const removeReferenceField = (index: number) => {
    if (referenceFilters.length > 1) {
      const newFilters = referenceFilters.filter((_, i) => i !== index);
      setReferenceFilters(newFilters);
    }
  };

  const updateReferenceFilter = (index: number, value: string) => {
    const newFilters = [...referenceFilters];
    newFilters[index] = value;
    setReferenceFilters(newFilters);
  };

  const searchByReference = async (reference: string): Promise<FilteredItem | null> => {
    const cleanRef = reference.toUpperCase().trim();
    if (cleanRef.length < 3) return null;

    console.log('🔍 Recherche référence:', cleanRef);
    let foundItem: FilteredItem | null = null;

    // Rechercher dans les clients (format CLI-XXXXXX uniquement)
    if (cleanRef.startsWith('CLI-')) {
      const idStr = cleanRef.replace('CLI-', '');
      const id = parseInt(idStr);
      
      if (!isNaN(id)) {
        console.log('🔍 Recherche client ID:', id);
        
        const { data: client, error } = await supabase
          .from('clients')
          .select('id, name, desired_date, departure_postal_code, arrival_postal_code, departure_city, arrival_city')
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

    // Rechercher dans les matchs
    if (!foundItem && cleanRef.startsWith('MTH-')) {
      const id = parseInt(cleanRef.replace('MTH-', ''));
      if (!isNaN(id)) {
        const { data: match, error } = await supabase
          .from('move_matches')
          .select(`
            id,
            created_at,
            client:clients(name, departure_postal_code, arrival_postal_code, departure_city, arrival_city),
            confirmed_move:confirmed_moves(company_name, departure_postal_code, arrival_postal_code, departure_city, arrival_city)
          `)
          .eq('id', id)
          .single();

        if (!error && match) {
          const client = Array.isArray(match.client) ? match.client[0] : match.client;
          const confirmedMove = Array.isArray(match.confirmed_move) ? match.confirmed_move[0] : match.confirmed_move;
          
          foundItem = {
            id: match.id,
            type: 'match',
            reference: `MTH-${String(match.id).padStart(6, '0')}`,
            name: `${client?.name || 'Client'} ↔ ${confirmedMove?.company_name || 'Déménageur'}`,
            date: match.created_at ? new Date(match.created_at).toLocaleDateString('fr-FR') : '',
            details: `${client?.departure_postal_code || ''} → ${client?.arrival_postal_code || ''}`,
            departure_postal_code: client?.departure_postal_code,
            arrival_postal_code: client?.arrival_postal_code,
            departure_city: client?.departure_city,
            arrival_city: client?.arrival_city,
            company_name: confirmedMove?.company_name
          };
        }
      }
    }

    return foundItem;
  };

  const searchAllReferences = async () => {
    const validReferences = referenceFilters.filter(ref => ref.trim().length >= 3);
    
    if (validReferences.length === 0) {
      toast({
        title: "Aucune référence valide",
        description: "Veuillez saisir au moins une référence valide (3 caractères minimum)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const searchPromises = validReferences.map(ref => searchByReference(ref));
      const results = await Promise.all(searchPromises);
      
      const foundItems = results
        .filter((item): item is FilteredItem => item !== null)
        .map((item, index) => ({
          ...item,
          color: ROUTE_COLORS[index % ROUTE_COLORS.length]
        }));

      if (foundItems.length > 0) {
        setSelectedItems(foundItems);
        toast({
          title: `${foundItems.length} référence(s) trouvée(s)`,
          description: `${foundItems.map(item => item.reference).join(', ')} affichés sur la carte`,
        });
      } else {
        toast({
          title: "Aucune référence trouvée",
          description: "Aucun élément trouvé pour les références saisies",
          variant: "destructive",
        });
        setSelectedItems([]);
      }
    } catch (error) {
      console.error('Error searching references:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rechercher les références",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setReferenceFilters(['']);
    setSelectedItems([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchAllReferences();
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
          {selectedItems.length > 0 && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Effacer toutes les sélections
            </Button>
          )}
        </div>

        {/* Interface de recherche par référence */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Filter className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Rechercher par références multiples</h2>
            <Button variant="outline" size="sm" onClick={addReferenceField}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>
          
          <div className="space-y-3">
            {referenceFilters.map((filter, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    placeholder={`Référence ${index + 1}: CLI-000001, TRJ-000001 ou MTH-000001...`}
                    value={filter}
                    onChange={(e) => updateReferenceFilter(index, e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="h-10"
                  />
                </div>
                {referenceFilters.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeReferenceField(index)}
                    className="h-10 px-3"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              Formats acceptés : CLI-XXXXXX (clients), TRJ-XXXXXX (trajets), MTH-XXXXXX (matchs)
            </p>
            
            <Button 
              onClick={searchAllReferences}
              disabled={loading}
              className="px-6"
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

          {/* Résultats de la recherche */}
          {selectedItems.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-medium text-gray-800">Références trouvées :</h3>
              <div className="flex flex-wrap gap-2">
                {selectedItems.map((item) => (
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
        </div>

        {/* Affichage de la carte */}
        {selectedItems.length > 0 && selectedItems.some(item => item.departure_postal_code && item.arrival_postal_code) ? (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold text-lg mb-4 text-gray-800">
              Carte des trajets ({selectedItems.length} trajet{selectedItems.length > 1 ? 's' : ''})
            </h3>
            <MultipleRoutesGoogleMap items={selectedItems} />
          </div>
        ) : selectedItems.length === 0 ? (
          <div className="h-96 bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
            <div className="text-center">
              <Map className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun trajet sélectionné</h3>
              <p className="text-gray-500 mb-1">Utilisez la recherche ci-dessus pour afficher plusieurs trajets</p>
              <p className="text-sm text-gray-400">
                Vous pouvez chercher jusqu'à 8 références simultanément
              </p>
            </div>
          </div>
        ) : (
          <div className="h-96 bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
            <div className="text-center">
              <Map className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Données incomplètes</h3>
              <p className="text-gray-500 mb-1">Certaines références n'ont pas de données d'adresse complètes</p>
              <p className="text-sm text-gray-400">
                Codes postaux de départ et d'arrivée requis pour l'affichage
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default GoogleMap;
