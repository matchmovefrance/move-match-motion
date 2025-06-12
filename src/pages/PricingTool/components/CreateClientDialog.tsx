
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateClientDialog = ({ open, onOpenChange, onSuccess }: CreateClientDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    departure_city: '',
    departure_postal_code: '',
    departure_address: '',
    arrival_city: '',
    arrival_postal_code: '',
    arrival_address: '',
    desired_date: '',
    estimated_volume: '',
    budget_min: '',
    budget_max: '',
    special_requirements: '',
    description: ''
  });

  const generateClientReference = (id: number) => {
    return `CLI-${String(id).padStart(6, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('🆕 Création nouveau client dans table unifiée:', formData);

      // Créer directement dans la table clients unifiée
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          departure_city: formData.departure_city,
          departure_postal_code: formData.departure_postal_code,
          departure_address: formData.departure_address,
          arrival_city: formData.arrival_city,
          arrival_postal_code: formData.arrival_postal_code,
          arrival_address: formData.arrival_address,
          desired_date: formData.desired_date,
          estimated_volume: parseFloat(formData.estimated_volume) || 0,
          budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
          budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
          special_requirements: formData.special_requirements,
          description: formData.description,
          status: 'pending',
          created_by: user?.id
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Générer et mettre à jour la référence client
      const clientRef = generateClientReference(clientData.id);
      await supabase
        .from('clients')
        .update({ client_reference: clientRef })
        .eq('id', clientData.id);

      toast({
        title: "Client créé avec succès",
        description: `Le nouveau client a été ajouté avec la référence ${clientRef}`,
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        departure_city: '',
        departure_postal_code: '',
        departure_address: '',
        arrival_city: '',
        arrival_postal_code: '',
        arrival_address: '',
        desired_date: '',
        estimated_volume: '',
        budget_min: '',
        budget_max: '',
        special_requirements: '',
        description: ''
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('❌ Erreur création client:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le client",
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
          <DialogTitle>Nouveau Client</DialogTitle>
          <DialogDescription>
            Ajoutez un nouveau client dans la base de données unifiée
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Adresse de départ</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departure_city">Ville *</Label>
                <Input
                  id="departure_city"
                  value={formData.departure_city}
                  onChange={(e) => setFormData({ ...formData, departure_city: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departure_postal_code">Code postal *</Label>
                <Input
                  id="departure_postal_code"
                  value={formData.departure_postal_code}
                  onChange={(e) => setFormData({ ...formData, departure_postal_code: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <Label htmlFor="departure_address">Adresse complète</Label>
              <Input
                id="departure_address"
                value={formData.departure_address}
                onChange={(e) => setFormData({ ...formData, departure_address: e.target.value })}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Adresse d'arrivée</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="arrival_city">Ville *</Label>
                <Input
                  id="arrival_city"
                  value={formData.arrival_city}
                  onChange={(e) => setFormData({ ...formData, arrival_city: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrival_postal_code">Code postal *</Label>
                <Input
                  id="arrival_postal_code"
                  value={formData.arrival_postal_code}
                  onChange={(e) => setFormData({ ...formData, arrival_postal_code: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <Label htmlFor="arrival_address">Adresse complète</Label>
              <Input
                id="arrival_address"
                value={formData.arrival_address}
                onChange={(e) => setFormData({ ...formData, arrival_address: e.target.value })}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Détails du déménagement</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="desired_date">Date souhaitée *</Label>
                <Input
                  id="desired_date"
                  type="date"
                  value={formData.desired_date}
                  onChange={(e) => setFormData({ ...formData, desired_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimated_volume">Volume estimé (m³) *</Label>
                <Input
                  id="estimated_volume"
                  type="number"
                  step="0.1"
                  value={formData.estimated_volume}
                  onChange={(e) => setFormData({ ...formData, estimated_volume: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="budget_min">Budget minimum (€)</Label>
                <Input
                  id="budget_min"
                  type="number"
                  value={formData.budget_min}
                  onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget_max">Budget maximum (€)</Label>
                <Input
                  id="budget_max"
                  type="number"
                  value={formData.budget_max}
                  onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="special_requirements">Exigences spéciales</Label>
            <Textarea
              id="special_requirements"
              value={formData.special_requirements}
              onChange={(e) => setFormData({ ...formData, special_requirements: e.target.value })}
              placeholder="Piano, objets fragiles, étages sans ascenseur..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description complémentaire</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Informations supplémentaires..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Création...' : 'Créer le client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClientDialog;
