import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Truck, MapPin, Calendar, Volume2, Edit, Trash2, User, Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListView } from '@/components/ui/list-view';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import MoveForm from './MoveForm';
import DateFilter from './DateFilter';

interface Move {
  id: number;
  mover_name: string | null;
  company_name: string | null;
  truck_identifier: string | null;
  departure_address: string | null;
  departure_city: string;
  departure_postal_code: string;
  departure_country: string | null;
  arrival_address: string | null;
  arrival_city: string;
  arrival_postal_code: string;
  arrival_country: string | null;
  departure_date: string;
  max_volume: number | null;
  used_volume: number;
  available_volume: number;
  status: 'pending' | 'confirmed' | 'completed';
  price_per_m3: number | null;
  total_price: number | null;
  description: string | null;
  special_requirements: string | null;
  access_conditions: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  created_at: string;
}

const MoveManagement = () => {
  const { user } = useAuth();
  const [moves, setMoves] = useState<Move[]>([]);
  const [filteredMoves, setFilteredMoves] = useState<Move[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMove, setEditingMove] = useState<Move | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMoves();
  }, []);

  useEffect(() => {
    setFilteredMoves(moves);
  }, [moves]);

  const fetchMoves = async () => {
    try {
      const { data, error } = await supabase
        .from('confirmed_moves')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Calculer le volume disponible et s'assurer que le status est compatible
      const movesWithCalculatedVolume = (data || []).map(move => ({
        ...move,
        available_volume: (move.max_volume || 0) - (move.used_volume || 0),
        status: (move.status as 'pending' | 'confirmed' | 'completed') || 'confirmed'
      }));
      
      setMoves(movesWithCalculatedVolume);
    } catch (error) {
      console.error('Error fetching moves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = (filteredData: Move[]) => {
    setFilteredMoves(filteredData);
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      // Convertir les valeurs string en nombres appropriés et nettoyer les champs
      const processedData = {
        ...formData,
        max_volume: formData.max_volume && formData.max_volume !== '' ? parseFloat(formData.max_volume) : null,
        used_volume: formData.used_volume && formData.used_volume !== '' ? parseFloat(formData.used_volume) : 0,
        price_per_m3: formData.price_per_m3 && formData.price_per_m3 !== '' ? parseFloat(formData.price_per_m3) : null,
        total_price: formData.total_price && formData.total_price !== '' ? parseFloat(formData.total_price) : null,
        max_weight: formData.max_weight && formData.max_weight !== '' ? parseFloat(formData.max_weight) : null,
        base_rate: formData.base_rate && formData.base_rate !== '' ? parseFloat(formData.base_rate) : null,
        fuel_surcharge: formData.fuel_surcharge && formData.fuel_surcharge !== '' ? parseFloat(formData.fuel_surcharge) : null,
        additional_fees: formData.additional_fees && formData.additional_fees !== '' ? parseFloat(formData.additional_fees) : null,
        total_cost: formData.total_cost && formData.total_cost !== '' ? parseFloat(formData.total_cost) : null,
        // Nettoyer les champs time
        departure_time: formData.departure_time && formData.departure_time !== '' ? formData.departure_time : null,
        arrival_time: formData.arrival_time && formData.arrival_time !== '' ? formData.arrival_time : null,
        estimated_arrival_time: formData.estimated_arrival_time && formData.estimated_arrival_time !== '' ? formData.estimated_arrival_time : null,
        // Nettoyer les champs date
        estimated_arrival_date: formData.estimated_arrival_date && formData.estimated_arrival_date !== '' ? formData.estimated_arrival_date : null,
      };

      // Supprimer available_volume car c'est une colonne générée
      delete processedData.available_volume;

      console.log('Processed data before save:', processedData);

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
        // Supprimer les champs mover_id et truck_id qui causent la contrainte de clé étrangère
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

      setShowAddForm(false);
      setEditingMove(null);
      fetchMoves();
    } catch (error: any) {
      console.error('Error saving move:', error);
      toast({
        title: "Erreur",
        description: `Impossible de sauvegarder le déménagement: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const deleteMove = async (id: number) => {
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
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-2">
            {move.company_name || 'Entreprise non renseignée'} - {move.mover_name || 'Déménageur non renseigné'}
          </h3>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <span>{move.departure_postal_code} {move.departure_city} → {move.arrival_postal_code} {move.arrival_city}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span>{new Date(move.departure_date).toLocaleDateString('fr-FR')}</span>
            </div>
            {move.max_volume && (
              <div className="flex items-center space-x-2">
                <Volume2 className="h-4 w-4 text-orange-600" />
                <span>Volume: {move.used_volume}m³ / {move.max_volume}m³ (Disponible: {move.available_volume}m³)</span>
              </div>
            )}
            {move.total_price && (
              <div className="flex items-center space-x-2">
                <Euro className="h-4 w-4 text-green-600" />
                <span>{move.total_price}€</span>
              </div>
            )}
            {move.contact_phone && (
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-blue-600" />
                <span>{move.contact_phone}</span>
              </div>
            )}
          </div>
          
          <div className="mt-3">
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
              move.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              move.status === 'confirmed' ? 'bg-green-100 text-green-800' :
              move.status === 'completed' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {move.status === 'pending' ? 'En attente' : 
               move.status === 'confirmed' ? 'Confirmé' :
               move.status === 'completed' ? 'Terminé' : move.status}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingMove(move)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer le déménagement</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer le déménagement de {move.company_name || 'cette entreprise'} ? 
                  Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMove(move.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </motion.div>
  );

  const renderMoveListItem = (move: Move) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex-1">
        <div className="flex items-center space-x-4">
          <div>
            <h4 className="font-medium text-gray-800">{move.company_name || 'Entreprise non renseignée'}</h4>
            <p className="text-sm text-gray-600">{move.mover_name || 'Déménageur non renseigné'}</p>
          </div>
          <div className="text-sm text-gray-500">
            <span>{move.departure_city} → {move.arrival_city}</span>
          </div>
          <div className="text-sm text-gray-500">
            <span>{new Date(move.departure_date).toLocaleDateString('fr-FR')}</span>
          </div>
          {move.available_volume && (
            <div className="text-sm text-gray-500">
              <span>{move.available_volume}m³ disponible</span>
            </div>
          )}
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            move.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            move.status === 'confirmed' ? 'bg-green-100 text-green-800' :
            move.status === 'completed' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {move.status === 'pending' ? 'En attente' : 
             move.status === 'confirmed' ? 'Confirmé' :
             move.status === 'completed' ? 'Terminé' : move.status}
          </div>
        </div>
      </div>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditingMove(move)}
        >
          <Edit className="h-3 w-3" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer le déménagement</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le déménagement de {move.company_name || 'cette entreprise'} ? 
                Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMove(move.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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

  if (showAddForm || editingMove) {
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
              setShowAddForm(false);
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
            max_volume: editingMove.max_volume?.toString() || '',
            used_volume: editingMove.used_volume?.toString() || '',
            available_volume: editingMove.available_volume?.toString() || '',
            price_per_m3: editingMove.price_per_m3?.toString() || '',
            total_price: editingMove.total_price?.toString() || ''
          } : undefined}
          isEditing={!!editingMove}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Truck className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Déménagements</h2>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un déménagement
        </Button>
      </div>

      <DateFilter 
        data={moves} 
        onFilter={handleDateFilter}
        dateField="departure_date"
        label="Filtrer par date de départ"
      />

      <ListView
        items={filteredMoves}
        searchFields={['company_name', 'mover_name', 'departure_city', 'arrival_city']}
        renderCard={renderMoveCard}
        renderListItem={renderMoveListItem}
        searchPlaceholder="Rechercher par entreprise, déménageur ou ville..."
        emptyStateMessage="Aucun déménagement trouvé"
        emptyStateIcon={<Truck className="h-12 w-12 text-gray-400 mx-auto" />}
        itemsPerPage={10}
      />
    </div>
  );
};

export default MoveManagement;
