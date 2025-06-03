import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Truck, Mail, Phone, Building, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface Mover {
  id: number;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  created_at: string;
}

const MoverList = () => {
  const { user } = useAuth();
  const [movers, setMovers] = useState<Mover[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMover, setEditingMover] = useState<Mover | null>(null);
  const [newMover, setNewMover] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchMovers();
  }, []);

  const fetchMovers = async () => {
    try {
      const { data, error } = await supabase
        .from('movers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMovers(data || []);
    } catch (error) {
      console.error('Error fetching movers:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMover = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('movers')
        .insert({
          ...newMover,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Déménageur ajouté avec succès",
      });

      setNewMover({ name: '', company_name: '', email: '', phone: '' });
      setShowAddForm(false);
      fetchMovers();
    } catch (error: any) {
      console.error('Error adding mover:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le déménageur",
        variant: "destructive",
      });
    }
  };

  const updateMover = async () => {
    if (!editingMover) return;

    try {
      const { error } = await supabase
        .from('movers')
        .update(editingMover)
        .eq('id', editingMover.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Déménageur mis à jour avec succès",
      });

      setEditingMover(null);
      fetchMovers();
    } catch (error: any) {
      console.error('Error updating mover:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le déménageur",
        variant: "destructive",
      });
    }
  };

  const deleteMover = async (id: number) => {
    try {
      const { error } = await supabase
        .from('movers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Déménageur supprimé avec succès",
      });

      fetchMovers();
    } catch (error: any) {
      console.error('Error deleting mover:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le déménageur",
        variant: "destructive",
      });
    }
  };

  const renderMoverCard = (mover: Mover) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-2">{mover.name}</h3>
          <p className="text-gray-600 mb-3">{mover.company_name}</p>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <span>{mover.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-blue-600" />
              <span>{mover.phone}</span>
            </div>
            <div className="text-xs text-gray-400 mt-3">
              Créé le {new Date(mover.created_at).toLocaleDateString('fr-FR')}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingMover(mover)}
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
                <AlertDialogTitle>Supprimer le déménageur</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer le déménageur {mover.name} de {mover.company_name} ? 
                  Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMover(mover.id)}
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

  const renderMoverListItem = (mover: Mover) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex-1">
        <div className="flex items-center space-x-4">
          <div>
            <h4 className="font-medium text-gray-800">{mover.name}</h4>
            <p className="text-sm text-gray-600">{mover.company_name}</p>
          </div>
          <div className="text-sm text-gray-500">
            <span>{mover.email}</span> • <span>{mover.phone}</span>
          </div>
          <div className="text-xs text-gray-400">
            {new Date(mover.created_at).toLocaleDateString('fr-FR')}
          </div>
        </div>
      </div>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditingMover(mover)}
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
              <AlertDialogTitle>Supprimer le déménageur</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le déménageur {mover.name} de {mover.company_name} ? 
                Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMover(mover.id)}
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Truck className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Déménageurs</h2>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un déménageur
        </Button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingMover) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        >
          <h3 className="text-lg font-semibold mb-4">
            {editingMover ? 'Modifier le déménageur' : 'Nouveau déménageur'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Nom"
              value={editingMover ? editingMover.name : newMover.name}
              onChange={(e) => editingMover 
                ? setEditingMover({...editingMover, name: e.target.value})
                : setNewMover({...newMover, name: e.target.value})
              }
            />
            <Input
              placeholder="Nom de l'entreprise"
              value={editingMover ? editingMover.company_name : newMover.company_name}
              onChange={(e) => editingMover 
                ? setEditingMover({...editingMover, company_name: e.target.value})
                : setNewMover({...newMover, company_name: e.target.value})
              }
            />
            <Input
              placeholder="Email"
              type="email"
              value={editingMover ? editingMover.email : newMover.email}
              onChange={(e) => editingMover 
                ? setEditingMover({...editingMover, email: e.target.value})
                : setNewMover({...newMover, email: e.target.value})
              }
            />
            <Input
              placeholder="Téléphone"
              value={editingMover ? editingMover.phone : newMover.phone}
              onChange={(e) => editingMover 
                ? setEditingMover({...editingMover, phone: e.target.value})
                : setNewMover({...newMover, phone: e.target.value})
              }
            />
          </div>
          <div className="flex space-x-2 mt-4">
            <Button onClick={editingMover ? updateMover : addMover}>
              {editingMover ? 'Mettre à jour' : 'Ajouter'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddForm(false);
                setEditingMover(null);
              }}
            >
              Annuler
            </Button>
          </div>
        </motion.div>
      )}

      {/* ListView with search and pagination */}
      <ListView
        items={movers}
        searchFields={['name', 'company_name', 'email', 'phone']}
        renderCard={renderMoverCard}
        renderListItem={renderMoverListItem}
        searchPlaceholder="Rechercher par nom, entreprise, email ou téléphone..."
        emptyStateMessage="Aucun déménageur trouvé"
        emptyStateIcon={<Truck className="h-12 w-12 text-gray-400 mx-auto" />}
        itemsPerPage={10}
      />
    </div>
  );
};

export default MoverList;
