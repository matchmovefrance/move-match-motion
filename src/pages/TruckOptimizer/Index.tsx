import { useState, useEffect } from 'react';
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
  const [clientInfo, setClientInfo] = useState<{name: string, reference: string} | null>(null);

  // Import data from volume calculator on component mount
  useEffect(() => {
    const importedData = localStorage.getItem('volumeCalculatorData');
    if (importedData) {
      const data = JSON.parse(importedData);
      console.log('📦 Données importées du calculateur de volume:', data);
      
      // Convert volume calculator data to truck optimizer format
      const convertedFurniture: FurnitureItem[] = [];
      data.furniture.forEach((item: any) => {
        // Create multiple instances based on quantity
        for (let i = 0; i < item.quantity; i++) {
          convertedFurniture.push({
            id: `${item.id}-${i}`,
            name: item.name,
            category: item.category,
            dimensions: estimateDimensionsFromVolume(item.volume),
            volume: item.volume,
            weight: estimateWeightFromVolume(item.volume),
            fragile: isFragileItem(item.category, item.name),
            color: getCategoryColor(item.category)
          });
        }
      });
      
      setSelectedFurniture(convertedFurniture);
      setClientInfo({
        name: data.clientName || '',
        reference: data.clientReference || ''
      });
      
      // Clear imported data after use
      localStorage.removeItem('volumeCalculatorData');
    }
  }, []);

  // Helper functions for data conversion
  const estimateDimensionsFromVolume = (volume: number) => {
    // Estimate dimensions based on volume (rough approximation)
    const baseSize = Math.cbrt(volume);
    return {
      length: baseSize * 1.2,
      width: baseSize * 0.8,
      height: baseSize * 1.0
    };
  };

  const estimateWeightFromVolume = (volume: number) => {
    // Rough weight estimation: 30kg per m³ average
    return Math.round(volume * 30);
  };

  const isFragileItem = (category: string, name: string) => {
    const fragileCategories = ['Cuisine'];
    const fragileItems = ['table', 'miroir', 'tableau', 'tv'];
    return fragileCategories.includes(category) || 
           fragileItems.some(item => name.toLowerCase().includes(item));
  };

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      'Salon': '#8B5CF6',
      'Chambre': '#10B981',
      'Cuisine': '#EF4444',
      'Salle à manger': '#F59E0B',
      'Bureau': '#6366F1',
      'Divers': '#78716C'
    };
    return colorMap[category] || '#78716C';
  };

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

  const handleSavePlan = () => {
    if (!selectedTruck || placedItems.length === 0) {
      console.log('⚠️ Aucun plan à sauvegarder');
      return;
    }

    const planData = {
      id: `plan-${Date.now()}`,
      clientName: clientInfo?.name || 'Client non renseigné',
      clientReference: clientInfo?.reference || `REF-${Date.now()}`,
      truck: selectedTruck,
      furniture: selectedFurniture,
      placements: placedItems,
      totalVolume: calculateUsedVolume(),
      usagePercentage: calculateUsagePercentage(),
      createdAt: new Date().toISOString(),
      summary: {
        placedItems: placedItems.length,
        totalFurniture: selectedFurniture.length,
        efficiency: calculateUsagePercentage()
      }
    };

    // Save to localStorage
    const existingPlans = JSON.parse(localStorage.getItem('savedTruckPlans') || '[]');
    existingPlans.push(planData);
    localStorage.setItem('savedTruckPlans', JSON.stringify(existingPlans));

    // Generate and download plan report
    const reportContent = generatePlanReport(planData);
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan-chargement-${planData.clientReference}-${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('💾 Plan sauvegardé:', planData.id);
    alert(`Plan de chargement sauvegardé et téléchargé !\nRéférence: ${planData.clientReference}`);
  };

  const generatePlanReport = (planData: any) => {
    const currentDate = new Date().toLocaleDateString('fr-FR');
    
    return `═══════════════════════════════════════════════════════
    PLAN DE CHARGEMENT OPTIMISÉ 3D
═══════════════════════════════════════════════════════

Client: ${planData.clientName}
Référence: ${planData.clientReference}
Date: ${currentDate}

CAMION SÉLECTIONNÉ:
${planData.truck.name} (${planData.truck.type})
Dimensions: ${planData.truck.dimensions.length}m × ${planData.truck.dimensions.width}m × ${planData.truck.dimensions.height}m
Volume: ${planData.truck.volume} m³
Charge maximale: ${planData.truck.maxWeight} kg

OPTIMISATION:
Volume utilisé: ${planData.totalVolume.toFixed(2)} m³ / ${planData.truck.volume} m³
Taux d'utilisation: ${planData.usagePercentage.toFixed(1)}%
Objets placés: ${planData.summary.placedItems} / ${planData.summary.totalFurniture}

═══════════════════════════════════════════════════════
PLAN DE PLACEMENT DÉTAILLÉ
═══════════════════════════════════════════════════════

${planData.placements.map((item: PlacedItem, index: number) => {
  const furniture = planData.furniture.find((f: FurnitureItem) => f.id === item.furnitureId);
  return `${index + 1}. ${furniture?.name || 'Objet inconnu'}
   Position: X=${item.position.x.toFixed(2)}m, Y=${item.position.y.toFixed(2)}m, Z=${item.position.z.toFixed(2)}m
   Rotation: ${item.rotation.x || item.rotation.y || item.rotation.z ? 'Orienté' : 'Standard'}
   Volume: ${furniture?.volume.toFixed(2)} m³`;
}).join('\n\n')}

═══════════════════════════════════════════════════════
Plan généré par l'optimiseur 3D MatchMove
Contact: support@matchmove.fr
═══════════════════════════════════════════════════════`;
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
              {clientInfo && (
                <p className="text-sm text-blue-600 mt-1">
                  Client: {clientInfo.name} {clientInfo.reference && `(${clientInfo.reference})`}
                </p>
              )}
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
                  onClick={handleSavePlan}
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
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'Plan de chargement 3D',
                        text: `Plan optimisé pour ${clientInfo?.name || 'client'} - ${calculateUsagePercentage().toFixed(1)}% d'utilisation`,
                        url: window.location.href
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Lien copié dans le presse-papiers');
                    }
                  }}
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
                    L'optimisation 3D place automatiquement vos meubles.
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
