import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface CountrySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  placeholder?: string;
  required?: boolean;
}

const europeanCountries = [
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Allemagne' },
  { code: 'ES', name: 'Espagne' },
  { code: 'IT', name: 'Italie' },
  { code: 'BE', name: 'Belgique' },
  { code: 'CH', name: 'Suisse' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'NL', name: 'Pays-Bas' },
  { code: 'AT', name: 'Autriche' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GB', name: 'Royaume-Uni' },
  { code: 'IE', name: 'Irlande' },
  { code: 'DK', name: 'Danemark' },
  { code: 'SE', name: 'Suède' },
  { code: 'NO', name: 'Norvège' },
  { code: 'FI', name: 'Finlande' },
  { code: 'PL', name: 'Pologne' },
  { code: 'CZ', name: 'République tchèque' },
  { code: 'SK', name: 'Slovaquie' },
  { code: 'HU', name: 'Hongrie' },
  { code: 'SI', name: 'Slovénie' },
  { code: 'HR', name: 'Croatie' },
  { code: 'RO', name: 'Roumanie' },
  { code: 'BG', name: 'Bulgarie' },
  { code: 'GR', name: 'Grèce' },
  { code: 'CY', name: 'Chypre' },
  { code: 'MT', name: 'Malte' },
  { code: 'EE', name: 'Estonie' },
  { code: 'LV', name: 'Lettonie' },
  { code: 'LT', name: 'Lituanie' }
];

export function CountrySelect({ value, onValueChange, label, placeholder = "Sélectionnez un pays", required = false }: CountrySelectProps) {
  return (
    <div>
      <Label>{label} {required && '*'}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {europeanCountries.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              {country.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}