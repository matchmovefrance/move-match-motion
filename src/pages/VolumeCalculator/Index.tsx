
import { useState } from 'react';
import { Calculator, RotateCcw, Download, Package, FileText, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FurnitureSelector from './components/FurnitureSelector';
import VolumeDisplay from './components/VolumeDisplay';
import { FurnitureItem, SelectedItem } from './types';
import { furnitureCategories } from './data/furnitureData';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const VolumeCalculator = () => {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientReference, setClientReference] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');

  const calculateTotalVolume = () => {
    return selectedItems.reduce((total, item) => total + (item.volume * item.quantity), 0);
  };

  const calculateTotalWeight = () => {
    // Estimation poids moyen par m³ selon le type de meuble
    return selectedItems.reduce((total, item) => {
      let weightPerM3 = 250; // kg/m³ par défaut
      
      // Ajustement selon la catégorie
      if (item.category === 'Cuisine') weightPerM3 = 400; // Électroménager plus lourd
      if (item.category === 'Chambre' && item.name.includes('Matelas')) weightPerM3 = 80;
      if (item.category === 'Divers' && item.name.includes('Carton')) weightPerM3 = 150;
      
      return total + (item.volume * item.quantity * weightPerM3);
    }, 0);
  };

  const getTruckRecommendation = (volume: number) => {
    if (volume <= 5) return { type: 'Utilitaire', size: '5m³', description: 'Parfait pour studio/F1' };
    if (volume <= 10) return { type: 'Camion 10m³', size: '10m³', description: 'Idéal pour F2/F3' };
    if (volume <= 20) return { type: 'Camion 20m³', size: '20m³', description: 'Recommandé pour F3/F4' };
    if (volume <= 35) return { type: 'Camion 35m³', size: '35m³', description: 'Nécessaire pour F4/F5+' };
    return { type: 'Semi-remorque', size: '40m³+', description: 'Déménagement important' };
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

  const generateProfessionalInventory = () => {
    const totalVolume = calculateTotalVolume();
    const totalWeight = calculateTotalWeight();
    const currentDate = new Date().toLocaleDateString('fr-FR');
    const truck = getTruckRecommendation(totalVolume);
    
    // En-tête professionnel
    const header = `═══════════════════════════════════════════════════════
    INVENTAIRE PROFESSIONNEL DE DÉMÉNAGEMENT
═══════════════════════════════════════════════════════

INFORMATIONS CLIENT
──────────────────────────────────────────────────────
Nom du client        : ${clientName || 'Non renseigné'}
Référence dossier    : ${clientReference || `INV-${Date.now()}`}
Adresse de départ    : ${clientAddress || 'Non renseignée'}
Téléphone           : ${clientPhone || 'Non renseigné'}
Email               : ${clientEmail || 'Non renseigné'}
Date d'établissement : ${currentDate}

RÉSUMÉ TECHNIQUE
──────────────────────────────────────────────────────
Volume total estimé  : ${totalVolume.toFixed(2)} m³
Poids total estimé   : ${Math.round(totalWeight)} kg
Nombre d'objets      : ${selectedItems.reduce((sum, item) => sum + item.quantity, 0)}
Types différents     : ${selectedItems.length}

RECOMMANDATION VÉHICULE
──────────────────────────────────────────────────────
Type recommandé      : ${truck.type}
Capacité conseillée  : ${truck.size}
Justification       : ${truck.description}

═══════════════════════════════════════════════════════`;

    // Inventaire détaillé par catégorie
    const itemsByCategory = selectedItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, SelectedItem[]>);

    let inventoryContent = '\nINVENTAIRE DÉTAILLÉ PAR PIÈCE\n';
    inventoryContent += '═══════════════════════════════════════════════════════\n';

    Object.entries(itemsByCategory).forEach(([category, items]) => {
      const categoryVolume = items.reduce((sum, item) => sum + (item.quantity * item.volume), 0);
      const categoryWeight = items.reduce((sum, item) => {
        let weightPerM3 = 250;
        if (category === 'Cuisine') weightPerM3 = 400;
        if (category === 'Chambre' && item.name.includes('Matelas')) weightPerM3 = 80;
        if (category === 'Divers' && item.name.includes('Carton')) weightPerM3 = 150;
        return sum + (item.volume * item.quantity * weightPerM3);
      }, 0);

      inventoryContent += `\n${category.toUpperCase()} - ${categoryVolume.toFixed(2)}m³ - ${Math.round(categoryWeight)}kg\n`;
      inventoryContent += '─'.repeat(60) + '\n';
      
      items.forEach((item, index) => {
        const itemVolume = item.quantity * item.volume;
        inventoryContent += `${(index + 1).toString().padStart(2, '0')}. ${item.name}\n`;
        inventoryContent += `    Quantité      : ${item.quantity} pièce(s)\n`;
        inventoryContent += `    Volume unit.  : ${item.volume.toFixed(3)} m³\n`;
        inventoryContent += `    Volume total  : ${itemVolume.toFixed(3)} m³\n`;
        inventoryContent += `    Description   : ${item.description || 'Standard'}\n`;
        inventoryContent += `    ─────────────────────────────────────────\n`;
      });
    });

    // Observations et notes
    const notesSection = notes ? `\nOBSERVATIONS ET NOTES PARTICULIÈRES
─────────────────────────────────────────────────────
${notes}

` : '';

    // Récapitulatif final
    const summary = `
═══════════════════════════════════════════════════════
RÉCAPITULATIF ET RECOMMANDATIONS
═══════════════════════════════════════════════════════

VOLUMES ET POIDS
• Volume total mesuré    : ${totalVolume.toFixed(2)} m³
• Poids total estimé     : ${Math.round(totalWeight)} kg
• Coefficient de foisonnement appliqué : +15% (sécurité transport)
• Volume de transport    : ${(totalVolume * 1.15).toFixed(2)} m³

MATÉRIEL RECOMMANDÉ
• Type de véhicule      : ${truck.type}
• Capacité utile        : ${truck.size}
• Équipe recommandée    : ${totalVolume > 20 ? '3-4 déménageurs' : '2-3 déménageurs'}
• Durée estimée         : ${Math.ceil(totalVolume / 5)} heure(s) de chargement

MATÉRIEL DE PROTECTION NÉCESSAIRE
• Sangles d'arrimage    : ${Math.ceil(totalVolume / 10)} jeux
• Couvertures           : ${Math.ceil(selectedItems.length / 3)} pièces
• Film plastique        : ${Math.ceil(totalVolume / 15)} rouleaux
• Cartons supplémentaires : Prévoir 10-15 cartons de sécurité

CONDITIONS PARTICULIÈRES
• Objets fragiles détectés : ${selectedItems.filter(item => item.name.toLowerCase().includes('verre') || item.name.toLowerCase().includes('miroir') || item.name.toLowerCase().includes('tv')).length > 0 ? 'OUI - Protection renforcée' : 'NON'}
• Démontage nécessaire : ${selectedItems.filter(item => item.category === 'Chambre' && (item.name.includes('Armoire') || item.name.includes('Lit'))).length > 0 ? 'OUI - Meubles volumineux' : 'Minimal'}
• Accès difficile      : À évaluer sur site

═══════════════════════════════════════════════════════
Inventaire établi par le système MatchMove Professional
Version : 2.0 | Contact technique : support@matchmove.fr
Validité de l'estimation : 30 jours
═══════════════════════════════════════════════════════`;

    return header + inventoryContent + notesSection + summary;
  };

  const handleExport = () => {
    const exportData = generateProfessionalInventory();
    
    const blob = new Blob([exportData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = `inventaire-${clientReference || clientName || 'demenagement'}-${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.txt`;
    a.download = fileName;
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
      clientAddress,
      clientPhone,
      clientEmail,
      notes,
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
              <h1 className="text-3xl font-bold text-gray-900">Calculateur de Volume Professionnel</h1>
              <p className="text-gray-600">Estimation précise pour devis et planification de déménagement</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {totalItems} références mobilier
            </Badge>
            <Badge variant="outline">
              {selectedItems.length} type{selectedItems.length > 1 ? 's' : ''} sélectionné{selectedItems.length > 1 ? 's' : ''}
            </Badge>
            <Badge variant="outline">
              {selectedItems.reduce((sum, item) => sum + item.quantity, 0)} objet{selectedItems.reduce((sum, item) => sum + item.quantity, 0) > 1 ? 's' : ''} total
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
                  Sélection des meubles et objets
                </CardTitle>
                <CardDescription>
                  Choisissez vos meubles avec les quantités exactes
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informations Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Essentiel</TabsTrigger>
                    <TabsTrigger value="details">Détails</TabsTrigger>
                  </TabsList>
                  <TabsContent value="basic" className="space-y-3">
                    <div>
                      <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
                        Nom du client *
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
                        Référence dossier
                      </label>
                      <Input
                        id="clientRef"
                        value={clientReference}
                        onChange={(e) => setClientReference(e.target.value)}
                        placeholder="Ex: DEV-2024-001"
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="details" className="space-y-3">
                    <div>
                      <label htmlFor="clientAddress" className="block text-sm font-medium text-gray-700 mb-1">
                        Adresse de départ
                      </label>
                      <Input
                        id="clientAddress"
                        value={clientAddress}
                        onChange={(e) => setClientAddress(e.target.value)}
                        placeholder="Adresse complète"
                      />
                    </div>
                    <div>
                      <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone
                      </label>
                      <Input
                        id="clientPhone"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="06 XX XX XX XX"
                      />
                    </div>
                    <div>
                      <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="client@email.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                        Notes particulières
                      </label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Accès difficile, objets fragiles, etc."
                        rows={3}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
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
                  Exporter l'inventaire Pro
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
                  <p><strong>ℹ️ Information :</strong></p>
                  <p>• Volumes basés sur standards professionnels</p>
                  <p>• Coefficient de foisonnement inclus (+15%)</p>
                  <p>• Export direct vers l'optimiseur 3D</p>
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
