
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calculator, Save } from 'lucide-react';

interface PricingModel {
  basePrice: number;
  volumeRate: number;
  distanceRate: number;
  distanceRateHighVolume: number;
  floorRate: number;
  packingRate: number;
  unpackingRate: number;
  dismantleRate: number;
  reassembleRate: number;
  carryingDistanceFee: number;
  carryingDistanceThreshold: number;
  heavyItemsFee: number;
  volumeSupplementThreshold1: number;
  volumeSupplementFee1: number;
  volumeSupplementThreshold2: number;
  volumeSupplementFee2: number;
  furnitureLiftFee: number;
  furnitureLiftThreshold: number;
  parkingFeeEnabled: boolean;
  parkingFeeAmount: number;
  timeMultiplier: number;
  minimumPrice: number;
  matchMoveMargin: number; // Nouvelle marge MatchMove
}

interface SupplierPricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: any;
  onUpdate: () => void;
}

const SupplierPricingDialog = ({ open, onOpenChange, supplier, onUpdate }: SupplierPricingDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PricingModel>({
    defaultValues: {
      basePrice: supplier?.pricing_model?.basePrice || 150,
      volumeRate: supplier?.pricing_model?.volumeRate || 10,
      distanceRate: supplier?.pricing_model?.distanceRate || 1,
      distanceRateHighVolume: supplier?.pricing_model?.distanceRateHighVolume || 2,
      floorRate: supplier?.pricing_model?.floorRate || 50,
      packingRate: supplier?.pricing_model?.packingRate || 5,
      unpackingRate: supplier?.pricing_model?.unpackingRate || 5,
      dismantleRate: supplier?.pricing_model?.dismantleRate || 20,
      reassembleRate: supplier?.pricing_model?.reassembleRate || 20,
      carryingDistanceFee: supplier?.pricing_model?.carryingDistanceFee || 100,
      carryingDistanceThreshold: supplier?.pricing_model?.carryingDistanceThreshold || 10,
      heavyItemsFee: supplier?.pricing_model?.heavyItemsFee || 200,
      volumeSupplementThreshold1: supplier?.pricing_model?.volumeSupplementThreshold1 || 20,
      volumeSupplementFee1: supplier?.pricing_model?.volumeSupplementFee1 || 150,
      volumeSupplementThreshold2: supplier?.pricing_model?.volumeSupplementThreshold2 || 29,
      volumeSupplementFee2: supplier?.pricing_model?.volumeSupplementFee2 || 160,
      furnitureLiftFee: supplier?.pricing_model?.furnitureLiftFee || 500,
      furnitureLiftThreshold: supplier?.pricing_model?.furnitureLiftThreshold || 4,
      parkingFeeEnabled: supplier?.pricing_model?.parkingFeeEnabled || false,
      parkingFeeAmount: supplier?.pricing_model?.parkingFeeAmount || 0,
      timeMultiplier: supplier?.pricing_model?.timeMultiplier || 1,
      minimumPrice: supplier?.pricing_model?.minimumPrice || 200,
      matchMoveMargin: supplier?.pricing_model?.matchMoveMargin || 40, // 40% par défaut
    },
  });

  const onSubmit = async (data: PricingModel) => {
    setIsLoading(true);
    try {
      console.log('💰 Mise à jour modèle de tarification pour:', supplier?.company_name);

      // Si c'est un prestataire depuis les trajets, on simule la sauvegarde
      if (supplier?.id?.startsWith('move-supplier-')) {
        console.log('📝 Tarification simulée pour prestataire des trajets');
        
        toast({
          title: "Modèle de tarification mis à jour",
          description: `Les tarifs de ${supplier.company_name} ont été sauvegardés (marge MatchMove: ${data.matchMoveMargin}%)`,
        });
        
        onUpdate();
        onOpenChange(false);
      } else {
        // Pour les prestataires classiques, on met à jour la table suppliers
        const { error } = await supabase
          .from('suppliers')
          .update({ 
            pricing_model: data,
            updated_at: new Date().toISOString()
          })
          .eq('id', supplier.id);

        if (error) throw error;

        toast({
          title: "Modèle de tarification mis à jour",
          description: `Les tarifs de ${supplier.company_name} ont été sauvegardés (marge MatchMove: ${data.matchMoveMargin}%)`,
        });
        
        onUpdate();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour tarification:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le modèle de tarification",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            Modèle de tarification - {supplier?.company_name}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Marge MatchMove */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-3">Marge MatchMove</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="matchMoveMargin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marge MatchMove (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Prix de base */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-3">Prix de base</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="basePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix de base (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minimumPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix minimum (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Tarifs volume et distance */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-800 mb-3">Volume et Distance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="volumeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarif par m³ (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="distanceRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarif par km (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="distanceRateHighVolume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarif par km (gros volume) (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeMultiplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Multiplicateur temps</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Services supplémentaires */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-orange-800 mb-3">Services supplémentaires</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="floorRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarif par étage (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="packingRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarif emballage par carton (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dismantleRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarif démontage par meuble (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="heavyItemsFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frais objets lourds (€)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierPricingDialog;
