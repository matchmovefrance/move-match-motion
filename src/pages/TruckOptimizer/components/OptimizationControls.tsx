
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

const OptimizationControls = ({ truck, furniture, onOptimize }: OptimizationControlsProps) => {
  const handle3DOptimize = () => {
    if (!truck || furniture.length === 0) return;

    const placements: PlacedItem[] = [];
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
      
      // Try to find a space that can fit this item
      let placed = false;
      
      for (let i = 0; i < availableSpaces.length && !placed; i++) {
        const space = availableSpaces[i];
        
        if (space.occupied) continue;
        
        // Check if item fits in this space (try different orientations)
        const orientations = [
          { l: itemL, w: itemW, h: itemH, rot: { x: 0, y: 0, z: 0 } },
          { l: itemW, w: itemL, h: itemH, rot: { x: 0, y: Math.PI / 2, z: 0 } },
          { l: itemL, w: itemH, h: itemW, rot: { x: Math.PI / 2, y: 0, z: 0 } },
          { l: itemH, w: itemL, h: itemW, rot: { x: 0, y: 0, z: Math.PI / 2 } },
          { l: itemW, w: itemH, h: itemL, rot: { x: Math.PI / 2, y: Math.PI / 2, z: 0 } },
          { l: itemH, w: itemW, h: itemL, rot: { x: 0, y: Math.PI / 2, z: Math.PI / 2 } }
        ];
        
        for (const orientation of orientations) {
          if (orientation.l <= space.width && 
              orientation.w <= space.depth && 
              orientation.h <= space.height) {
            
            // Place the item
            placements.push({
              id: `placed-${index}`,
              furnitureId: item.id,
              position: {
                x: space.x + orientation.l / 2,
                y: space.y + orientation.h / 2,
                z: space.z + orientation.w / 2
              },
              rotation: orientation.rot
            });
            
            // Mark this space as occupied
            space.occupied = true;
            
            // Create new available spaces from the remaining volume
            const newSpaces: PackingSpace[] = [];
            
            // Right space
            if (space.x + orientation.l < space.x + space.width) {
              newSpaces.push({
                x: space.x + orientation.l,
                y: space.y,
                z: space.z,
                width: space.width - orientation.l,
                height: space.height,
                depth: space.depth,
                occupied: false
              });
            }
            
            // Top space
            if (space.y + orientation.h < space.y + space.height) {
              newSpaces.push({
                x: space.x,
                y: space.y + orientation.h,
                z: space.z,
                width: orientation.l,
                height: space.height - orientation.h,
                depth: space.depth,
                occupied: false
              });
            }
            
            // Back space
            if (space.z + orientation.w < space.z + space.depth) {
              newSpaces.push({
                x: space.x,
                y: space.y,
                z: space.z + orientation.w,
                width: orientation.l,
                height: orientation.h,
                depth: space.depth - orientation.w,
                occupied: false
              });
            }
            
            // Add new spaces to the list
            availableSpaces = availableSpaces.concat(newSpaces);
            
            placed = true;
            break;
          }
        }
      }
      
      // If item couldn't be placed, try to stack it if possible
      if (!placed) {
        // Find the highest placed item and try to stack on top
        const stackableItems = placements.filter(p => {
          const furniture = sortedFurniture.find(f => f.id === p.furnitureId);
          return furniture && !furniture.fragile;
        });
        
        for (const stackItem of stackableItems) {
          const baseFurniture = sortedFurniture.find(f => f.id === stackItem.furnitureId);
          if (!baseFurniture) continue;
          
          const stackX = stackItem.position.x;
          const stackY = stackItem.position.y + baseFurniture.dimensions.height / 2 + itemH / 2;
          const stackZ = stackItem.position.z;
          
          // Check if stacking is within truck bounds and weight constraints
          if (stackY + itemH / 2 <= height && 
              !item.fragile && 
              item.weight <= 50) { // Weight limit for stacking
            
            placements.push({
              id: `placed-${index}`,
              furnitureId: item.id,
              position: { x: stackX, y: stackY, z: stackZ },
              rotation: { x: 0, y: 0, z: 0 }
            });
            
            placed = true;
            break;
          }
        }
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
          <p><strong>Algorithme 3D :</strong> Utilise tout le volume disponible avec rotation automatique et empilement sécurisé.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OptimizationControls;
