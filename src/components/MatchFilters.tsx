
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Clock, Check, X, Eye, RotateCcw } from 'lucide-react';

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
    const saved = localStorage.getItem('matchFilters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback if JSON is corrupted
      }
    }
    return {
      pending: true,
      accepted: false,
      rejected: false,
      showAll: false
    };
  });

  useEffect(() => {
    localStorage.setItem('matchFilters', JSON.stringify(filters));
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (filterKey: keyof MatchFilterOptions, checked: boolean) => {
    setFilters(prev => {
      const newFilters = { ...prev, [filterKey]: checked };
      
      // Si "Tout afficher" est activé, désactiver les autres
      if (filterKey === 'showAll' && checked) {
        return {
          pending: false,
          accepted: false,
          rejected: false,
          showAll: true
        };
      }
      
      // Si un autre filtre est activé, désactiver "Tout afficher"
      if (filterKey !== 'showAll' && checked) {
        newFilters.showAll = false;
      }
      
      return newFilters;
    });
  };

  const getActiveFiltersCount = () => {
    if (filters.showAll) return 1;
    return Object.entries(filters).filter(([key, value]) => key !== 'showAll' && value).length;
  };

  const resetFilters = () => {
    setFilters({
      pending: true,
      accepted: false,
      rejected: false,
      showAll: false
    });
  };

  const quickSelectAll = () => {
    setFilters({
      pending: false,
      accepted: false,
      rejected: false,
      showAll: true
    });
  };

  const quickSelectPending = () => {
    setFilters({
      pending: true,
      accepted: false,
      rejected: false,
      showAll: false
    });
  };

  const quickSelectProcessed = () => {
    setFilters({
      pending: false,
      accepted: true,
      rejected: true,
      showAll: false
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Filtres des correspondances
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {getActiveFiltersCount()} filtre{getActiveFiltersCount() > 1 ? 's' : ''} actif{getActiveFiltersCount() > 1 ? 's' : ''}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-gray-600 hover:text-gray-800"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtres rapides */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Filtres rapides</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters.showAll ? "default" : "outline"}
              size="sm"
              onClick={quickSelectAll}
              className="text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              Tout voir
            </Button>
            <Button
              variant={filters.pending && !filters.accepted && !filters.rejected ? "default" : "outline"}
              size="sm"
              onClick={quickSelectPending}
              className="text-xs"
            >
              <Clock className="h-3 w-3 mr-1" />
              En attente
            </Button>
            <Button
              variant={filters.accepted && filters.rejected && !filters.pending ? "default" : "outline"}
              size="sm"
              onClick={quickSelectProcessed}
              className="text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Traités
            </Button>
          </div>
        </div>

        {/* Filtres détaillés */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Filtres détaillés</h4>
          <ToggleGroup type="multiple" className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
            <ToggleGroupItem
              value="pending"
              pressed={filters.pending}
              onPressedChange={(pressed) => handleFilterChange('pending', pressed)}
              className="flex-1 flex items-center justify-center gap-2 h-auto py-3 px-2 text-xs data-[state=on]:bg-yellow-100 data-[state=on]:text-yellow-800 data-[state=on]:border-yellow-300"
            >
              <Clock className="h-4 w-4" />
              <span className="text-center">En attente</span>
            </ToggleGroupItem>
            
            <ToggleGroupItem
              value="accepted"
              pressed={filters.accepted}
              onPressedChange={(pressed) => handleFilterChange('accepted', pressed)}
              className="flex-1 flex items-center justify-center gap-2 h-auto py-3 px-2 text-xs data-[state=on]:bg-green-100 data-[state=on]:text-green-800 data-[state=on]:border-green-300"
            >
              <Check className="h-4 w-4" />
              <span className="text-center">Acceptés</span>
            </ToggleGroupItem>
            
            <ToggleGroupItem
              value="rejected"
              pressed={filters.rejected}
              onPressedChange={(pressed) => handleFilterChange('rejected', pressed)}
              className="flex-1 flex items-center justify-center gap-2 h-auto py-3 px-2 text-xs data-[state=on]:bg-red-100 data-[state=on]:text-red-800 data-[state=on]:border-red-300"
            >
              <X className="h-4 w-4" />
              <span className="text-center">Refusés</span>
            </ToggleGroupItem>
            
            <ToggleGroupItem
              value="showAll"
              pressed={filters.showAll}
              onPressedChange={(pressed) => handleFilterChange('showAll', pressed)}
              className="flex-1 flex items-center justify-center gap-2 h-auto py-3 px-2 text-xs data-[state=on]:bg-blue-100 data-[state=on]:text-blue-800 data-[state=on]:border-blue-300"
            >
              <Eye className="h-4 w-4" />
              <span className="text-center">Tout afficher</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <div className="space-y-1">
            <p>💡 <strong>Filtres rapides</strong> : Sélection prédéfinie pour un accès rapide</p>
            <p>⚙️ <strong>Filtres détaillés</strong> : Combinaisons personnalisées (multi-sélection)</p>
            <p>💾 Les filtres sont automatiquement sauvegardés</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchFilters;
