import React from 'react';
import { X, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SelectedItem } from '../types';

interface InventoryDisplayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: SelectedItem[];
}

export const InventoryDisplayDialog: React.FC<InventoryDisplayDialogProps> = ({
  isOpen,
  onClose,
  selectedItems
}) => {
  const calculateTotalVolume = () => {
    return selectedItems.reduce((total, item) => {
      return total + (item.volume * item.quantity);
    }, 0);
  };

  const countPackingOptions = (item: SelectedItem) => {
    if (!item.packingOptions) return 0;
    return item.packingOptions.filter(Boolean).length;
  };

  const countUnpackingOptions = (item: SelectedItem) => {
    if (!item.unpackingOptions) return 0;
    return item.unpackingOptions.filter(Boolean).length;
  };

  const countDisassemblyOptions = (item: SelectedItem) => {
    if (!item.disassemblyOptions) return 0;
    return item.disassemblyOptions.filter(Boolean).length;
  };

  const formatVolume = (volume: number) => {
    return volume.toFixed(2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <DialogTitle className="text-xl font-semibold">
              Inventaire des meubles sélectionnés
            </DialogTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4 overflow-auto">
          {selectedItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun meuble sélectionné</p>
              <p className="text-sm">Utilisez le sélecteur de meubles pour ajouter des items à votre inventaire.</p>
            </div>
          ) : (
            <>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total d'articles:</span> {selectedItems.length}
                  </div>
                  <div>
                    <span className="font-medium">Volume total:</span> {formatVolume(calculateTotalVolume())} m³
                  </div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Meuble</TableHead>
                      <TableHead className="font-semibold text-center">Catégorie</TableHead>
                      <TableHead className="font-semibold text-center">Quantité</TableHead>
                      <TableHead className="font-semibold text-center">Volume unitaire</TableHead>
                      <TableHead className="font-semibold text-center">Volume total</TableHead>
                      <TableHead className="font-semibold text-center">Options</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedItems.map((item, index) => (
                      <TableRow key={`${item.id}-${index}`} className="hover:bg-muted/30">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-xs">
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-center">
                          {formatVolume(item.volume)} m³
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {formatVolume(item.volume * item.quantity)} m³
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {countPackingOptions(item) > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {countPackingOptions(item)} Emb
                              </Badge>
                            )}
                            {countUnpackingOptions(item) > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {countUnpackingOptions(item)} Déb
                              </Badge>
                            )}
                            {countDisassemblyOptions(item) > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {countDisassemblyOptions(item)} Dém
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Separator />

              <div className="bg-primary/5 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">Volume total de l'inventaire:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatVolume(calculateTotalVolume())} m³
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};