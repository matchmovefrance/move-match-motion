
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Calculator, Building, Mail, Phone, MapPin } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import CreateSupplierDialog from './CreateSupplierDialog';
import SupplierPricingDialog from './SupplierPricingDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Supplier = Tables<'suppliers'>;

const SuppliersTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      console.log('🏢 Chargement des prestataires...');
      
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur chargement prestataires:', error);
        throw error;
      }

      // Filtrer les doublons et exclure le déménageur demo spécifique
      const uniqueSuppliers = data?.filter((supplier, index, self) => {
        // Exclure "Déménagements Express SARL" avec "Jean Dupont"
        if (supplier.company_name === 'Déménagements Express SARL' && 
            supplier.contact_name === 'Jean Dupont') {
          return false;
        }
        
        // Éviter les doublons par email
        return index === self.findIndex(s => s.email === supplier.email);
      }) || [];

      console.log('✅ Prestataires uniques chargés:', uniqueSuppliers.length);
      return uniqueSuppliers;
    },
    enabled: !!user,
  });

  const handleDelete = async (supplier: Supplier) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplier.id)
        .eq('created_by', user?.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-stats'] });
      
      toast({
        title: "Succès",
        description: "Prestataire supprimé avec succès",
      });
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le prestataire",
        variant: "destructive",
      });
    }
  };

  const handleEditPricing = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowPricingDialog(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateDialog(false);
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    queryClient.invalidateQueries({ queryKey: ['pricing-stats'] });
  };

  const handlePricingUpdate = () => {
    setShowPricingDialog(false);
    setSelectedSupplier(null);
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
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
            Gérez vos prestataires et leurs modèles de tarification
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
                    Priorité {supplier.priority_level}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{supplier.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{supplier.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{supplier.city}, {supplier.country}</span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-2">
                  Modèle de tarification: {supplier.pricing_model && Object.keys(supplier.pricing_model as any).length > 0 ? 'Configuré' : 'Non configuré'}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPricing(supplier)}
                    className="flex-1"
                  >
                    <Calculator className="h-3 w-3 mr-1" />
                    Tarifs
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer le prestataire</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer {supplier.company_name} ? 
                          Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(supplier)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!suppliers || suppliers.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Building className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun prestataire</h3>
              <p className="text-muted-foreground text-center mb-4">
                Commencez par ajouter des prestataires pour utiliser le système de devis
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter le premier prestataire
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
    </div>
  );
};

export default SuppliersTab;
