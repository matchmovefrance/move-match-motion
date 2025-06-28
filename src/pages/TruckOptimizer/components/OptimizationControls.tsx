
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Target, AlertTriangle } from 'lucide-react';
import { TruckModel, FurnitureItem, PlacedItem } from '../types';

interface OptimizationControlsProps {
  truck: TruckModel | null;
  furniture: FurnitureItem[];
  onOptimize: (placements: PlacedItem[]) => void;
}

const OptimizationControls = ({ truck, furniture, onOptimize }: OptimizationControlsProps) => {
  const handleAutoOptimize = () => {
    if (!truck || furniture.length === 0) return;

    // Simple placement algorithm - place items sequentially
    const placements: PlacedItem[] = [];
    let currentX = -truck.dimensions.length / 2;
    let currentZ = -truck.dimensions.width / 2;
    let currentY = 0;
    let rowHeight = 0;

    furniture.forEach((item, index) => {
      // Check if item fits in current position
      if (currentX + item.dimensions.length > truck.dimensions.length / 2) {
        // Move to next row
        currentX = -truck.dimensions.length / 2;
        currentZ += rowHeight + 0.1;
        currentY = 0;
        rowHeight = 0;
      }

      // Check if we're still within truck bounds
      if (currentZ + item.dimensions.width <= truck.dimensions.width / 2) {
        placements.push({
          id: `placed-${index}`,
          furnitureId: item.id,
          position: {
            x: currentX + item.dimensions.length / 2,
            y: currentY + item.dimensions.height / 2,
            z: currentZ + item.dimensions.width / 2
          },
          rotation: { x: 0, y: 0, z: 0 }
        });

        currentX += item.dimensions.length + 0.1;
        rowHeight = Math.max(rowHeight, item.dimensions.width);
      }
    });

    onOptimize(placements);
  };

  const calculateEfficiency = () => {
    if (!truck || furniture.length === 0) return 0;
    const totalFurnitureVolume = furniture.reduce((sum, item) => sum + item.volume, 0);
    return Math.min((totalFurnitureVolume / truck.volume) * 100, 100);
  };

  const getOptimizationTips = () => {
    const tips = [];
    
    if (furniture.some(item => item.fragile)) {
      tips.push("Des objets fragiles nécessitent un placement spécial");
    }
    
    if (calculateEfficiency() > 80) {
      tips.push("Attention: le camion sera très chargé");
    }
    
    if (furniture.length > 5) {
      tips.push("Optimisation recommandée pour ce nombre d'objets");
    }

    return tips;
  };

  if (!truck) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Optimisation Automatique
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Efficacité prévue</p>
            <div className="flex items-center gap-2">
              <Badge variant={calculateEfficiency() > 80 ? "destructive" : "default"}>
                {calculateEfficiency().toFixed(1)}%
              </Badge>
              <span className="text-xs text-gray-500">
                {furniture.reduce((sum, item) => sum + item.volume, 0).toFixed(2)}m³ / {truck.volume}m³
              </span>
            </div>
          </div>
          
          <Button
            onClick={handleAutoOptimize}
            disabled={furniture.length === 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Zap className="h-4 w-4 mr-2" />
            Optimiser
          </Button>
        </div>

        {getOptimizationTips().length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Conseils
            </h4>
            {getOptimizationTips().map((tip, index) => (
              <p key={index} className="text-xs text-gray-600 pl-5">
                • {tip}
              </p>
            ))}
          </div>
        )}

        <div className="pt-2 border-t text-xs text-gray-500">
          <p>L'algorithme place automatiquement vos meubles pour optimiser l'espace et la sécurité.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OptimizationControls;
