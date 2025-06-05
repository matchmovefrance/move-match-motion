
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, MapPin, Calendar, Volume2, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import AddressAutocomplete from './AddressAutocomplete';

interface MoveFormData {
  mover_name: string;
  company_name: string;
  departure_city: string;
  departure_postal_code: string;
  departure_address: string;
  arrival_city: string;
  arrival_postal_code: string;
  arrival_address: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  max_volume: number;
  price_per_m3: number;
  contact_phone: string;
  contact_email: string;
  description: string;
  route_type: string;
}

interface MoveFormProps {
  onSuccess?: () => void;
}

const MoveForm: React.FC<MoveFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<MoveFormData>({
    mover_name: '',
    company_name: '',
    departure_city: '',
    departure_postal_code: '',
    departure_address: '',
    arrival_city: '',
    arrival_postal_code: '',
    arrival_address: '',
    departure_date: '',
    departure_time: '',
    arrival_time: '',
    max_volume: 0,
    price_per_m3: 0,
    contact_phone: '',
    contact_email: '',
    description: '',
    route_type: 'direct'
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof MoveFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressSelect = (type: 'departure' | 'arrival', address: any) => {
    if (type === 'departure') {
      setFormData(prev => ({
        ...prev,
        departure_address: address.formatted_address,
        departure_city: address.city,
        departure_postal_code: address.postal_code
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        arrival_address: address.formatted_address,
        arrival_city: address.city,
        arrival_postal_code: address.postal_code
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour ajouter un déménagement",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Calculer le volume disponible (initialement égal au volume max)
      const available_volume = formData.max_volume;

      const moveData = {
        ...formData,
        used_volume: 0,
        available_volume,
        total_price: 0,
        status: 'confirmed',
        status_custom: 'en_cours',
        created_by: user.id,
        mover_id: 1, // Valeur par défaut
        truck_id: 1, // Valeur par défaut
        estimated_arrival_date: formData.departure_date,
        estimated_arrival_time: formData.arrival_time
      };

      const { error } = await supabase
        .from('confirmed_moves')
        .insert(moveData);

      if (error) {
        console.error('Error inserting move:', error);
        throw error;
      }

      toast({
        title: "Succès",
        description: "Déménagement ajouté avec succès",
      });

      // Reset form
      setFormData({
        mover_name: '',
        company_name: '',
        departure_city: '',
        departure_postal_code: '',
        departure_address: '',
        arrival_city: '',
        arrival_postal_code: '',
        arrival_address: '',
        departure_date: '',
        departure_time: '',
        arrival_time: '',
        max_volume: 0,
        price_per_m3: 0,
        contact_phone: '',
        contact_email: '',
        description: '',
        route_type: 'direct'
      });

      if (onSuccess) {
        onSuccess();
      }

    } catch (error: any) {
      console.error('Error submitting move:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout du déménagement",
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
          <span>Nouveau Déménagement</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations du déménageur */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mover_name">Nom du déménageur *</Label>
              <Input
                id="mover_name"
                value={formData.mover_name}
                onChange={(e) => handleInputChange('mover_name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="company_name">Nom de l'entreprise *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_phone">Téléphone</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange('contact_phone', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="contact_email">Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
              />
            </div>
          </div>

          {/* Adresses */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Itinéraire</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Adresse de départ *</Label>
                <AddressAutocomplete
                  onAddressSelect={(address) => handleAddressSelect('departure', address)}
                  placeholder="Rechercher l'adresse de départ"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Ville"
                    value={formData.departure_city}
                    onChange={(e) => handleInputChange('departure_city', e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Code postal"
                    value={formData.departure_postal_code}
                    onChange={(e) => handleInputChange('departure_postal_code', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Adresse d'arrivée *</Label>
                <AddressAutocomplete
                  onAddressSelect={(address) => handleAddressSelect('arrival', address)}
                  placeholder="Rechercher l'adresse d'arrivée"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Ville"
                    value={formData.arrival_city}
                    onChange={(e) => handleInputChange('arrival_city', e.target.value)}
                    required
                  />
                  <Input
                    placeholder="Code postal"
                    value={formData.arrival_postal_code}
                    onChange={(e) => handleInputChange('arrival_postal_code', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Type de trajet */}
          <div>
            <Label htmlFor="route_type">Type de trajet</Label>
            <Select value={formData.route_type} onValueChange={(value) => handleInputChange('route_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le type de trajet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="direct">Trajet direct</SelectItem>
                <SelectItem value="flexible">Trajet flexible (dates modifiables)</SelectItem>
              </SelectContent>
            </Select>
            {formData.route_type === 'flexible' && (
              <p className="text-sm text-gray-600 mt-1">
                Un trajet flexible permet aux clients de modifier leurs dates de déménagement.
              </p>
            )}
          </div>

          {/* Dates et horaires */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Planning</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="departure_date">Date de départ *</Label>
                <Input
                  id="departure_date"
                  type="date"
                  value={formData.departure_date}
                  onChange={(e) => handleInputChange('departure_date', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="departure_time">Heure de départ</Label>
                <Input
                  id="departure_time"
                  type="time"
                  value={formData.departure_time}
                  onChange={(e) => handleInputChange('departure_time', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="arrival_time">Heure d'arrivée estimée</Label>
                <Input
                  id="arrival_time"
                  type="time"
                  value={formData.arrival_time}
                  onChange={(e) => handleInputChange('arrival_time', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Volume et prix */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Volume2 className="h-5 w-5" />
              <span>Capacité et Tarification</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max_volume">Volume maximum (m³) *</Label>
                <Input
                  id="max_volume"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.max_volume}
                  onChange={(e) => handleInputChange('max_volume', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="price_per_m3">Prix par m³ (€)</Label>
                <Input
                  id="price_per_m3"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_per_m3}
                  onChange={(e) => handleInputChange('price_per_m3', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (optionnel)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Informations supplémentaires sur le déménagement"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Ajout en cours...' : 'Ajouter le déménagement'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MoveForm;
