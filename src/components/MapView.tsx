
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Map, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MapSearchEngine, SearchResult, MatchRoutes } from './MapView/SearchLogic';
import { GoogleMapsService } from './MapView/GoogleMapsService';

const MapView = () => {
  const { toast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  
  const [referenceFilter, setReferenceFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [matchRoutes, setMatchRoutes] = useState<MatchRoutes | null>(null);
  const [loading, setLoading] = useState(false);

  const initializeMap = async () => {
    if (!mapRef.current || mapInstance.current) return;

    try {
      mapInstance.current = await GoogleMapsService.initializeMap(mapRef.current);
    } catch (error) {
      console.error('❌ Erreur initialisation carte:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'initialiser la carte",
        variant: "destructive",
      });
    }
  };

  const displayOnMap = async (item: SearchResult, routes: MatchRoutes | null) => {
    if (!mapInstance.current) {
      await initializeMap();
    }

    if (!mapInstance.current) {
      throw new Error('Carte non initialisée');
    }

    try {
      if (routes) {
        // Afficher un match avec 2 trajets
        await GoogleMapsService.displayMatchRoutes(mapInstance.current, {
          client: {
            departure_postal_code: routes.client.departure_postal_code,
            arrival_postal_code: routes.client.arrival_postal_code,
            departure_city: routes.client.departure_city,
            arrival_city: routes.client.arrival_city,
            name: routes.client.name
          },
          move: {
            departure_postal_code: routes.move.departure_postal_code,
            arrival_postal_code: routes.move.arrival_postal_code,
            departure_city: routes.move.departure_city,
            arrival_city: routes.move.arrival_city,
            company_name: routes.move.company_name
          }
        });
      } else if (item.departure_postal_code && item.arrival_postal_code) {
        // Afficher un trajet simple
        await GoogleMapsService.displaySingleRoute(mapInstance.current, {
          departure_postal_code: item.departure_postal_code,
          arrival_postal_code: item.arrival_postal_code,
          departure_city: item.departure_city,
          arrival_city: item.arrival_city
        });
      } else {
        throw new Error('Données de trajet incomplètes');
      }
    } catch (error) {
      console.error('❌ Erreur affichage carte:', error);
      throw error;
    }
  };

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
    console.log(`🔍 RECHERCHE: ${referenceFilter}`);

    try {
      const result = await MapSearchEngine.searchByReference(referenceFilter);

      if (result.error) {
        toast({
          title: "Erreur de recherche",
          description: result.error,
          variant: "destructive",
        });
        setSelectedItem(null);
        setMatchRoutes(null);
        return;
      }

      if (!result.item) {
        toast({
          title: "Référence non trouvée",
          description: `Aucun élément trouvé pour la référence ${referenceFilter}`,
          variant: "destructive",
        });
        setSelectedItem(null);
        setMatchRoutes(null);
        return;
      }

      // Afficher sur la carte
      await displayOnMap(result.item, result.matchRoutes);

      setSelectedItem(result.item);
      setMatchRoutes(result.matchRoutes);

      const typeLabel = result.item.type === 'match' ? 'Match' : 
                       result.item.type === 'client' ? 'Client' : 'Trajet';
      
      toast({
        title: `${typeLabel} trouvé`,
        description: `${result.item.reference} affiché sur la carte`,
      });

    } catch (error) {
      console.error('❌ ERREUR GLOBALE:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur de recherche",
        variant: "destructive",
      });
      setSelectedItem(null);
      setMatchRoutes(null);
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

        {/* Interface de recherche */}
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
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">
            {selectedItem ? (
              <>
                Trajet: {selectedItem.reference}
                {selectedItem.type === 'match' && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    (Client en bleu, Déménageur en rouge)
                  </span>
                )}
              </>
            ) : (
              'Carte des trajets'
            )}
          </h3>
          <div ref={mapRef} className="h-96 w-full rounded-lg border" />
          {!selectedItem && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <Map className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun trajet sélectionné</h3>
                <p className="text-gray-500 mb-1">Utilisez la recherche ci-dessus pour afficher un trajet</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default MapView;
