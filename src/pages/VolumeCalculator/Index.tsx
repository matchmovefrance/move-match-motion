
import { useState } from 'react';
import { Calculator, RotateCcw, Download, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import FurnitureSelector from './components/FurnitureSelector';
import VolumeDisplay from './components/VolumeDisplay';
import { FurnitureItem, SelectedItem } from './types';
import { furnitureCategories } from './data/furnitureData';

const VolumeCalculator = () => {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  const calculateTotalVolume = () => {
    return selectedItems.reduce((total, item) => total + (item.volume * item.quantity), 0);
  };

  const handleAddItem = (item: FurnitureItem, quantity: number) => {
    const existingIndex = selectedItems.findIndex(selected => selected.id === item.id);
    
    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity = quantity;
      setSelectedItems(updated);
    } else if (quantity > 0) {
      setSelectedItems([...selectedItems, {
        ...item,
        quantity
      }]);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== itemId));
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    setSelectedItems(selectedItems.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  const handleReset = () => {
    setSelectedItems([]);
  };

  const handleExport = () => {
    const totalVolume = calculateTotalVolume();
    const itemsList = selectedItems.map(item => 
      `${item.name}: ${item.quantity} x ${item.volume} m³ = ${(item.quantity * item.volume).toFixed(2)} m³`
    ).join('\n');
    
    const exportData = `Calculateur de Volume - Résultat\n\n${itemsList}\n\nVolume total: ${totalVolume.toFixed(2)} m³`;
    
    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calcul-volume-demenagement.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalItems = furnitureCategories.reduce((total, category) => total + category.items.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Calculateur de Volume</h1>
              <p className="text-gray-600">Estimez le volume de vos meubles pour votre déménagement</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {totalItems} types de meubles disponibles
            </Badge>
            <Badge variant="outline">
              {selectedItems.length} sélectionné{selectedItems.length > 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Furniture Selection */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Sélection des meubles
                </CardTitle>
                <CardDescription>
                  Choisissez vos meubles et indiquez les quantités
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FurnitureSelector
                  onAddItem={handleAddItem}
                  selectedItems={selectedItems}
                />
              </CardContent>
            </Card>
          </div>

          {/* Volume Display & Summary */}
          <div className="space-y-6">
            <VolumeDisplay 
              totalVolume={calculateTotalVolume()}
              selectedItems={selectedItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
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
                  disabled={selectedItems.length === 0}
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
                
                <Button
                  onClick={handleExport}
                  disabled={selectedItems.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporter le calcul
                </Button>

                <Separator />
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Info:</strong> Les volumes sont basés sur les standards des déménageurs professionnels.</p>
                  <p>Ces estimations incluent l'espace nécessaire pour le transport sécurisé.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolumeCalculator;
