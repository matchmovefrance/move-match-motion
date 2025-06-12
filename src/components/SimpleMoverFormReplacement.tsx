
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, MapPin, Calendar, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SimpleMoverFormReplacementProps {
  onSuccess?: () => void;
}

const SimpleMoverFormReplacement = ({ onSuccess }: SimpleMoverFormReplacementProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    mover_name: '',
    departure_postal_code: '',
    arrival_postal_code: '',
    departure_date: '',
    max_volume: '',
    used_volume: ''
  });

  const calculateAvailableVolume = () => {
    const maxVol = parseFloat(formData.max_volume) || 0;
    const usedVol = parseFloat(formData.used_volume) || 0;
    return Math.max(0, maxVol - usedVol);
  };

  // Fonction pour synchroniser le prestataire dans service_providers
  const syncServiceProvider = async (moverData: typeof formData) => {
    try {
      // Vérifier si le prestataire existe déjà
      const { data: existingProvider } = await supabase
        .from('service_providers')
        .select('id')
        .eq('name', moverData.mover_name)
        .eq('company_name', moverData.company_name)
        .maybeSingle();

      if (!existingProvider) {
        // Ajouter le prestataire à service_providers s'il n'existe pas
        const { error: providerError } = await supabase
          .from('service_providers')
          .insert({
            name: moverData.mover_name,
            company_name: moverData.company_name,
            email: '',
            phone: '',
            address: `CP ${moverData.departure_postal_code}`,
            city: `CP ${moverData.departure_postal_code}`,
            postal_code: moverData.departure_postal_code,
            created_by: null // Accepter null pour les saisies publiques
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
    
    if (!formData.company_name || !formData.mover_name || 
        !formData.departure_postal_code || !formData.arrival_postal_code || 
        !formData.departure_date || !formData.max_volume) {
      toast({
        title: "Erreur",
        description: "Tous les champs obligatoires doivent être remplis",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const maxVolume = parseFloat(formData.max_volume);
      const usedVolume = parseFloat(formData.used_volume) || 0;
      const availableVolume = Math.max(0, maxVolume - usedVolume);

      // Synchroniser le prestataire dans service_providers
      await syncServiceProvider(formData);

      // Préparer les données du trajet - utiliser un UUID par défaut pour created_by
      const defaultUserId = '00000000-0000-0000-0000-000000000000'; // UUID par défaut pour les saisies publiques
      
      const moveData = {
        company_name: formData.company_name,
        mover_name: formData.mover_name,
        contact_phone: '',
        departure_city: `CP ${formData.departure_postal_code}`,
        departure_postal_code: formData.departure_postal_code,
        arrival_city: `CP ${formData.arrival_postal_code}`,
        arrival_postal_code: formData.arrival_postal_code,
        departure_date: formData.departure_date,
        max_volume: maxVolume,
        used_volume: usedVolume,
        available_volume: availableVolume,
        departure_address: '',
        arrival_address: '',
        departure_country: 'France',
        arrival_country: 'France',
        truck_identifier: 'AUTO-GENERATED',
        truck_type: 'Semi-remorque',
        price_per_m3: 0,
        status: 'confirmed',
        mover_id: 1,
        truck_id: 1,
        created_by: defaultUserId // Utiliser l'UUID par défaut
      };

      console.log('📝 Données du trajet à insérer:', moveData);

      const { error } = await supabase
        .from('confirmed_moves')
        .insert(moveData);

      if (error) {
        console.error('❌ Erreur lors de l\'insertion:', error);
        throw error;
      }

      toast({
        title: "Trajet enregistré",
        description: `Trajet enregistré avec ${availableVolume.toFixed(1)}m³ disponible`,
      });

      // Reset form
      setFormData({
        company_name: '',
        mover_name: '',
        departure_postal_code: '',
        arrival_postal_code: '',
        departure_date: '',
        max_volume: '',
        used_volume: ''
      });

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Truck className="h-5 w-5" />
          <span>Nouveau Trajet</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_name">Nom de l'entreprise *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Nom de votre entreprise"
                required
              />
            </div>
            <div>
              <Label htmlFor="mover_name">Nom du responsable *</Label>
              <Input
                id="mover_name"
                value={formData.mover_name}
                onChange={(e) => setFormData({ ...formData, mover_name: e.target.value })}
                placeholder="Votre nom"
                required
              />
            </div>
          </div>

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

          <div>
            <Label htmlFor="departure_date">Date de départ *</Label>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max_volume">Volume maximum (m³) *</Label>
              <div className="flex items-center space-x-2">
                <Volume2 className="h-4 w-4 text-orange-600" />
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
                <Volume2 className="h-4 w-4 text-blue-600" />
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

          {formData.max_volume && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {calculateAvailableVolume().toFixed(1)} m³
                  </div>
                  <div className="text-sm text-green-700">Volume disponible</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {formData.max_volume && parseFloat(formData.max_volume) > 0 
                      ? ((parseFloat(formData.used_volume) || 0) / parseFloat(formData.max_volume) * 100).toFixed(1) 
                      : 0}%
                  </div>
                  <div className="text-sm text-blue-700">Taux d'occupation</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600">
                    {parseFloat(formData.used_volume) || 0} m³
                  </div>
                  <div className="text-sm text-purple-700">Volume utilisé</div>
                </div>
              </div>

              {parseFloat(formData.used_volume) > parseFloat(formData.max_volume) && formData.max_volume && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  ⚠️ Le volume utilisé ne peut pas dépasser le volume maximum
                </div>
              )}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Enregistrement...' : 'Enregistrer le trajet'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SimpleMoverFormReplacement;
