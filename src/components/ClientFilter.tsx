
import { useState, useEffect } from 'react';
import { Calendar, CalendarDays, CalendarRange, MapPin } from 'lucide-react';
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
  label = "Filtrer les clients" 
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>{label}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtres par localisation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="postal-code-filter">Code postal</Label>
            <Input
              id="postal-code-filter"
              placeholder="Ex: 75001, 69000..."
              value={postalCodeFilter}
              onChange={(e) => setPostalCodeFilter(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="city-filter">Ville</Label>
            <Input
              id="city-filter"
              placeholder="Ex: Paris, Lyon..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Filtres par date */}
        <div className="space-y-3">
          <Label>Filtrer par date</Label>
          <div className="flex space-x-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              Tout
            </Button>
            <Button
              variant={filterType === 'range' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('range')}
            >
              <CalendarRange className="h-4 w-4 mr-1" />
              Période
            </Button>
            <Button
              variant={filterType === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('month')}
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              Mois
            </Button>
            <Button
              variant={filterType === 'year' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('year')}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Année
            </Button>
          </div>
        </div>

        {filterType === 'range' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date">Date de début</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">Date de fin</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {filterType === 'month' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Mois</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
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
            <div>
              <Label>Année</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
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
          <div>
            <Label>Année</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
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

        {(filterType !== 'all' || postalCodeFilter || cityFilter) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetFilters}
            className="w-full"
          >
            Réinitialiser les filtres
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
