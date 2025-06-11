
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Truck, Mail, Phone, Edit, Trash2, RefreshCw } from 'lucide-react';
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
import { useCache } from '@/hooks/useCache';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import SyncStatusDialog from './SyncStatusDialog';

interface Mover {
  id: number;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  created_at: string;
  created_by: string;
}

const MoverList = () => {
  const { user, profile } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMover, setEditingMover] = useState<Mover | null>(null);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [newMover, setNewMover] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: ''
  });
  const { toast } = useToast();

  // Optimized fetcher with targeted query
  const fetchMovers = useCallback(async () => {
    console.log('🔄 Fetching movers - User:', user?.email, 'Role:', profile?.role);
    
    const isAdminOrAgent = profile?.role === 'admin' || 
                          user?.email === 'contact@matchmove.fr' || 
                          user?.email === 'pierre@matchmove.fr' ||
                          profile?.role === 'agent';

    // Optimized query - only select needed fields
    let query = supabase
      .from('movers')
      .select('id, name, company_name, email, phone, created_at, created_by');
    
    if (!isAdminOrAgent) {
      query = query.eq('created_by', user?.id);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching movers:', error);
      throw error;
    }
    
    console.log('✅ Movers fetched:', data?.length || 0, 'movers');
    return data || [];
  }, [user?.id, user?.email, profile?.role]);

  // Use cache for movers data
  const { 
    data: movers = [], 
    loading, 
    error, 
    refetch 
  } = useCache(fetchMovers, {
    key: `movers-${user?.id}-${profile?.role}`,
    ttl: 2 * 60 * 1000 // 2 minutes cache
  });

  const resetForm = () => {
    setNewMover({ name: '', company_name: '', email: '', phone: '' });
  };

  const validateForm = () => {
    const requiredFields = ['name', 'company_name', 'email', 'phone'];
    const missingFields = [];

    for (const field of requiredFields) {
      if (!newMover[field as keyof typeof newMover]?.trim()) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      toast({
        title: "Erreur",
        description: `Les champs suivants sont obligatoires : ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMover.email)) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une adresse email valide",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const checkForDuplicateMover = async (email: string, excludeId?: number) => {
    if (!user) return false;
    
    try {
      let query = supabase
        .from('movers')
        .select('id')
        .eq('email', email.toLowerCase())
        .eq('created_by', user.id);
      
      if (excludeId) {
        query = query.neq('id', excludeId);
      }
      
      const { data } = await query;
      return (data && data.length > 0);
    } catch (error) {
      console.error('Error checking duplicate:', error);
      return false;
    }
  };

  const addMover = async () => {
    if (!user || !validateForm()) return;

    try {
      console.log('📝 Adding mover:', newMover);
      
      const isDuplicate = await checkForDuplicateMover(newMover.email);
      
      if (isDuplicate) {
        toast({
          title: "Erreur",
          description: "Un déménageur avec cette adresse email existe déjà",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('movers')
        .insert({
          name: newMover.name.trim(),
          company_name: newMover.company_name.trim(),
          email: newMover.email.trim().toLowerCase(),
          phone: newMover.phone.trim(),
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Déménageur ajouté avec succès",
      });

      resetForm();
      setShowAddForm(false);
      await refetch(); // Refresh cache
    } catch (error: any) {
      console.error('❌ Error adding mover:', error);
      toast({
        title: "Erreur",
        description: error.code === '23505' ? "Un déménageur avec cette adresse email existe déjà" : "Impossible d'ajouter le déménageur",
        variant: "destructive",
      });
    }
  };

  const updateMover = async () => {
    if (!editingMover || !user || !validateForm()) return;

    try {
      console.log('✏️ Updating mover:', editingMover.id);
      
      const isDuplicate = await checkForDuplicateMover(newMover.email, editingMover.id);
      
      if (isDuplicate) {
        toast({
          title: "Erreur",
          description: "Un déménageur avec cette adresse email existe déjà",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('movers')
        .update({
          name: newMover.name.trim(),
          company_name: newMover.company_name.trim(),
          email: newMover.email.trim().toLowerCase(),
          phone: newMover.phone.trim()
        })
        .eq('id', editingMover.id)
        .eq('created_by', user.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Déménageur mis à jour avec succès",
      });

      setEditingMover(null);
      resetForm();
      await refetch(); // Refresh cache
    } catch (error: any) {
      console.error('❌ Error updating mover:', error);
      toast({
        title: "Erreur",
        description: error.code === '23505' ? "Un déménageur avec cette adresse email existe déjà" : "Impossible de mettre à jour le déménageur",
        variant: "destructive",
      });
    }
  };

  const deleteMover = async (id: number) => {
    if (!user) return;
    
    try {
      console.log('🗑️ Deleting mover:', id);
      
      const { error } = await supabase
        .from('movers')
        .delete()
        .eq('id', id)
        .eq('created_by', user.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Déménageur supprimé avec succès",
      });

      await refetch(); // Refresh cache
    } catch (error: any) {
      console.error('❌ Error deleting mover:', error);
      toast({
        title: "Erreur",
        description: `Impossible de supprimer le déménageur: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleSyncComplete = () => {
    setShowSyncDialog(false);
    refetch();
    toast({
      title: "Succès",
      description: "Synchronisation terminée avec succès",
    });
  };

  // Show loading skeleton during data fetch
  if (loading && !showAddForm && !editingMover) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Truck className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Déménageurs</h2>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" disabled>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync
            </Button>
            <Button disabled>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un déménageur
            </Button>
          </div>
        </div>
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  if (showAddForm || editingMover) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Truck className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">
              {editingMover ? 'Modifier le déménageur' : 'Nouveau déménageur'}
            </h2>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setShowAddForm(false);
              setEditingMover(null);
              resetForm();
            }}
          >
            Retour à la liste
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informations du déménageur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Nom *"
                value={newMover.name}
                onChange={(e) => setNewMover({...newMover, name: e.target.value})}
              />
              <Input
                placeholder="Nom de l'entreprise *"
                value={newMover.company_name}
                onChange={(e) => setNewMover({...newMover, company_name: e.target.value})}
              />
              <Input
                placeholder="Email *"
                type="email"
                value={newMover.email}
                onChange={(e) => setNewMover({...newMover, email: e.target.value})}
              />
              <Input
                placeholder="Téléphone *"
                value={newMover.phone}
                onChange={(e) => setNewMover({...newMover, phone: e.target.value})}
              />
            </div>
            <div className="flex space-x-2 mt-4">
              <Button 
                onClick={editingMover ? updateMover : addMover}
              >
                {editingMover ? 'Mettre à jour' : 'Ajouter'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingMover(null);
                  resetForm();
                }}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Truck className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Déménageurs</h2>
          <span className="text-sm text-gray-500">({movers.length})</span>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowSyncDialog(true)}
            title="Vérifier la synchronisation"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un déménageur
          </Button>
        </div>
      </div>

      {movers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun déménageur trouvé</p>
            <p className="text-sm text-gray-500 mt-2">
              Commencez par ajouter un déménageur
            </p>
          </CardContent>
        </Card>
      ) : (
        <ListView
          items={movers}
          searchFields={['name', 'company_name', 'email', 'phone']}
          renderCard={(mover: Mover) => (
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
                    onClick={() => {
                      setEditingMover(mover);
                      setNewMover({
                        name: mover.name,
                        company_name: mover.company_name,
                        email: mover.email,
                        phone: mover.phone
                      });
                    }}
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
          )}
          renderListItem={(mover: Mover) => (
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
                  onClick={() => {
                    setEditingMover(mover);
                    setNewMover({
                      name: mover.name,
                      company_name: mover.company_name,
                      email: mover.email,
                      phone: mover.phone
                    });
                  }}
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
          )}
          searchPlaceholder="Rechercher par nom, entreprise, email ou téléphone..."
          emptyStateMessage="Aucun déménageur trouvé"
          emptyStateIcon={<Truck className="h-12 w-12 text-gray-400 mx-auto" />}
          itemsPerPage={10}
        />
      )}

      <SyncStatusDialog
        isOpen={showSyncDialog}
        onClose={() => setShowSyncDialog(false)}
        onSyncComplete={handleSyncComplete}
      />
    </div>
  );
};

export default MoverList;
