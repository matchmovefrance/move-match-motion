
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, Plus, X } from 'lucide-react';
import { FurnitureItem } from '../types';

interface FurniturePanelProps {
  selectedFurniture: FurnitureItem[];
  onFurnitureAdd: (item: FurnitureItem) => void;
  onFurnitureRemove: (id: string) => void;
}

const availableFurniture: FurnitureItem[] = [
  {
    id: '1',
    name: 'Canapé 3 places',
    category: 'Salon',
    dimensions: { length: 2.0, width: 0.9, height: 0.8 },
    volume: 1.44,
    weight: 60,
    fragile: false,
    color: '#8B5CF6'
  },
  {
    id: '2',
    name: 'Armoire 2 portes',
    category: 'Chambre',
    dimensions: { length: 1.2, width: 0.6, height: 2.0 },
    volume: 1.44,
    weight: 80,
    fragile: false,
    color: '#06B6D4'
  },
  {
    id: '3',
    name: 'Table à manger',
    category: 'Salle à manger',
    dimensions: { length: 1.5, width: 0.9, height: 0.75 },
    volume: 1.01,
    weight: 45,
    fragile: true,
    color: '#F59E0B'
  },
  {
    id: '4',
    name: 'Réfrigérateur',
    category: 'Cuisine',
    dimensions: { length: 0.6, width: 0.65, height: 1.8 },
    volume: 0.70,
    weight: 120,
    fragile: true,
    color: '#EF4444'
  },
  {
    id: '5',
    name: 'Matelas 160x200',
    category: 'Chambre',
    dimensions: { length: 2.0, width: 1.6, height: 0.25 },
    volume: 0.80,
    weight: 25,
    fragile: false,
    color: '#10B981'
  }
];

const FurniturePanel = ({ selectedFurniture, onFurnitureAdd, onFurnitureRemove }: FurniturePanelProps) => {
  const isSelected = (id: string) => selectedFurniture.some(item => item.id === id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Meubles Disponibles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Available Furniture */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Catalogue</h4>
          {availableFurniture.map((item) => (
            <div
              key={item.id}
              className="p-2 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{item.name}</span>
                <Button
                  size="sm"
                  variant={isSelected(item.id) ? "secondary" : "outline"}
                  onClick={() => isSelected(item.id) ? onFurnitureRemove(item.id) : onFurnitureAdd(item)}
                  disabled={isSelected(item.id)}
                >
                  {isSelected(item.id) ? "Ajouté" : <Plus className="h-3 w-3" />}
                </Button>
              </div>
              
              <div className="text-xs text-gray-600 space-y-1">
                <p>{item.volume.toFixed(2)}m³ - {item.weight}kg</p>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs">
                    {item.category}
                  </Badge>
                  {item.fragile && (
                    <Badge variant="destructive" className="text-xs">
                      Fragile
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedFurniture.length > 0 && (
          <>
            <Separator />
            
            {/* Selected Furniture */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Sélectionnés ({selectedFurniture.length})</h4>
              {selectedFurniture.map((item) => (
                <div
                  key={item.id}
                  className="p-2 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onFurnitureRemove(item.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600">
                    {item.volume.toFixed(2)}m³
                  </p>
                </div>
              ))}
              
              <div className="pt-2 border-t text-xs text-gray-600">
                <p><strong>Volume total:</strong> {selectedFurniture.reduce((sum, item) => sum + item.volume, 0).toFixed(2)}m³</p>
                <p><strong>Poids total:</strong> {selectedFurniture.reduce((sum, item) => sum + item.weight, 0)}kg</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FurniturePanel;
