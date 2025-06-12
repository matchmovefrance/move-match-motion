import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
  departure_time: string;
  
  // Adresse d'arrivée
  arrival_address: string;
  arrival_city: string;
  arrival_postal_code: string;
  arrival_country: string;
  
  // Détails du déménagement
  desired_date: string;
  estimated_arrival_date: string;
  estimated_arrival_time: string;
  estimated_volume: string;
  description: string;
  
  // Options pour dates flexibles
  flexible_dates: boolean;
  date_range_start: string;
  date_range_end: string;
  
  // Budget
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
  clientId?: number;
}

const ClientForm = ({ onSubmit, initialData, isEditing = false, clientId }: ClientFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    phone: '',
    departure_address: '',
    departure_city: '',
    departure_postal_code: '',
    departure_country: 'France',
    departure_time: '',
    arrival_address: '',
    arrival_city: '',
    arrival_postal_code: '',
    arrival_country: 'France',
    desired_date: '',
    estimated_arrival_date: '',
    estimated_arrival_time: '',
    estimated_volume: '',
    description: '',
    flexible_dates: false,
    date_range_start: '',
    date_range_end: '',
    budget_min: '',
    budget_max: '',
    quote_amount: '',
    special_requirements: '',
    access_conditions: '',
    inventory_list: '',
    ...initialData
  });

  // Auto-save pour synchronisation temps réel
  useEffect(() => {
    if (isEditing && clientId && user) {
      const autoSave = async () => {
        try {
          // Préparer les données pour l'update
          const updateData = {
            name: formData.name || null,
            email: formData.email || null,
            phone: formData.phone || null,
            departure_city: formData.departure_city,
            departure_postal_code: formData.departure_postal_code,
            departure_country: formData.departure_country || 'France',
            arrival_city: formData.arrival_city,
            arrival_postal_code: formData.arrival_postal_code,
            arrival_country: formData.arrival_country || 'France',
            desired_date: formData.desired_date,
            estimated_volume: formData.estimated_volume ? parseFloat(formData.estimated_volume) : null,
            flexible_dates: formData.flexible_dates,
            flexibility_days: formData.date_range_start && formData.date_range_end ? 
              Math.ceil((new Date(formData.date_range_end).getTime() - new Date(formData.date_range_start).getTime()) / (1000 * 60 * 60 * 24)) : 0
          };

          const { error } = await supabase
            .from('clients')
            .update(updateData)
            .eq('id', clientId);

          if (error) {
            console.error('Auto-save error:', error);
          }
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      };

      // Debounce auto-save
      const timeoutId = setTimeout(autoSave, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [formData, isEditing, clientId, user]);

  const handleInputChange = (field: keyof ClientFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation basique
    if (!formData.name || !formData.email || !formData.phone || !formData.departure_city || !formData.arrival_city || !formData.estimated_volume || !formData.desired_date) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    // Validation des dates flexibles
    if (formData.flexible_dates) {
      if (!formData.date_range_start || !formData.date_range_end) {
        toast({
          title: "Erreur",
          description: "Les dates de début et fin sont requises pour les dates flexibles",
          variant: "destructive",
        });
        return;
      }
      
      const startDate = new Date(formData.date_range_start);
      const endDate = new Date(formData.date_range_end);
      const desiredDate = new Date(formData.desired_date);
      
      if (startDate > desiredDate || endDate < desiredDate) {
        toast({
          title: "Erreur",
          description: "La date souhaitée doit être entre les dates de début et fin",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      toast({
        title: "Succès",
        description: isEditing ? "Demande mise à jour avec succès" : "Demande créée avec succès",
      });
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
            {isEditing && (
              <span className="text-sm text-green-600 ml-2">(Sauvegarde automatique)</span>
            )}
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
                departure_time: formData.departure_time,
                estimated_arrival_date: formData.estimated_arrival_date,
                estimated_arrival_time: formData.estimated_arrival_time,
                estimated_volume: formData.estimated_volume,
                description: formData.description,
                flexible_dates: formData.flexible_dates,
                date_range_start: formData.date_range_start,
                date_range_end: formData.date_range_end,
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
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Enregistrement...' : (isEditing ? 'Mettre à jour' : 'Ajouter la demande')}
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
