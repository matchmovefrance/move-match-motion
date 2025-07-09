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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, Eye, Calendar, MapPin, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { SelectedItem } from '../types';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

const getLocationTypeDisplayName = (locationType: string) => {
  switch (locationType) {
    case 'appartement':
      return 'Appartement';
    case 'maison':
      return 'Maison';
    case 'garde_meuble':
      return 'Garde meuble';
    default:
      return locationType;
  }
};

interface Inventory {
  id: string;
  client_name: string;
  client_reference: string;
  client_email?: string;
  departure_postal_code: string;
  arrival_postal_code: string;
  total_volume: number;
  distance_km: number;
  total_weight?: number;
  selected_items: any; // JSONB field from database
  created_at: string;
  // Ajout des champs de date
  moving_date?: string;
  flexible_dates?: boolean;
  date_range_start?: string;
  date_range_end?: string;
}

interface InventoryHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadInventory: (inventory: any) => void;
}

export function InventoryHistoryDialog({ isOpen, onClose, onLoadInventory }: InventoryHistoryDialogProps) {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [filteredInventories, setFilteredInventories] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'normal' | 'compact'>('normal');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [inventoryToDelete, setInventoryToDelete] = useState<Inventory | null>(null);
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
      setFilteredInventories(data || []);
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

  // Fonction de filtrage
  const filterInventories = () => {
    if (!searchTerm) {
      setFilteredInventories(inventories);
      return;
    }

    const filtered = inventories.filter(inventory => {
      const clientName = inventory.client_name?.toLowerCase() || '';
      const clientEmail = inventory.client_email?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();
      
      return clientName.includes(searchLower) || clientEmail.includes(searchLower);
    });

    setFilteredInventories(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    filterInventories();
  }, [searchTerm, inventories]);

  const deleteInventory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('inventories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const updatedInventories = inventories.filter(inv => inv.id !== id);
      setInventories(updatedInventories);
      setFilteredInventories(updatedInventories.filter(inv => {
        const clientName = inv.client_name?.toLowerCase() || '';
        const clientEmail = inv.client_email?.toLowerCase() || '';
        const searchLower = searchTerm.toLowerCase();
        return !searchTerm || clientName.includes(searchLower) || clientEmail.includes(searchLower);
      }));
      
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

  const handleDeleteClick = (inventory: Inventory) => {
    setInventoryToDelete(inventory);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (inventoryToDelete) {
      await deleteInventory(inventoryToDelete.id);
      setShowDeleteDialog(false);
      setInventoryToDelete(null);
    }
  };

  const handleLoadInventory = (inventory: Inventory) => {
    onLoadInventory({
      clientName: inventory.client_name,
      clientReference: inventory.client_reference,
      clientPhone: (inventory as any).client_phone,
      clientEmail: (inventory as any).client_email,
      notes: (inventory as any).notes,
      selectedItems: inventory.selected_items,
      // Ajout des champs de date
      movingDate: inventory.moving_date,
      flexibleDates: inventory.flexible_dates,
      dateRangeStart: inventory.date_range_start,
      dateRangeEnd: inventory.date_range_end,
      extendedFormData: {
        departureAddress: (inventory as any).departure_address || '',
        departurePostalCode: inventory.departure_postal_code || '',
        arrivalAddress: (inventory as any).arrival_address || '',
        arrivalPostalCode: inventory.arrival_postal_code || '',
        departureLocationType: (inventory as any).departure_location_type || 'appartement',
        departureFloor: (inventory as any).departure_floor || '0',
        departureHasElevator: (inventory as any).departure_has_elevator || false,
        departureElevatorSize: (inventory as any).departure_elevator_size || '',
        departureHasFreightElevator: (inventory as any).departure_has_freight_elevator || false,
        departureCarryingDistance: (inventory as any).departure_carrying_distance || '0',
        departureParkingNeeded: (inventory as any).departure_parking_needed || false,
        arrivalLocationType: (inventory as any).arrival_location_type || 'appartement',
        arrivalFloor: (inventory as any).arrival_floor || '0',
        arrivalHasElevator: (inventory as any).arrival_has_elevator || false,
        arrivalElevatorSize: (inventory as any).arrival_elevator_size || '',
        arrivalHasFreightElevator: (inventory as any).arrival_has_freight_elevator || false,
        arrivalCarryingDistance: (inventory as any).arrival_carrying_distance || '0',
        arrivalParkingNeeded: (inventory as any).arrival_parking_needed || false,
      }
    });
    onClose();
    toast({
      title: "Inventaire chargé",
      description: "L'inventaire complet a été chargé dans le calculateur",
    });
  };

  // Pagination
  const totalPages = Math.ceil(filteredInventories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInventories = filteredInventories.slice(startIndex, endIndex);

  useEffect(() => {
    if (isOpen) {
      setSelectedInventory(null); // Toujours afficher la liste au début
      loadInventories();
    }
  }, [isOpen, user]);

  if (selectedInventory) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Détails de l'inventaire</DialogTitle>
                <DialogDescription>
                  {selectedInventory.client_name} - {new Date(selectedInventory.created_at).toLocaleDateString('fr-FR')}
                </DialogDescription>
              </div>
              <Button 
                onClick={() => setSelectedInventory(null)} 
                variant="outline"
                size="sm"
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              >
                ← Retour à la liste
              </Button>
            </div>
          </DialogHeader>
          
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-blue-600">Informations client</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Nom:</strong> {selectedInventory.client_name}</p>
                    <p><strong>Référence:</strong> {selectedInventory.client_reference}</p>
                    <p><strong>Email:</strong> {(selectedInventory as any).client_email || 'Non renseigné'}</p>
                    <p><strong>Téléphone:</strong> {(selectedInventory as any).client_phone || 'Non renseigné'}</p>
                  </div>
                </div>
                  <div>
                    <h4 className="font-medium mb-3 text-green-600">Détails du déménagement</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Volume total:</strong> {selectedInventory.total_volume.toFixed(2)} m³</p>
                      <p><strong>Distance:</strong> {selectedInventory.distance_km?.toFixed(0)} km</p>
                      <p><strong>Poids estimé:</strong> {selectedInventory.total_weight?.toFixed(0) || 'N/A'} kg</p>
                      <p><strong>Nb objets:</strong> {selectedInventory.selected_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0}</p>
                      {selectedInventory.moving_date && (
                        <p><strong>Date déménagement:</strong> {new Date(selectedInventory.moving_date).toLocaleDateString('fr-FR')}</p>
                      )}
                      {selectedInventory.flexible_dates && selectedInventory.date_range_start && selectedInventory.date_range_end && (
                        <p><strong>Période flexible:</strong> du {new Date(selectedInventory.date_range_start).toLocaleDateString('fr-FR')} au {new Date(selectedInventory.date_range_end).toLocaleDateString('fr-FR')}</p>
                      )}
                    </div>
                  </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-orange-600">Configuration départ</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Adresse:</strong> {(selectedInventory as any).departure_address || 'Non renseignée'}</p>
                    <p><strong>Code postal:</strong> {selectedInventory.departure_postal_code}</p>
                    <p><strong>Type lieu:</strong> {getLocationTypeDisplayName((selectedInventory as any).departure_location_type || 'appartement')}</p>
                    <p><strong>Étage:</strong> {(selectedInventory as any).departure_floor || '0'}</p>
                    <p><strong>Ascenseur:</strong> {(selectedInventory as any).departure_has_elevator ? `Oui (${(selectedInventory as any).departure_elevator_size || 'taille N/A'})` : 'Non'}</p>
                    <p><strong>Monte-charge:</strong> {(selectedInventory as any).departure_has_freight_elevator ? 'Oui' : 'Non'}</p>
                    <p><strong>Distance portage:</strong> {(selectedInventory as any).departure_carrying_distance || '0'}m</p>
                    <p><strong>Stationnement:</strong> {(selectedInventory as any).departure_parking_needed ? 'Nécessaire' : 'Non nécessaire'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3 text-purple-600">Configuration arrivée</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Adresse:</strong> {(selectedInventory as any).arrival_address || 'Non renseignée'}</p>
                    <p><strong>Code postal:</strong> {selectedInventory.arrival_postal_code}</p>
                    <p><strong>Type lieu:</strong> {getLocationTypeDisplayName((selectedInventory as any).arrival_location_type || 'appartement')}</p>
                    <p><strong>Étage:</strong> {(selectedInventory as any).arrival_floor || '0'}</p>
                    <p><strong>Ascenseur:</strong> {(selectedInventory as any).arrival_has_elevator ? `Oui (${(selectedInventory as any).arrival_elevator_size || 'taille N/A'})` : 'Non'}</p>
                    <p><strong>Monte-charge:</strong> {(selectedInventory as any).arrival_has_freight_elevator ? 'Oui' : 'Non'}</p>
                    <p><strong>Distance portage:</strong> {(selectedInventory as any).arrival_carrying_distance || '0'}m</p>
                    <p><strong>Stationnement:</strong> {(selectedInventory as any).arrival_parking_needed ? 'Nécessaire' : 'Non nécessaire'}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3 text-red-600">Inventaire détaillé ({selectedInventory.selected_items?.length || 0} types d'objets)</h4>
                <div className="grid gap-2 max-h-60 overflow-y-auto">
                  {(selectedInventory.selected_items || []).map((item: SelectedItem, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{item.icon}</span>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.category}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">Qté: {item.quantity}</Badge>
                        <Badge variant="outline">{(item.volume * item.quantity).toFixed(3)} m³</Badge>
                        <Badge variant="default">{item.volume.toFixed(3)} m³/u</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {(selectedInventory as any).notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2 text-gray-600">Notes particulières</h4>
                    <p className="text-sm bg-yellow-50 p-3 rounded border">{(selectedInventory as any).notes}</p>
                  </div>
                </>
              )}

            <div className="flex gap-3 pt-4 border-t">
              <Button 
                onClick={() => setSelectedInventory(null)} 
                variant="outline"
                className="flex-1 bg-gray-50 hover:bg-gray-100"
              >
                ← Retour à la liste
              </Button>
              <Button 
                onClick={() => handleLoadInventory(selectedInventory)}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
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
            {/* Barre de recherche et contrôles */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={viewMode} onValueChange={(value: 'normal' | 'compact') => setViewMode(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Résultats */}
            {filteredInventories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'Aucun inventaire trouvé pour cette recherche' : 'Aucun inventaire trouvé'}
              </div>
            ) : (
              <>
                {currentInventories.map((inventory) => (
                  <Card key={inventory.id} className={`hover:bg-gray-50 transition-colors ${viewMode === 'compact' ? 'py-2' : ''}`}>
                    <CardHeader className={viewMode === 'compact' ? 'pb-1 pt-3' : 'pb-3'}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className={viewMode === 'compact' ? 'text-base' : 'text-lg'}>
                            {inventory.client_name || 'Sans nom'}
                          </CardTitle>
                          <CardDescription>
                            <div className={`flex items-center gap-4 mt-1 ${viewMode === 'compact' ? 'text-xs' : ''}`}>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(inventory.created_at).toLocaleDateString('fr-FR')}
                              </span>
                              {inventory.moving_date && (
                                <span className="flex items-center gap-1 text-blue-600">
                                  <Calendar className="h-4 w-4" />
                                  Déménagement: {new Date(inventory.moving_date).toLocaleDateString('fr-FR')}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {inventory.departure_postal_code} → {inventory.arrival_postal_code}
                              </span>
                              {inventory.client_email && (
                                <span className="text-gray-500">{inventory.client_email}</span>
                              )}
                            </div>
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size={viewMode === 'compact' ? 'sm' : 'sm'}
                            onClick={() => setSelectedInventory(inventory)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                          <Button
                            variant="outline"
                            size={viewMode === 'compact' ? 'sm' : 'sm'}
                            onClick={() => handleDeleteClick(inventory)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {viewMode === 'normal' && (
                      <CardContent className="pt-0">
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>Volume: {inventory.total_volume.toFixed(2)} m³</span>
                          <span>Items: {inventory.selected_items?.length || 0}</span>
                          {inventory.distance_km && <span>Distance: {inventory.distance_km.toFixed(0)} km</span>}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} sur {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Dialog de confirmation de suppression */}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Supprimer l'inventaire"
          description={`Êtes-vous sûr de vouloir supprimer l'inventaire de "${inventoryToDelete?.client_name || 'ce client'}" ?`}
          confirmText="Supprimer"
          cancelText="Annuler"
          onConfirm={confirmDelete}
          variant="destructive"
        />
      </DialogContent>
    </Dialog>
  );
}