import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Settings, MapPin, Phone, Mail, Edit, Trash2, Building, RefreshCw, Calculator, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ListView } from '@/components/ui/list-view';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import SyncStatusDialog from './SyncStatusDialog';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import SupplierPricingDialog from '@/pages/PricingTool/components/SupplierPricingDialog';
import SupplierBankDetailsDialog from '@/pages/PricingTool/components/SupplierBankDetailsDialog';

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
  source?: string;
  pricing_model?: any;
  bank_details?: any;
}

const ServiceProviders = () => {
  const { user } = useAuth();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ServiceProvider | null>(null);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [showBankDetailsDialog, setShowBankDetailsDialog] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<ServiceProvider | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
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

  // Récupérer les prestataires depuis les trajets confirmés
  const { data: providersFromMoves } = useQuery({
    queryKey: ['providers-from-confirmed-moves'],
    queryFn: async () => {
      console.log('🔍 Chargement des prestataires depuis les trajets confirmés...');
      
      const { data: moves, error } = await supabase
        .from('confirmed_moves')
        .select(`
          mover_id,
          mover_name,
          company_name,
          contact_email,
          contact_phone
        `)
        .not('mover_id', 'is', null);

      if (error) {
        console.error('❌ Erreur lors du chargement des trajets:', error);
        return [];
      }

      // Créer un Map pour éviter les doublons par mover_id
      const uniqueProviders = new Map();
      
      moves?.forEach(move => {
        if (move.mover_id && !uniqueProviders.has(move.mover_id)) {
          uniqueProviders.set(move.mover_id, {
            id: `move-${move.mover_id}`,
            name: move.mover_name || 'Nom non défini',
            company_name: move.company_name || 'Entreprise non définie',
            email: move.contact_email || '',
            phone: move.contact_phone || '',
            address: '',
            city: '',
            postal_code: '',
            coordinates: null,
            created_at: new Date().toISOString(),
            created_by: null,
            source: 'moves',
            pricing_model: {
              basePrice: 150,
              volumeRate: 10,
              distanceRate: 1,
              matchMoveMargin: 40
            },
            bank_details: null
          });
        }
      });

      const providers = Array.from(uniqueProviders.values());
      console.log('✅ Prestataires uniques depuis les trajets:', providers.length);
      return providers;
    },
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
      setLoading(true);
      console.log('🔄 Fetching service providers from database...');
      
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching providers:', error);
        throw error;
      }
      
      console.log('✅ Service providers fetched from DB:', data?.length || 0);
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

  const checkForDuplicateProvider = async (email: string, excludeId?: number) => {
    if (!user) return false;
    
    try {
      let query = supabase
        .from('service_providers')
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
      console.log('📝 Provider form submission started:', { isEditing: !!editingProvider, formData });

      // Vérifier les doublons
      const isDuplicate = await checkForDuplicateProvider(
        formData.email, 
        editingProvider?.id
      );
      
      if (isDuplicate) {
        toast({
          title: "Erreur",
          description: "Un prestataire avec cette adresse email existe déjà",
          variant: "destructive",
        });
        return;
      }

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
        console.log('✏️ Updating existing provider:', editingProvider.id);
        
        // Update existing provider
        const { error } = await supabase
          .from('service_providers')
          .update(providerData)
          .eq('id', editingProvider.id)
          .eq('created_by', user.id);

        if (error) {
          console.error('❌ Provider update error:', error);
          throw error;
        }

        console.log('✅ Provider updated successfully');
        toast({
          title: "Succès",
          description: "Prestataire mis à jour avec succès",
        });
      } else {
        console.log('➕ Creating new provider');
        
        // Create new provider
        const { error } = await supabase
          .from('service_providers')
          .insert(providerData);

        if (error) {
          console.error('❌ Provider creation error:', error);
          throw error;
        }

        console.log('✅ Provider created successfully');
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
      console.error('❌ Error saving provider:', error);
      
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

  const handleDeleteClick = (provider: ServiceProvider) => {
    setProviderToDelete(provider);
    setShowDeleteDialog(true);
  };

  const deleteProvider = async () => {
    if (!user || !providerToDelete) return;
    
    try {
      console.log('🗑️ Deleting provider:', providerToDelete.id);
      
      const { error } = await supabase
        .from('service_providers')
        .delete()
        .eq('id', providerToDelete.id)
        .eq('created_by', user.id);

      if (error) {
        console.error('❌ Error deleting provider:', error);
        throw error;
      }

      console.log('✅ Provider deleted successfully');
      
      // Mettre à jour l'état local immédiatement
      setProviders(prevProviders => prevProviders.filter(p => p.id !== providerToDelete.id));
      
      toast({
        title: "Succès",
        description: "Prestataire supprimé avec succès",
      });
      
      setShowDeleteDialog(false);
      setProviderToDelete(null);
    } catch (error: any) {
      console.error('❌ Error deleting provider:', error);
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

  const handleSyncComplete = () => {
    setShowSyncDialog(false);
    fetchProviders();
    toast({
      title: "Succès",
      description: "Synchronisation terminée avec succès",
    });
  };

  const handleEditPricing = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setShowPricingDialog(true);
  };

  const handleEditBankDetails = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setShowBankDetailsDialog(true);
  };

  // Combiner les prestataires de la DB avec ceux des trajets
  const allProviders = [
    ...(providers || []),
    ...(providersFromMoves || [])
  ];

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
            Ajouter un prestataire
          </Button>
        </div>
      </div>

      <ListView
        items={allProviders}
        searchFields={['name', 'company_name', 'email', 'city']}
        renderCard={(provider: ServiceProvider) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-800">
                    {provider.company_name}
                  </h3>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-blue-600" />
                    <span>{provider.name}</span>
                  </div>
                  {provider.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <span>{provider.address}, {provider.postal_code} {provider.city}</span>
                    </div>
                  )}
                  {provider.email && (
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
                  )}
                  {provider.phone && (
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
                  )}
                  
                  {/* Boutons pour tarification et RIB */}
                  <div className="flex space-x-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPricing(provider)}
                      className="text-xs"
                    >
                      <Calculator className="h-3 w-3 mr-1" />
                      Tarification
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditBankDetails(provider)}
                      className="text-xs text-green-600 hover:text-green-700"
                    >
                      <CreditCard className="h-3 w-3 mr-1" />
                      RIB
                    </Button>
                  </div>
                  
                  <div className="text-xs text-gray-400 mt-3">
                    {provider.source === 'moves' 
                      ? 'Depuis les trajets confirmés'
                      : `Créé le ${new Date(provider.created_at).toLocaleDateString('fr-FR')}`
                    }
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingProvider(provider)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClick(provider)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
        renderListItem={(provider: ServiceProvider) => (
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-800">{provider.company_name}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{provider.name}</p>
                </div>
                {provider.city && (
                  <div className="text-sm text-gray-500">
                    <span>{provider.city}</span>
                  </div>
                )}
                {provider.email && (
                  <div className="text-sm text-blue-600">
                    <a 
                      href={`mailto:${provider.email}`}
                      className="hover:underline"
                      title="Envoyer un email"
                    >
                      {provider.email}
                    </a>
                  </div>
                )}
                {provider.phone && (
                  <div className="text-sm text-blue-600">
                    <a 
                      href={`tel:${provider.phone}`}
                      className="hover:underline"
                      title="Appeler ce numéro"
                    >
                      {provider.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
            {/* Actions */}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditPricing(provider)}
                className="text-xs"
              >
                <Calculator className="h-3 w-3" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditBankDetails(provider)}
                className="text-xs text-green-600 hover:text-green-700"
              >
                <CreditCard className="h-3 w-3" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingProvider(provider)}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteClick(provider)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
        searchPlaceholder="Rechercher par nom, entreprise, email ou ville..."
        emptyStateMessage="Aucun prestataire trouvé"
        emptyStateIcon={<Settings className="h-12 w-12 text-gray-400 mx-auto" />}
        itemsPerPage={10}
      />

      <SyncStatusDialog
        isOpen={showSyncDialog}
        onClose={() => setShowSyncDialog(false)}
        onSyncComplete={handleSyncComplete}
      />

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Supprimer le prestataire"
        description={`Êtes-vous sûr de vouloir supprimer ${providerToDelete?.company_name} ? Cette action ne peut pas être annulée.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={deleteProvider}
        variant="destructive"
      />

      <SupplierPricingDialog
        open={showPricingDialog}
        onOpenChange={setShowPricingDialog}
        supplier={selectedProvider}
        onUpdate={() => {
          setShowPricingDialog(false);
          setSelectedProvider(null);
          fetchProviders();
        }}
      />

      <SupplierBankDetailsDialog
        open={showBankDetailsDialog}
        onOpenChange={setShowBankDetailsDialog}
        supplier={selectedProvider}
        onUpdate={() => {
          setShowBankDetailsDialog(false);
          setSelectedProvider(null);
          fetchProviders();
        }}
      />
    </div>
  );
};

export default ServiceProviders;
