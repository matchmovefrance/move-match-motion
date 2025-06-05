
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';

interface PersonalInfoSectionProps {
  formData: {
    name: string;
    email: string;
    phone: string;
  };
  onInputChange: (field: string, value: string) => void;
}

const PersonalInfoSection = ({ formData, onInputChange }: PersonalInfoSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <User className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Informations personnelles</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="name">Nom complet *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onInputChange('name', e.target.value)}
            placeholder=""
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            placeholder=""
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Téléphone *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => onInputChange('phone', e.target.value)}
            placeholder=""
            required
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoSection;
