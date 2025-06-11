
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface MatchFiltersProps {
  onFiltersChange: (filters: MatchFilterOptions) => void;
}

export interface MatchFilterOptions {
  pending: boolean;
  accepted: boolean;
  rejected: boolean;
  showAll: boolean;
}

const MatchFilters = ({ onFiltersChange }: MatchFiltersProps) => {
  const [filters, setFilters] = useState<MatchFilterOptions>(() => {
    // Charger les filtres sauvegardés ou utiliser les valeurs par défaut
    const saved = localStorage.getItem('matchFilters');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      pending: true,
      accepted: false,
      rejected: false,
      showAll: false
    };
  });

  useEffect(() => {
    // Sauvegarder les filtres
    localStorage.setItem('matchFilters', JSON.stringify(filters));
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (filterKey: keyof MatchFilterOptions, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: checked
    }));
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(Boolean).length;
  };

  const resetFilters = () => {
    setFilters({
      pending: true,
      accepted: false,
      rejected: false,
      showAll: false
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filtres des correspondances</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {getActiveFiltersCount()} filtres actifs
            </Badge>
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pending"
              checked={filters.pending}
              onCheckedChange={(checked) => handleFilterChange('pending', checked as boolean)}
            />
            <label htmlFor="pending" className="text-sm font-medium cursor-pointer">
              En attente d'acceptation
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="accepted"
              checked={filters.accepted}
              onCheckedChange={(checked) => handleFilterChange('accepted', checked as boolean)}
            />
            <label htmlFor="accepted" className="text-sm font-medium cursor-pointer">
              Acceptés
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="rejected"
              checked={filters.rejected}
              onCheckedChange={(checked) => handleFilterChange('rejected', checked as boolean)}
            />
            <label htmlFor="rejected" className="text-sm font-medium cursor-pointer">
              Refusés
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showAll"
              checked={filters.showAll}
              onCheckedChange={(checked) => handleFilterChange('showAll', checked as boolean)}
            />
            <label htmlFor="showAll" className="text-sm font-medium cursor-pointer">
              Tout afficher
            </label>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          <p>• Les filtres sont automatiquement sauvegardés</p>
          <p>• Plusieurs filtres peuvent être sélectionnés simultanément</p>
          <p>• "Tout afficher" ignore les autres filtres</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchFilters;
