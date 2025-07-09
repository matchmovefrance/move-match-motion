import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, Eye, Calendar, MapPin } from 'lucide-react';
import { SelectedItem } from '../types';

interface Inventory {
  id: string;
  client_name: string;
  client_reference: string;
  departure_postal_code: string;
  arrival_postal_code: string;
  total_volume: number;
  distance_km: number;
  selected_items: any; // JSONB field from database
  created_at: string;
}

interface InventoryHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadInventory: (inventory: any) => void;
}

export function InventoryHistoryDialog({ isOpen, onClose, onLoadInventory }: InventoryHistoryDialogProps) {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadInventories = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInventories(data || []);
    } catch (error) {
      console.error('Error loading inventories:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteInventory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('inventories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInventories(inventories.filter(inv => inv.id !== id));
      toast({
        title: "Inventaire supprimé",
        description: "L'inventaire a été supprimé avec succès",
      });
    } catch (error) {
      console.error('Error deleting inventory:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'inventaire",
        variant: "destructive",
      });
    }
  };

  const handleLoadInventory = (inventory: Inventory) => {
    onLoadInventory({
      clientName: inventory.client_name,
      clientReference: inventory.client_reference,
      selectedItems: inventory.selected_items,
      // Vous pouvez ajouter d'autres champs selon vos besoins
    });
    onClose();
    toast({
      title: "Inventaire chargé",
      description: "L'inventaire a été chargé dans le calculateur",
    });
  };

  useEffect(() => {
    if (isOpen) {
      loadInventories();
    }
  }, [isOpen, user]);

  if (selectedInventory) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de l'inventaire</DialogTitle>
            <DialogDescription>
              {selectedInventory.client_name} - {new Date(selectedInventory.created_at).toLocaleDateString('fr-FR')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Informations client</h4>
                <p><strong>Nom:</strong> {selectedInventory.client_name}</p>
                <p><strong>Référence:</strong> {selectedInventory.client_reference}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Détails du déménagement</h4>
                <p><strong>Volume total:</strong> {selectedInventory.total_volume.toFixed(2)} m³</p>
                <p><strong>Distance:</strong> {selectedInventory.distance_km?.toFixed(0)} km</p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Items ({selectedInventory.selected_items?.length || 0})</h4>
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {(selectedInventory.selected_items || []).map((item: SelectedItem, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>{item.name}</span>
                    <div className="flex gap-2">
                      <Badge variant="secondary">Qté: {item.quantity}</Badge>
                      <Badge variant="outline">{(item.volume * item.quantity).toFixed(3)} m³</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => setSelectedInventory(null)} variant="outline">
                Retour
              </Button>
              <Button onClick={() => handleLoadInventory(selectedInventory)}>
                Charger cet inventaire
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historique des inventaires</DialogTitle>
          <DialogDescription>
            Consultez et chargez vos anciens inventaires
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : inventories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun inventaire trouvé
          </div>
        ) : (
          <div className="space-y-4">
            {inventories.map((inventory) => (
              <Card key={inventory.id} className="hover:bg-gray-50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{inventory.client_name || 'Sans nom'}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(inventory.created_at).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {inventory.departure_postal_code} → {inventory.arrival_postal_code}
                          </span>
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInventory(inventory)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteInventory(inventory.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Volume: {inventory.total_volume.toFixed(2)} m³</span>
                    <span>Items: {inventory.selected_items?.length || 0}</span>
                    {inventory.distance_km && <span>Distance: {inventory.distance_km.toFixed(0)} km</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}