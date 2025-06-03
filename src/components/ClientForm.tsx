
import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin, Calendar, Volume2, Euro, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import AddressAutocomplete from './AddressAutocomplete';

interface ClientFormData {
  // Informations personnelles
  name: string;
  email: string;
  phone: string;
  
  // Adresse de départ
  departure_address: string;
  departure_city: string;
  departure_postal_code: string;
  departure_country: string;
  
  // Adresse d'arrivée
  arrival_address: string;
  arrival_city: string;
  arrival_postal_code: string;
  arrival_country: string;
  
  // Détails du déménagement
  desired_date: string;
  flexible_dates: boolean;
  date_range_start: string;
  date_range_end: string;
  estimated_volume: string;
  description: string;
  
  // Devis
  budget_min: string;
  budget_max: string;
  quote_amount: string;
  
  // Informations supplémentaires
  special_requirements: string;
  access_conditions: string;
  inventory_list: string;
}

interface ClientFormProps {
  onSubmit: (data: ClientFormData) => void;
  initialData?: Partial<ClientFormData>;
  isEditing?: boolean;
}

const ClientForm = ({ onSubmit, initialData, isEditing = false }: ClientFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    phone: '',
    departure_address: '',
    departure_city: '',
    departure_postal_code: '',
    departure_country: 'France',
    arrival_address: '',
    arrival_city: '',
    arrival_postal_code: '',
    arrival_country: 'France',
    desired_date: '',
    flexible_dates: false,
    date_range_start: '',
    date_range_end: '',
    estimated_volume: '',
    description: '',
    budget_min: '',
    budget_max: '',
    quote_amount: '',
    special_requirements: '',
    access_conditions: '',
    inventory_list: '',
    ...initialData
  });

  const handleInputChange = (field: keyof ClientFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation basique
    if (!formData.name || !formData.email || !formData.phone || !formData.departure_city || !formData.arrival_city) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    onSubmit(formData);
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
            <User className="h-5 w-5 text-blue-600" />
            <span>{isEditing ? 'Modifier la demande de déménagement' : 'Nouvelle demande de déménagement'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations personnelles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name">Nom complet *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Jean Dupont"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="jean.dupont@email.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="06 12 34 56 78"
                  required
                />
              </div>
            </div>

            {/* Adresse de départ */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold">Adresse de départ</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <AddressAutocomplete
                    label="Adresse complète"
                    value={formData.departure_address}
                    onChange={(value) => handleInputChange('departure_address', value)}
                    placeholder="123 Rue de la Paix, Paris"
                    required
                    id="departure_address"
                  />
                </div>
                <div>
                  <Label htmlFor="departure_city">Ville *</Label>
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
              </div>
            </div>

            {/* Adresse d'arrivée */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-red-600" />
                <h3 className="text-lg font-semibold">Adresse d'arrivée</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <AddressAutocomplete
                    label="Adresse complète"
                    value={formData.arrival_address}
                    onChange={(value) => handleInputChange('arrival_address', value)}
                    placeholder="456 Avenue des Champs, Lyon"
                    required
                    id="arrival_address"
                  />
                </div>
                <div>
                  <Label htmlFor="arrival_city">Ville *</Label>
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
              </div>
            </div>

            {/* Détails du déménagement */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Détails du déménagement</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="desired_date">Date souhaitée *</Label>
                  <Input
                    id="desired_date"
                    type="date"
                    value={formData.desired_date}
                    onChange={(e) => handleInputChange('desired_date', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="estimated_volume">Volume estimé (m³) *</Label>
                  <Input
                    id="estimated_volume"
                    type="number"
                    step="0.1"
                    value={formData.estimated_volume}
                    onChange={(e) => handleInputChange('estimated_volume', e.target.value)}
                    placeholder="25.5"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description du déménagement</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Appartement 3 pièces, meubles lourds..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Budget et devis */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Euro className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold">Budget et devis</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="budget_min">Budget minimum (€)</Label>
                  <Input
                    id="budget_min"
                    type="number"
                    value={formData.budget_min}
                    onChange={(e) => handleInputChange('budget_min', e.target.value)}
                    placeholder="1000"
                  />
                </div>
                <div>
                  <Label htmlFor="budget_max">Budget maximum (€)</Label>
                  <Input
                    id="budget_max"
                    type="number"
                    value={formData.budget_max}
                    onChange={(e) => handleInputChange('budget_max', e.target.value)}
                    placeholder="1500"
                  />
                </div>
                <div>
                  <Label htmlFor="quote_amount">Montant du devis (€)</Label>
                  <Input
                    id="quote_amount"
                    type="number"
                    value={formData.quote_amount}
                    onChange={(e) => handleInputChange('quote_amount', e.target.value)}
                    placeholder="1200"
                  />
                </div>
              </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informations supplémentaires</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="special_requirements">Exigences particulières</Label>
                  <Textarea
                    id="special_requirements"
                    value={formData.special_requirements}
                    onChange={(e) => handleInputChange('special_requirements', e.target.value)}
                    placeholder="Piano, objets fragiles, démontage..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="access_conditions">Conditions d'accès</Label>
                  <Textarea
                    id="access_conditions"
                    value={formData.access_conditions}
                    onChange={(e) => handleInputChange('access_conditions', e.target.value)}
                    placeholder="3ème étage sans ascenseur, parking..."
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="inventory_list">Liste d'inventaire</Label>
                  <Textarea
                    id="inventory_list"
                    value={formData.inventory_list}
                    onChange={(e) => handleInputChange('inventory_list', e.target.value)}
                    placeholder="Détail des meubles et objets à déménager..."
                    rows={4}
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-4 pt-6 border-t">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {isEditing ? 'Mettre à jour' : 'Ajouter la demande'}
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

export default ClientForm;
