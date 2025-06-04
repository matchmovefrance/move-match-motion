
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Building2, Mail, Phone, MapPin, Edit, Trash2 } from 'lucide-react';
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

interface ServiceProvider {
  id: number;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  coordinates: string | null;
  created_at: string;
}

const ServiceProviders = () => {
  const { user } = useAuth();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ServiceProvider | null>(null);
  const [newProvider, setNewProvider] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    coordinates: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProvider = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('service_providers')
        .insert({
          ...newProvider,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Prestataire ajouté avec succès",
      });

      setNewProvider({
        name: '',
        company_name: '',
        email: '',
        phone: '',
        address: '',
        postal_code: '',
        city: '',
        coordinates: ''
      });
      setShowAddForm(false);
      fetchProviders();
    } catch (error: any) {
      console.error('Error adding provider:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le prestataire",
        variant: "destructive",
      });
    }
  };

  const updateProvider = async () => {
    if (!editingProvider) return;

    try {
      const { error } = await supabase
        .from('service_providers')
        .update(editingProvider)
        .eq('id', editingProvider.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Prestataire mis à jour avec succès",
      });

      setEditingProvider(null);
      fetchProviders();
    } catch (error: any) {
      console.error('Error updating provider:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le prestataire",
        variant: "destructive",
      });
    }
  };

  const deleteProvider = async (id: number) => {
    try {
      console.log('Deleting service provider:', id);
      
      // Supprimer le prestataire de service de la base de données
      const { error } = await supabase
        .from('service_providers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting service provider:', error);
        throw error;
      }

      // Mettre à jour l'état local immédiatement après la suppression réussie
      setProviders(prevProviders => {
        const updatedProviders = prevProviders.filter(p => p.id !== id);
        console.log('Updated providers list:', updatedProviders);
        return updatedProviders;
      });

      toast({
        title: "Succès",
        description: "Prestataire supprimé avec succès de la base de données et de l'application",
      });

    } catch (error: any) {
      console.error('Error deleting service provider:', error);
      toast({
        title: "Erreur",
        description: `Impossible de supprimer le prestataire: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const renderProviderCard = (provider: ServiceProvider) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-2">{provider.name}</h3>
          <p className="text-gray-600 mb-3">{provider.company_name}</p>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <span>{provider.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-blue-600" />
              <span>{provider.phone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span>{provider.address}, {provider.postal_code} {provider.city}</span>
            </div>
            {provider.coordinates && (
              <div className="text-xs text-blue-600">{provider.coordinates}</div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingProvider(provider)}
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
                <AlertDialogTitle>Supprimer le prestataire</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer le prestataire {provider.name} de {provider.company_name} ? 
                  Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteProvider(provider.id)}
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

  const renderProviderListItem = (provider: ServiceProvider) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex-1">
        <div className="flex items-center space-x-4">
          <div>
            <h4 className="font-medium text-gray-800">{provider.name}</h4>
            <p className="text-sm text-gray-600">{provider.company_name}</p>
          </div>
          <div className="text-sm text-gray-500">
            <span>{provider.email}</span> • <span>{provider.phone}</span>
          </div>
          <div className="text-sm text-gray-500">
            {provider.postal_code} {provider.city}
          </div>
        </div>
      </div>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditingProvider(provider)}
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
              <AlertDialogTitle>Supprimer le prestataire</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le prestataire {provider.name} de {provider.company_name} ? 
                Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteProvider(provider.id)}
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
          <Building2 className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Prestataires</h2>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un prestataire
        </Button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingProvider) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        >
          <h3 className="text-lg font-semibold mb-4">
            {editingProvider ? 'Modifier le prestataire' : 'Nouveau prestataire'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Nom"
              value={editingProvider ? editingProvider.name : newProvider.name}
              onChange={(e) => editingProvider 
                ? setEditingProvider({...editingProvider, name: e.target.value})
                : setNewProvider({...newProvider, name: e.target.value})
              }
            />
            <Input
              placeholder="Nom de l'entreprise"
              value={editingProvider ? editingProvider.company_name : newProvider.company_name}
              onChange={(e) => editingProvider 
                ? setEditingProvider({...editingProvider, company_name: e.target.value})
                : setNewProvider({...newProvider, company_name: e.target.value})
              }
            />
            <Input
              placeholder="Email"
              type="email"
              value={editingProvider ? editingProvider.email : newProvider.email}
              onChange={(e) => editingProvider 
                ? setEditingProvider({...editingProvider, email: e.target.value})
                : setNewProvider({...newProvider, email: e.target.value})
              }
            />
            <Input
              placeholder="Téléphone"
              value={editingProvider ? editingProvider.phone : newProvider.phone}
              onChange={(e) => editingProvider 
                ? setEditingProvider({...editingProvider, phone: e.target.value})
                : setNewProvider({...newProvider, phone: e.target.value})
              }
            />
            <Input
              placeholder="Adresse"
              value={editingProvider ? editingProvider.address : newProvider.address}
              onChange={(e) => editingProvider 
                ? setEditingProvider({...editingProvider, address: e.target.value})
                : setNewProvider({...newProvider, address: e.target.value})
              }
            />
            <Input
              placeholder="Code postal"
              value={editingProvider ? editingProvider.postal_code : newProvider.postal_code}
              onChange={(e) => editingProvider 
                ? setEditingProvider({...editingProvider, postal_code: e.target.value})
                : setNewProvider({...newProvider, postal_code: e.target.value})
              }
            />
            <Input
              placeholder="Ville"
              value={editingProvider ? editingProvider.city : newProvider.city}
              onChange={(e) => editingProvider 
                ? setEditingProvider({...editingProvider, city: e.target.value})
                : setNewProvider({...newProvider, city: e.target.value})
              }
            />
            <Input
              placeholder="Coordonnées GPS (optionnel)"
              value={editingProvider ? editingProvider.coordinates || '' : newProvider.coordinates}
              onChange={(e) => editingProvider 
                ? setEditingProvider({...editingProvider, coordinates: e.target.value})
                : setNewProvider({...newProvider, coordinates: e.target.value})
              }
            />
          </div>
          <div className="flex space-x-2 mt-4">
            <Button onClick={editingProvider ? updateProvider : addProvider}>
              {editingProvider ? 'Mettre à jour' : 'Ajouter'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddForm(false);
                setEditingProvider(null);
              }}
            >
              Annuler
            </Button>
          </div>
        </motion.div>
      )}

      {/* ListView with search and pagination */}
      <ListView
        items={providers}
        searchFields={['name', 'company_name', 'email', 'city']}
        renderCard={renderProviderCard}
        renderListItem={renderProviderListItem}
        searchPlaceholder="Rechercher par nom, entreprise, email ou ville..."
        emptyStateMessage="Aucun prestataire trouvé"
        emptyStateIcon={<MapPin className="h-12 w-12 text-gray-400 mx-auto" />}
        itemsPerPage={10}
      />
    </div>
  );
};

export default ServiceProviders;
