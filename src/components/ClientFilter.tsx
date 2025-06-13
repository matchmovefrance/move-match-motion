
import { useState, useEffect } from 'react';
import { Calendar, CalendarDays, CalendarRange, MapPin, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  client_reference?: string;
  created_at: string;
  departure_city?: string;
  departure_postal_code?: string;
  arrival_city?: string;
  arrival_postal_code?: string;
  desired_date?: string;
  estimated_volume?: number;
  flexible_dates?: boolean;
  flexibility_days?: number;
  status?: string;
  is_matched?: boolean;
  match_status?: string;
}

interface ClientFilterProps {
  data: Client[];
  onFilter: (filteredData: Client[]) => void;
  label?: string;
}

export default function ClientFilter({ 
  data, 
  onFilter, 
  label = "Filtres" 
}: ClientFilterProps) {
  const [filterType, setFilterType] = useState<'all' | 'range' | 'month' | 'year'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [postalCodeFilter, setPostalCodeFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  // Générer les options de mois et années disponibles
  const availableMonths = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return {
      value: month.toString().padStart(2, '0'),
      label: new Date(2000, i, 1).toLocaleDateString('fr-FR', { month: 'long' })
    };
  });

  const availableYears = [...new Set(
    data.map(client => {
      const date = client.desired_date || client.created_at;
      return new Date(date).getFullYear();
    })
  )].sort((a, b) => b - a);

  const applyFilter = () => {
    let filtered = [...data];

    // Filtre par date (utilise desired_date en priorité, sinon created_at)
    switch (filterType) {
      case 'all':
        // Pas de filtre par date
        break;
        
      case 'range':
        if (startDate && endDate) {
          filtered = filtered.filter(client => {
            const clientDate = new Date(client.desired_date || client.created_at);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return clientDate >= start && clientDate <= end;
          });
        }
        break;
        
      case 'month':
        if (selectedMonth && selectedYear) {
          filtered = filtered.filter(client => {
            const clientDate = new Date(client.desired_date || client.created_at);
            return clientDate.getMonth() + 1 === parseInt(selectedMonth) && 
                   clientDate.getFullYear() === parseInt(selectedYear);
          });
        }
        break;
        
      case 'year':
        if (selectedYear) {
          filtered = filtered.filter(client => {
            const clientDate = new Date(client.desired_date || client.created_at);
            return clientDate.getFullYear() === parseInt(selectedYear);
          });
        }
        break;
    }

    // Filtre par code postal
    if (postalCodeFilter) {
      filtered = filtered.filter(client =>
        client.departure_postal_code?.includes(postalCodeFilter) ||
        client.arrival_postal_code?.includes(postalCodeFilter)
      );
    }

    // Filtre par ville
    if (cityFilter) {
      filtered = filtered.filter(client =>
        client.departure_city?.toLowerCase().includes(cityFilter.toLowerCase()) ||
        client.arrival_city?.toLowerCase().includes(cityFilter.toLowerCase())
      );
    }

    onFilter(filtered);
  };

  // Appliquer le filtre quand les paramètres changent
  useEffect(() => {
    applyFilter();
  }, [filterType, startDate, endDate, selectedMonth, selectedYear, postalCodeFilter, cityFilter, data]);

  const resetFilters = () => {
    setFilterType('all');
    setStartDate('');
    setEndDate('');
    setSelectedMonth('');
    setSelectedYear('');
    setPostalCodeFilter('');
    setCityFilter('');
  };

  const hasActiveFilters = filterType !== 'all' || postalCodeFilter || cityFilter;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-primary" />
            <span>{label}</span>
          </div>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetFilters}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Réinitialiser
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtres par localisation - en haut */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="postal-code-filter" className="text-sm flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              Code postal
            </Label>
            <Input
              id="postal-code-filter"
              placeholder="Ex: 75001, 69000..."
              value={postalCodeFilter}
              onChange={(e) => setPostalCodeFilter(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city-filter" className="text-sm">Ville</Label>
            <Input
              id="city-filter"
              placeholder="Ex: Paris, Lyon..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        {/* Filtres par date */}
        <div className="space-y-3">
          <Label className="text-sm">Filtrer par date</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
              className="h-8"
            >
              Tout
            </Button>
            <Button
              variant={filterType === 'range' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('range')}
              className="h-8"
            >
              <CalendarRange className="h-3 w-3 mr-1" />
              Période
            </Button>
            <Button
              variant={filterType === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('month')}
              className="h-8"
            >
              <CalendarDays className="h-3 w-3 mr-1" />
              Mois
            </Button>
            <Button
              variant={filterType === 'year' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('year')}
              className="h-8"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Année
            </Button>
          </div>
        </div>

        {filterType === 'range' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm">Date de début</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-sm">Date de fin</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        )}

        {filterType === 'month' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm">Mois</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Sélectionner un mois" />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Année</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Sélectionner une année" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {filterType === 'year' && (
          <div className="w-full md:w-1/2">
            <Label className="text-sm">Année</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Sélectionner une année" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
