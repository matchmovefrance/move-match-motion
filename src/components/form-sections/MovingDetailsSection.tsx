
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, Package } from 'lucide-react';

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
  };
  onInputChange: (field: string, value: string | boolean) => void;
}

const MovingDetailsSection = ({ formData, onInputChange }: MovingDetailsSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Calendar className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold">Détails du déménagement</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="desired_date">Date souhaitée *</Label>
          <Input
            id="desired_date"
            type="date"
            value={formData.desired_date}
            onChange={(e) => onInputChange('desired_date', e.target.value)}
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
        
        {/* Nouvelle section pour les dates flexibles */}
        <div className="md:col-span-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="flexible_dates"
              checked={formData.flexible_dates || false}
              onCheckedChange={(checked) => onInputChange('flexible_dates', checked)}
            />
            <Label htmlFor="flexible_dates" className="text-sm font-medium">
              Dates flexibles (±15 jours)
            </Label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Cochez cette option si vous êtes flexible sur les dates de déménagement
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
              />
            </div>
            <div>
              <Label htmlFor="date_range_end">Date la plus tard</Label>
              <Input
                id="date_range_end"
                type="date"
                value={formData.date_range_end || ''}
                onChange={(e) => onInputChange('date_range_end', e.target.value)}
              />
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
            placeholder="15.0"
            required
          />
        </div>
        <div className="md:col-span-1">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onInputChange('description', e.target.value)}
            placeholder="Détails supplémentaires sur le déménagement..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

export default MovingDetailsSection;
