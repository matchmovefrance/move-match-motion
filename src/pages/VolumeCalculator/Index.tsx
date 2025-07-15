import { useState, useEffect } from 'react';
import { Calculator, RotateCcw, Download, Package, FileText, Send, FileDown, History, Search, Eye } from 'lucide-react';
import matchmoveLogo from '@/assets/matchmove-logo-new.png';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FurnitureSelector from './components/FurnitureSelector';
import VolumeDisplay from './components/VolumeDisplay';
import { ClientFormDialog } from './components/ClientFormDialog';
import { InventoryHistoryDialog } from './components/InventoryHistoryDialog';
import { InventoryDisplayDialog } from './components/InventoryDisplayDialog';
import { FurnitureItem, SelectedItem } from './types';
import { furnitureCategories } from './data/furnitureData';
import { useGoogleMapsDistance } from '@/hooks/useGoogleMapsDistance';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { generateUltraLightPDF } from './utils/ultraLightPDF';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { pricingEngine } from '@/pages/PricingTool/components/PricingEngine';
import jsPDF from 'jspdf';

const VolumeCalculator = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientReference, setClientReference] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'txt'>('pdf');
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showInventoryDialog, setShowInventoryDialog] = useState(false);
  const [isExtendedForm, setIsExtendedForm] = useState(false);
  const [extendedFormData, setExtendedFormData] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Ajout des champs de date de déménagement
  const [movingDate, setMovingDate] = useState('');
  const [flexibleDates, setFlexibleDates] = useState(false);
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  
  // Formule
  const [formule, setFormule] = useState('standard');

  // Hook pour calculer la distance
  const { distance, distanceText, isLoading: isCalculatingDistance, error: distanceError } = useGoogleMapsDistance({
    departurePostalCode: extendedFormData.departurePostalCode,
    arrivalPostalCode: extendedFormData.arrivalPostalCode,
    enabled: !!(extendedFormData.departurePostalCode && extendedFormData.arrivalPostalCode)
  });

  const getLocationTypeDisplayName = (locationType: string) => {
    switch (locationType) {
      case 'appartement':
        return 'Appartement';
      case 'maison':
        return 'Maison';
      case 'garde_meuble':
        return 'Garde meuble';
      default:
        return locationType;
    }
  };

  const calculateTotalVolume = () => {
    return selectedItems.reduce((total, item) => {
      return total + (item.volume * item.quantity);
    }, 0);
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

  const handleAddItem = (item: FurnitureItem & { disassemblyOptions?: boolean[]; packingOptions?: boolean[]; unpackingOptions?: boolean[]; dimensions?: string }, quantity: number) => {
    const existingIndex = selectedItems.findIndex(selected => selected.id === item.id);
    
    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity = quantity;
      updated[existingIndex].disassemblyOptions = item.disassemblyOptions || updated[existingIndex].disassemblyOptions;
      updated[existingIndex].packingOptions = item.packingOptions || updated[existingIndex].packingOptions;
      updated[existingIndex].unpackingOptions = item.unpackingOptions || updated[existingIndex].unpackingOptions;
      setSelectedItems(updated);
    } else if (quantity > 0) {
      setSelectedItems([...selectedItems, {
        ...item,
        quantity,
        disassemblyOptions: item.disassemblyOptions || Array(quantity).fill(false),
        packingOptions: item.packingOptions || Array(quantity).fill(false),
        unpackingOptions: item.unpackingOptions || Array(quantity).fill(false)
      }]);
    }
  };

  const handleUpdateItemOptions = (itemId: string, index: number, optionType: 'disassembly' | 'packing' | 'unpacking', value: boolean) => {
    setSelectedItems(items => items.map(item => {
      if (item.id === itemId) {
        const updated = { ...item };
        if (optionType === 'disassembly') {
          updated.disassemblyOptions = [...(item.disassemblyOptions || [])];
          updated.disassemblyOptions[index] = value;
        } else if (optionType === 'packing') {
          updated.packingOptions = [...(item.packingOptions || [])];
          updated.packingOptions[index] = value;
        } else if (optionType === 'unpacking') {
          updated.unpackingOptions = [...(item.unpackingOptions || [])];
          updated.unpackingOptions[index] = value;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleUpdateItemDimensions = (itemId: string, dimensions: string) => {
    setSelectedItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId ? { ...item, dimensions } : item
      )
    );
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
    setClientName('');
    setClientReference('');
    setClientAddress('');
    setClientPhone('');
    setClientEmail('');
    setNotes('');
    setExtendedFormData({});
    setMovingDate('');
    setFlexibleDates(false);
    setDateRangeStart('');
    setDateRangeEnd('');
    setFormule('standard');
  };

  const saveInventory = async () => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour sauvegarder un inventaire",
        variant: "destructive",
      });
      return;
    }

    if (selectedItems.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun item sélectionné",
        variant: "destructive",
      });
      return;
    }

    try {
      const totalVolume = calculateTotalVolume();
      const totalWeight = calculateTotalWeight();

      // Préparer les dimensions pour la sauvegarde
      const itemDimensions: { [key: string]: string } = {};
      selectedItems.forEach(item => {
        if (item.dimensions) {
          itemDimensions[item.id] = item.dimensions;
        }
      });

      const inventoryData = {
        client_name: clientName,
        client_reference: clientReference,
        client_phone: clientPhone,
        client_email: clientEmail,
        notes: notes,
        departure_address: extendedFormData.departureAddress || '',
        departure_postal_code: extendedFormData.departurePostalCode || '',
        arrival_address: extendedFormData.arrivalAddress || '',
        arrival_postal_code: extendedFormData.arrivalPostalCode || '',
        departure_location_type: extendedFormData.departureLocationType || 'appartement',
        departure_floor: extendedFormData.departureFloor || '0',
        departure_has_elevator: extendedFormData.departureHasElevator || false,
        departure_elevator_size: extendedFormData.departureElevatorSize || '',
        departure_has_freight_elevator: extendedFormData.departureHasFreightElevator || false,
        departure_carrying_distance: extendedFormData.departureCarryingDistance || '0',
        departure_parking_needed: extendedFormData.departureParkingNeeded || false,
        arrival_location_type: extendedFormData.arrivalLocationType || 'appartement',
        arrival_floor: extendedFormData.arrivalFloor || '0',
        arrival_has_elevator: extendedFormData.arrivalHasElevator || false,
        arrival_elevator_size: extendedFormData.arrivalElevatorSize || '',
        arrival_has_freight_elevator: extendedFormData.arrivalHasFreightElevator || false,
        arrival_carrying_distance: extendedFormData.arrivalCarryingDistance || '0',
        arrival_parking_needed: extendedFormData.arrivalParkingNeeded || false,
        total_volume: totalVolume,
        total_weight: totalWeight,
        selected_items: selectedItems as any,
        item_dimensions: itemDimensions, // Nouvelle colonne pour les dimensions
        created_by: user.id,
        // Ajout des champs de date
        moving_date: movingDate || null,
        flexible_dates: flexibleDates,
        date_range_start: dateRangeStart || null,
        date_range_end: dateRangeEnd || null,
        formule: formule,
      };

      const { error } = await supabase
        .from('inventories')
        .insert(inventoryData);

      if (error) throw error;

      // Vider automatiquement le cache après la sauvegarde pour plus de fluidité
      pricingEngine.clearDistanceCache();

      toast({
        title: "Inventaire sauvegardé",
        description: "L'inventaire a été sauvegardé avec succès",
      });
    } catch (error) {
      console.error('Error saving inventory:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'inventaire",
        variant: "destructive",
      });
    }
  };

  const loadCompanySettings = async () => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('company_name, address, phone, email, siret')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading company settings:', error);
        return null;
      }

      return data || {
        company_name: 'MatchMove',
        address: 'France',
        phone: '+33 1 23 45 67 89',
        email: 'contact@matchmove.fr',
        siret: ''
      };
    } catch (error) {
      console.error('Error loading company settings:', error);
      return null;
    }
  };

  const generateProfessionalInventoryContent = async (calculatedDistance?: number, distanceText?: string) => {
    const settings = await loadCompanySettings();
    const totalVolume = calculateTotalVolume();
    const totalWeight = calculateTotalWeight();
    const currentDate = new Date().toLocaleDateString('fr-FR');
    const documentDate = new Date().toLocaleDateString('fr-FR');
    const truck = getTruckRecommendation(totalVolume);
    
    return {
      settings,
      totalVolume,
      totalWeight,
      currentDate,
      documentDate,
      truck,
      calculatedDistance,
      distanceText,
      selectedItems,
      movingDate,
      flexibleDates,
      dateRangeStart,
      dateRangeEnd,
      extendedFormData
    };
  };

  const generateProfessionalInventoryTXT = async () => {
    const data = await generateProfessionalInventoryContent(distance, distanceText);
    const { settings, totalVolume, totalWeight, currentDate, documentDate, truck, movingDate, flexibleDates, dateRangeStart, dateRangeEnd, extendedFormData, calculatedDistance, distanceText: calculatedDistanceText } = data;
    
    // En-tête professionnel avec nouvelles informations
    const header = `═══════════════════════════════════════════════════════
    INVENTAIRE PROFESSIONNEL DE DÉMÉNAGEMENT
═══════════════════════════════════════════════════════

INFORMATIONS ENTREPRISE
──────────────────────────────────────────────────────
Entreprise          : ${settings?.company_name || 'MatchMove'}
Adresse             : ${settings?.address || 'France'}
Téléphone           : ${settings?.phone || '+33 1 23 45 67 89'}
Email               : ${settings?.email || 'contact@matchmove.fr'}
SIRET               : ${settings?.siret || 'Non renseigné'}

INFORMATIONS CLIENT
──────────────────────────────────────────────────────
Nom du client        : ${clientName || 'Non renseigné'}
Référence dossier    : ${clientReference || `INV-${Date.now()}`}
Téléphone           : ${clientPhone || 'Non renseigné'}
Email               : ${clientEmail || 'Non renseigné'}
Date d'établissement : ${documentDate}
Date déménagement    : ${movingDate ? new Date(movingDate).toLocaleDateString('fr-FR') : 'Non renseignée'}
${flexibleDates ? `Dates flexibles      : du ${dateRangeStart ? new Date(dateRangeStart).toLocaleDateString('fr-FR') : 'N/A'} au ${dateRangeEnd ? new Date(dateRangeEnd).toLocaleDateString('fr-FR') : 'N/A'}` : ''}

DÉTAILS DU DÉMÉNAGEMENT
──────────────────────────────────────────────────────
Adresse de départ    : ${extendedFormData?.departureAddress || 'Non renseignée'}
Code postal départ   : ${extendedFormData?.departurePostalCode || 'Non renseigné'}
Type lieu départ     : ${getLocationTypeDisplayName(extendedFormData?.departureLocationType || 'appartement')}
Étage départ         : ${extendedFormData?.departureFloor || '0'}
Ascenseur départ     : ${extendedFormData?.departureHasElevator ? 'Oui' : 'Non'}
${extendedFormData?.departureHasElevator ? `Taille ascenseur    : ${extendedFormData?.departureElevatorSize || 'Non précisée'}` : ''}
Monte-charge départ  : ${extendedFormData?.departureHasFreightElevator ? 'Oui' : 'Non'}
Distance portage     : ${extendedFormData?.departureCarryingDistance || '0'} mètres
Stationnement        : ${extendedFormData?.departureParkingNeeded ? 'Nécessaire' : 'Non nécessaire'}
Formule              : ${formule || 'standard'}

Adresse d'arrivée    : ${extendedFormData?.arrivalAddress || 'Non renseignée'}
Code postal arrivée  : ${extendedFormData?.arrivalPostalCode || 'Non renseigné'}
Type lieu arrivée    : ${getLocationTypeDisplayName(extendedFormData?.arrivalLocationType || 'appartement')}
Étage arrivée        : ${extendedFormData?.arrivalFloor || '0'}
Ascenseur arrivée    : ${extendedFormData?.arrivalHasElevator ? 'Oui' : 'Non'}
${extendedFormData?.arrivalHasElevator ? `Taille ascenseur    : ${extendedFormData?.arrivalElevatorSize || 'Non précisée'}` : ''}
Monte-charge arrivée : ${extendedFormData?.arrivalHasFreightElevator ? 'Oui' : 'Non'}
Distance portage     : ${extendedFormData?.arrivalCarryingDistance || '0'} mètres
Stationnement        : ${extendedFormData?.arrivalParkingNeeded ? 'Nécessaire' : 'Non nécessaire'}

RÉSUMÉ TECHNIQUE
──────────────────────────────────────────────────────
Volume total estimé  : ${totalVolume.toFixed(2)} m³
Nombre d'objets      : ${selectedItems.reduce((sum, item) => sum + item.quantity, 0)}
Types différents     : ${selectedItems.length}
${extendedFormData?.departurePostalCode && extendedFormData?.arrivalPostalCode && calculatedDistance ? `Distance estimée    : ${calculatedDistanceText || calculatedDistance + 'km'}` : ''}
Notes particulières  : ${notes || 'Aucune'}

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
      const categoryVolume = items.reduce((sum, item) => {
        let itemVolume = 0;
        for (let i = 0; i < item.quantity; i++) {
          let unitVolume = item.volume;
          if (item.disassemblyOptions?.[i]) unitVolume = unitVolume / 2;
          itemVolume += unitVolume;
        }
        return sum + itemVolume;
      }, 0);

      inventoryContent += `\n${category.toUpperCase()} - ${categoryVolume.toFixed(2)}m³\n`;
      inventoryContent += '─'.repeat(60) + '\n';
      
      items.forEach((item, index) => {
        inventoryContent += `${(index + 1).toString().padStart(2, '0')}. ${item.icon} ${item.name}\n`;
        inventoryContent += `    Quantité      : ${item.quantity} pièce(s)\n`;
        inventoryContent += `    Volume unit.  : ${item.volume.toFixed(3)} m³\n`;
        
        // Afficher les options pour chaque item
        for (let i = 0; i < item.quantity; i++) {
          const isCarton = item.name.toLowerCase().includes('carton');
          const hasDisassembly = item.disassemblyOptions?.[i];
          const hasPacking = item.packingOptions?.[i];
          
          if (hasDisassembly || hasPacking) {
            inventoryContent += `    Item #${i + 1}     : `;
            if (hasDisassembly) inventoryContent += 'Démontage/Remontage ';
            if (hasPacking) inventoryContent += 'Emballage/Déballage ';
            inventoryContent += '\n';
          }
        }
        
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

VOLUMES ET RECOMMANDATIONS
• Volume total mesuré    : ${totalVolume.toFixed(2)} m³
• Coefficient de foisonnement appliqué : +15% (sécurité transport)
• Volume de transport    : ${(totalVolume * 1.15).toFixed(2)} m³
• Site web              : matchmove.fr

MATÉRIEL RECOMMANDÉ
• Type de véhicule      : ${truck.type}
• Capacité utile        : ${truck.size}
• Équipe recommandée    : ${totalVolume > 20 ? '3-4 déménageurs' : '2-3 déménageurs'}
• Durée estimée         : ${Math.ceil(totalVolume / 5)} heure(s) de chargement

CONDITIONS PARTICULIÈRES
• Objets fragiles détectés : ${selectedItems.filter(item => item.name.toLowerCase().includes('verre') || item.name.toLowerCase().includes('miroir') || item.name.toLowerCase().includes('tv')).length > 0 ? 'OUI - Protection renforcée' : 'NON'}
• Services spéciaux requis : ${selectedItems.some(item => item.disassemblyOptions?.some(opt => opt) || item.packingOptions?.some(opt => opt)) ? 'OUI - Voir détails par item' : 'NON'}
• Accès difficile      : À évaluer sur site

═══════════════════════════════════════════════════════
Inventaire établi par ${settings?.company_name || 'MatchMove'}
Contact : ${settings?.email || 'contact@matchmove.fr'}
Validité de l'estimation : 30 jours
═══════════════════════════════════════════════════════`;

    return header + inventoryContent + notesSection + summary;
  };

  const generateProfessionalInventoryPDF = async () => {
    const data = await generateProfessionalInventoryContent(distance, distanceText);
    const { settings, totalVolume, extendedFormData } = data;
    
    // Utiliser le générateur ultra-léger pour réduire la taille du PDF
    return generateUltraLightPDF(
      selectedItems,
      totalVolume,
      settings,
      movingDate,
      extendedFormData,
      notes
    );
  };

  const handleExport = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Aucun élément sélectionné",
        description: "Veuillez ajouter des meubles avant d'exporter l'inventaire.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (exportFormat === 'pdf') {
        const pdf = await generateProfessionalInventoryPDF();
        const fileName = `inventaire-${clientReference || clientName || 'demenagement'}-${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`;
        pdf.save(fileName);
        
        toast({
          title: "PDF généré avec succès",
          description: "L'inventaire ultra-léger a été exporté en PDF (~10KB).",
        });
      } else {
        const exportData = await generateProfessionalInventoryTXT();
        
        const blob = new Blob([exportData], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventaire-${clientReference || clientName || 'demenagement'}-${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Fichier texte généré avec succès",
          description: "L'inventaire a été exporté en format texte.",
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast({
        title: "Erreur lors de l'export",
        description: "Une erreur est survenue lors de l'export de l'inventaire.",
        variant: "destructive",
      });
    }
  };
  // Fonction temporaire pour déboguer le cache des distances
  const clearDistanceCache = () => {
    pricingEngine.clearDistanceCache();
    toast({
      title: "Cache vidé",
      description: "Le cache des distances a été vidé. Testez maintenant.",
    });
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

  // Calculate total items by flattening subcategories
  const totalItems = furnitureCategories.reduce((total, category) => {
    return total + category.subcategories.reduce((subTotal, subcategory) => {
      return subTotal + subcategory.items.length;
    }, 0);
  }, 0);

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
                  onUpdateItemOptions={handleUpdateItemOptions}
                  onUpdateItemDimensions={handleUpdateItemDimensions}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
                  <VolumeDisplay
                    totalVolume={calculateTotalVolume()}
                    selectedItems={selectedItems}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveItem}
                    distance={distance}
                    distanceText={distanceText}
                    isCalculatingDistance={isCalculatingDistance}
                    distanceError={distanceError}
                    departurePostalCode={extendedFormData.departurePostalCode}
                    arrivalPostalCode={extendedFormData.arrivalPostalCode}
                  />


            {/* Dates de déménagement */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Date de déménagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="movingDate">Date souhaitée *</Label>
                    <Input
                      id="movingDate"
                      type="date"
                      value={movingDate}
                      onChange={(e) => {
                        setMovingDate(e.target.value);
                        // Recalculer les dates flexibles si activées
                        if (flexibleDates && e.target.value) {
                          const desiredDate = new Date(e.target.value);
                          const startDate = new Date(desiredDate);
                          startDate.setDate(desiredDate.getDate() - 15);
                          const endDate = new Date(desiredDate);
                          endDate.setDate(desiredDate.getDate() + 15);
                          
                          setDateRangeStart(startDate.toISOString().split('T')[0]);
                          setDateRangeEnd(endDate.toISOString().split('T')[0]);
                        }
                      }}
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="flexibleDates"
                      checked={flexibleDates}
                      onCheckedChange={(checked) => {
                        setFlexibleDates(!!checked);
                        
                        if (checked && movingDate) {
                          // Calculer automatiquement ±15 jours autour de la date souhaitée
                          const desiredDate = new Date(movingDate);
                          const startDate = new Date(desiredDate);
                          startDate.setDate(desiredDate.getDate() - 15);
                          const endDate = new Date(desiredDate);
                          endDate.setDate(desiredDate.getDate() + 15);
                          
                          setDateRangeStart(startDate.toISOString().split('T')[0]);
                          setDateRangeEnd(endDate.toISOString().split('T')[0]);
                        } else if (!checked) {
                          // Effacer les dates de plage si désactivé
                          setDateRangeStart('');
                          setDateRangeEnd('');
                        }
                      }}
                    />
                    <Label htmlFor="flexibleDates" className="text-sm font-medium">
                      Dates flexibles (±15 jours autour de la date souhaitée)
                    </Label>
                  </div>

                  {flexibleDates && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="dateRangeStart">Date la plus tôt</Label>
                        <Input
                          id="dateRangeStart"
                          type="date"
                          value={dateRangeStart}
                          onChange={(e) => setDateRangeStart(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dateRangeEnd">Date la plus tard</Label>
                        <Input
                          id="dateRangeEnd"
                          type="date"
                          value={dateRangeEnd}
                          onChange={(e) => setDateRangeEnd(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Information client - Popup Dialog */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Information client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Champs de base visibles */}
                  <div className="grid grid-cols-1 gap-2">
                    <Input
                      placeholder="Nom du client"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                    <Input
                      placeholder="Référence"
                      value={clientReference}
                      onChange={(e) => setClientReference(e.target.value)}
                    />
                  </div>
                  
                  {/* Bouton pour ouvrir le formulaire complet */}
                  <ClientFormDialog
                    clientName={clientName}
                    setClientName={setClientName}
                    clientReference={clientReference}
                    setClientReference={setClientReference}
                    clientPhone={clientPhone}
                    setClientPhone={setClientPhone}
                    clientEmail={clientEmail}
                    setClientEmail={setClientEmail}
                    notes={notes}
                    setNotes={setNotes}
                    departureAddress={extendedFormData.departureAddress || ''}
                    setDepartureAddress={(value) => setExtendedFormData(prev => ({ ...prev, departureAddress: value }))}
                    departurePostalCode={extendedFormData.departurePostalCode || ''}
                    setDeparturePostalCode={(value) => setExtendedFormData(prev => ({ ...prev, departurePostalCode: value }))}
                    arrivalAddress={extendedFormData.arrivalAddress || ''}
                    setArrivalAddress={(value) => setExtendedFormData(prev => ({ ...prev, arrivalAddress: value }))}
                    arrivalPostalCode={extendedFormData.arrivalPostalCode || ''}
                    setArrivalPostalCode={(value) => setExtendedFormData(prev => ({ ...prev, arrivalPostalCode: value }))}
                    departureLocationType={extendedFormData.departureLocationType || 'appartement'}
                    setDepartureLocationType={(value) => setExtendedFormData(prev => ({ ...prev, departureLocationType: value }))}
                    departureFloor={extendedFormData.departureFloor || '0'}
                    setDepartureFloor={(value) => setExtendedFormData(prev => ({ ...prev, departureFloor: value }))}
                    departureHasElevator={extendedFormData.departureHasElevator || false}
                    setDepartureHasElevator={(value) => setExtendedFormData(prev => ({ ...prev, departureHasElevator: value }))}
                    departureElevatorSize={extendedFormData.departureElevatorSize || ''}
                    setDepartureElevatorSize={(value) => setExtendedFormData(prev => ({ ...prev, departureElevatorSize: value }))}
                    departureHasFreightElevator={extendedFormData.departureHasFreightElevator || false}
                    setDepartureHasFreightElevator={(value) => setExtendedFormData(prev => ({ ...prev, departureHasFreightElevator: value }))}
                    departureCarryingDistance={extendedFormData.departureCarryingDistance || '0'}
                    setDepartureCarryingDistance={(value) => setExtendedFormData(prev => ({ ...prev, departureCarryingDistance: value }))}
                    departureParkingNeeded={extendedFormData.departureParkingNeeded || false}
                    setDepartureParkingNeeded={(value) => setExtendedFormData(prev => ({ ...prev, departureParkingNeeded: value }))}
                    arrivalLocationType={extendedFormData.arrivalLocationType || 'appartement'}
                    setArrivalLocationType={(value) => setExtendedFormData(prev => ({ ...prev, arrivalLocationType: value }))}
                    arrivalFloor={extendedFormData.arrivalFloor || '0'}
                    setArrivalFloor={(value) => setExtendedFormData(prev => ({ ...prev, arrivalFloor: value }))}
                    arrivalHasElevator={extendedFormData.arrivalHasElevator || false}
                    setArrivalHasElevator={(value) => setExtendedFormData(prev => ({ ...prev, arrivalHasElevator: value }))}
                    arrivalElevatorSize={extendedFormData.arrivalElevatorSize || ''}
                    setArrivalElevatorSize={(value) => setExtendedFormData(prev => ({ ...prev, arrivalElevatorSize: value }))}
                    arrivalHasFreightElevator={extendedFormData.arrivalHasFreightElevator || false}
                    setArrivalHasFreightElevator={(value) => setExtendedFormData(prev => ({ ...prev, arrivalHasFreightElevator: value }))}
                    arrivalCarryingDistance={extendedFormData.arrivalCarryingDistance || '0'}
                    setArrivalCarryingDistance={(value) => setExtendedFormData(prev => ({ ...prev, arrivalCarryingDistance: value }))}
                    arrivalParkingNeeded={extendedFormData.arrivalParkingNeeded || false}
                    setArrivalParkingNeeded={(value) => setExtendedFormData(prev => ({ ...prev, arrivalParkingNeeded: value }))}
                    formule={formule}
                    setFormule={setFormule}
                    onSaveInventory={saveInventory}
                    selectedItemsCount={selectedItems.length}
                  />
                </div>
              </CardContent>
            </Card>

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
                  variant="outline"
                  onClick={() => setShowHistoryDialog(true)}
                  className="w-full"
                >
                  <History className="h-4 w-4 mr-2" />
                  Historique des inventaires
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowInventoryDialog(true)}
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Afficher l'inventaire
                </Button>
                
                <div>
                  <label htmlFor="exportFormat" className="block text-sm font-medium text-gray-700 mb-2">
                    Format d'export
                  </label>
                  <Select value={exportFormat} onValueChange={(value: 'pdf' | 'txt') => setExportFormat(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choisir le format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Professionnel</SelectItem>
                      <SelectItem value="txt">Fichier Texte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  onClick={handleExport}
                  disabled={selectedItems.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Exporter l'inventaire {exportFormat.toUpperCase()}
                </Button>

                <Button
                  onClick={exportToTruckOptimizer}
                  disabled={selectedItems.length === 0}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Optimiser en 3D
                </Button>

                <Button
                  onClick={saveInventory}
                  disabled={selectedItems.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Sauvegarder l'inventaire
                </Button>

                <Separator />
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>ℹ️ Information :</strong></p>
                  <p>• Volumes modifiables avec persistance</p>
                  <p>• Calcul automatique de distance</p>
                  <p>• Configuration détaillée des lieux</p>
                  <p>• Historique complet des inventaires</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <InventoryHistoryDialog
        isOpen={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
        onLoadInventory={(inventory) => {
          setClientName(inventory.clientName || '');
          setClientReference(inventory.clientReference || '');
          setClientPhone(inventory.clientPhone || '');
          setClientEmail(inventory.clientEmail || '');
          setNotes(inventory.notes || '');
          setSelectedItems(inventory.selectedItems || []);
          setFormule(inventory.formule || 'standard');
          if (inventory.extendedFormData) {
            setExtendedFormData(inventory.extendedFormData);
          }
          // Restaurer les dates de déménagement
          setMovingDate(inventory.movingDate || '');
          setFlexibleDates(inventory.flexibleDates || false);
          setDateRangeStart(inventory.dateRangeStart || '');
          setDateRangeEnd(inventory.dateRangeEnd || '');
          toast({
            title: "Inventaire chargé",
            description: "L'inventaire complet a été chargé avec succès",
          });
        }}
      />

      <InventoryDisplayDialog
        isOpen={showInventoryDialog}
        onClose={() => setShowInventoryDialog(false)}
        selectedItems={selectedItems}
        clientData={{
          name: clientName,
          reference: clientReference,
          phone: clientPhone,
          email: clientEmail,
          address: clientAddress,
          notes: notes
        }}
        extendedFormData={extendedFormData}
        movingDate={movingDate}
        flexibleDates={flexibleDates}
        dateRangeStart={dateRangeStart}
        dateRangeEnd={dateRangeEnd}
      />
    </div>
  );
};

export default VolumeCalculator;
