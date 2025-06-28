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
import { Input } from '@/components/ui/input';

const VolumeCalculator = () => {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientReference, setClientReference] = useState('');

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
    const totalWeight = selectedItems.reduce((sum, item) => sum + (item.quantity * 20), 0); // Estimation poids moyen
    const currentDate = new Date().toLocaleDateString('fr-FR');
    
    // Format inventaire professionnel
    const header = `═══════════════════════════════════════════════════════
    INVENTAIRE DE DÉMÉNAGEMENT PROFESSIONNEL
═══════════════════════════════════════════════════════

Client: ${clientName || 'Non renseigné'}
Référence: ${clientReference || `INV-${Date.now()}`}
Date: ${currentDate}
Volume total estimé: ${totalVolume.toFixed(2)} m³
Poids estimé: ${totalWeight} kg

═══════════════════════════════════════════════════════`;

    const itemsByCategory = selectedItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, SelectedItem[]>);

    let inventoryContent = '';
    Object.entries(itemsByCategory).forEach(([category, items]) => {
      inventoryContent += `\n${category.toUpperCase()}\n`;
      inventoryContent += '─'.repeat(50) + '\n';
      
      items.forEach((item, index) => {
        const itemVolume = item.quantity * item.volume;
        inventoryContent += `${index + 1}. ${item.name}\n`;
        inventoryContent += `   Quantité: ${item.quantity}\n`;
        inventoryContent += `   Volume unitaire: ${item.volume.toFixed(2)} m³\n`;
        inventoryContent += `   Volume total: ${itemVolume.toFixed(2)} m³\n`;
        inventoryContent += `   Description: ${item.description || 'Standard'}\n\n`;
      });
    });

    const summary = `
═══════════════════════════════════════════════════════
RÉCAPITULATIF
═══════════════════════════════════════════════════════
Nombre total d'objets: ${selectedItems.reduce((sum, item) => sum + item.quantity, 0)}
Types d'objets différents: ${selectedItems.length}
Volume total: ${totalVolume.toFixed(2)} m³
Poids estimé: ${totalWeight} kg

RECOMMANDATIONS CAMION:
- Moins de 10 m³: Utilitaire
- 10-20 m³: Camion 20 m³  
- 20-35 m³: Camion 35 m³
- Plus de 35 m³: Semi-remorque

═══════════════════════════════════════════════════════
Inventaire généré automatiquement par le système MatchMove
Contact: support@matchmove.fr
═══════════════════════════════════════════════════════`;

    const exportData = header + inventoryContent + summary;
    
    const blob = new Blob([exportData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventaire-${clientReference || 'demenagement'}-${currentDate.replace(/\//g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToTruckOptimizer = () => {
    const furnitureData = selectedItems.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      volume: item.volume,
      quantity: item.quantity
    }));
    
    localStorage.setItem('volumeCalculatorData', JSON.stringify({
      furniture: furnitureData,
      clientName,
      clientReference,
      totalVolume: calculateTotalVolume()
    }));
    
    window.location.href = '/truck-optimizer';
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
            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations Client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du client
                  </label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nom complet du client"
                  />
                </div>
                <div>
                  <label htmlFor="clientRef" className="block text-sm font-medium text-gray-700 mb-1">
                    Référence
                  </label>
                  <Input
                    id="clientRef"
                    value={clientReference}
                    onChange={(e) => setClientReference(e.target.value)}
                    placeholder="Référence client (optionnel)"
                  />
                </div>
              </CardContent>
            </Card>

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
                  Exporter l'inventaire
                </Button>

                <Button
                  onClick={exportToTruckOptimizer}
                  disabled={selectedItems.length === 0}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Optimiser en 3D
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
