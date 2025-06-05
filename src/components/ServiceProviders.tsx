
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Building, Mail, Phone, MapPin, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      console.error('Error fetching service providers:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les fournisseurs de services",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addProvider = async () => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour ajouter un fournisseur",
        variant: "destructive",
      });
      return;
    }

    // Validation des champs obligatoires
    if (!newProvider.name.trim() || !newProvider.company_name.trim() || !newProvider.email.trim() || 
        !newProvider.phone.trim() || !newProvider.address.trim() || !newProvider.city.trim() || 
        !newProvider.postal_code.trim()) {
      toast({
        title: "Erreur",
        description: "Tous les champs sont obligatoires",
        variant: "destructive",
      });
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newProvider.email)) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une adresse email valide",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Adding service provider:', newProvider);
      
      const { data, error } = await supabase
        .from('service_providers')
        .insert({
          name: newProvider.name.trim(),
          company_name: newProvider.company_name.trim(),
          email: newProvider.email.trim().toLowerCase(),
          phone: newProvider.phone.trim(),
          address: newProvider.address.trim(),
          city: newProvider.city.trim(),
          postal_code: newProvider.postal_code.trim(),
          coordinates: newProvider.coordinates.trim() || null,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Service provider added successfully:', data);

      toast({
        title: "Succès",
        description: "Fournisseur de services ajouté avec succès",
      });

      setNewProvider({ 
        name: '', 
        company_name: '', 
        email: '', 
        phone: '', 
        address: '', 
        city: '', 
        postal_code: '', 
        coordinates: '' 
      });
      setShowAddForm(false);
      fetchProviders();
    } catch (error: any) {
      console.error('Error adding service provider:', error);
      
      let errorMessage = "Impossible d'ajouter le fournisseur de services";
      
      if (error.code === '23505') {
        errorMessage = "Un fournisseur avec cette adresse email existe déjà";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const updateProvider = async () => {
    if (!editingProvider) return;

    // Validation des champs obligatoires
    if (!editingProvider.name.trim() || !editingProvider.company_name.trim() || 
        !editingProvider.email.trim() || !editingProvider.phone.trim() || 
        !editingProvider.address.trim() || !editingProvider.city.trim() || 
        !editingProvider.postal_code.trim()) {
      toast({
        title: "Erreur",
        description: "Tous les champs sont obligatoires",
        variant: "destructive",
      });
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editingProvider.email)) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une adresse email valide",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('service_providers')
        .update({
          name: editingProvider.name.trim(),
          company_name: editingProvider.company_name.trim(),
          email: editingProvider.email.trim().toLowerCase(),
          phone: editingProvider.phone.trim(),
          address: editingProvider.address.trim(),
          city: editingProvider.city.trim(),
          postal_code: editingProvider.postal_code.trim(),
          coordinates: editingProvider.coordinates?.trim() || null
        })
        .eq('id', editingProvider.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Fournisseur de services mis à jour avec succès",
      });

      setEditingProvider(null);
      fetchProviders();
    } catch (error: any) {
      console.error('Error updating service provider:', error);
      
      let errorMessage = "Impossible de mettre à jour le fournisseur de services";
      
      if (error.code === '23505') {
        errorMessage = "Un fournisseur avec cette adresse email existe déjà";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const deleteProvider = async (id: number) => {
    try {
      console.log('Deleting service provider:', id);
      
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
        description: "Fournisseur de services supprimé avec succès",
      });

    } catch (error: any) {
      console.error('Error deleting service provider:', error);
      toast({
        title: "Erreur",
        description: `Impossible de supprimer le fournisseur: ${error.message}`,
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
            <div className="text-xs text-gray-400 mt-3">
              Créé le {new Date(provider.created_at).toLocaleDateString('fr-FR')}
            </div>
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
                <AlertDialogTitle>Supprimer le fournisseur</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer le fournisseur {provider.name} de {provider.company_name} ? 
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
            <span>{provider.city}</span>
          </div>
          <div className="text-xs text-gray-400">
            {new Date(provider.created_at).toLocaleDateString('fr-FR')}
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
              <AlertDialogTitle>Supprimer le fournisseur</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le fournisseur {provider.name} de {provider.company_name} ? 
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
          <Building className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Fournisseurs de services</h2>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un fournisseur
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
            {editingProvider ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Nom *"
              value={editingProvider ? editingProvider.name : newProvider.name}
              onChange={(e) => editingProvider 
                ? setEditingProvider({...editingProvider, name: e.target.value})
                : setNewProvider({...newProvider, name: e.target.value})
              }
            />
            <Input
              placeholder="Nom de l'entreprise *"
              value={editingProvider ? editingProvider.company_name : newProvider.company_name}
              onChange={(e) => editingProvider 
                ? setEditingProvider({...editingProvider, company_name: e.target.value})
                : setNewProvider({...newProvider, company_name: e.target.value})
              }
            />
            <Input
              placeholder="Email *"
              type="email"
              value={editingProvider ? editingProvider.email : newProvider.email}
              onChange={(e) => editingProvider 
                ? setEditingProvider({...editingProvider, email: e.target.value})
                : setNewProvider({...newProvider, email: e.target.value})
              }
            />
            <Input
              placeholder="Téléphone *"
              value={editingProvider ? editingProvider.phone : newProvider.phone}
              onChange={(e) => editingProvider 
                ? setEditingProvider({...editingProvider, phone: e.target.value})
                : setNewProvider({...newProvider, phone: e.target.value})
              }
            />
            <Input
              placeholder="Adresse *"
              value={editingProvider ? editingProvider.address : newProvider.address}
              onChange={(e) => editingProvider 
                ? setEditingProvider({...editingProvider, address: e.target.value})
                : setNewProvider({...newProvider, address: e.target.value})
              }
            />
            <Input
              placeholder="Ville *"
              value={editingProvider ? editingProvider.city : newProvider.city}
              onChange={(e) => editingProvider 
                ? setEditingProvider({...editingProvider, city: e.target.value})
                : setNewProvider({...newProvider, city: e.target.value})
              }
            />
            <Input
              placeholder="Code postal *"
              value={editingProvider ? editingProvider.postal_code : newProvider.postal_code}
              onChange={(e) => editingProvider 
                ? setEditingProvider({...editingProvider, postal_code: e.target.value})
                : setNewProvider({...newProvider, postal_code: e.target.value})
              }
            />
            <Input
              placeholder="Coordonnées (optionnel)"
              value={editingProvider ? (editingProvider.coordinates || '') : newProvider.coordinates}
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
        emptyStateMessage="Aucun fournisseur de services trouvé"
        emptyStateIcon={<Building className="h-12 w-12 text-gray-400 mx-auto" />}
        itemsPerPage={10}
      />
    </div>
  );
};

export default ServiceProviders;
