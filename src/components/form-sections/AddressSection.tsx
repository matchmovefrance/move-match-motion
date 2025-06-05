
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';
import AddressAutocomplete from '../AddressAutocomplete';

interface AddressSectionProps {
  title: string;
  icon: React.ReactNode;
  formData: {
    address: string;
    city: string;
    postal_code: string;
    country: string;
  };
  onInputChange: (field: string, value: string) => void;
  addressPrefix: string;
}

const AddressSection = ({ title, icon, formData, onInputChange, addressPrefix }: AddressSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        {icon}
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <AddressAutocomplete
            label="Adresse complète"
            value={formData.address}
            onChange={(value) => onInputChange(`${addressPrefix}_address`, value)}
            placeholder=""
            required
            id={`${addressPrefix}_address`}
          />
        </div>
        <div>
          <Label htmlFor={`${addressPrefix}_city`}>Ville *</Label>
          <Input
            id={`${addressPrefix}_city`}
            value={formData.city}
            onChange={(e) => onInputChange(`${addressPrefix}_city`, e.target.value)}
            placeholder=""
            required
          />
        </div>
        <div>
          <Label htmlFor={`${addressPrefix}_postal_code`}>Code postal *</Label>
          <Input
            id={`${addressPrefix}_postal_code`}
            value={formData.postal_code}
            onChange={(e) => onInputChange(`${addressPrefix}_postal_code`, e.target.value)}
            placeholder=""
            required
          />
        </div>
      </div>
    </div>
  );
};

export default AddressSection;
