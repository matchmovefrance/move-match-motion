
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Package } from 'lucide-react';

interface MovingDetailsSectionProps {
  formData: {
    desired_date: string;
    departure_time: string;
    estimated_arrival_date: string;
    estimated_arrival_time: string;
    estimated_volume: string;
    description: string;
  };
  onInputChange: (field: string, value: string) => void;
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
