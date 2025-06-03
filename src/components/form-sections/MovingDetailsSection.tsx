
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from 'lucide-react';

interface MovingDetailsSectionProps {
  formData: {
    desired_date: string;
    estimated_volume: string;
    description: string;
  };
  onInputChange: (field: string, value: string) => void;
}

const MovingDetailsSection = ({ formData, onInputChange }: MovingDetailsSectionProps) => {
  return (
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
            onChange={(e) => onInputChange('desired_date', e.target.value)}
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
            onChange={(e) => onInputChange('estimated_volume', e.target.value)}
            placeholder="25.5"
            required
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="description">Description du déménagement</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onInputChange('description', e.target.value)}
            placeholder="Appartement 3 pièces, meubles lourds..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

export default MovingDetailsSection;
