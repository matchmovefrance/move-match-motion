
import { useState } from 'react';
import { Package, Truck, RotateCcw, Save, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import TruckSelector from './components/TruckSelector';
import FurniturePanel from './components/FurniturePanel';
import Scene3D from './components/Scene3D';
import OptimizationControls from './components/OptimizationControls';
import { TruckModel, FurnitureItem, PlacedItem } from './types';

const TruckOptimizer = () => {
  const [selectedTruck, setSelectedTruck] = useState<TruckModel | null>(null);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [selectedFurniture, setSelectedFurniture] = useState<FurnitureItem[]>([]);

  const handleTruckSelect = (truck: TruckModel) => {
    setSelectedTruck(truck);
    setPlacedItems([]); // Reset placement when changing truck
  };

  const handleFurnitureAdd = (furniture: FurnitureItem) => {
    setSelectedFurniture(prev => [...prev, furniture]);
  };

  const handleFurnitureRemove = (id: string) => {
    setSelectedFurniture(prev => prev.filter(item => item.id !== id));
    setPlacedItems(prev => prev.filter(item => item.furnitureId !== id));
  };

  const handleItemPlace = (item: PlacedItem) => {
    setPlacedItems(prev => [...prev, item]);
  };

  const handleItemRemove = (id: string) => {
    setPlacedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleReset = () => {
    setPlacedItems([]);
    setSelectedFurniture([]);
  };

  const calculateUsedVolume = () => {
    return placedItems.reduce((total, item) => {
      const furniture = selectedFurniture.find(f => f.id === item.furnitureId);
      return total + (furniture ? furniture.volume : 0);
    }, 0);
  };

  const calculateUsagePercentage = () => {
    if (!selectedTruck) return 0;
    const usedVolume = calculateUsedVolume();
    return (usedVolume / selectedTruck.volume) * 100;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-600 rounded-lg text-white">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Optimiseur de Chargement 3D</h1>
              <p className="text-gray-600">Optimisez le chargement de vos camions de déménagement</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Truck className="h-3 w-3" />
              {selectedTruck ? selectedTruck.name : 'Aucun camion sélectionné'}
            </Badge>
            <Badge variant="outline">
              {selectedFurniture.length} meuble{selectedFurniture.length > 1 ? 's' : ''} sélectionné{selectedFurniture.length > 1 ? 's' : ''}
            </Badge>
            {selectedTruck && (
              <Badge 
                variant={calculateUsagePercentage() > 80 ? "destructive" : "default"}
                className="bg-blue-100 text-blue-800"
              >
                {calculateUsagePercentage().toFixed(1)}% utilisé
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Truck Selection */}
          <div className="lg:col-span-1">
            <TruckSelector 
              selectedTruck={selectedTruck}
              onTruckSelect={handleTruckSelect}
            />
          </div>

          {/* Center - 3D Scene */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Vue 3D du Chargement
                </CardTitle>
                <CardDescription>
                  Glissez-déposez vos meubles dans le camion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-gray-100 rounded-lg overflow-hidden">
                  <Scene3D
                    truck={selectedTruck}
                    furniture={selectedFurniture}
                    placedItems={placedItems}
                    onItemPlace={handleItemPlace}
                    onItemRemove={handleItemRemove}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Optimization Controls */}
            <div className="mt-6">
              <OptimizationControls
                truck={selectedTruck}
                furniture={selectedFurniture}
                onOptimize={(optimizedPlacements) => setPlacedItems(optimizedPlacements)}
              />
            </div>
          </div>

          {/* Right Panel - Furniture & Controls */}
          <div className="lg:col-span-1 space-y-6">
            <FurniturePanel
              selectedFurniture={selectedFurniture}
              onFurnitureAdd={handleFurnitureAdd}
              onFurnitureRemove={handleFurnitureRemove}
            />

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={placedItems.length === 0 && selectedFurniture.length === 0}
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
                
                <Button
                  disabled={placedItems.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder le Plan
                </Button>

                <Button
                  variant="outline"
                  disabled={placedItems.length === 0}
                  className="w-full"
                >
                  <Share className="h-4 w-4 mr-2" />
                  Partager
                </Button>

                <Separator />
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Volume utilisé:</strong> {calculateUsedVolume().toFixed(2)} m³</p>
                  {selectedTruck && (
                    <p><strong>Volume disponible:</strong> {selectedTruck.volume.toFixed(2)} m³</p>
                  )}
                  <p className="text-xs mt-2">
                    Utilisez la souris pour naviguer dans la vue 3D. 
                    Glissez-déposez les meubles pour les placer.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TruckOptimizer;
