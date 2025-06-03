
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface AdditionalInfoSectionProps {
  formData: {
    special_requirements: string;
    access_conditions: string;
    inventory_list: string;
  };
  onInputChange: (field: string, value: string) => void;
}

const AdditionalInfoSection = ({ formData, onInputChange }: AdditionalInfoSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Informations supplémentaires</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="special_requirements">Exigences particulières</Label>
          <Textarea
            id="special_requirements"
            value={formData.special_requirements}
            onChange={(e) => onInputChange('special_requirements', e.target.value)}
            placeholder="Piano, objets fragiles, démontage..."
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="access_conditions">Conditions d'accès</Label>
          <Textarea
            id="access_conditions"
            value={formData.access_conditions}
            onChange={(e) => onInputChange('access_conditions', e.target.value)}
            placeholder="3ème étage sans ascenseur, parking..."
            rows={3}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="inventory_list">Liste d'inventaire</Label>
          <Textarea
            id="inventory_list"
            value={formData.inventory_list}
            onChange={(e) => onInputChange('inventory_list', e.target.value)}
            placeholder="Détail des meubles et objets à déménager..."
            rows={4}
          />
        </div>
      </div>
    </div>
  );
};

export default AdditionalInfoSection;
