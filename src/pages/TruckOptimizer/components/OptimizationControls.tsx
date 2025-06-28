
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Target, AlertTriangle, AlertCircle } from 'lucide-react';
import { TruckModel, FurnitureItem, PlacedItem } from '../types';
import { useState } from 'react';

interface OptimizationControlsProps {
  truck: TruckModel | null;
  furniture: FurnitureItem[];
  onOptimize: (placements: PlacedItem[]) => void;
}

// 3D Bin Packing Algorithm
interface PackingSpace {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  occupied: boolean;
}

interface OptimizationResult {
  placements: PlacedItem[];
  unplacedItems: FurnitureItem[];
  warnings: string[];
}

const OptimizationControls = ({ truck, furniture, onOptimize }: OptimizationControlsProps) => {
  const [lastOptimizationResult, setLastOptimizationResult] = useState<OptimizationResult | null>(null);

  const handle3DOptimize = () => {
    if (!truck || furniture.length === 0) return;

    const result = performOptimization();
    setLastOptimizationResult(result);
    onOptimize(result.placements);
  };

  const performOptimization = (): OptimizationResult => {
    if (!truck) return { placements: [], unplacedItems: [], warnings: [] };

    const placements: PlacedItem[] = [];
    const unplacedItems: FurnitureItem[] = [];
    const warnings: string[] = [];
    const { length, width, height } = truck.dimensions;
    
    // Initialize available spaces - start with the full truck volume
    let availableSpaces: PackingSpace[] = [{
      x: -length / 2,
      y: 0,
      z: -width / 2,
      width: length,
      height: height,
      depth: width,
      occupied: false
    }];

    // Sort furniture by volume (largest first) for better optimization
    const sortedFurniture = [...furniture].sort((a, b) => b.volume - a.volume);

    sortedFurniture.forEach((item, index) => {
      const { length: itemL, width: itemW, height: itemH } = item.dimensions;
      
      // Generate all possible orientations for this item
      const orientations = [
        { l: itemL, w: itemW, h: itemH, rot: { x: 0, y: 0, z: 0 }, name: 'normale' },
        { l: itemW, w: itemL, h: itemH, rot: { x: 0, y: Math.PI / 2, z: 0 }, name: 'rotation 90°' },
        { l: itemL, w: itemH, h: itemW, rot: { x: Math.PI / 2, y: 0, z: 0 }, name: 'sur le côté' },
        { l: itemH, w: itemL, h: itemW, rot: { x: 0, y: 0, z: Math.PI / 2 }, name: 'debout' },
        { l: itemW, w: itemH, h: itemL, rot: { x: Math.PI / 2, y: Math.PI / 2, z: 0 }, name: 'rotation complexe 1' },
        { l: itemH, w: itemW, h: itemL, rot: { x: 0, y: Math.PI / 2, z: Math.PI / 2 }, name: 'rotation complexe 2' }
      ];
      
      let placed = false;
      let bestFitSpace: PackingSpace | null = null;
      let bestOrientation: typeof orientations[0] | null = null;
      
      // Try to find the best fitting space for any orientation
      for (let i = 0; i < availableSpaces.length && !placed; i++) {
        const space = availableSpaces[i];
        
        if (space.occupied) continue;
        
        // Try each orientation in this space
        for (const orientation of orientations) {
          // Check if this orientation fits in the current space
          if (orientation.l <= space.width && 
              orientation.w <= space.depth && 
              orientation.h <= space.height) {
            
            // Check if the item fits within truck bounds
            const itemCenterX = space.x + orientation.l / 2;
            const itemCenterY = space.y + orientation.h / 2;
            const itemCenterZ = space.z + orientation.w / 2;
            
            const itemMinX = itemCenterX - orientation.l / 2;
            const itemMaxX = itemCenterX + orientation.l / 2;
            const itemMinZ = itemCenterZ - orientation.w / 2;
            const itemMaxZ = itemCenterZ + orientation.w / 2;
            const itemMaxY = itemCenterY + orientation.h / 2;
            
            if (itemMinX >= -length / 2 && itemMaxX <= length / 2 &&
                itemMinZ >= -width / 2 && itemMaxZ <= width / 2 &&
                itemMaxY <= height) {
              
              bestFitSpace = space;
              bestOrientation = orientation;
              break;
            }
          }
        }
        
        if (bestFitSpace && bestOrientation) break;
      }
      
      // Place the item if we found a good fit
      if (bestFitSpace && bestOrientation) {
        const itemCenterX = bestFitSpace.x + bestOrientation.l / 2;
        const itemCenterY = bestFitSpace.y + bestOrientation.h / 2;
        const itemCenterZ = bestFitSpace.z + bestOrientation.w / 2;
        
        placements.push({
          id: `placed-${index}`,
          furnitureId: item.id,
          position: {
            x: itemCenterX,
            y: itemCenterY,
            z: itemCenterZ
          },
          rotation: bestOrientation.rot
        });
        
        // Mark this space as occupied
        bestFitSpace.occupied = true;
        
        // Create new available spaces from the remaining volume
        const newSpaces: PackingSpace[] = [];
        
        // Right space
        if (bestFitSpace.x + bestOrientation.l < bestFitSpace.x + bestFitSpace.width) {
          newSpaces.push({
            x: bestFitSpace.x + bestOrientation.l,
            y: bestFitSpace.y,
            z: bestFitSpace.z,
            width: bestFitSpace.width - bestOrientation.l,
            height: bestFitSpace.height,
            depth: bestFitSpace.depth,
            occupied: false
          });
        }
        
        // Top space
        if (bestFitSpace.y + bestOrientation.h < bestFitSpace.y + bestFitSpace.height) {
          newSpaces.push({
            x: bestFitSpace.x,
            y: bestFitSpace.y + bestOrientation.h,
            z: bestFitSpace.z,
            width: bestOrientation.l,
            height: bestFitSpace.height - bestOrientation.h,
            depth: bestFitSpace.depth,
            occupied: false
          });
        }
        
        // Back space
        if (bestFitSpace.z + bestOrientation.w < bestFitSpace.z + bestFitSpace.depth) {
          newSpaces.push({
            x: bestFitSpace.x,
            y: bestFitSpace.y,
            z: bestFitSpace.z + bestOrientation.w,
            width: bestOrientation.l,
            height: bestOrientation.h,
            depth: bestFitSpace.depth - bestOrientation.w,
            occupied: false
          });
        }
        
        // Add new spaces to the list
        availableSpaces = availableSpaces.concat(newSpaces);
        placed = true;
        
        if (bestOrientation.name !== 'normale') {
          warnings.push(`${item.name} placé en ${bestOrientation.name}`);
        }
      } else {
        // Item couldn't be placed - try stacking if possible
        let stacked = false;
        
        if (!item.fragile && item.weight <= 50) {
          // Find the highest placed item and try to stack on top
          const stackableItems = placements.filter(p => {
            const furniture = sortedFurniture.find(f => f.id === p.furnitureId);
            return furniture && !furniture.fragile && furniture.weight >= item.weight;
          });
          
          for (const stackItem of stackableItems) {
            const baseFurniture = sortedFurniture.find(f => f.id === stackItem.furnitureId);
            if (!baseFurniture) continue;
            
            const stackX = stackItem.position.x;
            const stackY = stackItem.position.y + baseFurniture.dimensions.height / 2 + itemH / 2;
            const stackZ = stackItem.position.z;
            
            // Check if stacking is within truck bounds
            if (stackY + itemH / 2 <= height) {
              placements.push({
                id: `placed-${index}`,
                furnitureId: item.id,
                position: { x: stackX, y: stackY, z: stackZ },
                rotation: { x: 0, y: 0, z: 0 }
              });
              
              stacked = true;
              warnings.push(`${item.name} empilé sur ${baseFurniture.name}`);
              break;
            }
          }
        }
        
        if (!stacked) {
          unplacedItems.push(item);
        }
      }
    });

    return { placements, unplacedItems, warnings };
  };

  const calculateEfficiency = () => {
    if (!truck || furniture.length === 0) return 0;
    const totalFurnitureVolume = furniture.reduce((sum, item) => sum + item.volume, 0);
    return Math.min((totalFurnitureVolume / truck.volume) * 100, 100);
  };

  const getOptimizationTips = () => {
    const tips = [];
    
    if (furniture.some(item => item.fragile)) {
      tips.push("Les objets fragiles seront placés en sécurité (pas d'empilement)");
    }
    
    if (calculateEfficiency() > 80) {
      tips.push("Volume important: optimisation 3D recommandée");
    }
    
    if (furniture.length > 5) {
      tips.push("Algorithme 3D utilisé pour maximiser l'espace");
    }

    const heavyItems = furniture.filter(item => item.weight > 50);
    if (heavyItems.length > 0) {
      tips.push("Objets lourds placés au sol pour la stabilité");
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
          Optimisation 3D Intelligente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Efficacité volumétrique</p>
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
            onClick={handle3DOptimize}
            disabled={furniture.length === 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Zap className="h-4 w-4 mr-2" />
            Optimiser 3D
          </Button>
        </div>

        {/* Optimization Results */}
        {lastOptimizationResult && (
          <div className="space-y-3">
            {lastOptimizationResult.unplacedItems.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-sm font-medium text-red-800 flex items-center gap-1 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  Objets non placés ({lastOptimizationResult.unplacedItems.length})
                </h4>
                <div className="space-y-1">
                  {lastOptimizationResult.unplacedItems.map((item, index) => (
                    <p key={index} className="text-xs text-red-700">
                      • {item.name} - Dimensions: {item.dimensions.length}×{item.dimensions.width}×{item.dimensions.height}m
                    </p>
                  ))}
                </div>
                <p className="text-xs text-red-600 mt-2 font-medium">
                  Ces objets ne peuvent pas être placés même avec toutes les rotations possibles.
                </p>
              </div>
            )}

            {lastOptimizationResult.warnings.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="text-sm font-medium text-amber-800 flex items-center gap-1 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  Optimisations appliquées
                </h4>
                <div className="space-y-1">
                  {lastOptimizationResult.warnings.map((warning, index) => (
                    <p key={index} className="text-xs text-amber-700">• {warning}</p>
                  ))}
                </div>
              </div>
            )}

            {lastOptimizationResult.placements.length > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>✓ {lastOptimizationResult.placements.length} objets placés avec succès</strong>
                </p>
              </div>
            )}
          </div>
        )}

        {getOptimizationTips().length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Stratégie d'optimisation
            </h4>
            {getOptimizationTips().map((tip, index) => (
              <p key={index} className="text-xs text-gray-600 pl-5">
                • {tip}
              </p>
            ))}
          </div>
        )}

        <div className="pt-2 border-t text-xs text-gray-500">
          <p><strong>Algorithme 3D :</strong> Teste toutes les rotations possibles et utilise l'empilement sécurisé pour maximiser l'espace.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OptimizationControls;
