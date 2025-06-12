
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Map, Search, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import GoogleMapRoute from './GoogleMapRoute';

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

const GoogleMap = () => {
  const { toast } = useToast();
  const [referenceFilter, setReferenceFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState<FilteredItem | null>(null);
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

      // Rechercher dans les clients
      if (cleanRef.startsWith('CLI-')) {
        const id = parseInt(cleanRef.replace('CLI-', ''));
        if (!isNaN(id)) {
          const { data: client, error } = await supabase
            .from('client_requests')
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
          }
        }
      }

      // Rechercher dans les trajets
      if (!foundItem && cleanRef.startsWith('TRJ-')) {
        const id = parseInt(cleanRef.replace('TRJ-', ''));
        if (!isNaN(id)) {
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
              client_request:client_requests(name, departure_postal_code, arrival_postal_code, departure_city, arrival_city),
              confirmed_move:confirmed_moves(company_name, departure_postal_code, arrival_postal_code, departure_city, arrival_city)
            `)
            .eq('id', id)
            .single();

          if (!error && match) {
            const clientRequest = Array.isArray(match.client_request) ? match.client_request[0] : match.client_request;
            const confirmedMove = Array.isArray(match.confirmed_move) ? match.confirmed_move[0] : match.confirmed_move;
            
            foundItem = {
              id: match.id,
              type: 'match',
              reference: `MTH-${String(match.id).padStart(6, '0')}`,
              name: `${clientRequest?.name || 'Client'} ↔ ${confirmedMove?.company_name || 'Déménageur'}`,
              date: match.created_at ? new Date(match.created_at).toLocaleDateString('fr-FR') : '',
              details: `${clientRequest?.departure_postal_code || ''} → ${clientRequest?.arrival_postal_code || ''}`,
              departure_postal_code: clientRequest?.departure_postal_code,
              arrival_postal_code: clientRequest?.arrival_postal_code,
              departure_city: clientRequest?.departure_city,
              arrival_city: clientRequest?.arrival_city,
              company_name: confirmedMove?.company_name
            };
          }
        }
      }

      if (foundItem) {
        setSelectedItem(foundItem);
        toast({
          title: "Référence trouvée",
          description: `${foundItem.reference} affiché sur la carte`,
        });
      } else {
        toast({
          title: "Référence non trouvée",
          description: `Aucun élément trouvé pour la référence ${cleanRef}`,
          variant: "destructive",
        });
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Error searching by reference:', error);
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
            <Filter className="h-5 w-5 text-blue-600" />
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
        {selectedItem && selectedItem.departure_postal_code && selectedItem.arrival_postal_code ? (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold text-lg mb-4 text-gray-800">
              Trajet: {selectedItem.reference}
            </h3>
            <GoogleMapRoute 
              move={{
                departure_postal_code: selectedItem.departure_postal_code,
                arrival_postal_code: selectedItem.arrival_postal_code,
                departure_city: selectedItem.departure_city || '',
                arrival_city: selectedItem.arrival_city || '',
                company_name: selectedItem.company_name || selectedItem.name
              }}
            />
          </div>
        ) : !selectedItem ? (
          <div className="h-96 bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
            <div className="text-center">
              <Map className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun trajet sélectionné</h3>
              <p className="text-gray-500 mb-1">Utilisez la recherche ci-dessus pour afficher un trajet</p>
              <p className="text-sm text-gray-400">
                Exemples : CLI-000001, TRJ-000001, MTH-000001
              </p>
            </div>
          </div>
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
      </motion.div>
    </div>
  );
};

export default GoogleMap;
