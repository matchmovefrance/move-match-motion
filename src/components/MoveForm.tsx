import { useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, MapPin, Calendar, Volume2, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import AddressAutocomplete from './AddressAutocomplete';

interface MoveFormData {
  // Informations du déménageur
  mover_name: string;
  company_name: string;
  contact_email: string;
  contact_phone: string;
  
  // Informations du camion
  truck_identifier: string;
  truck_type: string;
  max_volume: string;
  max_weight: string;
  
  // Trajet
  departure_address: string;
  departure_city: string;
  departure_postal_code: string;
  departure_country: string;
  departure_date: string;
  departure_time: string;
  
  arrival_address: string;
  arrival_city: string;
  arrival_postal_code: string;
  arrival_country: string;
  estimated_arrival_date: string;
  estimated_arrival_time: string;
  
  // Capacité et volume
  used_volume: string;
  available_volume: string;
  number_of_clients: string;
  
  // Statut et suivi
  status: string;
  status_custom: string;
  route_type: string;
  
  // Informations supplémentaires
  description: string;
  special_conditions: string;
  equipment_available: string;
  insurance_details: string;
  
  // Tarification
  base_rate: string;
  fuel_surcharge: string;
  additional_fees: string;
  total_cost: string;
  price_per_m3: string;
  total_price: string;
}

interface MoveFormProps {
  onSubmit: (data: MoveFormData) => void;
  initialData?: Partial<MoveFormData>;
  isEditing?: boolean;
}

const MoveForm = ({ onSubmit, initialData, isEditing = false }: MoveFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<MoveFormData>({
    mover_name: '',
    company_name: '',
    contact_email: '',
    contact_phone: '',
    truck_identifier: '',
    truck_type: 'Semi-remorque',
    max_volume: '',
    max_weight: '',
    departure_address: '',
    departure_city: '',
    departure_postal_code: '',
    departure_country: 'France',
    departure_date: '',
    departure_time: '',
    arrival_address: '',
    arrival_city: '',
    arrival_postal_code: '',
    arrival_country: 'France',
    estimated_arrival_date: '',
    estimated_arrival_time: '',
    used_volume: '0',
    available_volume: '',
    number_of_clients: '0',
    status: 'confirmed',
    status_custom: 'en_cours',
    route_type: 'direct',
    description: '',
    special_conditions: '',
    equipment_available: '',
    insurance_details: '',
    base_rate: '',
    fuel_surcharge: '',
    additional_fees: '',
    total_cost: '',
    price_per_m3: '',
    total_price: '',
    ...initialData
  });

  const handleInputChange = (field: keyof MoveFormData, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Calculer automatiquement le volume disponible
      if (field === 'max_volume' || field === 'used_volume') {
        const maxVol = parseFloat(updated.max_volume || '0');
        const usedVol = parseFloat(updated.used_volume || '0');
        updated.available_volume = (maxVol - usedVol).toString();
      }
      
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.mover_name || !formData.departure_city || !formData.arrival_city || !formData.max_volume) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    // Nettoyer les champs time et date avant soumission
    const cleanTimeField = (value: string) => {
      return value && value.trim() !== '' ? value : null;
    };

    const processedData = {
      ...formData,
      departure_time: cleanTimeField(formData.departure_time),
      estimated_arrival_time: cleanTimeField(formData.estimated_arrival_time),
      estimated_arrival_date: cleanTimeField(formData.estimated_arrival_date),
    };

    onSubmit(processedData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Truck className="h-5 w-5 text-blue-600" />
            <span>{isEditing ? 'Modifier le déménagement' : 'Nouveau déménagement'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations du déménageur */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Informations du déménageur</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mover_name">Nom du déménageur *</Label>
                  <Input
                    id="mover_name"
                    value={formData.mover_name}
                    onChange={(e) => handleInputChange('mover_name', e.target.value)}
                    placeholder="Jean Martin"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="company_name">Nom de l'entreprise *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="Transport Express SARL"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email">Email de contact</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    placeholder="contact@transport-express.fr"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone">Téléphone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>
            </div>

            {/* Informations du camion */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Truck className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold">Informations du camion</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="truck_identifier">Identifiant camion *</Label>
                  <Input
                    id="truck_identifier"
                    value={formData.truck_identifier}
                    onChange={(e) => handleInputChange('truck_identifier', e.target.value)}
                    placeholder="CAM-001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="truck_type">Type de camion</Label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.truck_type}
                    onChange={(e) => handleInputChange('truck_type', e.target.value)}
                  >
                    <option value="Camionnette">Camionnette</option>
                    <option value="Camion 12m³">Camion 12m³</option>
                    <option value="Camion 20m³">Camion 20m³</option>
                    <option value="Semi-remorque">Semi-remorque</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="max_volume">Volume maximum (m³) *</Label>
                  <Input
                    id="max_volume"
                    type="number"
                    step="0.1"
                    value={formData.max_volume}
                    onChange={(e) => handleInputChange('max_volume', e.target.value)}
                    placeholder="25.0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="max_weight">Poids maximum (kg)</Label>
                  <Input
                    id="max_weight"
                    type="number"
                    value={formData.max_weight}
                    onChange={(e) => handleInputChange('max_weight', e.target.value)}
                    placeholder="3500"
                  />
                </div>
              </div>
            </div>

            {/* Départ avec autocomplétion */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold">Point de départ</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <AddressAutocomplete
                    label="Adresse de départ"
                    value={formData.departure_address}
                    onChange={(value) => handleInputChange('departure_address', value)}
                    placeholder="123 Rue de la République, Paris"
                    id="departure_address"
                  />
                </div>
                <div>
                  <Label htmlFor="departure_city">Ville de départ *</Label>
                  <Input
                    id="departure_city"
                    value={formData.departure_city}
                    onChange={(e) => handleInputChange('departure_city', e.target.value)}
                    placeholder="Paris"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="departure_postal_code">Code postal *</Label>
                  <Input
                    id="departure_postal_code"
                    value={formData.departure_postal_code}
                    onChange={(e) => handleInputChange('departure_postal_code', e.target.value)}
                    placeholder="75001"
                    required
                  />
                </div>
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
              </div>
            </div>

            {/* Arrivée avec autocomplétion */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-red-600" />
                <h3 className="text-lg font-semibold">Point d'arrivée</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <AddressAutocomplete
                    label="Adresse d'arrivée"
                    value={formData.arrival_address}
                    onChange={(value) => handleInputChange('arrival_address', value)}
                    placeholder="456 Avenue des Champs, Lyon"
                    id="arrival_address"
                  />
                </div>
                <div>
                  <Label htmlFor="arrival_city">Ville d'arrivée *</Label>
                  <Input
                    id="arrival_city"
                    value={formData.arrival_city}
                    onChange={(e) => handleInputChange('arrival_city', e.target.value)}
                    placeholder="Lyon"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="arrival_postal_code">Code postal *</Label>
                  <Input
                    id="arrival_postal_code"
                    value={formData.arrival_postal_code}
                    onChange={(e) => handleInputChange('arrival_postal_code', e.target.value)}
                    placeholder="69001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="estimated_arrival_date">Date d'arrivée estimée</Label>
                  <Input
                    id="estimated_arrival_date"
                    type="date"
                    value={formData.estimated_arrival_date}
                    onChange={(e) => handleInputChange('estimated_arrival_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="estimated_arrival_time">Heure d'arrivée estimée</Label>
                  <Input
                    id="estimated_arrival_time"
                    type="time"
                    value={formData.estimated_arrival_time}
                    onChange={(e) => handleInputChange('estimated_arrival_time', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Capacité et volume */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Volume2 className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Capacité et chargement</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="used_volume">Volume utilisé (m³)</Label>
                  <Input
                    id="used_volume"
                    type="number"
                    step="0.1"
                    value={formData.used_volume}
                    onChange={(e) => handleInputChange('used_volume', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="available_volume">Volume disponible (m³)</Label>
                  <Input
                    id="available_volume"
                    type="number"
                    step="0.1"
                    value={formData.available_volume}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="number_of_clients">Nombre de clients</Label>
                  <Input
                    id="number_of_clients"
                    type="number"
                    value={formData.number_of_clients}
                    onChange={(e) => handleInputChange('number_of_clients', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Statut et type */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Statut et classification</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <option value="confirmed">Confirmé</option>
                    <option value="pending">En attente</option>
                    <option value="completed">Terminé</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="status_custom">Statut personnalisé</Label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.status_custom}
                    onChange={(e) => handleInputChange('status_custom', e.target.value)}
                  >
                    <option value="en_cours">En cours</option>
                    <option value="termine">Terminé</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="route_type">Type de trajet</Label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.route_type}
                    onChange={(e) => handleInputChange('route_type', e.target.value)}
                  >
                    <option value="direct">Direct</option>
                    <option value="grouped">Groupé</option>
                    <option value="return">Retour</option>
                    <option value="loop">Boucle</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold">Informations supplémentaires</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Description du trajet..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="special_conditions">Conditions particulières</Label>
                  <Textarea
                    id="special_conditions"
                    value={formData.special_conditions}
                    onChange={(e) => handleInputChange('special_conditions', e.target.value)}
                    placeholder="Restrictions, péages, horaires..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="equipment_available">Équipement disponible</Label>
                  <Textarea
                    id="equipment_available"
                    value={formData.equipment_available}
                    onChange={(e) => handleInputChange('equipment_available', e.target.value)}
                    placeholder="Sangles, diable, monte-charge..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="insurance_details">Détails assurance</Label>
                  <Textarea
                    id="insurance_details"
                    value={formData.insurance_details}
                    onChange={(e) => handleInputChange('insurance_details', e.target.value)}
                    placeholder="Couverture, limites, conditions..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Tarification */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tarification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_per_m3">Prix par m³ (€)</Label>
                  <Input
                    id="price_per_m3"
                    type="number"
                    step="0.01"
                    value={formData.price_per_m3}
                    onChange={(e) => handleInputChange('price_per_m3', e.target.value)}
                    placeholder="50.00"
                  />
                </div>
                <div>
                  <Label htmlFor="total_price">Prix total (€)</Label>
                  <Input
                    id="total_price"
                    type="number"
                    step="0.01"
                    value={formData.total_price}
                    onChange={(e) => handleInputChange('total_price', e.target.value)}
                    placeholder="1250.00"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-4 pt-6 border-t">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {isEditing ? 'Mettre à jour' : 'Ajouter le déménagement'}
              </Button>
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MoveForm;
