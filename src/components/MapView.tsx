
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Map, Search, X } from 'lucide-react';
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

const MapView = () => {
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Map className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Carte</h2>
        </div>
        {selectedItem && (
          <Button variant="outline" onClick={clearFilter}>
            <X className="h-4 w-4 mr-2" />
            Effacer
          </Button>
        )}
      </div>

      {/* Filtre de recherche par référence */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher par référence
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="CLI-000001, TRJ-000001, MTH-000001..."
                value={referenceFilter}
                onChange={(e) => setReferenceFilter(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 border-blue-300 focus:border-blue-500"
              />
            </div>
          </div>
          <Button 
            onClick={searchByReference}
            disabled={loading || referenceFilter.length < 3}
            className="mt-6"
          >
            {loading ? 'Recherche...' : 'Rechercher'}
          </Button>
        </div>

        {selectedItem && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Badge className="bg-blue-100 text-blue-800">
                {selectedItem.reference}
              </Badge>
              <div>
                <span className="font-medium">{selectedItem.name}</span>
                <div className="text-sm text-gray-500">
                  {selectedItem.details} • {selectedItem.date}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Affichage de la carte */}
      {selectedItem && selectedItem.type === 'move' && selectedItem.departure_postal_code && selectedItem.arrival_postal_code ? (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold mb-4">Trajet: {selectedItem.reference}</h3>
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
      ) : selectedItem && (selectedItem.type === 'client' || selectedItem.type === 'match') && selectedItem.departure_postal_code && selectedItem.arrival_postal_code ? (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold mb-4">
            {selectedItem.type === 'client' ? 'Demande client' : 'Match'}: {selectedItem.reference}
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
        <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
          <div className="text-center">
            <Map className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Recherchez par référence pour afficher un trajet</p>
            <p className="text-sm text-gray-400 mt-1">
              Saisissez une référence (CLI-XXXXXX, TRJ-XXXXXX, MTH-XXXXXX)
            </p>
          </div>
        </div>
      ) : (
        <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
          <div className="text-center">
            <Map className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Impossible d'afficher la carte</p>
            <p className="text-sm text-gray-400 mt-1">
              Données d'adresse manquantes pour {selectedItem.reference}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MapView;
