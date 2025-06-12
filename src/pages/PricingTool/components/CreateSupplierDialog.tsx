import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CreateSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateSupplierDialog = ({ open, onOpenChange, onSuccess }: CreateSupplierDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'France',
    priority_level: 1,
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      // Créer le fournisseur dans la table suppliers
      const { error: supplierError } = await supabase
        .from('suppliers')
        .insert({
          ...formData,
          created_by: user.id,
        });

      if (supplierError) throw supplierError;

      // Synchroniser avec service_providers
      const { error: serviceProviderError } = await supabase
        .from('service_providers')
        .insert({
          name: formData.contact_name,
          company_name: formData.company_name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          created_by: user.id,
        });

      if (serviceProviderError) {
        console.warn('Erreur lors de la synchronisation avec service_providers:', serviceProviderError);
      }

      toast({
        title: "Succès",
        description: "Prestataire créé avec succès",
      });

      onSuccess();
      
      // Reset form
      setFormData({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postal_code: '',
        country: 'France',
        priority_level: 1,
        is_active: true,
      });

    } catch (error) {
      console.error('Error creating supplier:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le prestataire",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter un prestataire</DialogTitle>
          <DialogDescription>
            Créez un nouveau prestataire pour le système de devis
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nom de l'entreprise *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => updateFormData('company_name', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact_name">Nom du contact *</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => updateFormData('contact_name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">Adresse *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => updateFormData('address', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => updateFormData('city', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">Code postal *</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => updateFormData('postal_code', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <Select value={formData.country} onValueChange={(value) => updateFormData('country', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="France">France</SelectItem>
                  <SelectItem value="Belgique">Belgique</SelectItem>
                  <SelectItem value="Suisse">Suisse</SelectItem>
                  <SelectItem value="Luxembourg">Luxembourg</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority_level">Niveau de priorité</Label>
              <Select 
                value={formData.priority_level.toString()} 
                onValueChange={(value) => updateFormData('priority_level', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner la priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Priorité haute</SelectItem>
                  <SelectItem value="2">2 - Priorité normale</SelectItem>
                  <SelectItem value="3">3 - Priorité basse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer le prestataire'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSupplierDialog;
