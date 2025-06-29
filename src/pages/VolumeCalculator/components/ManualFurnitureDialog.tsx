
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FurnitureItem } from '../types';

interface ManualFurnitureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddFurniture: (furniture: FurnitureItem, quantity: number) => void;
}

const ManualFurnitureDialog = ({ open, onOpenChange, onAddFurniture }: ManualFurnitureDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Divers',
    volume: '',
    description: '',
    quantity: 1
  });

  const categories = [
    'Salon',
    'Chambre',
    'Cuisine',
    'Salle de bain',
    'Bureau',
    'Divers'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.volume || parseFloat(formData.volume) <= 0) {
      return;
    }

    const furniture: FurnitureItem = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name.trim(),
      category: formData.category,
      volume: parseFloat(formData.volume),
      description: formData.description.trim() || 'Meuble ajouté manuellement',
      icon: '📦'
    };

    onAddFurniture(furniture, formData.quantity);
    
    // Reset form
    setFormData({
      name: '',
      category: 'Divers',
      volume: '',
      description: '',
      quantity: 1
    });
    
    onOpenChange(false);
  };

  const updateFormData = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un meuble personnalisé</DialogTitle>
          <DialogDescription>
            Ajoutez un meuble qui n'est pas dans la liste standard
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du meuble *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              placeholder="Ex: Bibliothèque sur mesure"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Catégorie</Label>
            <Select value={formData.category} onValueChange={(value) => updateFormData('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="volume">Volume (m³) *</Label>
            <Input
              id="volume"
              type="number"
              step="0.001"
              min="0.001"
              value={formData.volume}
              onChange={(e) => updateFormData('volume', e.target.value)}
              placeholder="Ex: 0.5"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantité</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => updateFormData('quantity', parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Détails supplémentaires..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit">
              Ajouter le meuble
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ManualFurnitureDialog;
