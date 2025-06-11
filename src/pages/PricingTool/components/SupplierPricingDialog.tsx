
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calculator, Save, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Supplier = Tables<'suppliers'>;

interface SupplierPricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  onUpdate: () => void;
}

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
}

const defaultPricingModel: PricingModel = {
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
};

const SupplierPricingDialog = ({ open, onOpenChange, supplier, onUpdate }: SupplierPricingDialogProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('base');
  const [pricing, setPricing] = useState<PricingModel>(defaultPricingModel);
  const [loading, setLoading] = useState(false);

  // Sample calculation values for preview
  const [previewData, setPreviewData] = useState({
    volume: 25,
    distance: 15,
    floors: 2,
    packingBoxes: 10,
    unpackingBoxes: 10,
    dismantleFurniture: 3,
    reassembleFurniture: 3,
    carryingDistance: 15,
    heavyItems: true,
    parkingRequired: false,
    furnitureLift: false,
    floorLevel: 3,
  });

  useEffect(() => {
    if (supplier?.pricing_model) {
      const existingModel = supplier.pricing_model as any;
      setPricing({
        ...defaultPricingModel,
        ...existingModel,
      });
    } else {
      setPricing(defaultPricingModel);
    }
  }, [supplier]);

  const calculatePreviewPrice = () => {
    let total = pricing.basePrice;
    
    // Volume
    total += previewData.volume * pricing.volumeRate;
    
    // Distance avec condition volume
    const distanceRate = previewData.volume > 20 ? pricing.distanceRateHighVolume : pricing.distanceRate;
    total += previewData.distance * distanceRate;
    
    // Étages
    total += previewData.floors * pricing.floorRate;
    
    // Emballage/Déballage
    total += previewData.packingBoxes * pricing.packingRate;
    total += previewData.unpackingBoxes * pricing.unpackingRate;
    
    // Démontage/Remontage
    total += previewData.dismantleFurniture * pricing.dismantleRate;
    total += previewData.reassembleFurniture * pricing.reassembleRate;
    
    // Distance de portage
    if (previewData.carryingDistance > pricing.carryingDistanceThreshold) {
      total += pricing.carryingDistanceFee;
    }
    
    // Effets lourds
    if (previewData.heavyItems) {
      total += pricing.heavyItemsFee;
    }
    
    // Suppléments volume
    if (previewData.volume > pricing.volumeSupplementThreshold1) {
      total += pricing.volumeSupplementFee1;
    }
    if (previewData.volume > pricing.volumeSupplementThreshold2) {
      total += pricing.volumeSupplementFee2;
    }
    
    // Monte-meuble
    if (previewData.furnitureLift && previewData.floorLevel > pricing.furnitureLiftThreshold) {
      total += pricing.furnitureLiftFee;
    }
    
    // Stationnement
    if (previewData.parkingRequired && pricing.parkingFeeEnabled) {
      total += pricing.parkingFeeAmount;
    }
    
    // Multiplicateur de temps
    total *= pricing.timeMultiplier;
    
    // Prix minimum
    return Math.max(total, pricing.minimumPrice);
  };

  const handleSave = async () => {
    if (!supplier) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('suppliers')
        .update({
          pricing_model: pricing
        })
        .eq('id', supplier.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Modèle de tarification mis à jour",
      });

      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating pricing:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le modèle de tarification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePricing = (field: keyof PricingModel, value: number | boolean) => {
    setPricing(prev => ({ ...prev, [field]: value }));
  };

  const updatePreviewData = (field: keyof typeof previewData, value: number | boolean) => {
    setPreviewData(prev => ({ ...prev, [field]: value }));
  };

  if (!supplier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Configuration des tarifs - {supplier.company_name}
          </DialogTitle>
          <DialogDescription>
            Configurez le modèle de tarification pour ce fournisseur
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="base">Tarifs de base</TabsTrigger>
            <TabsTrigger value="services">Services & Options</TabsTrigger>
            <TabsTrigger value="preview">Aperçu & Test</TabsTrigger>
          </TabsList>

          <TabsContent value="base" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tarification de base</CardTitle>
                <CardDescription>Prix de base et tarifs principaux</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Prix de base (€)</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    value={pricing.basePrice}
                    onChange={(e) => updatePricing('basePrice', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volumeRate">Prix par m³ (€)</Label>
                  <Input
                    id="volumeRate"
                    type="number"
                    value={pricing.volumeRate}
                    onChange={(e) => updatePricing('volumeRate', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="distanceRate">Prix par km (volume {'<='} 20m³)</Label>
                  <Input
                    id="distanceRate"
                    type="number"
                    step="0.1"
                    value={pricing.distanceRate}
                    onChange={(e) => updatePricing('distanceRate', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="distanceRateHighVolume">Prix par km (volume {'>'} 20m³)</Label>
                  <Input
                    id="distanceRateHighVolume"
                    type="number"
                    step="0.1"
                    value={pricing.distanceRateHighVolume}
                    onChange={(e) => updatePricing('distanceRateHighVolume', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="floorRate">Prix par étage (€)</Label>
                  <Input
                    id="floorRate"
                    type="number"
                    value={pricing.floorRate}
                    onChange={(e) => updatePricing('floorRate', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumPrice">Prix minimum (€)</Label>
                  <Input
                    id="minimumPrice"
                    type="number"
                    value={pricing.minimumPrice}
                    onChange={(e) => updatePricing('minimumPrice', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeMultiplier">Coefficient multiplicateur</Label>
                  <Input
                    id="timeMultiplier"
                    type="number"
                    step="0.01"
                    value={pricing.timeMultiplier}
                    onChange={(e) => updatePricing('timeMultiplier', Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Suppléments volume</CardTitle>
                <CardDescription>Frais additionnels basés sur le volume</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="volumeSupplementThreshold1">Seuil 1 (m³)</Label>
                  <Input
                    id="volumeSupplementThreshold1"
                    type="number"
                    value={pricing.volumeSupplementThreshold1}
                    onChange={(e) => updatePricing('volumeSupplementThreshold1', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Si le volume est {'>'} à cette valeur, ajouter les frais
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volumeSupplementFee1">Frais 1 (€)</Label>
                  <Input
                    id="volumeSupplementFee1"
                    type="number"
                    value={pricing.volumeSupplementFee1}
                    onChange={(e) => updatePricing('volumeSupplementFee1', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volumeSupplementThreshold2">Seuil 2 (m³)</Label>
                  <Input
                    id="volumeSupplementThreshold2"
                    type="number"
                    value={pricing.volumeSupplementThreshold2}
                    onChange={(e) => updatePricing('volumeSupplementThreshold2', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Si le volume est {'>'} à cette valeur, ajouter les frais
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volumeSupplementFee2">Frais 2 (€)</Label>
                  <Input
                    id="volumeSupplementFee2"
                    type="number"
                    value={pricing.volumeSupplementFee2}
                    onChange={(e) => updatePricing('volumeSupplementFee2', Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Services de manutention</CardTitle>
                <CardDescription>Emballage, démontage, remontage</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="packingRate">Emballage par carton (€)</Label>
                  <Input
                    id="packingRate"
                    type="number"
                    value={pricing.packingRate}
                    onChange={(e) => updatePricing('packingRate', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unpackingRate">Déballage par carton (€)</Label>
                  <Input
                    id="unpackingRate"
                    type="number"
                    value={pricing.unpackingRate}
                    onChange={(e) => updatePricing('unpackingRate', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dismantleRate">Démontage par meuble (€)</Label>
                  <Input
                    id="dismantleRate"
                    type="number"
                    value={pricing.dismantleRate}
                    onChange={(e) => updatePricing('dismantleRate', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reassembleRate">Remontage par meuble (€)</Label>
                  <Input
                    id="reassembleRate"
                    type="number"
                    value={pricing.reassembleRate}
                    onChange={(e) => updatePricing('reassembleRate', Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Options supplémentaires</CardTitle>
                <CardDescription>Frais conditionnels</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carryingDistanceThreshold">Seuil de distance de portage (m)</Label>
                  <Input
                    id="carryingDistanceThreshold"
                    type="number"
                    value={pricing.carryingDistanceThreshold}
                    onChange={(e) => updatePricing('carryingDistanceThreshold', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Si la distance est {'>'} à cette valeur, ajouter les frais
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carryingDistanceFee">Frais de portage (€)</Label>
                  <Input
                    id="carryingDistanceFee"
                    type="number"
                    value={pricing.carryingDistanceFee}
                    onChange={(e) => updatePricing('carryingDistanceFee', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heavyItemsFee">Frais pour objets lourds (€)</Label>
                  <Input
                    id="heavyItemsFee"
                    type="number"
                    value={pricing.heavyItemsFee}
                    onChange={(e) => updatePricing('heavyItemsFee', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supplément pour objets {'>'} 85kg
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parkingFeeAmount">Frais de stationnement (€)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="parkingFeeAmount"
                      type="number"
                      value={pricing.parkingFeeAmount}
                      onChange={(e) => updatePricing('parkingFeeAmount', Number(e.target.value))}
                      disabled={!pricing.parkingFeeEnabled}
                    />
                    <Select
                      value={pricing.parkingFeeEnabled ? "true" : "false"}
                      onValueChange={(v) => updatePricing('parkingFeeEnabled', v === "true")}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Actif?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Activé</SelectItem>
                        <SelectItem value="false">Désactivé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="furnitureLiftThreshold">Étage seuil pour monte-meuble</Label>
                  <Input
                    id="furnitureLiftThreshold"
                    type="number"
                    value={pricing.furnitureLiftThreshold}
                    onChange={(e) => updatePricing('furnitureLiftThreshold', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Monte-meuble requis si étage {'>'} à cette valeur
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="furnitureLiftFee">Frais de monte-meuble (€)</Label>
                  <Input
                    id="furnitureLiftFee"
                    type="number"
                    value={pricing.furnitureLiftFee}
                    onChange={(e) => updatePricing('furnitureLiftFee', Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Prévisualisation du tarif</CardTitle>
                <CardDescription>
                  Simulez un devis avec ce modèle de tarification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="volume">Volume (m³)</Label>
                    <Input
                      id="volume"
                      type="number"
                      value={previewData.volume}
                      onChange={(e) => updatePreviewData('volume', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="distance">Distance (km)</Label>
                    <Input
                      id="distance"
                      type="number"
                      value={previewData.distance}
                      onChange={(e) => updatePreviewData('distance', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="floors">Nombre d'étages</Label>
                    <Input
                      id="floors"
                      type="number"
                      value={previewData.floors}
                      onChange={(e) => updatePreviewData('floors', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="packingBoxes">Cartons à emballer</Label>
                    <Input
                      id="packingBoxes"
                      type="number"
                      value={previewData.packingBoxes}
                      onChange={(e) => updatePreviewData('packingBoxes', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unpackingBoxes">Cartons à déballer</Label>
                    <Input
                      id="unpackingBoxes"
                      type="number"
                      value={previewData.unpackingBoxes}
                      onChange={(e) => updatePreviewData('unpackingBoxes', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="floorLevel">Étage actuel</Label>
                    <Input
                      id="floorLevel"
                      type="number"
                      value={previewData.floorLevel}
                      onChange={(e) => updatePreviewData('floorLevel', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dismantleFurniture">Meubles à démonter</Label>
                    <Input
                      id="dismantleFurniture"
                      type="number"
                      value={previewData.dismantleFurniture}
                      onChange={(e) => updatePreviewData('dismantleFurniture', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reassembleFurniture">Meubles à remonter</Label>
                    <Input
                      id="reassembleFurniture"
                      type="number"
                      value={previewData.reassembleFurniture}
                      onChange={(e) => updatePreviewData('reassembleFurniture', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carryingDistance">Distance de portage (m)</Label>
                    <Input
                      id="carryingDistance"
                      type="number"
                      value={previewData.carryingDistance}
                      onChange={(e) => updatePreviewData('carryingDistance', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Objets lourds</Label>
                    <Select
                      value={previewData.heavyItems ? "true" : "false"}
                      onValueChange={(v) => updatePreviewData('heavyItems', v === "true")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Objets lourds?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Oui</SelectItem>
                        <SelectItem value="false">Non</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Stationnement payant</Label>
                    <Select
                      value={previewData.parkingRequired ? "true" : "false"}
                      onValueChange={(v) => updatePreviewData('parkingRequired', v === "true")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Stationnement?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Oui</SelectItem>
                        <SelectItem value="false">Non</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Monte-meuble</Label>
                    <Select
                      value={previewData.furnitureLift ? "true" : "false"}
                      onValueChange={(v) => updatePreviewData('furnitureLift', v === "true")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Monte-meuble?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Oui</SelectItem>
                        <SelectItem value="false">Non</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="rounded-lg bg-blue-50 p-6 text-center">
                  <h3 className="text-lg font-semibold text-blue-800">Prix estimé</h3>
                  <div className="mt-2 text-3xl font-bold text-blue-900">
                    {calculatePreviewPrice().toLocaleString('fr-FR')} €
                  </div>
                  <p className="mt-2 text-sm text-blue-600">
                    La formule utilise toutes les variables configurées pour calculer ce prix
                  </p>
                </div>

                <div className="mt-6 text-sm text-muted-foreground">
                  <h4 className="font-semibold mb-1">Formule de calcul</h4>
                  <p className="whitespace-pre-wrap">
                    {`Prix de base (${pricing.basePrice}€)
+ Volume (${previewData.volume} m³) × ${pricing.volumeRate}€
+ Distance (${previewData.distance} km) × ${previewData.volume > 20 ? pricing.distanceRateHighVolume : pricing.distanceRate}€
+ Étages (${previewData.floors}) × ${pricing.floorRate}€
+ Cartons à emballer (${previewData.packingBoxes}) × ${pricing.packingRate}€
+ Cartons à déballer (${previewData.unpackingBoxes}) × ${pricing.unpackingRate}€
+ Meubles à démonter (${previewData.dismantleFurniture}) × ${pricing.dismantleRate}€
+ Meubles à remonter (${previewData.reassembleFurniture}) × ${pricing.reassembleRate}€
${previewData.carryingDistance > pricing.carryingDistanceThreshold ? `+ Frais de portage (${pricing.carryingDistanceFee}€)` : ''}
${previewData.heavyItems ? `+ Frais pour objets lourds (${pricing.heavyItemsFee}€)` : ''}
${previewData.volume > pricing.volumeSupplementThreshold1 ? `+ Supplément volume 1 (${pricing.volumeSupplementFee1}€)` : ''}
${previewData.volume > pricing.volumeSupplementThreshold2 ? `+ Supplément volume 2 (${pricing.volumeSupplementFee2}€)` : ''}
${previewData.furnitureLift && previewData.floorLevel > pricing.furnitureLiftThreshold ? `+ Frais monte-meuble (${pricing.furnitureLiftFee}€)` : ''}
${previewData.parkingRequired && pricing.parkingFeeEnabled ? `+ Frais de stationnement (${pricing.parkingFeeAmount}€)` : ''}
× Coefficient multiplicateur (${pricing.timeMultiplier})
= Total minimum ${pricing.minimumPrice}€`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? 'Enregistrement...' : (
              <>
                <Save className="h-4 w-4" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierPricingDialog;
