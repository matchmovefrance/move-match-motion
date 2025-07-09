import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EditVolumeDialogProps {
  item: {
    id: string;
    name: string;
    volume: number;
    category: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onVolumeUpdated: (itemId: string, newVolume: number) => void;
}

export function EditVolumeDialog({ item, isOpen, onClose, onVolumeUpdated }: EditVolumeDialogProps) {
  const [newVolume, setNewVolume] = useState(item?.volume?.toString() || '0');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSave = async () => {
    const volumeNum = parseFloat(newVolume);
    if (isNaN(volumeNum) || volumeNum <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un volume valide",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Vérifier si un volume personnalisé existe déjà
      const { data: existingVolume } = await supabase
        .from('furniture_volumes')
        .select('*')
        .eq('furniture_id', item.id)
        .maybeSingle();

      if (existingVolume) {
        // Mettre à jour le volume existant
        const { error } = await supabase
          .from('furniture_volumes')
          .update({
            custom_volume: volumeNum,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingVolume.id);

        if (error) throw error;
      } else {
        // Créer un nouveau volume personnalisé
        const { error } = await supabase
          .from('furniture_volumes')
          .insert({
            furniture_id: item.id,
            furniture_name: item.name,
            custom_volume: volumeNum,
            default_volume: item.volume,
            category: item.category,
            modified_by: user?.id,
          });

        if (error) throw error;
      }

      onVolumeUpdated(item.id, volumeNum);
      toast({
        title: "Volume mis à jour",
        description: "Le volume a été sauvegardé comme nouvelle valeur par défaut",
      });
      onClose();
    } catch (error) {
      console.error('Error updating volume:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le volume",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!item) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier le volume</DialogTitle>
          <DialogDescription>
            Modifiez le volume de "{item.name}". Cette modification sera sauvegardée comme nouvelle valeur par défaut.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="volume" className="text-right">
              Volume (m³)
            </Label>
            <Input
              id="volume"
              type="number"
              step="0.001"
              value={newVolume}
              onChange={(e) => setNewVolume(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}