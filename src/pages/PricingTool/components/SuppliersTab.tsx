
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Calculator, Building, Mail, Phone, MapPin, CreditCard } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import CreateSupplierDialog from './CreateSupplierDialog';
import SupplierPricingDialog from './SupplierPricingDialog';
import SupplierBankDetailsDialog from './SupplierBankDetailsDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

type SupplierFromMoves = {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  is_active: boolean;
  priority_level: number;
  pricing_model: any;
  performance_metrics: any;
  created_at: string;
  created_by: string;
  updated_at: string;
  service_provider_id: number | null;
  source: 'moves' | 'suppliers';
};

const SuppliersTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [showBankDetailsDialog, setShowBankDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierFromMoves | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<SupplierFromMoves | null>(null);

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['unified-suppliers'],
    queryFn: async () => {
      console.log('🏢 Chargement des prestataires unifiés...');
      
      // Charger les prestataires depuis la table suppliers
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*');

      if (suppliersError) {
        console.error('❌ Erreur chargement table suppliers:', suppliersError);
      }

      // Charger les prestataires depuis les trajets confirmés
      const { data: movesData, error: movesError } = await supabase
        .from('confirmed_moves')
        .select('mover_id, mover_name, company_name, contact_email, contact_phone')
        .not('mover_id', 'is', null);

      if (movesError) {
        console.error('❌ Erreur chargement prestataires depuis trajets:', movesError);
      }

      // Créer une Map pour gérer les doublons par email/nom entreprise
      const suppliersMap = new Map<string, SupplierFromMoves>();

      // Ajouter les prestataires de la table suppliers
      suppliersData?.forEach((supplier) => {
        const key = `${supplier.email?.toLowerCase()}-${supplier.company_name?.toLowerCase()}`;
        suppliersMap.set(key, {
          id: supplier.id,
          company_name: supplier.company_name,
          contact_name: supplier.contact_name,
          email: supplier.email || '',
          phone: supplier.phone || '',
          address: supplier.address || 'Non spécifié',
          city: supplier.city || 'Non spécifié',
          postal_code: supplier.postal_code || '00000',
          country: supplier.country || 'France',
          is_active: supplier.is_active !== false,
          priority_level: supplier.priority_level || 1,
          pricing_model: supplier.pricing_model || {
            basePrice: 150,
            volumeRate: 10,
            distanceRate: 1,
            distanceRateHighVolume: 2,
            floorRate: 50,
            packingRate: 5,
            unpackingRate: 5,
            dismantleRate: 20,
            reassembleRate: 20,
            carryingDistanceFee: 100,
            carryingDistanceThreshold: 10,
            heavyItemsFee: 200,
            volumeSupplementThreshold1: 20,
            volumeSupplementFee1: 150,
            volumeSupplementThreshold2: 29,
            volumeSupplementFee2: 160,
            furnitureLiftFee: 500,
            furnitureLiftThreshold: 4,
            parkingFeeEnabled: false,
            parkingFeeAmount: 0,
            timeMultiplier: 1,
            minimumPrice: 200,
            matchMoveMargin: 40,
          },
          performance_metrics: supplier.performance_metrics || {
            total_bids: 0,
            acceptance_rate: 0,
            avg_response_time: 0
          },
          created_at: supplier.created_at,
          created_by: supplier.created_by,
          updated_at: supplier.updated_at,
          service_provider_id: supplier.service_provider_id,
          source: 'suppliers'
        });
      });

      // Ajouter les prestataires des trajets (seulement s'ils n'existent pas déjà)
      movesData?.forEach((move) => {
        const email = move.contact_email?.toLowerCase() || '';
        const companyName = move.company_name?.toLowerCase() || '';
        const key = `${email}-${companyName}`;
        
        // Vérifier si ce prestataire existe déjà
        if (!suppliersMap.has(key) && (email || companyName)) {
          suppliersMap.set(key, {
            id: `move-supplier-${move.mover_id}`,
            company_name: move.company_name || 'Entreprise non définie',
            contact_name: move.mover_name || 'Nom non défini',
            email: move.contact_email || '',
            phone: move.contact_phone || '',
            address: 'Non spécifié',
            city: 'Non spécifié',
            postal_code: '00000',
            country: 'France',
            is_active: true,
            priority_level: 1,
            pricing_model: {
              basePrice: 150,
              volumeRate: 10,
              distanceRate: 1,
              distanceRateHighVolume: 2,
              floorRate: 50,
              packingRate: 5,
              unpackingRate: 5,
              dismantleRate: 20,
              reassembleRate: 20,
              carryingDistanceFee: 100,
              carryingDistanceThreshold: 10,
              heavyItemsFee: 200,
              volumeSupplementThreshold1: 20,
              volumeSupplementFee1: 150,
              volumeSupplementThreshold2: 29,
              volumeSupplementFee2: 160,
              furnitureLiftFee: 500,
              furnitureLiftThreshold: 4,
              parkingFeeEnabled: false,
              parkingFeeAmount: 0,
              timeMultiplier: 1,
              minimumPrice: 200,
              matchMoveMargin: 40,
            },
            performance_metrics: {
              total_bids: 0,
              acceptance_rate: 0,
              avg_response_time: 0
            },
            created_at: new Date().toISOString(),
            created_by: user?.id || '',
            updated_at: new Date().toISOString(),
            service_provider_id: null,
            source: 'moves'
          });
        }
      });

      const uniqueSuppliers = Array.from(suppliersMap.values());
      console.log('✅ Prestataires unifiés chargés:', uniqueSuppliers.length);
      console.log('📊 Répartition:', {
        fromSuppliers: uniqueSuppliers.filter(s => s.source === 'suppliers').length,
        fromMoves: uniqueSuppliers.filter(s => s.source === 'moves').length
      });
      
      return uniqueSuppliers;
    },
    enabled: !!user,
  });

  const handleDeleteClick = (supplier: SupplierFromMoves) => {
    setSupplierToDelete(supplier);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!supplierToDelete) return;

    if (supplierToDelete.source === 'moves') {
      toast({
        title: "Information",
        description: "Ce prestataire provient des trajets confirmés et ne peut pas être supprimé",
      });
    } else {
      try {
        const { error } = await supabase
          .from('suppliers')
          .delete()
          .eq('id', supplierToDelete.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Prestataire supprimé avec succès",
        });
        
        queryClient.invalidateQueries({ queryKey: ['unified-suppliers'] });
      } catch (error) {
        console.error('Error deleting supplier:', error);
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le prestataire",
          variant: "destructive",
        });
      }
    }
    
    setShowDeleteDialog(false);
    setSupplierToDelete(null);
  };

  const handleEditPricing = (supplier: SupplierFromMoves) => {
    setSelectedSupplier(supplier);
    setShowPricingDialog(true);
  };

  const handleEditBankDetails = (supplier: SupplierFromMoves) => {
    setSelectedSupplier(supplier);
    setShowBankDetailsDialog(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateDialog(false);
    queryClient.invalidateQueries({ queryKey: ['unified-suppliers'] });
    queryClient.invalidateQueries({ queryKey: ['pricing-stats'] });
  };

  const handlePricingUpdate = () => {
    setShowPricingDialog(false);
    setSelectedSupplier(null);
    queryClient.invalidateQueries({ queryKey: ['unified-suppliers'] });
  };

  const handleBankDetailsUpdate = () => {
    setShowBankDetailsDialog(false);
    setSelectedSupplier(null);
    queryClient.invalidateQueries({ queryKey: ['unified-suppliers'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Prestataires ({suppliers?.length || 0})</h3>
          <p className="text-sm text-muted-foreground">
            Prestataires unifiés depuis les trajets confirmés et la table prestataires (sans doublons)
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un prestataire
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suppliers?.map((supplier) => (
          <Card key={supplier.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="h-4 w-4 text-blue-600" />
                    {supplier.company_name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {supplier.contact_name}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={supplier.is_active ? "default" : "secondary"}>
                    {supplier.is_active ? "Actif" : "Inactif"}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {supplier.source === 'moves' ? 'Trajets' : 'DB'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                {supplier.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{supplier.city}, {supplier.country}</span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-2">
                  Modèle de tarification: {supplier.pricing_model && Object.keys(supplier.pricing_model as any).length > 0 ? 'Configuré' : 'Non configuré'}
                  {supplier.pricing_model?.matchMoveMargin && (
                    <span className="text-green-600 font-medium"> (Marge: {supplier.pricing_model.matchMoveMargin}%)</span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPricing(supplier)}
                    className="text-xs"
                  >
                    <Calculator className="h-3 w-3 mr-1" />
                    Tarifs
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditBankDetails(supplier)}
                    className="text-xs text-green-600 hover:text-green-700"
                  >
                    <CreditCard className="h-3 w-3 mr-1" />
                    RIB
                  </Button>
                </div>
                
                <div className="flex justify-center mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteClick(supplier)}
                    className="text-red-600 hover:text-red-700 text-xs"
                    disabled={supplier.source === 'moves'}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    {supplier.source === 'moves' ? 'Non supprimable' : 'Supprimer'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!suppliers || suppliers.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Building className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun prestataire trouvé</h3>
              <p className="text-muted-foreground text-center mb-4">
                Aucun prestataire dans la base de données ou les trajets confirmés
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un prestataire manuellement
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <CreateSupplierDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateSuccess}
      />

      <SupplierPricingDialog
        open={showPricingDialog}
        onOpenChange={setShowPricingDialog}
        supplier={selectedSupplier}
        onUpdate={handlePricingUpdate}
      />

      <SupplierBankDetailsDialog
        open={showBankDetailsDialog}
        onOpenChange={setShowBankDetailsDialog}
        supplier={selectedSupplier}
        onUpdate={handleBankDetailsUpdate}
      />

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Supprimer le prestataire"
        description={`Êtes-vous sûr de vouloir supprimer ${supplierToDelete?.company_name} ? Cette action ne peut pas être annulée.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </div>
  );
};

export default SuppliersTab;
