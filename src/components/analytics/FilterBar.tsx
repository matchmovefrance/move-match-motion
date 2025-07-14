import { useState } from 'react';
import { Calendar, Filter, Search, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterBarProps {
  onTimeRangeChange: (range: string) => void;
  onSearchChange: (search: string) => void;
  onStatusFilter: (status: string) => void;
}

export const FilterBar = ({ 
  onTimeRangeChange, 
  onSearchChange, 
  onStatusFilter 
}: FilterBarProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearchChange(value);
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 border-0 shadow-sm">
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
        {/* Section titre */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
            <p className="text-sm text-muted-foreground">Vue d'ensemble des performances</p>
          </div>
        </div>

        <div className="flex-1" />

        {/* Filtres */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Recherche */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Période */}
          <Select onValueChange={onTimeRangeChange} defaultValue="30">
            <SelectTrigger className="w-[140px] bg-white border-gray-200">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 jours</SelectItem>
              <SelectItem value="30">30 jours</SelectItem>
              <SelectItem value="90">3 mois</SelectItem>
              <SelectItem value="365">1 an</SelectItem>
            </SelectContent>
          </Select>

          {/* Statut */}
          <Select onValueChange={onStatusFilter} defaultValue="all">
            <SelectTrigger className="w-[130px] bg-white border-gray-200">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="confirmed">Confirmé</SelectItem>
              <SelectItem value="rejected">Rejeté</SelectItem>
            </SelectContent>
          </Select>

          {/* Bouton export */}
          <Button variant="outline" size="sm" className="hidden sm:flex">
            Exporter
          </Button>
        </div>
      </div>
    </Card>
  );
};