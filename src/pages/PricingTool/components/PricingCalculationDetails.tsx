
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, Info } from 'lucide-react';

interface PricingCalculationDetailsProps {
  quote: {
    supplier_company: string;
    supplier_price: number;
    matchmove_margin: number;
    calculated_price: number;
    pricing_breakdown?: {
      exactDistance: number;
      estimatedVolume: number;
      estimatedFloors: number;
      marginPercentage: number;
      supplierPricingModel: any;
      basePrice: number;
      volumeRate: number;
      distanceRate: number;
      matchMoveMarginUsed: number;
      quoteType: string;
      calculationDetails: {
        baseCalculation: number;
        finalSupplierPrice: number;
        marginAmount: number;
        finalClientPrice: number;
      };
    };
  };
}

export const PricingCalculationDetails = ({ quote }: PricingCalculationDetailsProps) => {
  const breakdown = quote.pricing_breakdown;
  
  if (!breakdown) {
    return (
      <Card>
        <CardContent className="text-center py-4">
          <Info className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Détails de calcul non disponibles</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Calculator className="h-4 w-4" />
          Détails du calcul - {quote.supplier_company}
          <Badge variant="outline" className="text-xs">
            {breakdown.quoteType}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informations de base */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Distance :</span>
            <div className="font-medium">{breakdown.exactDistance} km</div>
          </div>
          <div>
            <span className="text-muted-foreground">Volume :</span>
            <div className="font-medium">{breakdown.estimatedVolume} m³</div>
          </div>
          <div>
            <span className="text-muted-foreground">Étages estimés :</span>
            <div className="font-medium">{breakdown.estimatedFloors}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Type de devis :</span>
            <div className="font-medium capitalize">{breakdown.quoteType}</div>
          </div>
        </div>

        {/* Variables du modèle prestataire */}
        <div className="border-t pt-3">
          <h4 className="font-medium text-sm mb-2 text-blue-600">Variables du modèle prestataire</h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Prix de base :</span>
              <div className="font-medium">{breakdown.basePrice}€</div>
            </div>
            <div>
              <span className="text-muted-foreground">Tarif/m³ :</span>
              <div className="font-medium">{breakdown.volumeRate}€</div>
            </div>
            <div>
              <span className="text-muted-foreground">Tarif/km :</span>
              <div className="font-medium">{breakdown.distanceRate}€</div>
            </div>
          </div>
          
          {breakdown.supplierPricingModel && (
            <div className="mt-2 text-xs text-muted-foreground">
              <details className="cursor-pointer">
                <summary className="hover:text-foreground">Voir modèle complet</summary>
                <pre className="mt-2 bg-muted p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(breakdown.supplierPricingModel, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>

        {/* Calcul détaillé */}
        <div className="border-t pt-3">
          <h4 className="font-medium text-sm mb-2 text-green-600">Calcul détaillé</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Calcul de base :</span>
              <span className="font-mono">{breakdown.calculationDetails.baseCalculation.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span>Prix prestataire final :</span>
              <span className="font-mono font-medium text-blue-600">
                {breakdown.calculationDetails.finalSupplierPrice}€
              </span>
            </div>
            <div className="flex justify-between border-t pt-1">
              <span>Marge MatchMove ({breakdown.matchMoveMarginUsed}%) :</span>
              <span className="font-mono text-orange-600">
                +{breakdown.calculationDetails.marginAmount}€
              </span>
            </div>
            <div className="flex justify-between border-t pt-1 font-medium">
              <span>Prix final client :</span>
              <span className="font-mono text-lg text-green-600">
                {breakdown.calculationDetails.finalClientPrice}€
              </span>
            </div>
          </div>
        </div>

        {/* Vérification marge */}
        <div className="border-t pt-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Vérification marge</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Marge appliquée : {breakdown.marginPercentage.toFixed(1)}% 
            {breakdown.marginPercentage >= 39 && breakdown.marginPercentage <= 41 ? (
              <Badge variant="default" className="ml-2 text-xs">✓ Conforme 40%</Badge>
            ) : (
              <Badge variant="destructive" className="ml-2 text-xs">⚠ Écart détecté</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
