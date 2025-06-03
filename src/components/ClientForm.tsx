
import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import PersonalInfoSection from './form-sections/PersonalInfoSection';
import AddressSection from './form-sections/AddressSection';
import MovingDetailsSection from './form-sections/MovingDetailsSection';
import BudgetSection from './form-sections/BudgetSection';
import AdditionalInfoSection from './form-sections/AdditionalInfoSection';

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
            <PersonalInfoSection
              formData={{
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
              }}
              onInputChange={handleInputChange}
            />

            <AddressSection
              title="Adresse de départ"
              icon={<MapPin className="h-5 w-5 text-green-600" />}
              formData={{
                address: formData.departure_address,
                city: formData.departure_city,
                postal_code: formData.departure_postal_code,
                country: formData.departure_country,
              }}
              onInputChange={handleInputChange}
              addressPrefix="departure"
            />

            <AddressSection
              title="Adresse d'arrivée"
              icon={<MapPin className="h-5 w-5 text-red-600" />}
              formData={{
                address: formData.arrival_address,
                city: formData.arrival_city,
                postal_code: formData.arrival_postal_code,
                country: formData.arrival_country,
              }}
              onInputChange={handleInputChange}
              addressPrefix="arrival"
            />

            <MovingDetailsSection
              formData={{
                desired_date: formData.desired_date,
                estimated_volume: formData.estimated_volume,
                description: formData.description,
              }}
              onInputChange={handleInputChange}
            />

            <BudgetSection
              formData={{
                budget_min: formData.budget_min,
                budget_max: formData.budget_max,
                quote_amount: formData.quote_amount,
              }}
              onInputChange={handleInputChange}
            />

            <AdditionalInfoSection
              formData={{
                special_requirements: formData.special_requirements,
                access_conditions: formData.access_conditions,
                inventory_list: formData.inventory_list,
              }}
              onInputChange={handleInputChange}
            />

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
