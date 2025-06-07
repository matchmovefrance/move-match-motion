
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Settings, MapPin, Phone, Mail, Edit, Trash2, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  created_by: string | null;
}

const ServiceProviders = () => {
  const { user } = useAuth();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ServiceProvider | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: ''
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    if (editingProvider) {
      setFormData({
        name: editingProvider.name,
        company_name: editingProvider.company_name,
        email: editingProvider.email,
        phone: editingProvider.phone,
        address: editingProvider.address,
        city: editingProvider.city,
        postal_code: editingProvider.postal_code
      });
    } else {
      resetForm();
    }
  }, [editingProvider]);

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
      toast({
        title: "Erreur",
        description: "Impossible de charger les prestataires",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      company_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postal_code: ''
    });
  };

  const validateForm = () => {
    const requiredFields = ['name', 'company_name', 'email', 'phone', 'address', 'city', 'postal_code'];
    const missingFields = [];

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]?.trim()) {
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

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une adresse email valide",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour effectuer cette action",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) return;

    try {
      setLoading(true);

      const providerData = {
        name: formData.name.trim(),
        company_name: formData.company_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        postal_code: formData.postal_code.trim(),
        created_by: user.id
      };

      if (editingProvider) {
        // Update existing provider
        const { error } = await supabase
          .from('service_providers')
          .update(providerData)
          .eq('id', editingProvider.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Prestataire mis à jour avec succès",
        });
      } else {
        // Create new provider
        const { error } = await supabase
          .from('service_providers')
          .insert(providerData);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Prestataire ajouté avec succès",
        });
      }

      // Reset form and go back to list
      setShowAddForm(false);
      setEditingProvider(null);
      resetForm();
      await fetchProviders();

    } catch (error: any) {
      console.error('Error saving provider:', error);
      
      let errorMessage = "Impossible de sauvegarder le prestataire";
      if (error.code === '23505') {
        errorMessage = "Un prestataire avec cette adresse email existe déjà";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteProvider = async (id: number) => {
    try {
      const { error } = await supabase
        .from('service_providers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProviders(prevProviders => prevProviders.filter(p => p.id !== id));
      toast({
        title: "Succès",
        description: "Prestataire supprimé avec succès",
      });
    } catch (error: any) {
      console.error('Error deleting provider:', error);
      toast({
        title: "Erreur",
        description: `Impossible de supprimer le prestataire: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading && !showAddForm && !editingProvider) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showAddForm || editingProvider) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">
              {editingProvider ? 'Modifier le prestataire' : 'Nouveau prestataire'}
            </h2>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setShowAddForm(false);
              setEditingProvider(null);
              resetForm();
            }}
          >
            Retour à la liste
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informations du prestataire</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Nom du contact"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_name">Nom de l'entreprise *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="Nom de l'entreprise"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email@exemple.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="0123456789"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Adresse *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Rue de la Paix"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Ville *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Paris"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postal_code">Code postal *</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    placeholder="75000"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-6 border-t">
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? 'Enregistrement...' : (editingProvider ? 'Mettre à jour' : 'Ajouter le prestataire')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingProvider(null);
                    resetForm();
                  }}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Prestataires de services</h2>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un prestataire
        </Button>
      </div>

      <ListView
        items={providers}
        searchFields={['name', 'company_name', 'email', 'city']}
        renderCard={(provider: ServiceProvider) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-2">
                  {provider.company_name}
                </h3>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-blue-600" />
                    <span>{provider.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span>{provider.address}, {provider.postal_code} {provider.city}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-purple-600" />
                    <a 
                      href={`mailto:${provider.email}`}
                      className="text-blue-600 hover:underline"
                      title="Envoyer un email"
                    >
                      {provider.email}
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-orange-600" />
                    <a 
                      href={`tel:${provider.phone}`}
                      className="text-blue-600 hover:underline"
                      title="Appeler ce numéro"
                    >
                      {provider.phone}
                    </a>
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
                      <AlertDialogTitle>Supprimer le prestataire</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer {provider.company_name} ? 
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
        )}
        renderListItem={(provider: ServiceProvider) => (
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <div>
                  <h4 className="font-medium text-gray-800">{provider.company_name}</h4>
                  <p className="text-sm text-gray-600">{provider.name}</p>
                </div>
                <div className="text-sm text-gray-500">
                  <span>{provider.city}</span>
                </div>
                <div className="text-sm text-blue-600">
                  <a 
                    href={`mailto:${provider.email}`}
                    className="hover:underline"
                    title="Envoyer un email"
                  >
                    {provider.email}
                  </a>
                </div>
                <div className="text-sm text-blue-600">
                  <a 
                    href={`tel:${provider.phone}`}
                    className="hover:underline"
                    title="Appeler ce numéro"
                  >
                    {provider.phone}
                  </a>
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
                      Êtes-vous sûr de vouloir supprimer {provider.company_name} ? 
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
        )}
        searchPlaceholder="Rechercher par nom, entreprise, email ou ville..."
        emptyStateMessage="Aucun prestataire trouvé"
        emptyStateIcon={<Settings className="h-12 w-12 text-gray-400 mx-auto" />}
        itemsPerPage={10}
      />
    </div>
  );
};

export default ServiceProviders;
