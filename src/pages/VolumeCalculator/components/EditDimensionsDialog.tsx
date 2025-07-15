import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface EditDimensionsDialogProps {
  item: {
    id: string;
    name: string;
    dimensions?: {
      length_cm?: number;
      width_cm?: number;
      height_cm?: number;
    };
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onDimensionsUpdated: (itemId: string, dimensions: { length_cm?: number; width_cm?: number; height_cm?: number }) => void;
}

export const EditDimensionsDialog = ({ item, isOpen, onClose, onDimensionsUpdated }: EditDimensionsDialogProps) => {
  const [dimensions, setDimensions] = useState({
    length_cm: '',
    width_cm: '',
    height_cm: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (item) {
      setDimensions({
        length_cm: item.dimensions?.length_cm?.toString() || '',
        width_cm: item.dimensions?.width_cm?.toString() || '',
        height_cm: item.dimensions?.height_cm?.toString() || ''
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    setIsLoading(true);
    
    try {
      const updateData = {
        length_cm: dimensions.length_cm ? parseInt(dimensions.length_cm) : null,
        width_cm: dimensions.width_cm ? parseInt(dimensions.width_cm) : null,
        height_cm: dimensions.height_cm ? parseInt(dimensions.height_cm) : null
      };

      const { error } = await supabase
        .from('custom_furniture')
        .update(updateData)
        .eq('id', item.id);

      if (error) throw error;

      // Mettre à jour les dimensions dans le composant parent
      onDimensionsUpdated(item.id, {
        length_cm: updateData.length_cm || undefined,
        width_cm: updateData.width_cm || undefined,
        height_cm: updateData.height_cm || undefined
      });

      toast({
        title: "Dimensions mises à jour",
        description: "Les dimensions du meuble ont été mises à jour avec succès",
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating dimensions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les dimensions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setDimensions(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier les dimensions</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Meuble: {item?.name}
            </Label>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="length_cm" className="text-sm text-gray-700">
                  Longueur (cm)
                </Label>
                <Input
                  id="length_cm"
                  type="number"
                  min="1"
                  value={dimensions.length_cm}
                  onChange={(e) => handleInputChange('length_cm', e.target.value)}
                  placeholder="L"
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="width_cm" className="text-sm text-gray-700">
                  Largeur (cm)
                </Label>
                <Input
                  id="width_cm"
                  type="number"
                  min="1"
                  value={dimensions.width_cm}
                  onChange={(e) => handleInputChange('width_cm', e.target.value)}
                  placeholder="l"
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="height_cm" className="text-sm text-gray-700">
                  Hauteur (cm)
                </Label>
                <Input
                  id="height_cm"
                  type="number"
                  min="1"
                  value={dimensions.height_cm}
                  onChange={(e) => handleInputChange('height_cm', e.target.value)}
                  placeholder="H"
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};