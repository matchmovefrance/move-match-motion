
import { useState, useEffect } from 'react';
import { Calendar, CalendarDays, CalendarRange } from 'lucide-react';
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

interface DateFilterProps<T> {
  data: T[];
  onFilter: (filteredData: T[]) => void;
  dateField: keyof T;
  label?: string;
}

export default function DateFilter<T extends Record<string, any>>({ 
  data, 
  onFilter, 
  dateField, 
  label = "Filtrer par date" 
}: DateFilterProps<T>) {
  const [filterType, setFilterType] = useState<'all' | 'range' | 'month' | 'year'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Générer les options de mois et années disponibles
  const availableMonths = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return {
      value: month.toString().padStart(2, '0'),
      label: new Date(2000, i, 1).toLocaleDateString('fr-FR', { month: 'long' })
    };
  });

  const availableYears = [...new Set(
    data.map(item => new Date(item[dateField] as string).getFullYear())
  )].sort((a, b) => b - a);

  const applyFilter = () => {
    let filtered = [...data];

    switch (filterType) {
      case 'all':
        // Pas de filtre
        break;
        
      case 'range':
        if (startDate && endDate) {
          filtered = data.filter(item => {
            const itemDate = new Date(item[dateField] as string);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return itemDate >= start && itemDate <= end;
          });
        }
        break;
        
      case 'month':
        if (selectedMonth && selectedYear) {
          filtered = data.filter(item => {
            const itemDate = new Date(item[dateField] as string);
            return itemDate.getMonth() + 1 === parseInt(selectedMonth) && 
                   itemDate.getFullYear() === parseInt(selectedYear);
          });
        }
        break;
        
      case 'year':
        if (selectedYear) {
          filtered = data.filter(item => {
            const itemDate = new Date(item[dateField] as string);
            return itemDate.getFullYear() === parseInt(selectedYear);
          });
        }
        break;
    }

    onFilter(filtered);
  };

  // Appliquer le filtre quand les paramètres changent
  useEffect(() => {
    applyFilter();
  }, [filterType, startDate, endDate, selectedMonth, selectedYear, data]);

  const resetFilters = () => {
    setFilterType('all');
    setStartDate('');
    setEndDate('');
    setSelectedMonth('');
    setSelectedYear('');
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

        {filterType !== 'all' && (
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
