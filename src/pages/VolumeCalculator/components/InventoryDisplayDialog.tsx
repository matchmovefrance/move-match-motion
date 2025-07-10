import React from 'react';
import { X, Package, User, MapPin, Calendar, Clock } from 'lucide-react';
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
  clientData?: {
    name: string;
    reference: string;
    phone: string;
    email: string;
    address: string;
    notes: string;
  };
  extendedFormData?: any;
  movingDate?: string;
  flexibleDates?: boolean;
  dateRangeStart?: string;
  dateRangeEnd?: string;
}

export const InventoryDisplayDialog: React.FC<InventoryDisplayDialogProps> = ({
  isOpen,
  onClose,
  selectedItems,
  clientData,
  extendedFormData,
  movingDate,
  flexibleDates,
  dateRangeStart,
  dateRangeEnd
}) => {
  const calculateTotalVolume = () => {
    return selectedItems.reduce((total, item) => {
      return total + (item.volume * item.quantity);
    }, 0);
  };

  const countPackingOptions = (item: SelectedItem) => {
    console.log('Counting packing options for item:', item.name, 'packingOptions:', item.packingOptions);
    if (!item.packingOptions || !Array.isArray(item.packingOptions)) return 0;
    const count = item.packingOptions.filter(Boolean).length;
    console.log('Packing count:', count);
    return count;
  };

  const countUnpackingOptions = (item: SelectedItem) => {
    console.log('Counting unpacking options for item:', item.name, 'unpackingOptions:', item.unpackingOptions);
    if (!item.unpackingOptions || !Array.isArray(item.unpackingOptions)) return 0;
    const count = item.unpackingOptions.filter(Boolean).length;
    console.log('Unpacking count:', count);
    return count;
  };

  const countDisassemblyOptions = (item: SelectedItem) => {
    console.log('Counting disassembly options for item:', item.name, 'disassemblyOptions:', item.disassemblyOptions);
    if (!item.disassemblyOptions || !Array.isArray(item.disassemblyOptions)) return 0;
    const count = item.disassemblyOptions.filter(Boolean).length;
    console.log('Disassembly count:', count);
    return count;
  };

  const formatVolume = (volume: number) => {
    return volume.toFixed(2);
  };

  const getLocationTypeDisplayName = (locationType: string) => {
    switch (locationType) {
      case 'appartement':
        return 'Appartement';
      case 'maison':
        return 'Maison';
      case 'garde_meuble':
        return 'Garde meuble';
      default:
        return locationType || 'Non spécifié';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Non spécifiée';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 p-6 border-b">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <DialogTitle className="text-xl font-semibold">
              Inventaire détaillé
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

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Informations client et déménagement */}
          {(clientData || movingDate || extendedFormData) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Informations du client et du déménagement
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Informations client */}
                {clientData && (
                  <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                    <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                      Client
                    </h4>
                    {clientData.name && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Nom:</span>
                        <span className="text-sm">{clientData.name}</span>
                      </div>
                    )}
                    {clientData.reference && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Référence:</span>
                        <span className="text-sm">{clientData.reference}</span>
                      </div>
                    )}
                    {clientData.phone && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Téléphone:</span>
                        <span className="text-sm">{clientData.phone}</span>
                      </div>
                    )}
                    {clientData.email && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Email:</span>
                        <span className="text-sm">{clientData.email}</span>
                      </div>
                    )}
                    {clientData.address && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Adresse:</span>
                        <span className="text-sm">{clientData.address}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Informations de déménagement */}
                <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Dates de déménagement
                  </h4>
                  {movingDate && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Date souhaitée:</span>
                      <span className="text-sm">{formatDate(movingDate)}</span>
                    </div>
                  )}
                  {flexibleDates && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Dates flexibles:</span>
                      <span className="text-sm">Oui</span>
                    </div>
                  )}
                  {dateRangeStart && dateRangeEnd && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Période:</span>
                      <span className="text-sm">{formatDate(dateRangeStart)} - {formatDate(dateRangeEnd)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Configuration des lieux */}
              {extendedFormData && (extendedFormData.departurePostalCode || extendedFormData.arrivalPostalCode) && (
                <div className="space-y-4">
                  <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Configuration des lieux
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Lieu de départ */}
                    {extendedFormData.departurePostalCode && (
                      <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                        <h5 className="font-medium text-sm text-green-600">📍 Départ</h5>
                        <div className="space-y-1 text-xs">
                          {extendedFormData.departurePostalCode && (
                            <div className="flex justify-between">
                              <span>Code postal:</span>
                              <span className="font-medium">{extendedFormData.departurePostalCode}</span>
                            </div>
                          )}
                          {extendedFormData.departureLocationType && (
                            <div className="flex justify-between">
                              <span>Type de logement:</span>
                              <span className="font-medium">{getLocationTypeDisplayName(extendedFormData.departureLocationType)}</span>
                            </div>
                          )}
                          {extendedFormData.departureFloor && (
                            <div className="flex justify-between">
                              <span>Étage:</span>
                              <span className="font-medium">{extendedFormData.departureFloor}</span>
                            </div>
                          )}
                          {extendedFormData.departureHasElevator !== undefined && (
                            <div className="flex justify-between">
                              <span>Ascenseur:</span>
                              <span className="font-medium">{extendedFormData.departureHasElevator ? 'Oui' : 'Non'}</span>
                            </div>
                          )}
                          {extendedFormData.departureCarryingDistance && (
                            <div className="flex justify-between">
                              <span>Distance de portage:</span>
                              <span className="font-medium">{extendedFormData.departureCarryingDistance}m</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Lieu d'arrivée */}
                    {extendedFormData.arrivalPostalCode && (
                      <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                        <h5 className="font-medium text-sm text-blue-600">📍 Arrivée</h5>
                        <div className="space-y-1 text-xs">
                          {extendedFormData.arrivalPostalCode && (
                            <div className="flex justify-between">
                              <span>Code postal:</span>
                              <span className="font-medium">{extendedFormData.arrivalPostalCode}</span>
                            </div>
                          )}
                          {extendedFormData.arrivalLocationType && (
                            <div className="flex justify-between">
                              <span>Type de logement:</span>
                              <span className="font-medium">{getLocationTypeDisplayName(extendedFormData.arrivalLocationType)}</span>
                            </div>
                          )}
                          {extendedFormData.arrivalFloor && (
                            <div className="flex justify-between">
                              <span>Étage:</span>
                              <span className="font-medium">{extendedFormData.arrivalFloor}</span>
                            </div>
                          )}
                          {extendedFormData.arrivalHasElevator !== undefined && (
                            <div className="flex justify-between">
                              <span>Ascenseur:</span>
                              <span className="font-medium">{extendedFormData.arrivalHasElevator ? 'Oui' : 'Non'}</span>
                            </div>
                          )}
                          {extendedFormData.arrivalCarryingDistance && (
                            <div className="flex justify-between">
                              <span>Distance de portage:</span>
                              <span className="font-medium">{extendedFormData.arrivalCarryingDistance}m</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {clientData?.notes && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-2">
                    Notes
                  </h4>
                  <p className="text-sm">{clientData.notes}</p>
                </div>
              )}

              <Separator />
            </div>
          )}
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