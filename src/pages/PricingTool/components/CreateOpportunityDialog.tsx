
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface CreateOpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateOpportunityDialog = ({ open, onOpenChange }: CreateOpportunityDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    estimated_volume: '',
    budget_range_min: '',
    budget_range_max: '',
    departure_address: '',
    departure_city: '',
    departure_postal_code: '',
    arrival_address: '',
    arrival_city: '',
    arrival_postal_code: '',
    special_requirements: '',
    priority: '1',
    status: 'draft' as const,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedDate) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('pricing_opportunities')
        .insert({
          ...formData,
          estimated_volume: parseFloat(formData.estimated_volume),
          budget_range_min: formData.budget_range_min ? parseFloat(formData.budget_range_min) : null,
          budget_range_max: formData.budget_range_max ? parseFloat(formData.budget_range_max) : null,
          priority: parseInt(formData.priority),
          desired_date: format(selectedDate, 'yyyy-MM-dd'),
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Opportunité créée",
        description: "L'opportunité de devis a été créée avec succès.",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        estimated_volume: '',
        budget_range_min: '',
        budget_range_max: '',
        departure_address: '',
        departure_city: '',
        departure_postal_code: '',
        arrival_address: '',
        arrival_city: '',
        arrival_postal_code: '',
        special_requirements: '',
        priority: '1',
        status: 'draft',
      });
      setSelectedDate(undefined);
      
      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['pricing-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-stats'] });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating opportunity:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de l'opportunité.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle opportunité</DialogTitle>
          <DialogDescription>
            Ajoutez les détails de la demande de déménagement pour commencer à recevoir des devis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre de l'opportunité *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="ex: Déménagement 3 pièces Paris → Lyon"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Détails additionnels sur le déménagement..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimated_volume">Volume estimé (m³) *</Label>
                <Input
                  id="estimated_volume"
                  type="number"
                  step="0.1"
                  value={formData.estimated_volume}
                  onChange={(e) => handleInputChange('estimated_volume', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="priority">Priorité</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Normale</SelectItem>
                    <SelectItem value="2">2 - Élevée</SelectItem>
                    <SelectItem value="3">3 - Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Budget</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget_min">Budget minimum (€)</Label>
                <Input
                  id="budget_min"
                  type="number"
                  value={formData.budget_range_min}
                  onChange={(e) => handleInputChange('budget_range_min', e.target.value)}
                  placeholder="800"
                />
              </div>
              <div>
                <Label htmlFor="budget_max">Budget maximum (€)</Label>
                <Input
                  id="budget_max"
                  type="number"
                  value={formData.budget_range_max}
                  onChange={(e) => handleInputChange('budget_range_max', e.target.value)}
                  placeholder="1200"
                />
              </div>
            </div>
          </div>

          {/* Departure Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Adresse de départ</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="departure_address">Adresse</Label>
                <Input
                  id="departure_address"
                  value={formData.departure_address}
                  onChange={(e) => handleInputChange('departure_address', e.target.value)}
                  placeholder="123 Rue de la Paix"
                />
              </div>
              <div>
                <Label htmlFor="departure_city">Ville *</Label>
                <Input
                  id="departure_city"
                  value={formData.departure_city}
                  onChange={(e) => handleInputChange('departure_city', e.target.value)}
                  placeholder="Paris"
                  required
                />
              </div>
              <div>
                <Label htmlFor="departure_postal_code">Code postal *</Label>
                <Input
                  id="departure_postal_code"
                  value={formData.departure_postal_code}
                  onChange={(e) => handleInputChange('departure_postal_code', e.target.value)}
                  placeholder="75001"
                  required
                />
              </div>
            </div>
          </div>

          {/* Arrival Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Adresse d'arrivée</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="arrival_address">Adresse</Label>
                <Input
                  id="arrival_address"
                  value={formData.arrival_address}
                  onChange={(e) => handleInputChange('arrival_address', e.target.value)}
                  placeholder="45 Rue de la République"
                />
              </div>
              <div>
                <Label htmlFor="arrival_city">Ville *</Label>
                <Input
                  id="arrival_city"
                  value={formData.arrival_city}
                  onChange={(e) => handleInputChange('arrival_city', e.target.value)}
                  placeholder="Lyon"
                  required
                />
              </div>
              <div>
                <Label htmlFor="arrival_postal_code">Code postal *</Label>
                <Input
                  id="arrival_postal_code"
                  value={formData.arrival_postal_code}
                  onChange={(e) => handleInputChange('arrival_postal_code', e.target.value)}
                  placeholder="69002"
                  required
                />
              </div>
            </div>
          </div>

          {/* Date and Requirements */}
          <div className="space-y-4">
            <div>
              <Label>Date souhaitée *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${!selectedDate && 'text-muted-foreground'}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: fr }) : 'Sélectionner une date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="special_requirements">Exigences spéciales</Label>
              <Textarea
                id="special_requirements"
                value={formData.special_requirements}
                onChange={(e) => handleInputChange('special_requirements', e.target.value)}
                placeholder="Ascenseur, piano, objets fragiles..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer l'opportunité
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOpportunityDialog;
