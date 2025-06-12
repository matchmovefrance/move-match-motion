
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';

interface MapFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: MapFilters) => void;
  currentFilters: MapFilters;
}

export interface MapFilters {
  type: 'all' | 'client' | 'move' | 'match';
  reference: string;
  name: string;
  date: string;
}

export const MapFilterDialog = ({ open, onOpenChange, onApplyFilters, currentFilters }: MapFilterDialogProps) => {
  const [filters, setFilters] = useState<MapFilters>(currentFilters);

  const handleApply = () => {
    onApplyFilters(filters);
    onOpenChange(false);
  };

  const handleReset = () => {
    const resetFilters: MapFilters = {
      type: 'all',
      reference: '',
      name: '',
      date: ''
    };
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtres de carte</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="type">Type d'élément</Label>
            <Select
              value={filters.type}
              onValueChange={(value: MapFilters['type']) => setFilters({ ...filters, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tout afficher</SelectItem>
                <SelectItem value="client">Clients uniquement</SelectItem>
                <SelectItem value="move">Trajets uniquement</SelectItem>
                <SelectItem value="match">Matchs uniquement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reference">Référence</Label>
            <Input
              id="reference"
              placeholder="CLI-000001, TRJ-000001, MTH-000001..."
              value={filters.reference}
              onChange={(e) => setFilters({ ...filters, reference: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="name">Nom/Entreprise</Label>
            <Input
              id="name"
              placeholder="Nom du client ou de l'entreprise..."
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <Button onClick={handleApply} className="flex-1">
            <Search className="h-4 w-4 mr-2" />
            Appliquer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
