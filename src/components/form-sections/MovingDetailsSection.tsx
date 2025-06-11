
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, Package, MapPin } from 'lucide-react';
import { useGoogleMapsDistance } from '@/hooks/useGoogleMapsDistance';

interface MovingDetailsSectionProps {
  formData: {
    desired_date: string;
    departure_time: string;
    estimated_arrival_date: string;
    estimated_arrival_time: string;
    estimated_volume: string;
    description: string;
    flexible_dates?: boolean;
    date_range_start?: string;
    date_range_end?: string;
    departure_postal_code?: string;
    arrival_postal_code?: string;
    departure_city?: string;
    arrival_city?: string;
  };
  onInputChange: (field: string, value: string | boolean) => void;
}

const MovingDetailsSection = ({ formData, onInputChange }: MovingDetailsSectionProps) => {
  // Calculer la distance en temps réel
  const { distance, duration, isLoading: isCalculatingDistance } = useGoogleMapsDistance({
    departurePostalCode: formData.departure_postal_code,
    arrivalPostalCode: formData.arrival_postal_code,
    departureCity: formData.departure_city,
    arrivalCity: formData.arrival_city,
    enabled: !!(formData.departure_postal_code && formData.arrival_postal_code)
  });

  // Calculer automatiquement les dates min/max quand flexible_dates est activé
  const handleFlexibleDatesChange = (checked: boolean) => {
    onInputChange('flexible_dates', checked);
    
    if (checked && formData.desired_date) {
      // Calculer automatiquement ±15 jours autour de la date souhaitée
      const desiredDate = new Date(formData.desired_date);
      const startDate = new Date(desiredDate);
      startDate.setDate(desiredDate.getDate() - 15);
      const endDate = new Date(desiredDate);
      endDate.setDate(desiredDate.getDate() + 15);
      
      onInputChange('date_range_start', startDate.toISOString().split('T')[0]);
      onInputChange('date_range_end', endDate.toISOString().split('T')[0]);
    } else if (!checked) {
      // Effacer les dates de plage si désactivé
      onInputChange('date_range_start', '');
      onInputChange('date_range_end', '');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Calendar className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold">Détails du déménagement</h3>
      </div>

      {/* Affichage de la distance calculée */}
      {(formData.departure_postal_code && formData.arrival_postal_code) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Distance calculée:</span>
            {isCalculatingDistance ? (
              <span className="text-blue-600">Calcul en cours...</span>
            ) : distance ? (
              <span className="text-blue-600 font-semibold">
                {distance} km {duration && `(${Math.round(duration / 60)}h${duration % 60}min)`}
              </span>
            ) : (
              <span className="text-orange-600">Non calculée</span>
            )}
          </div>
          {distance && (
            <p className="text-xs text-blue-600 mt-1">
              Distance calculée via Google Maps entre {formData.departure_postal_code} et {formData.arrival_postal_code}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="desired_date">Date souhaitée *</Label>
          <Input
            id="desired_date"
            type="date"
            value={formData.desired_date}
            onChange={(e) => {
              onInputChange('desired_date', e.target.value);
              // Recalculer les dates flexibles si activées
              if (formData.flexible_dates && e.target.value) {
                const desiredDate = new Date(e.target.value);
                const startDate = new Date(desiredDate);
                startDate.setDate(desiredDate.getDate() - 15);
                const endDate = new Date(desiredDate);
                endDate.setDate(desiredDate.getDate() + 15);
                
                onInputChange('date_range_start', startDate.toISOString().split('T')[0]);
                onInputChange('date_range_end', endDate.toISOString().split('T')[0]);
              }
            }}
            required
          />
        </div>
        <div>
          <Label htmlFor="departure_time">Heure de départ</Label>
          <Input
            id="departure_time"
            type="time"
            value={formData.departure_time}
            onChange={(e) => onInputChange('departure_time', e.target.value)}
          />
        </div>
        
        {/* Section pour les dates flexibles */}
        <div className="md:col-span-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="flexible_dates"
              checked={formData.flexible_dates || false}
              onCheckedChange={handleFlexibleDatesChange}
            />
            <Label htmlFor="flexible_dates" className="text-sm font-medium">
              Dates flexibles (±15 jours autour de la date souhaitée)
            </Label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Cochez cette option si vous êtes flexible sur les dates de déménagement (calcul automatique de la plage)
          </p>
        </div>

        {formData.flexible_dates && (
          <>
            <div>
              <Label htmlFor="date_range_start">Date la plus tôt</Label>
              <Input
                id="date_range_start"
                type="date"
                value={formData.date_range_start || ''}
                onChange={(e) => onInputChange('date_range_start', e.target.value)}
                className="bg-gray-50"
                readOnly
              />
              <p className="text-xs text-gray-400 mt-1">Calculé automatiquement</p>
            </div>
            <div>
              <Label htmlFor="date_range_end">Date la plus tard</Label>
              <Input
                id="date_range_end"
                type="date"
                value={formData.date_range_end || ''}
                onChange={(e) => onInputChange('date_range_end', e.target.value)}
                className="bg-gray-50"
                readOnly
              />
              <p className="text-xs text-gray-400 mt-1">Calculé automatiquement</p>
            </div>
          </>
        )}
        
        <div>
          <Label htmlFor="estimated_arrival_date">Date d'arrivée estimée</Label>
          <Input
            id="estimated_arrival_date"
            type="date"
            value={formData.estimated_arrival_date}
            onChange={(e) => onInputChange('estimated_arrival_date', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="estimated_arrival_time">Heure d'arrivée estimée</Label>
          <Input
            id="estimated_arrival_time"
            type="time"
            value={formData.estimated_arrival_time}
            onChange={(e) => onInputChange('estimated_arrival_time', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="estimated_volume">Volume estimé (m³) *</Label>
          <Input
            id="estimated_volume"
            type="number"
            step="0.1"
            value={formData.estimated_volume}
            onChange={(e) => onInputChange('estimated_volume', e.target.value)}
            placeholder=""
            required
          />
        </div>
        <div className="md:col-span-1">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onInputChange('description', e.target.value)}
            placeholder=""
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

export default MovingDetailsSection;
