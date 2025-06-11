
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Calculator, Plus, Trash2, Save } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Supplier = Tables<'suppliers'>;

interface PricingRule {
  id: string;
  name: string;
  basePrice: number;
  distanceRate: number;
  volumeRate: number;
  timeMultiplier: number;
  minimumPrice: number;
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
    basePrice: 300,
    distanceRate: 1.5,
    volumeRate: 45,
    timeMultiplier: 1.0,
    minimumPrice: 200,
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
          basePrice: existingModel.basePrice || 300,
          distanceRate: existingModel.distanceRate || 1.5,
          volumeRate: existingModel.volumeRate || 45,
          timeMultiplier: existingModel.timeMultiplier || 1.0,
          minimumPrice: existingModel.minimumPrice || 200,
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
    const exampleVolume = 20; // m³
    const exampleDistance = 50; // km
    const calculatedPrice = pricingRules.basePrice + 
                           (exampleDistance * pricingRules.distanceRate) + 
                           (exampleVolume * pricingRules.volumeRate);
    
    return Math.max(calculatedPrice * pricingRules.timeMultiplier, pricingRules.minimumPrice);
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
            Définissez les règles de calcul des prix pour ce fournisseur
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Configuration des tarifs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Paramètres de tarification</CardTitle>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="distanceRate">Tarif par km (€/km)</Label>
                  <Input
                    id="distanceRate"
                    type="number"
                    step="0.1"
                    value={pricingRules.distanceRate}
                    onChange={(e) => setPricingRules(prev => ({
                      ...prev,
                      distanceRate: parseFloat(e.target.value) || 0
                    }))}
                  />
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
                </div>
              </div>

              <div>
                <Label htmlFor="timeMultiplier">Multiplicateur de temps</Label>
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
                <p className="text-xs text-gray-500 mt-1">
                  1.0 = tarif normal, 1.5 = +50% pour urgence, etc.
                </p>
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

          {/* Aperçu du calcul */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aperçu du calcul</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Exemple de calcul :</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Prix de base :</span>
                    <span>{pricingRules.basePrice}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Distance (50 km × {pricingRules.distanceRate}€) :</span>
                    <span>{(50 * pricingRules.distanceRate).toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Volume (20 m³ × {pricingRules.volumeRate}€) :</span>
                    <span>{(20 * pricingRules.volumeRate).toFixed(2)}€</span>
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
                <h4 className="font-medium mb-2">Formule de calcul :</h4>
                <code className="text-xs bg-white p-2 rounded block">
                  max(
                    (basePrice + (distance × distanceRate) + (volume × volumeRate)) × timeMultiplier,
                    minimumPrice
                  )
                </code>
              </div>

              {pricingRules.conditions && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <h4 className="font-medium mb-1">Conditions :</h4>
                  <p className="text-sm">{pricingRules.conditions}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
