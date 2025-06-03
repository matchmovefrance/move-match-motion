
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Truck, MapPin, Calendar, Volume2, Edit, Trash2, Users } from 'lucide-react';
import { ListView } from '@/components/ui/list-view';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import MoveForm from './MoveForm';

interface Move {
  id: number;
  mover_name: string;
  company_name: string;
  truck_identifier: string;
  departure_date: string;
  departure_address: string;
  departure_city: string;
  departure_postal_code: string;
  departure_country: string;
  arrival_address: string;
  arrival_city: string;
  arrival_postal_code: string;
  arrival_country: string;
  max_volume: number;
  used_volume: number;
  available_volume?: number;
  description: string;
  special_requirements: string;
  access_conditions: string;
  price_per_m3: number;
  total_price: number;
  contact_phone: string;
  contact_email: string;
  status: 'confirmed' | 'pending' | 'completed';
  status_custom?: string;
  created_at: string;
}

const MoveManagement = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingMove, setEditingMove] = useState<Move | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMoves();
  }, []);

  const fetchMoves = async () => {
    try {
      const { data, error } = await supabase
        .from('confirmed_moves')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const movesWithCalculations = (data || []).map(move => ({
        ...move,
        available_volume: move.max_volume - move.used_volume
      }));
      
      setMoves(movesWithCalculations);
    } catch (error) {
      console.error('Error fetching moves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      // Convert string values to appropriate types
      const processedData = {
        ...formData,
        max_volume: parseFloat(formData.max_volume) || 0,
        used_volume: parseFloat(formData.used_volume) || 0,
        price_per_m3: parseFloat(formData.price_per_m3) || 0,
        total_price: parseFloat(formData.total_price) || 0
      };

      if (editingMove) {
        const { error } = await supabase
          .from('confirmed_moves')
          .update(processedData)
          .eq('id', editingMove.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Déménagement mis à jour avec succès",
        });
      } else {
        const { error } = await supabase
          .from('confirmed_moves')
          .insert({
            ...processedData,
            created_by: user?.id
          });

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Déménagement ajouté avec succès",
        });
      }

      setShowForm(false);
      setEditingMove(null);
      fetchMoves();
    } catch (error: any) {
      console.error('Error saving move:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le déménagement",
        variant: "destructive",
      });
    }
  };

  const deleteMove = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce déménagement ?')) return;

    try {
      const { error } = await supabase
        .from('confirmed_moves')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Déménagement supprimé avec succès",
      });

      fetchMoves();
    } catch (error: any) {
      console.error('Error deleting move:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le déménagement",
        variant: "destructive",
      });
    }
  };

  const renderMoveCard = (move: Move) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300"
    >
      <div className="relative p-4 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="absolute top-4 right-4">
          <span className={`bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium`}>
            {move.status_custom || move.status}
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{move.company_name}</h3>
            <p className="text-sm text-gray-500">{move.truck_identifier}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center space-x-2 text-gray-600">
          <Users className="h-4 w-4" />
          <span className="text-sm">{move.mover_name}</span>
        </div>

        <div className="flex items-center space-x-2 text-gray-600">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">{new Date(move.departure_date).toLocaleDateString('fr-FR')}</span>
        </div>

        <div className="flex items-center space-x-2 text-gray-600">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">{move.departure_city} → {move.arrival_city}</span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600">Volume utilisé</span>
            </div>
            <span className="text-sm font-medium text-gray-800">
              {move.used_volume}m³ / {move.max_volume}m³
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(move.used_volume / move.max_volume) * 100}%` }}
              transition={{ duration: 0.8 }}
              className={`h-full rounded-full ${
                (move.used_volume / move.max_volume) > 0.9 
                  ? 'bg-red-500' 
                  : (move.used_volume / move.max_volume) > 0.7 
                  ? 'bg-yellow-500' 
                  : 'bg-green-500'
              }`}
            />
          </div>
        </div>

        <div className="flex space-x-2 pt-2">
          <button 
            onClick={() => setEditingMove(move)}
            className="flex-1 flex items-center justify-center space-x-1 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Edit className="h-4 w-4" />
            <span className="text-sm">Modifier</span>
          </button>
          <button 
            onClick={() => deleteMove(move.id)}
            className="flex items-center justify-center p-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderMoveListItem = (move: Move) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex-1">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Truck className="h-4 w-4 text-white" />
          </div>
          <div>
            <h4 className="font-medium text-gray-800">{move.company_name}</h4>
            <p className="text-sm text-gray-600">{move.truck_identifier}</p>
          </div>
          <div className="text-sm text-gray-500">
            <span>{move.departure_city} → {move.arrival_city}</span>
          </div>
          <div className="text-sm text-gray-500">
            <span>{new Date(move.departure_date).toLocaleDateString('fr-FR')}</span>
          </div>
          <div className="text-sm text-gray-600">
            {move.used_volume}m³ / {move.max_volume}m³
          </div>
        </div>
      </div>
      <div className="flex space-x-2">
        <button 
          onClick={() => setEditingMove(move)}
          className="px-3 py-1 text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors text-sm"
        >
          <Edit className="h-3 w-3" />
        </button>
        <button 
          onClick={() => deleteMove(move.id)}
          className="px-3 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors text-sm"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showForm || editingMove) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Truck className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">
              {editingMove ? 'Modifier le déménagement' : 'Nouveau déménagement'}
            </h2>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setShowForm(false);
              setEditingMove(null);
            }}
          >
            Retour à la liste
          </Button>
        </div>
        
        <MoveForm
          onSubmit={handleFormSubmit}
          initialData={editingMove ? {
            ...editingMove,
            max_volume: editingMove.max_volume.toString(),
            used_volume: editingMove.used_volume.toString(),
            price_per_m3: editingMove.price_per_m3.toString(),
            total_price: editingMove.total_price.toString()
          } : undefined}
          isEditing={!!editingMove}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-800"
          >
            Gestion des Déménagements
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 mt-2"
          >
            Gérez les trajets confirmés et planifiez de nouveaux déménagements
          </motion.p>
        </div>
        
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow"
        >
          <Plus className="h-5 w-5" />
          <span>Nouveau trajet</span>
        </motion.button>
      </div>

      <ListView
        items={moves}
        searchFields={['company_name', 'mover_name', 'truck_identifier', 'departure_city', 'arrival_city', 'status']}
        renderCard={renderMoveCard}
        renderListItem={renderMoveListItem}
        searchPlaceholder="Rechercher par entreprise, déménageur, camion, ville ou statut..."
        emptyStateMessage="Aucun déménagement trouvé"
        emptyStateIcon={<Truck className="h-12 w-12 text-gray-400 mx-auto" />}
        itemsPerPage={9}
      />
    </div>
  );
};

export default MoveManagement;
