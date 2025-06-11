
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Calculator, Plus, Trash2, Save, Info } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Supplier = Tables<'suppliers'>;

interface PricingRule {
  id: string;
  name: string;
  // Prix de base
  basePrice: number;
  volumeRate: number;
  
  // Distance avec conditions
  distanceRateStandard: number;
  distanceRateHeavy: number; // Si volume > 20m³
  
  // Suppléments par service
  floorRate: number; // Par étage supplémentaire
  packingRate: number; // Par carton à emballer
  unpackingRate: number; // Par carton à déballer
  dismantleRate: number; // Par meuble à démonter
  reassembleRate: number; // Par meuble à remonter
  
  // Suppléments conditionnels
  carryingDistanceFee: number; // Si distance portage > 10m
  heavyItemsFee: number; // Si effets lourds > 85kg
  volumeSupplementOver20: number; // Si volume > 20m³
  volumeSupplementOver29: number; // Si volume > 29m³
  furnitureLiftFee: number; // Monte-meuble > 4ème étage sans ascenseur
  
  // Conditions particulières
  parkingFeeIncluded: boolean;
  parkingRate: number;
  minimumPrice: number;
  timeMultiplier: number;
  conditions: string;
}

interface SupplierPricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  onUpdate: () => void;
}

const SupplierPricingDialog = ({ open, onOpenChange, supplier, onUpdate }: SupplierPricingDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [pricingRules, setPricingRules] = useState<PricingRule>({
    id: '1',
    name: 'Tarif standard',
    basePrice: 150,
    volumeRate: 10,
    distanceRateStandard: 1,
    distanceRateHeavy: 2,
    floorRate: 50,
    packingRate: 5,
    unpackingRate: 5,
    dismantleRate: 20,
    reassembleRate: 20,
    carryingDistanceFee: 100,
    heavyItemsFee: 200,
    volumeSupplementOver20: 150,
    volumeSupplementOver29: 160,
    furnitureLiftFee: 500,
    parkingFeeIncluded: false,
    parkingRate: 0,
    minimumPrice: 200,
    timeMultiplier: 1.0,
    conditions: ''
  });

  // Charger les tarifs existants
  useEffect(() => {
    if (supplier && supplier.pricing_model) {
      const existingModel = supplier.pricing_model as any;
      if (existingModel.basePrice) {
        setPricingRules({
          id: '1',
          name: existingModel.name || 'Tarif standard',
          basePrice: existingModel.basePrice || 150,
          volumeRate: existingModel.volumeRate || 10,
          distanceRateStandard: existingModel.distanceRateStandard || 1,
          distanceRateHeavy: existingModel.distanceRateHeavy || 2,
          floorRate: existingModel.floorRate || 50,
          packingRate: existingModel.packingRate || 5,
          unpackingRate: existingModel.unpackingRate || 5,
          dismantleRate: existingModel.dismantleRate || 20,
          reassembleRate: existingModel.reassembleRate || 20,
          carryingDistanceFee: existingModel.carryingDistanceFee || 100,
          heavyItemsFee: existingModel.heavyItemsFee || 200,
          volumeSupplementOver20: existingModel.volumeSupplementOver20 || 150,
          volumeSupplementOver29: existingModel.volumeSupplementOver29 || 160,
          furnitureLiftFee: existingModel.furnitureLiftFee || 500,
          parkingFeeIncluded: existingModel.parkingFeeIncluded || false,
          parkingRate: existingModel.parkingRate || 0,
          minimumPrice: existingModel.minimumPrice || 200,
          timeMultiplier: existingModel.timeMultiplier || 1.0,
          conditions: existingModel.conditions || ''
        });
      }
    }
  }, [supplier]);

  const handleSave = async () => {
    if (!supplier) return;

    setIsLoading(true);
    try {
      const updatedPricingModel = {
        ...pricingRules,
        lastUpdated: new Date().toISOString()
      };

      const { error } = await supabase
        .from('suppliers')
        .update({ 
          pricing_model: updatedPricingModel,
          updated_at: new Date().toISOString()
        })
        .eq('id', supplier.id);

      if (error) throw error;

      toast({
        title: "Tarifs mis à jour",
        description: `Les tarifs de ${supplier.company_name} ont été sauvegardés.`,
      });

      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les tarifs.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePreview = () => {
    // Exemple de calcul avec des valeurs de test
    const volume = 25; // m³
    const distance = 50; // km
    const floors = 2; // étages
    const packingBoxes = 10; // cartons à emballer
    const unpackingBoxes = 10; // cartons à déballer
    const dismantleFurniture = 3; // meubles à démonter
    const reassembleFurniture = 3; // meubles à remonter
    const carryingDistance = 15; // mètres (> 10)
    const hasHeavyItems = true; // effets lourds
    const needsParking = true; // stationnement payant
    const needsFurnitureLift = true; // monte-meuble nécessaire

    let totalPrice = pricingRules.basePrice;
    
    // Volume
    totalPrice += volume * pricingRules.volumeRate;
    
    // Distance (avec condition volume)
    const distanceRate = volume > 20 ? pricingRules.distanceRateHeavy : pricingRules.distanceRateStandard;
    totalPrice += distance * distanceRate;
    
    // Étages
    totalPrice += floors * pricingRules.floorRate;
    
    // Emballage/Déballage
    totalPrice += packingBoxes * pricingRules.packingRate;
    totalPrice += unpackingBoxes * pricingRules.unpackingRate;
    
    // Démontage/Remontage
    totalPrice += dismantleFurniture * pricingRules.dismantleRate;
    totalPrice += reassembleFurniture * pricingRules.reassembleRate;
    
    // Distance de portage
    if (carryingDistance > 10) {
      totalPrice += pricingRules.carryingDistanceFee;
    }
    
    // Effets lourds
    if (hasHeavyItems) {
      totalPrice += pricingRules.heavyItemsFee;
    }
    
    // Suppléments volume
    if (volume > 20) {
      totalPrice += pricingRules.volumeSupplementOver20;
    }
    if (volume > 29) {
      totalPrice += pricingRules.volumeSupplementOver29;
    }
    
    // Stationnement
    if (needsParking && pricingRules.parkingFeeIncluded) {
      totalPrice += pricingRules.parkingRate;
    }
    
    // Monte-meuble
    if (needsFurnitureLift) {
      totalPrice += pricingRules.furnitureLiftFee;
    }
    
    // Multiplicateur temps et prix minimum
    totalPrice *= pricingRules.timeMultiplier;
    totalPrice = Math.max(totalPrice, pricingRules.minimumPrice);
    
    return totalPrice;
  };

  if (!supplier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Configuration des tarifs - {supplier.company_name}
          </DialogTitle>
          <DialogDescription>
            Définissez les règles de calcul des prix pour ce fournisseur avec toutes les variables métier
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Tarifs de base</TabsTrigger>
            <TabsTrigger value="services">Services additionnels</TabsTrigger>
            <TabsTrigger value="preview">Aperçu & Test</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Prix de base et volume</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="basePrice">Prix de base (€)</Label>
                      <Input
                        id="basePrice"
                        type="number"
                        value={pricingRules.basePrice}
                        onChange={(e) => setPricingRules(prev => ({
                          ...prev,
                          basePrice: parseFloat(e.target.value) || 0
                        }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">Prix fixe de départ</p>
                    </div>
                    <div>
                      <Label htmlFor="volumeRate">Tarif par m³ (€/m³)</Label>
                      <Input
                        id="volumeRate"
                        type="number"
                        step="0.1"
                        value={pricingRules.volumeRate}
                        onChange={(e) => setPricingRules(prev => ({
                          ...prev,
                          volumeRate: parseFloat(e.target.value) || 0
                        }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">Multiplié par le volume</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Distance et transport</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="distanceStandard">Distance standard (€/km)</Label>
                      <Input
                        id="distanceStandard"
                        type="number"
                        step="0.1"
                        value={pricingRules.distanceRateStandard}
                        onChange={(e) => setPricingRules(prev => ({
                          ...prev,
                          distanceRateStandard: parseFloat(e.target.value) || 0
                        }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">Si volume ≤ 20m³</p>
                    </div>
                    <div>
                      <Label htmlFor="distanceHeavy">Distance volume lourd (€/km)</Label>
                      <Input
                        id="distanceHeavy"
                        type="number"
                        step="0.1"
                        value={pricingRules.distanceRateHeavy}
                        onChange={(e) => setPricingRules(prev => ({
                          ...prev,
                          distanceRateHeavy: parseFloat(e.target.value) || 0
                        }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">Si volume > 20m³</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Services par unité</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="floorRate">Tarif par étage (€)</Label>
                      <Input
                        id="floorRate"
                        type="number"
                        value={pricingRules.floorRate}
                        onChange={(e) => setPricingRules(prev => ({
                          ...prev,
                          floorRate: parseFloat(e.target.value) || 0
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="packingRate">Emballage par carton (€)</Label>
                      <Input
                        id="packingRate"
                        type="number"
                        value={pricingRules.packingRate}
                        onChange={(e) => setPricingRules(prev => ({
                          ...prev,
                          packingRate: parseFloat(e.target.value) || 0
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="unpackingRate">Déballage par carton (€)</Label>
                      <Input
                        id="unpackingRate"
                        type="number"
                        value={pricingRules.unpackingRate}
                        onChange={(e) => setPricingRules(prev => ({
                          ...prev,
                          unpackingRate: parseFloat(e.target.value) || 0
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dismantleRate">Démontage par meuble (€)</Label>
                      <Input
                        id="dismantleRate"
                        type="number"
                        value={pricingRules.dismantleRate}
                        onChange={(e) => setPricingRules(prev => ({
                          ...prev,
                          dismantleRate: parseFloat(e.target.value) || 0
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reassembleRate">Remontage par meuble (€)</Label>
                      <Input
                        id="reassembleRate"
                        type="number"
                        value={pricingRules.reassembleRate}
                        onChange={(e) => setPricingRules(prev => ({
                          ...prev,
                          reassembleRate: parseFloat(e.target.value) || 0
                        }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Suppléments conditionnels</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="carryingFee">Distance portage > 10m (€)</Label>
                      <Input
                        id="carryingFee"
                        type="number"
                        value={pricingRules.carryingDistanceFee}
                        onChange={(e) => setPricingRules(prev => ({
                          ...prev,
                          carryingDistanceFee: parseFloat(e.target.value) || 0
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="heavyItemsFee">Effets lourds > 85kg (€)</Label>
                      <Input
                        id="heavyItemsFee"
                        type="number"
                        value={pricingRules.heavyItemsFee}
                        onChange={(e) => setPricingRules(prev => ({
                          ...prev,
                          heavyItemsFee: parseFloat(e.target.value) || 0
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="volume20Supplement">Volume > 20m³ (€)</Label>
                      <Input
                        id="volume20Supplement"
                        type="number"
                        value={pricingRules.volumeSupplementOver20}
                        onChange={(e) => setPricingRules(prev => ({
                          ...prev,
                          volumeSupplementOver20: parseFloat(e.target.value) || 0
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="volume29Supplement">Volume > 29m³ (€)</Label>
                      <Input
                        id="volume29Supplement"
                        type="number"
                        value={pricingRules.volumeSupplementOver29}
                        onChange={(e) => setPricingRules(prev => ({
                          ...prev,
                          volumeSupplementOver29: parseFloat(e.target.value) || 0
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="furnitureLiftFee">Monte-meuble > 4ème (€)</Label>
                      <Input
                        id="furnitureLiftFee"
                        type="number"
                        value={pricingRules.furnitureLiftFee}
                        onChange={(e) => setPricingRules(prev => ({
                          ...prev,
                          furnitureLiftFee: parseFloat(e.target.value) || 0
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="parkingRate">Tarif stationnement (€)</Label>
                      <Input
                        id="parkingRate"
                        type="number"
                        value={pricingRules.parkingRate}
                        onChange={(e) => setPricingRules(prev => ({
                          ...prev,
                          parkingRate: parseFloat(e.target.value) || 0
                        }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="timeMultiplier">Multiplicateur temps</Label>
                      <Input
                        id="timeMultiplier"
                        type="number"
                        step="0.1"
                        value={pricingRules.timeMultiplier}
                        onChange={(e) => setPricingRules(prev => ({
                          ...prev,
                          timeMultiplier: parseFloat(e.target.value) || 1
                        }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">1.0 = normal, 1.5 = +50% urgence</p>
                    </div>
                    <div>
                      <Label htmlFor="minimumPrice">Prix minimum (€)</Label>
                      <Input
                        id="minimumPrice"
                        type="number"
                        value={pricingRules.minimumPrice}
                        onChange={(e) => setPricingRules(prev => ({
                          ...prev,
                          minimumPrice: parseFloat(e.target.value) || 0
                        }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="conditions">Conditions particulières</Label>
                    <Input
                      id="conditions"
                      value={pricingRules.conditions}
                      onChange={(e) => setPricingRules(prev => ({
                        ...prev,
                        conditions: e.target.value
                      }))}
                      placeholder="Ex: Supplément weekend, conditions d'accès..."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Aperçu du calcul complet</CardTitle>
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Info className="h-4 w-4" />
                  Exemple avec: 25m³, 50km, 2 étages, 10 cartons, 3 meubles, effets lourds, stationnement, monte-meuble
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Prix de base :</span>
                      <span>{pricingRules.basePrice}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Volume (25m³ × {pricingRules.volumeRate}€) :</span>
                      <span>{(25 * pricingRules.volumeRate).toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Distance (50km × {pricingRules.distanceRateHeavy}€, vol > 20m³) :</span>
                      <span>{(50 * pricingRules.distanceRateHeavy).toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Étages (2 × {pricingRules.floorRate}€) :</span>
                      <span>{(2 * pricingRules.floorRate).toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Emballage/Déballage (20 × {pricingRules.packingRate}€) :</span>
                      <span>{(20 * pricingRules.packingRate).toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Démontage/Remontage (6 × {pricingRules.dismantleRate}€) :</span>
                      <span>{(6 * pricingRules.dismantleRate).toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Distance portage > 10m :</span>
                      <span>{pricingRules.carryingDistanceFee}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Effets lourds > 85kg :</span>
                      <span>{pricingRules.heavyItemsFee}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Supplément volume > 20m³ :</span>
                      <span>{pricingRules.volumeSupplementOver20}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stationnement :</span>
                      <span>{pricingRules.parkingRate}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monte-meuble > 4ème :</span>
                      <span>{pricingRules.furnitureLiftFee}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Multiplicateur × {pricingRules.timeMultiplier} :</span>
                      <span>×{pricingRules.timeMultiplier}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Prix final :</span>
                      <span className="text-green-600">{calculatePreview().toFixed(2)}€</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Formule de calcul complète :</h4>
                  <code className="text-xs bg-white p-3 rounded block overflow-x-auto">
                    max(
                      (150 + (Volume × 10) + Distance_km × IF(Volume > 20, 2, 1) + Nb_Etages × 50 + 
                      Cartons_emballer × 5 + Cartons_deballer × 5 + IF(Distance_portage > 10, 100, 0) + 
                      IF(Effets_lourds = "Oui", 200, 0) + IF(Volume > 20, 150, 0) + 
                      Nb_meubles_demonter × 20 + Nb_meubles_remonter × 20 + IF(Volume > 29, 160, 0) + 
                      IF(Stationnement = "Oui", Tarif_stationnement, 0) + 
                      IF(Monte_meuble AND Etage > 4 AND No_ascenseur, 500, 0)) × timeMultiplier,
                      minimumPrice
                    )
                  </code>
                </div>

                {pricingRules.conditions && (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <h4 className="font-medium mb-1">Conditions particulières :</h4>
                    <p className="text-sm">{pricingRules.conditions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Sauvegarde...' : 'Sauvegarder les tarifs'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierPricingDialog;
