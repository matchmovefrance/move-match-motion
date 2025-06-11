import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Truck, MapPin, Calendar, Volume2, Edit, Trash2, Euro, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import StatusToggle from './StatusToggle';

interface ConfirmedMove {
  id: number;
  mover_name: string | null;
  company_name: string | null;
  departure_city: string;
  departure_postal_code: string;
  arrival_city: string;
  arrival_postal_code: string;
  departure_date: string;
  max_volume: number | null;
  used_volume: number;
  available_volume: number;
  price_per_m3: number | null;
  total_price: number | null;
  status: string;
  status_custom: string | null;
  route_type: string | null;
  created_at: string;
  created_by: string;
}

const MoveManagement = () => {
  const { user, profile } = useAuth();
  const [moves, setMoves] = useState<ConfirmedMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMove, setEditingMove] = useState<ConfirmedMove | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMoves();
  }, []);

  const fetchMoves = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching moves from database...', { userRole: profile?.role });
      
      let query = supabase.from('confirmed_moves').select('*');
      
      // Pour les admins et agents, voir toutes les données
      // Pour les autres rôles, voir seulement leurs propres données
      if (profile?.role !== 'admin' && user?.email !== 'contact@matchmove.fr' && user?.email !== 'pierre@matchmove.fr') {
        query = query.eq('created_by', user?.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching moves:', error);
        throw error;
      }
      
      console.log('✅ Moves fetched from DB:', data?.length || 0);
      setMoves(data || []);
    } catch (error) {
      console.error('Error fetching moves:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les déménagements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (moveId: number, newStatus: 'en_cours' | 'termine') => {
    try {
      const { error } = await supabase
        .from('confirmed_moves')
        .update({ status_custom: newStatus })
        .eq('id', moveId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Déménagement ${newStatus === 'termine' ? 'terminé' : 'remis en cours'}`,
      });

      fetchMoves();
    } catch (error) {
      console.error('Error updating move status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const handleFormSubmit = async (formData: any) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour effectuer cette action",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      console.log('📝 Form submission started:', { isEditing: !!editingMove, formData });

      // Validation des champs obligatoires
      const requiredFields = ['company_name', 'departure_city', 'arrival_city', 'departure_date'];
      const missingFields = requiredFields.filter(field => !formData[field] || String(formData[field]).trim() === '');
      if (missingFields.length > 0) {
        toast({
          title: "Erreur",
          description: `Les champs suivants sont obligatoires : ${missingFields.join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      // Préparation des données
      const processedData = {
        ...formData,
        created_by: user.id,
        max_volume: formData.max_volume ? parseFloat(formData.max_volume) : null,
        price_per_m3: formData.price_per_m3 ? parseFloat(formData.price_per_m3) : null,
        total_price: formData.total_price ? parseFloat(formData.total_price) : null,
        used_volume: formData.used_volume ? parseFloat(formData.used_volume) : 0,
        available_volume: formData.max_volume ? parseFloat(formData.max_volume) - (formData.used_volume ? parseFloat(formData.used_volume) : 0) : 0,
      };
      console.log('🧹 Processed data:', processedData);

      if (editingMove) {
        console.log('✏️ Updating existing move:', editingMove.id);
        
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
        console.log('➕ Creating new move');
        
        const { data, error } = await supabase
          .from('confirmed_moves')
          .insert(processedData)
          .select();

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Déménagement ajouté avec succès",
        });
      }

      setShowAddForm(false);
      setEditingMove(null);
      await fetchMoves();
      
    } catch (error: any) {
      console.error('❌ Error saving move:', error);
      toast({
        title: "Erreur",
        description: `Impossible de sauvegarder le déménagement: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteMove = async (moveId: number) => {
    if (!user) return;
    
    try {
      console.log('🗑️ Deleting move:', moveId);
      
      const { error } = await supabase
        .from('confirmed_moves')
        .delete()
        .eq('id', moveId);

      if (error) throw error;

      setMoves(prevMoves => prevMoves.filter(m => m.id !== moveId));

      toast({
        title: "Succès",
        description: "Déménagement supprimé avec succès",
      });

    } catch (error: any) {
      console.error('❌ Error deleting move:', error);
      toast({
        title: "Erreur",
        description: `Impossible de supprimer le déménagement: ${error.message}`,
        variant: "destructive",
      });
    }
  };

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
          initialData={editingMove}
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
          <h2 className="text-2xl font-bold text-gray-800">Déménagements confirmés</h2>
          <span className="text-sm text-gray-500">({moves.length} déménagements)</span>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un déménagement
        </Button>
      </div>

      <ListView
        items={moves}
        searchFields={['company_name', 'mover_name', 'departure_city', 'arrival_city']}
        renderCard={(move: ConfirmedMove) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-2">
                  {move.company_name || 'Déménageur non renseigné'}
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
                      <span>Volume max: {move.max_volume}m³ | Utilisé: {move.used_volume}m³ | Disponible: {move.available_volume}m³</span>
                    </div>
                  )}
                  {move.total_price && (
                    <div className="flex items-center space-x-2">
                      <Euro className="h-4 w-4 text-green-600" />
                      <span>Prix total: {move.total_price}€</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-3">
                    Créé le {new Date(move.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                
                <div className="mt-3 flex items-center space-x-3">
                  <StatusToggle
                    status={move.status_custom || 'en_cours'}
                    onStatusChange={(newStatus) => handleStatusChange(move.id, newStatus)}
                  />
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
                        Êtes-vous sûr de vouloir supprimer ce déménagement ? 
                        Cette action supprimera définitivement le déménagement de la base de données.
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
        )}
        renderListItem={(move: ConfirmedMove) => (
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <div>
                  <h4 className="font-medium text-gray-800">{move.company_name || 'Déménageur non renseigné'}</h4>
                  <p className="text-sm text-gray-600">{move.mover_name}</p>
                </div>
                <div className="text-sm text-gray-500">
                  <span>{move.departure_city} → {move.arrival_city}</span>
                </div>
                <div className="text-sm text-gray-500">
                  <span>{new Date(move.departure_date).toLocaleDateString('fr-FR')}</span>
                </div>
                {move.max_volume && (
                  <div className="text-sm text-gray-500">
                    <span>{move.available_volume}m³ dispo</span>
                  </div>
                )}
                <StatusToggle
                  status={move.status_custom || 'en_cours'}
                  onStatusChange={(newStatus) => handleStatusChange(move.id, newStatus)}
                  variant="inline"
                />
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
                      Êtes-vous sûr de vouloir supprimer ce déménagement ? 
                      Cette action supprimera définitivement le déménagement de la base de données.
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
        )}
        searchPlaceholder="Rechercher par entreprise, déménageur ou ville..."
        emptyStateMessage="Aucun déménagement trouvé"
        emptyStateIcon={<Truck className="h-12 w-12 text-gray-400 mx-auto" />}
        itemsPerPage={10}
      />
    </div>
  );
};

export default MoveManagement;
