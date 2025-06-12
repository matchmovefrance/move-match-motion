
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
    arrival_city: '',
    arrival_postal_code: '',
    desired_date: '',
    estimated_volume: '',
    flexible_dates: false,
    flexibility_days: 0,
    description: ''
  });

  const generateClientReference = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `CLI-${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('🆕 Création nouveau client:', formData);

      const clientReference = generateClientReference();

      // Créer le client directement dans la table clients
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          departure_city: formData.departure_city,
          departure_postal_code: formData.departure_postal_code,
          departure_country: 'France',
          arrival_city: formData.arrival_city,
          arrival_postal_code: formData.arrival_postal_code,
          arrival_country: 'France',
          desired_date: formData.desired_date,
          estimated_volume: parseFloat(formData.estimated_volume) || 0,
          flexible_dates: formData.flexible_dates,
          flexibility_days: formData.flexibility_days,
          status: 'pending',
          client_reference: clientReference,
          created_by: user?.id
        })
        .select()
        .single();

      if (clientError) throw clientError;

      toast({
        title: "Client créé avec succès",
        description: `Le nouveau client ${clientReference} a été ajouté`,
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        departure_city: '',
        departure_postal_code: '',
        arrival_city: '',
        arrival_postal_code: '',
        desired_date: '',
        estimated_volume: '',
        flexible_dates: false,
        flexibility_days: 0,
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
            Ajoutez un nouveau client dans la base de données
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
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Détails du déménagement</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
