import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';

interface City {
  name: string;
  code: string;
  full_name: string;
}

interface CityAutocompleteProps {
  postalCode: string;
  selectedCity: string;
  onCitySelect: (city: string) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
}

export function CityAutocomplete({ 
  postalCode, 
  selectedCity, 
  onCitySelect, 
  label, 
  placeholder = "Sélectionnez une ville",
  disabled = false
}: CityAutocompleteProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCities = useCallback(async (code: string) => {
    if (code.length !== 5) {
      setCities([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Utiliser l'API française geo.api.gouv.fr pour les villes
      const response = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${code}&fields=nom,code,codesPostaux&format=json&geometry=centre`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des villes');
      }
      
      const data = await response.json();
      
      const cityList = data.map((commune: any) => ({
        name: commune.nom,
        code: commune.code,
        full_name: `${commune.nom} (${code})`
      }));
      
      setCities(cityList);
    } catch (err) {
      setError('Impossible de récupérer les villes pour ce code postal');
      setCities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (postalCode && postalCode.length === 5) {
      fetchCities(postalCode);
    } else {
      setCities([]);
    }
  }, [postalCode, fetchCities]);

  if (!postalCode || postalCode.length !== 5) {
    return (
      <div>
        <Label className="text-muted-foreground">{label}</Label>
        <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          Saisissez un code postal valide (5 chiffres)
        </div>
      </div>
    );
  }

  return (
    <div>
      <Label>{label}</Label>
      <Select 
        value={selectedCity} 
        onValueChange={onCitySelect}
        disabled={disabled || loading || cities.length === 0}
      >
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Chargement..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {cities.map((city) => (
            <SelectItem key={city.code} value={city.name}>
              {city.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
      {cities.length === 0 && !loading && !error && postalCode.length === 5 && (
        <p className="text-sm text-amber-600 mt-1">Aucune ville trouvée pour ce code postal</p>
      )}
    </div>
  );
}