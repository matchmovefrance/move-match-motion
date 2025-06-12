
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, MapPin, Calendar, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface Provider {
  id: string;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  source: string;
}

interface NewMoveFormProps {
  onSuccess?: () => void;
  initialData?: any;
  isEditing?: boolean;
}

const NewMoveForm = ({ onSuccess, initialData, isEditing = false }: NewMoveFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    provider_id: '',
    departure_postal_code: '',
    arrival_postal_code: '',
    departure_date: '',
    max_volume: '',
    used_volume: ''
  });

  // Récupération des prestataires depuis la table service_providers
  const { data: serviceProviders = [], isLoading: serviceProvidersLoading } = useQuery({
    queryKey: ['service-providers'],
    queryFn: async () => {
      console.log('🔄 Récupération des prestataires depuis service_providers');
      
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .order('company_name');

      if (error) {
        console.error('❌ Erreur récupération des prestataires:', error);
        throw error;
      }
      
      // Transformer les données au format requis
      const formattedProviders = data?.map(provider => ({
        id: provider.id.toString(),
        name: provider.name,
        company_name: provider.company_name,
        email: provider.email || '',
        phone: provider.phone || '',
        source: 'service_providers'
      })) || [];
      
      console.log('✅ Prestataires depuis service_providers:', formattedProviders.length);
      return formattedProviders;
    },
    enabled: !!user
  });

  // Récupération des prestataires uniques depuis confirmed_moves
  const { data: moveProviders = [], isLoading: moveProvidersLoading } = useQuery({
    queryKey: ['move-providers'],
    queryFn: async () => {
      console.log('🔄 Récupération des prestataires depuis confirmed_moves');
      
      const { data, error } = await supabase
        .from('confirmed_moves')
        .select('mover_id, mover_name, company_name, contact_email, contact_phone')
        .not('mover_id', 'is', null)
        .not('company_name', 'is', null);

      if (error) {
        console.error('❌ Erreur récupération des prestataires depuis trajets:', error);
        throw error;
      }
      
      // Création d'un Map pour éviter les doublons
      const uniqueProvidersMap = new Map();
      
      data?.forEach((move) => {
        // Clé unique basée sur le nom du prestataire et le nom de l'entreprise
        const key = `${move.mover_name}-${move.company_name}`.toLowerCase();
        
        if (!uniqueProvidersMap.has(key)) {
          uniqueProvidersMap.set(key, {
            id: `move-${move.mover_id || '0'}`,
            name: move.mover_name || 'Sans nom',
            company_name: move.company_name || 'Sans entreprise',
            email: move.contact_email || '',
            phone: move.contact_phone || '',
            source: 'confirmed_moves'
          });
        }
      });

      const uniqueProviders = Array.from(uniqueProvidersMap.values());
      console.log('✅ Prestataires uniques depuis confirmed_moves:', uniqueProviders.length);
      return uniqueProviders;
    },
    enabled: !!user
  });

  // Combiner les prestataires des deux sources
  const allProviders = [
    ...serviceProviders,
    ...moveProviders.filter(moveProvider => 
      // Exclure les prestataires de confirmed_moves qui sont déjà présents dans service_providers
      !serviceProviders.some(sp => 
        sp.name.toLowerCase() === moveProvider.name.toLowerCase() && 
        sp.company_name.toLowerCase() === moveProvider.company_name.toLowerCase()
      )
    )
  ];

  const providersLoading = serviceProvidersLoading || moveProvidersLoading;

  // Initialiser le formulaire avec les données existantes si on est en mode édition
  useEffect(() => {
    if (initialData) {
      setFormData({
        provider_id: initialData.provider_id?.toString() || '',
        departure_postal_code: initialData.departure_postal_code || '',
        arrival_postal_code: initialData.arrival_postal_code || '',
        departure_date: initialData.departure_date || '',
        max_volume: initialData.max_volume?.toString() || '',
        used_volume: initialData.used_volume?.toString() || ''
      });
    }
  }, [initialData]);

  // Fonction pour synchroniser le prestataire dans service_providers
  const syncServiceProvider = async (selectedProvider: Provider) => {
    try {
      // Si le prestataire vient déjà de service_providers, pas besoin de synchroniser
      if (selectedProvider.source === 'service_providers') {
        return;
      }

      // Vérifier si le prestataire existe déjà
      const { data: existingProvider } = await supabase
        .from('service_providers')
        .select('id')
        .eq('name', selectedProvider.name)
        .eq('company_name', selectedProvider.company_name)
        .maybeSingle();

      if (!existingProvider) {
        // Ajouter le prestataire à service_providers s'il n'existe pas
        const { error: providerError } = await supabase
          .from('service_providers')
          .insert({
            name: selectedProvider.name,
            company_name: selectedProvider.company_name,
            email: selectedProvider.email || '',
            phone: selectedProvider.phone || '',
            address: '',
            city: '',
            postal_code: '',
            created_by: user?.id
          });

        if (providerError) {
          console.warn('Erreur lors de la synchronisation du prestataire:', providerError);
        } else {
          console.log('Prestataire synchronisé dans service_providers');
        }
      }
    } catch (error) {
      console.warn('Erreur lors de la synchronisation:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour créer un trajet",
        variant: "destructive",
      });
      return;
    }

    // Validation basique des champs requis
    if (!formData.provider_id || !formData.departure_postal_code || !formData.arrival_postal_code || 
        !formData.departure_date || !formData.max_volume) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    // Validation des volumes
    const maxVolume = parseFloat(formData.max_volume);
    const usedVolume = parseFloat(formData.used_volume) || 0;
    
    if (usedVolume > maxVolume) {
      toast({
        title: "Erreur",
        description: "Le volume utilisé ne peut pas être supérieur au volume total",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Recherche du prestataire sélectionné
      const selectedProvider = allProviders.find(p => p.id === formData.provider_id);
      
      if (!selectedProvider) {
        toast({
          title: "Erreur",
          description: "Prestataire non trouvé",
          variant: "destructive",
        });
        return;
      }

      // Synchroniser le prestataire dans service_providers
      await syncServiceProvider(selectedProvider);

      const availableVolume = maxVolume - usedVolume;

      // Préparer les données du trajet
      const moveData = {
        mover_name: selectedProvider.name,
        company_name: selectedProvider.company_name,
        departure_city: `CP ${formData.departure_postal_code}`,
        departure_postal_code: formData.departure_postal_code,
        departure_country: 'France',
        arrival_city: `CP ${formData.arrival_postal_code}`,
        arrival_postal_code: formData.arrival_postal_code,
        arrival_country: 'France',
        departure_date: formData.departure_date,
        max_volume: maxVolume,
        used_volume: usedVolume,
        available_volume: availableVolume,
        status: 'confirmed',
        status_custom: 'en_cours',
        contact_phone: selectedProvider.phone,
        contact_email: selectedProvider.email,
        created_by: user.id,
        // Si le prestataire vient de service_providers, utiliser son ID, sinon 1 par défaut
        mover_id: selectedProvider.source === 'service_providers' 
          ? parseInt(selectedProvider.id) 
          : parseInt(selectedProvider.id.replace('move-', '')) || 1,
        truck_id: 1
      };

      // Créer ou modifier le trajet
      if (isEditing && initialData?.id) {
        const { error } = await supabase
          .from('confirmed_moves')
          .update(moveData)
          .eq('id', initialData.id);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('confirmed_moves')
          .insert(moveData);
          
        if (error) throw error;
      }

      // Notification de succès
      toast({
        title: "Trajet enregistré",
        description: `Trajet ${isEditing ? 'modifié' : 'créé'} avec succès (${availableVolume.toFixed(1)}m³ disponible)`,
      });

      // Réinitialiser le formulaire si ce n'est pas une modification
      if (!isEditing) {
        setFormData({
          provider_id: '',
          departure_postal_code: '',
          arrival_postal_code: '',
          departure_date: '',
          max_volume: '',
          used_volume: ''
        });
      }

      // Appeler la fonction de callback si elle existe
      if (onSuccess) {
        onSuccess();
      }

    } catch (error: any) {
      console.error('❌ Erreur lors de la sauvegarde du trajet:', error);
      toast({
        title: "Erreur",
        description: `Impossible de sauvegarder le trajet: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculer le volume disponible pour affichage
  const availableVolume = formData.max_volume && formData.used_volume 
    ? parseFloat(formData.max_volume) - parseFloat(formData.used_volume)
    : parseFloat(formData.max_volume) || 0;

  // Logging pour le débogage
  console.log('📊 Résumé des prestataires dans NewMoveForm:', {
    serviceProviders: serviceProviders.length,
    moveProviders: moveProviders.length,
    allProviders: allProviders.length,
    loading: providersLoading
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Truck className="h-5 w-5" />
          <span>{isEditing ? 'Modifier le trajet' : 'Nouveau Trajet Déménageur'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sélection du prestataire */}
          <div>
            <Label htmlFor="provider_id">Prestataire *</Label>
            <div className="flex items-center space-x-2">
              <Select 
                value={formData.provider_id} 
                onValueChange={(value) => setFormData({ ...formData, provider_id: value })}
                disabled={providersLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue 
                    placeholder={
                      providersLoading 
                        ? "Chargement des prestataires..." 
                        : allProviders.length === 0 
                          ? "Aucun prestataire disponible"
                          : "Sélectionner un prestataire"
                    } 
                  />
                </SelectTrigger>
                <SelectContent>
                  {allProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.company_name} - {provider.name}
                      {provider.source === 'service_providers' ? (
                        <span className="text-xs text-blue-600 ml-2">(DB)</span>
                      ) : (
                        <span className="text-xs text-green-600 ml-2">(Trajet)</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const newWindow = window.open('/pricing-tool', '_blank');
                  if (newWindow) {
                    setTimeout(() => {
                      newWindow.location.hash = '#suppliers';
                    }, 500);
                  }
                }}
              >
                +
              </Button>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Si le prestataire n'existe pas, ajoutez-le dans l'onglet "Prestataires"
            </p>
          </div>

          {/* Codes postaux */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="departure_postal_code">Code postal départ *</Label>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <Input
                  id="departure_postal_code"
                  value={formData.departure_postal_code}
                  onChange={(e) => setFormData({ ...formData, departure_postal_code: e.target.value })}
                  placeholder="Ex: 75001"
                  maxLength={5}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="arrival_postal_code">Code postal arrivée *</Label>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-red-600" />
                <Input
                  id="arrival_postal_code"
                  value={formData.arrival_postal_code}
                  onChange={(e) => setFormData({ ...formData, arrival_postal_code: e.target.value })}
                  placeholder="Ex: 69001"
                  maxLength={5}
                  required
                />
              </div>
            </div>
          </div>

          {/* Date du trajet */}
          <div>
            <Label htmlFor="departure_date">Date du trajet *</Label>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <Input
                id="departure_date"
                type="date"
                value={formData.departure_date}
                onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              ⚠️ Date fixe - non modifiable (contrairement aux clients qui ont de la flexibilité)
            </p>
          </div>

          {/* Volumes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max_volume">Volume total camion (m³) *</Label>
              <div className="flex items-center space-x-2">
                <Volume2 className="h-4 w-4 text-blue-600" />
                <Input
                  id="max_volume"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.max_volume}
                  onChange={(e) => setFormData({ ...formData, max_volume: e.target.value })}
                  placeholder="Ex: 50"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="used_volume">Volume utilisé (m³)</Label>
              <div className="flex items-center space-x-2">
                <Volume2 className="h-4 w-4 text-orange-600" />
                <Input
                  id="used_volume"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.used_volume}
                  onChange={(e) => setFormData({ ...formData, used_volume: e.target.value })}
                  placeholder="Ex: 15.5"
                />
              </div>
            </div>
          </div>

          {/* Résumé des volumes */}
          {formData.max_volume && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {availableVolume.toFixed(1)} m³
                  </div>
                  <div className="text-sm text-green-700">Volume disponible</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {formData.max_volume ? ((parseFloat(formData.used_volume) || 0) / parseFloat(formData.max_volume) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-sm text-blue-700">Taux d'occupation</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600">
                    {parseFloat(formData.max_volume).toFixed(1)} m³
                  </div>
                  <div className="text-sm text-purple-700">Volume total</div>
                </div>
              </div>

              {availableVolume < 0 && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  ⚠️ Le volume utilisé dépasse le volume total !
                </div>
              )}
            </div>
          )}

          {/* Bouton de soumission */}
          <Button 
            type="submit" 
            disabled={loading || allProviders.length === 0} 
            className="w-full"
          >
            {loading 
              ? 'Enregistrement...' 
              : (isEditing 
                ? 'Mettre à jour le trajet' 
                : 'Créer le trajet'
              )
            }
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default NewMoveForm;
