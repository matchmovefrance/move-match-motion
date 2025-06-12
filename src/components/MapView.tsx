
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Map, Filter, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FilteredItem {
  id: number;
  type: 'client' | 'move' | 'match';
  reference: string;
  name: string;
  date: string;
  details: string;
}

const MapView = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [filteredItems, setFilteredItems] = useState<FilteredItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<FilteredItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchItems();
    } else {
      setFilteredItems([]);
    }
  }, [searchTerm, typeFilter]);

  const searchItems = async () => {
    setLoading(true);
    try {
      let items: FilteredItem[] = [];

      // Rechercher dans les clients
      if (typeFilter === 'all' || typeFilter === 'client') {
        const { data: clients, error: clientError } = await supabase
          .from('client_requests')
          .select('id, name, desired_date, departure_postal_code, arrival_postal_code')
          .or(`name.ilike.%${searchTerm}%,departure_postal_code.ilike.%${searchTerm}%,arrival_postal_code.ilike.%${searchTerm}%`)
          .limit(10);

        if (!clientError && clients) {
          items.push(...clients.map(client => ({
            id: client.id,
            type: 'client' as const,
            reference: `CLI-${String(client.id).padStart(6, '0')}`,
            name: client.name || 'Client',
            date: client.desired_date ? new Date(client.desired_date).toLocaleDateString('fr-FR') : '',
            details: `${client.departure_postal_code} → ${client.arrival_postal_code}`
          })));
        }
      }

      // Rechercher dans les trajets
      if (typeFilter === 'all' || typeFilter === 'move') {
        const { data: moves, error: moveError } = await supabase
          .from('confirmed_moves')
          .select('id, company_name, departure_date, departure_postal_code, arrival_postal_code')
          .or(`company_name.ilike.%${searchTerm}%,departure_postal_code.ilike.%${searchTerm}%,arrival_postal_code.ilike.%${searchTerm}%`)
          .limit(10);

        if (!moveError && moves) {
          items.push(...moves.map(move => ({
            id: move.id,
            type: 'move' as const,
            reference: `TRJ-${String(move.id).padStart(6, '0')}`,
            name: move.company_name || 'Déménageur',
            date: move.departure_date ? new Date(move.departure_date).toLocaleDateString('fr-FR') : '',
            details: `${move.departure_postal_code} → ${move.arrival_postal_code}`
          })));
        }
      }

      // Rechercher dans les matchs
      if (typeFilter === 'all' || typeFilter === 'match') {
        const { data: matches, error: matchError } = await supabase
          .from('move_matches')
          .select(`
            id,
            created_at,
            client_request:client_requests(name, departure_postal_code, arrival_postal_code),
            confirmed_move:confirmed_moves(company_name, departure_postal_code, arrival_postal_code)
          `)
          .limit(10);

        if (!matchError && matches) {
          const filteredMatches = matches.filter(match => {
            const clientRequest = Array.isArray(match.client_request) ? match.client_request[0] : match.client_request;
            const confirmedMove = Array.isArray(match.confirmed_move) ? match.confirmed_move[0] : match.confirmed_move;
            
            const matchRef = `MTH-${String(match.id).padStart(6, '0')}`;
            const clientName = clientRequest?.name || '';
            const moveName = confirmedMove?.company_name || '';
            
            return matchRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   moveName.toLowerCase().includes(searchTerm.toLowerCase());
          });

          items.push(...filteredMatches.map(match => {
            const clientRequest = Array.isArray(match.client_request) ? match.client_request[0] : match.client_request;
            const confirmedMove = Array.isArray(match.confirmed_move) ? match.confirmed_move[0] : match.confirmed_move;
            
            return {
              id: match.id,
              type: 'match' as const,
              reference: `MTH-${String(match.id).padStart(6, '0')}`,
              name: `${clientRequest?.name || 'Client'} ↔ ${confirmedMove?.company_name || 'Déménageur'}`,
              date: match.created_at ? new Date(match.created_at).toLocaleDateString('fr-FR') : '',
              details: `${clientRequest?.departure_postal_code || ''} → ${clientRequest?.arrival_postal_code || ''}`
            };
          }));
        }
      }

      setFilteredItems(items);
    } catch (error) {
      console.error('Error searching items:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rechercher les éléments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToMap = (item: FilteredItem) => {
    if (!selectedItems.find(selected => selected.id === item.id && selected.type === item.type)) {
      setSelectedItems([...selectedItems, item]);
      toast({
        title: "Ajouté à la carte",
        description: `${item.reference} ajouté à la visualisation`,
      });
    }
  };

  const removeFromMap = (item: FilteredItem) => {
    setSelectedItems(selectedItems.filter(selected => !(selected.id === item.id && selected.type === item.type)));
  };

  const clearAllFilters = () => {
    setSelectedItems([]);
    setSearchTerm('');
    setFilteredItems([]);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'client': return 'bg-green-100 text-green-800';
      case 'move': return 'bg-blue-100 text-blue-800';
      case 'match': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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
        {selectedItems.length > 0 && (
          <Button variant="outline" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-2" />
            Effacer filtres ({selectedItems.length})
          </Button>
        )}
      </div>

      {/* Filtres de recherche */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher par référence, nom, ou code postal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="client">Clients</SelectItem>
              <SelectItem value="move">Trajets</SelectItem>
              <SelectItem value="match">Matchs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Résultats de recherche */}
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {filteredItems.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <Badge className={getTypeColor(item.type)}>
                    {item.reference}
                  </Badge>
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <div className="text-sm text-gray-500">
                      {item.details} • {item.date}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addToMap(item)}
                  disabled={selectedItems.some(selected => selected.id === item.id && selected.type === item.type)}
                >
                  {selectedItems.some(selected => selected.id === item.id && selected.type === item.type) ? 'Ajouté' : 'Ajouter'}
                </Button>
              </div>
            ))}
          </div>
        ) : searchTerm.length >= 2 ? (
          <div className="text-center py-4 text-gray-500">
            Aucun résultat trouvé
          </div>
        ) : null}
      </div>

      {/* Éléments sélectionnés */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Éléments affichés sur la carte ({selectedItems.length})</h3>
          <div className="flex flex-wrap gap-2">
            {selectedItems.map((item) => (
              <Badge
                key={`selected-${item.type}-${item.id}`}
                variant="secondary"
                className="flex items-center space-x-1"
              >
                <span>{item.reference}</span>
                <button
                  onClick={() => removeFromMap(item)}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Placeholder pour la carte */}
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center">
          <Map className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Carte interactive</p>
          <p className="text-sm text-gray-400 mt-1">
            {selectedItems.length === 0 ? 'Utilisez les filtres ci-dessus pour afficher des éléments' : 
             `${selectedItems.length} élément(s) sélectionné(s) pour affichage`}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default MapView;
