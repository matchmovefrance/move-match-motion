
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, MapPin, Calendar, Volume2, Plus, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ServiceProvider {
  id: string;
  name: string;
  company_name: string;
  phone: string;
  email: string;
  service_provider_id: number | null;
}

interface SimpleMoveFormProps {
  onSuccess?: () => void;
  initialData?: any;
  isEditing?: boolean;
}

const SimpleMoveForm = ({ onSuccess, initialData, isEditing }: SimpleMoveFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [formData, setFormData] = useState({
    provider_id: '',
    departure_postal_code: '',
    arrival_postal_code: '',
    departure_date: '',
    max_volume: '',
    used_volume: ''
  });

  useEffect(() => {
    fetchProviders();
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

  const fetchProviders = async () => {
    try {
      setProvidersLoading(true);
      console.log('🏢 Chargement des prestataires depuis les trajets...');
      
      const { data, error } = await supabase
        .from('confirmed_moves')
        .select('mover_id, mover_name, company_name, contact_email, contact_phone')
        .not('mover_id', 'is', null);

      if (error) {
        console.error('❌ Erreur chargement prestataires:', error);
        throw error;
      }

      // Créer un Map pour éviter les doublons basés sur mover_name + company_name
      const uniqueSuppliersMap = new Map();
      
      data?.forEach((move) => {
        const key = `${move.mover_name}-${move.company_name}`;
        if (!uniqueSuppliersMap.has(key)) {
          uniqueSuppliersMap.set(key, {
            id: `move-supplier-${move.mover_id}`,
            company_name: move.company_name,
            name: move.mover_name,
            email: move.contact_email || '',
            phone: move.contact_phone || '',
            service_provider_id: move.mover_id,
          });
        }
      });

      const uniqueProviders = Array.from(uniqueSuppliersMap.values());
      console.log('✅ Prestataires uniques chargés depuis les trajets:', uniqueProviders.length);
      setProviders(uniqueProviders);
      
      if (uniqueProviders.length === 0) {
        toast({
          title: "Aucun prestataire",
          description: "Aucun prestataire trouvé. Créez des trajets ou ajoutez des prestataires.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les prestataires",
        variant: "destructive",
      });
      setProviders([]);
    } finally {
      setProvidersLoading(false);
    }
  };

  // Générer référence trajet
  const generateMoveReference = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `TRJ-${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté",
        variant: "destructive",
      });
      return;
    }

    // Validation
    if (!formData.provider_id || !formData.departure_postal_code || !formData.arrival_postal_code || 
        !formData.departure_date || !formData.max_volume) {
      toast({
        title: "Erreur",
        description: "Tous les champs obligatoires doivent être remplis",
        variant: "destructive",
      });
      return;
    }

    const usedVolume = parseFloat(formData.used_volume) || 0;
    const maxVolume = parseFloat(formData.max_volume);

    if (usedVolume > maxVolume) {
      toast({
        title: "Erreur",
        description: "Le volume utilisé ne peut pas dépasser le volume total",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Récupérer les infos du prestataire sélectionné
      const selectedProvider = providers.find(p => p.id === formData.provider_id);
      
      if (!selectedProvider) {
        throw new Error('Prestataire sélectionné non trouvé');
      }

      const moveReference = isEditing ? initialData?.move_reference : generateMoveReference();
      const availableVolume = maxVolume - usedVolume;

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
        move_reference: moveReference,
        mover_id: selectedProvider.service_provider_id || 1,
        truck_id: 1
      };

      if (isEditing && initialData?.id) {
        await supabase
          .from('confirmed_moves')
          .update(moveData)
          .eq('id', initialData.id);
      } else {
        await supabase
          .from('confirmed_moves')
          .insert(moveData);
      }

      toast({
        title: "Succès",
        description: `Trajet ${isEditing ? 'modifié' : 'créé'} avec la référence ${moveReference} (${availableVolume.toFixed(1)}m³ disponible)`,
      });

      // Reset form si nouveau trajet
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

      if (onSuccess) {
        onSuccess();
      }

    } catch (error: any) {
      console.error('Error saving move:', error);
      toast({
        title: "Erreur",
        description: `Impossible de sauvegarder: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const availableVolume = formData.max_volume && formData.used_volume 
    ? parseFloat(formData.max_volume) - parseFloat(formData.used_volume)
    : parseFloat(formData.max_volume) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Truck className="h-5 w-5" />
          <span>{isEditing ? 'Modifier le trajet' : 'Nouveau Trajet Déménageur'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Prestataire */}
          <div>
            <Label htmlFor="provider_id">Prestataire *</Label>
            <div className="flex items-center space-x-2">
              <Select 
                value={formData.provider_id} 
                onValueChange={(value) => setFormData({ ...formData, provider_id: value })}
                disabled={providersLoading}
              >
                <SelectTrigger>
                  <SelectValue 
                    placeholder={
                      providersLoading 
                        ? "Chargement des prestataires..." 
                        : providers.length === 0 
                          ? "Aucun prestataire disponible"
                          : "Sélectionner un prestataire"
                    } 
                  />
                </SelectTrigger>
                <SelectContent>
                  {providers.length === 0 && !providersLoading ? (
                    <div className="p-2 text-center text-gray-500">
                      <AlertCircle className="h-4 w-4 mx-auto mb-1" />
                      Aucun prestataire trouvé
                    </div>
                  ) : (
                    providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.company_name} - {provider.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const currentUrl = window.location.origin;
                  window.open(`${currentUrl}/pricing-tool#suppliers`, '_blank');
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {providers.length === 0 && !providersLoading && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                Aucun prestataire trouvé. Créez des trajets ou ajoutez des prestataires dans le Pricing Tool.
              </p>
            )}
            {providers.length > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                {providers.length} prestataire(s) disponible(s)
              </p>
            )}
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

          {/* Affichage volume disponible */}
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

          <Button 
            type="submit" 
            disabled={loading || providers.length === 0} 
            className="w-full"
          >
            {loading ? 'Enregistrement...' : (isEditing ? 'Mettre à jour le trajet' : 'Créer le trajet')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SimpleMoveForm;
