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
import { SaveInventoryDialog } from './components/SaveInventoryDialog';
import { FurnitureItem, SelectedItem } from './types';
import { furnitureCategories } from './data/furnitureData';
import { useGoogleMapsDistance } from '@/hooks/useGoogleMapsDistance';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from '@/contexts/SessionContext';
import { useToast } from '@/hooks/use-toast';
import { pricingEngine } from '@/pages/PricingTool/components/PricingEngine';
import jsPDF from 'jspdf';

const VolumeCalculator = () => {
  const { user } = useAuth();
  const { setSessionData, getSessionData, isSessionReady } = useSession();
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
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [currentInventoryId, setCurrentInventoryId] = useState<string | null>(null);
  const [isExtendedForm, setIsExtendedForm] = useState(false);
  const [extendedFormData, setExtendedFormData] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour les villes
  const [departureCity, setDepartureCity] = useState('');
  const [arrivalCity, setArrivalCity] = useState('');
  
  // Déménagement international
  const [isInternational, setIsInternational] = useState(false);
  const [internationalData, setInternationalData] = useState({
    departureAddress: '',
    arrivalAddress: '',
    departureCountry: '',
    arrivalCountry: '',
    departureCity: '',
    arrivalCity: ''
  });
  
  
  // Formule
  const [formule, setFormule] = useState('standard');
  
  // Marges de sécurité
  const [safetyMargin10, setSafetyMargin10] = useState(false);
  const [safetyMargin15, setSafetyMargin15] = useState(false);

  // Hook pour calculer la distance
  const { distance, distanceText, isLoading: isCalculatingDistance, error: distanceError } = useGoogleMapsDistance({
    departurePostalCode: extendedFormData.departurePostalCode,
    arrivalPostalCode: extendedFormData.arrivalPostalCode,
    enabled: !!(extendedFormData.departurePostalCode && extendedFormData.arrivalPostalCode && !isInternational)
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

  const handleAddItem = (item: FurnitureItem & { disassemblyOptions?: boolean[]; packingOptions?: boolean[]; unpackingOptions?: boolean[] }, quantity: number) => {
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
    setFormule('standard');
    setIsInternational(false);
    setInternationalData({
      departureAddress: '',
      arrivalAddress: '',
      departureCountry: '',
      arrivalCountry: '',
      departureCity: '',
      arrivalCity: ''
    });
  };

  const handleSaveClick = () => {
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

    // Toujours montrer le dialogue pour choisir entre créer nouveau ou mettre à jour
    setShowSaveDialog(true);
  };

  const createNewInventory = async () => {
    await saveInventory(false);
    setShowSaveDialog(false);
  };

  const updateExistingInventory = async () => {
    await saveInventory(true);
    setShowSaveDialog(false);
  };

  const saveInventory = async (isUpdate: boolean = false) => {
    try {
      const totalVolume = calculateTotalVolume();
      const totalWeight = calculateTotalWeight();

      const inventoryData = {
        client_name: clientName,
        client_reference: clientReference,
        client_phone: clientPhone,
        client_email: clientEmail,
        notes: notes,
        departure_address: extendedFormData.departureAddress || '',
        departure_postal_code: extendedFormData.departurePostalCode || '',
        departure_city: extendedFormData.departureCity || '',
        arrival_address: extendedFormData.arrivalAddress || '',
        arrival_postal_code: extendedFormData.arrivalPostalCode || '',
        arrival_city: extendedFormData.arrivalCity || '',
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
        created_by: user.id,
        moving_date: extendedFormData.movingDate || null,
        flexible_dates: extendedFormData.flexibleDates || false,
        date_range_start: extendedFormData.dateRangeStart || null,
        date_range_end: extendedFormData.dateRangeEnd || null,
        formule: formule,
        is_international: isInternational || false,
        international_data: isInternational ? internationalData : null,
      };

      let error;
      if (isUpdate && currentInventoryId) {
        const { error: updateError } = await supabase
          .from('inventories')
          .update(inventoryData)
          .eq('id', currentInventoryId);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('inventories')
          .insert(inventoryData);
        error = insertError;
        // Reset l'ID si on crée un nouvel inventaire
        setCurrentInventoryId(null);
      }

      if (error) throw error;

      pricingEngine.clearDistanceCache();

      toast({
        title: isUpdate ? "Inventaire mis à jour" : "Inventaire sauvegardé",
        description: isUpdate ? "L'inventaire a été mis à jour avec succès" : "L'inventaire a été sauvegardé avec succès",
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

  const loadInventoryFromHistory = (inventory: any) => {
    setSelectedItems(inventory.selected_items || []);
    setClientName(inventory.client_name || '');
    setClientReference(inventory.client_reference || '');
    setClientPhone(inventory.client_phone || '');
    setClientEmail(inventory.client_email || '');
    setNotes(inventory.notes || '');
    setFormule(inventory.formule || 'standard');
    setIsInternational(inventory.is_international || false);
    setInternationalData(inventory.international_data || {
      departureAddress: '',
      arrivalAddress: '',
      departureCountry: '',
      arrivalCountry: '',
      departureCity: '',
      arrivalCity: ''
    });
    setCurrentInventoryId(inventory.id);
    
    // Charger les données étendues
    setExtendedFormData({
      departureAddress: inventory.departure_address || '',
      departurePostalCode: inventory.departure_postal_code || '',
      departureCity: inventory.departure_city || '',
      arrivalAddress: inventory.arrival_address || '',
      arrivalPostalCode: inventory.arrival_postal_code || '',
      arrivalCity: inventory.arrival_city || '',
      departureLocationType: inventory.departure_location_type || 'appartement',
      departureFloor: inventory.departure_floor || '0',
      departureHasElevator: inventory.departure_has_elevator || false,
      departureElevatorSize: inventory.departure_elevator_size || '',
      departureHasFreightElevator: inventory.departure_has_freight_elevator || false,
      departureCarryingDistance: inventory.departure_carrying_distance || '0',
      departureParkingNeeded: inventory.departure_parking_needed || false,
      arrivalLocationType: inventory.arrival_location_type || 'appartement',
      arrivalFloor: inventory.arrival_floor || '0',
      arrivalHasElevator: inventory.arrival_has_elevator || false,
      arrivalElevatorSize: inventory.arrival_elevator_size || '',
      arrivalHasFreightElevator: inventory.arrival_has_freight_elevator || false,
      arrivalCarryingDistance: inventory.arrival_carrying_distance || '0',
      arrivalParkingNeeded: inventory.arrival_parking_needed || false,
    });
    
    setShowHistoryDialog(false);
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
      movingDate: extendedFormData.movingDate || '',
      flexibleDates: extendedFormData.flexibleDates || false,
      dateRangeStart: extendedFormData.dateRangeStart || '',
      dateRangeEnd: extendedFormData.dateRangeEnd || '',
      extendedFormData,
      isInternational,
      internationalData
    };
  };

  const generateProfessionalInventoryTXT = async () => {
    const data = await generateProfessionalInventoryContent(distance, distanceText);
    const { settings, totalVolume, totalWeight, currentDate, documentDate, truck, movingDate, flexibleDates, dateRangeStart, dateRangeEnd, extendedFormData, calculatedDistance, distanceText: calculatedDistanceText, isInternational, internationalData } = data;
    
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
${isInternational ? 
`Type de déménagement : International
Adresse de départ    : ${internationalData?.departureAddress || 'Non renseignée'}
Pays de départ       : ${internationalData?.departureCountry || 'Non renseigné'}
Adresse d'arrivée    : ${internationalData?.arrivalAddress || 'Non renseignée'}
Pays d'arrivée       : ${internationalData?.arrivalCountry || 'Non renseigné'}
Formule              : ${formule || 'standard'}

RÉSUMÉ TECHNIQUE
──────────────────────────────────────────────────────
Volume total estimé  : ${totalVolume.toFixed(2)} m³
Nombre d'objets      : ${selectedItems.reduce((sum, item) => sum + item.quantity, 0)}
Types différents     : ${selectedItems.length}
Distance estimée     : Déménagement à l'international - distance non disponible
Notes particulières  : ${notes || 'Aucune'}` :
`Type de déménagement : National
Ville de départ      : ${extendedFormData?.departureCity || 'Non renseignée'}
Code postal départ   : ${extendedFormData?.departurePostalCode || 'Non renseigné'}
Adresse de départ    : ${extendedFormData?.departureAddress || 'Non renseignée'}
Type lieu départ     : ${getLocationTypeDisplayName(extendedFormData?.departureLocationType || 'appartement')}
Étage départ         : ${extendedFormData?.departureFloor || '0'}
Ascenseur départ     : ${extendedFormData?.departureHasElevator ? 'Oui' : 'Non'}
${extendedFormData?.departureHasElevator ? `Taille ascenseur    : ${extendedFormData?.departureElevatorSize || 'Non précisée'}` : ''}
Monte-charge départ  : ${extendedFormData?.departureHasFreightElevator ? 'Oui' : 'Non'}
Distance portage     : ${extendedFormData?.departureCarryingDistance || '0'} mètres
Stationnement        : ${extendedFormData?.departureParkingNeeded ? 'Nécessaire' : 'Non nécessaire'}
Formule              : ${formule || 'standard'}

Ville d'arrivée      : ${extendedFormData?.arrivalCity || 'Non renseignée'}
Code postal arrivée  : ${extendedFormData?.arrivalPostalCode || 'Non renseigné'}
Adresse d'arrivée    : ${extendedFormData?.arrivalAddress || 'Non renseignée'}
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
Notes particulières  : ${notes || 'Aucune'}`}

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
    const { settings, totalVolume, totalWeight, currentDate, documentDate, truck, movingDate, flexibleDates, dateRangeStart, dateRangeEnd, extendedFormData, calculatedDistance, distanceText: calculatedDistanceText } = data;
    
    // Configuration PDF optimisée pour taille réduite
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true, // Active la compression native
      putOnlyUsedFonts: true, // N'inclut que les polices utilisées
      floatPrecision: 2 // Réduit la précision des nombres
    });
    
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;
    let yPosition = 20;

    // Couleurs optimisées (utilisation de couleurs simples)
    const primaryColor: [number, number, number] = [98, 184, 136];
    const secondaryColor: [number, number, number] = [52, 73, 94];
    const lightGray: [number, number, number] = [245, 245, 245];

    // Header section optimisé
    const headerHeight = 60;
    
    // Background simplifié
    pdf.setFillColor(...lightGray);
    pdf.rect(0, 0, pageWidth, headerHeight, 'F');

    // Logo optimisé - version compressée
    try {
      // Réduction de la taille du logo pour diminuer la taille du PDF
      const logoSize = 40; // Réduit de 60 à 40
      const logoYPosition = 8;
      // Compression de l'image lors de l'ajout
      pdf.addImage(matchmoveLogo, 'PNG', margin, logoYPosition, logoSize, logoSize, undefined, 'FAST');
    } catch (error) {
      console.log('Logo not loaded:', error);
    }

    // Informations entreprise optimisées
    pdf.setFontSize(9); // Réduit de 10 à 9
    pdf.setTextColor(...secondaryColor);
    const companyInfo = [
      settings?.company_name || 'MatchMove',
      settings?.address || 'France',
      settings?.phone || '+33 1 23 45 67 89',
      settings?.email || 'contact@matchmove.fr',
      'matchmove.fr',
      `Document: ${currentDate}`
    ];
    
    let rightX = pageWidth - margin;
    companyInfo.forEach((info, index) => {
      if (info) { // Évite les lignes vides
        const textWidth = pdf.getTextWidth(info);
        pdf.text(info, rightX - textWidth, yPosition + (index * 3.5));
      }
    });

    yPosition = headerHeight + 15;

    // Titre optimisé
    pdf.setFontSize(16); // Réduit de 18 à 16
    pdf.setTextColor(...primaryColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INVENTAIRE PROFESSIONNEL DE DÉMÉNAGEMENT', margin, yPosition);
    yPosition += 12;

    // Section client optimisée
    pdf.setFillColor(...primaryColor);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 6, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INFORMATIONS CLIENT', margin + 5, yPosition + 4);
    yPosition += 10;

    pdf.setTextColor(...secondaryColor);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    
    // Informations client - format exact demandé
    const clientInfo = [
      `Nom: ${clientName || 'Non renseigné'}`,
      `Date déménagement: ${movingDate ? new Date(movingDate).toLocaleDateString('fr-FR') : 'Non renseignée'}`,
      `Téléphone: ${clientPhone || 'Non renseigné'}`,
      `Email: ${clientEmail || 'Non renseigné'}`
    ];

    clientInfo.forEach((info, index) => {
      if (index < 2) {
        pdf.text(info, margin + 5, yPosition + (index * 4));
      } else {
        pdf.text(info, pageWidth / 2 + 10, yPosition + ((index - 2) * 4));
      }
    });

    yPosition += 15;

    // Configuration des lieux optimisée
    pdf.setFillColor(...primaryColor);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 6, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CONFIGURATION DES LIEUX', margin + 5, yPosition + 4);
    yPosition += 10;

    pdf.setTextColor(...secondaryColor);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    
    // Distance si disponible
    if (isInternational) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`DISTANCE ESTIMÉE: Déménagement à l'international - distance non disponible`, margin + 5, yPosition);
      pdf.setFont('helvetica', 'normal');
      yPosition += 6;
    } else if (extendedFormData?.departurePostalCode && extendedFormData?.arrivalPostalCode) {
      pdf.setFont('helvetica', 'bold');
      const distanceDisplay = calculatedDistanceText || (calculatedDistance ? `${calculatedDistance} km` : 'Calcul en cours');
      pdf.text(`DISTANCE ESTIMÉE: ${distanceDisplay}`, margin + 5, yPosition);
      pdf.setFont('helvetica', 'normal');
      yPosition += 6;
    }
    
    // Configuration détaillée selon le type de déménagement
    let departureInfo: string[] = [];
    let arrivalInfo: string[] = [];
    
    if (isInternational) {
      departureInfo = [
        `LIEU DE DÉPART:`,
        `Adresse: ${internationalData?.departureAddress || 'Non spécifiée'}`,
        `Pays: ${internationalData?.departureCountry || 'Non spécifié'}`,
        `Formule: ${formule || 'standard'}`
      ];
      
      arrivalInfo = [
        `LIEU D'ARRIVÉE:`,
        `Adresse: ${internationalData?.arrivalAddress || 'Non spécifiée'}`,
        `Pays: ${internationalData?.arrivalCountry || 'Non spécifié'}`
      ];
    } else {
      departureInfo = [
        `LIEU DE DÉPART:`,
        `Ville: ${extendedFormData?.departureCity || 'Non spécifiée'}`,
        `Code postal: ${extendedFormData?.departurePostalCode || 'Non spécifié'}`,
        `Adresse: ${extendedFormData?.departureAddress || 'Non spécifiée'}`,
        `Type de lieu: ${getLocationTypeDisplayName(extendedFormData?.departureLocationType || 'appartement')}`,
        `Étage: ${extendedFormData?.departureFloor || extendedFormData?.departureFloor === 0 ? extendedFormData?.departureFloor : 'Non spécifié'}`,
        `Ascenseur: ${extendedFormData?.departureHasElevator ? 'Oui' : 'Non'}`,
        `Monte-charge: ${extendedFormData?.departureHasFreightElevator ? 'Oui' : 'Non'}`,
        `Distance portage: ${extendedFormData?.departureCarryingDistance || '0'}m`,
        `Stationnement: ${extendedFormData?.departureParkingNeeded ? 'Demandé' : 'Non demandé'}`,
        `Formule: ${formule || 'standard'}`
      ];
      
      arrivalInfo = [
        `LIEU D'ARRIVÉE:`,
        `Ville: ${extendedFormData?.arrivalCity || 'Non spécifiée'}`,
        `Code postal: ${extendedFormData?.arrivalPostalCode || 'Non spécifié'}`,
        `Adresse: ${extendedFormData?.arrivalAddress || 'Non spécifiée'}`,
        `Type de lieu: ${getLocationTypeDisplayName(extendedFormData?.arrivalLocationType || 'appartement')}`,
        `Étage: ${extendedFormData?.arrivalFloor || extendedFormData?.arrivalFloor === 0 ? extendedFormData?.arrivalFloor : 'Non spécifié'}`,
        `Ascenseur: ${extendedFormData?.arrivalHasElevator ? 'Oui' : 'Non'}`,
        `Monte-charge: ${extendedFormData?.arrivalHasFreightElevator ? 'Oui' : 'Non'}`,
        `Distance portage: ${extendedFormData?.arrivalCarryingDistance || '0'}m`,
        `Stationnement: ${extendedFormData?.arrivalParkingNeeded ? 'Demandé' : 'Non demandé'}`
      ];
    }

    departureInfo.forEach((info, index) => {
      if (index === 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.text(info, margin + 5, yPosition + (index * 3.5));
        pdf.setFont('helvetica', 'normal');
      } else {
        pdf.text(info, margin + 5, yPosition + (index * 3.5));
      }
    });

    arrivalInfo.forEach((info, index) => {
      if (index === 0) {
        pdf.setFont('helvetica', 'bold');
        pdf.text(info, pageWidth / 2 + 10, yPosition + (index * 3.5));
        pdf.setFont('helvetica', 'normal');
      } else {
        pdf.text(info, pageWidth / 2 + 10, yPosition + (index * 3.5));
      }
    });

    yPosition += 38; // Ajusté pour accommoder plus de lignes d'informations

    // Résumé optimisé
    pdf.setFillColor(...lightGray);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 18, 'F');
    
    pdf.setFontSize(10);
    pdf.setTextColor(...primaryColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RÉSUMÉ', margin + 5, yPosition + 6);
    
    pdf.setFontSize(9);
    pdf.setTextColor(...secondaryColor);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Volume total: ${totalVolume.toFixed(2)} m³`, margin + 5, yPosition + 12);
    pdf.text(`Objets: ${selectedItems.reduce((sum, item) => sum + item.quantity, 0)}`, pageWidth / 2, yPosition + 6);
    pdf.text(`Types: ${selectedItems.length}`, pageWidth / 2, yPosition + 12);
    
    yPosition += 25;

    // Tableau d'inventaire optimisé
    pdf.setFillColor(...primaryColor);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    
    // En-têtes simplifiés
    pdf.text('ARTICLE', margin + 5, yPosition + 5);
    pdf.text('QTE', margin + 75, yPosition + 5);
    pdf.text('VOL.U', margin + 95, yPosition + 5);
    pdf.text('VOL.T', margin + 120, yPosition + 5);
    pdf.text('OPTIONS', margin + 145, yPosition + 5);
    
    yPosition += 8;

    // Contenu du tableau optimisé
    pdf.setTextColor(...secondaryColor);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    
    let rowIndex = 0;
    selectedItems.forEach((item) => {
      // Nouvelle page si nécessaire
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
        
        // Re-dessiner l'en-tête
        pdf.setFillColor(...primaryColor);
        pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        
        pdf.text('ARTICLE', margin + 5, yPosition + 5);
        pdf.text('QTE', margin + 75, yPosition + 5);
        pdf.text('VOL.U', margin + 95, yPosition + 5);
        pdf.text('VOL.T', margin + 120, yPosition + 5);
        pdf.text('OPTIONS', margin + 145, yPosition + 5);
        
        yPosition += 8;
        pdf.setTextColor(...secondaryColor);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
      }

      // Ligne alternée simplifiée
      if (rowIndex % 2 === 0) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin, yPosition, pageWidth - 2 * margin, 10, 'F');
      }

      const itemTotalVolume = item.volume * item.quantity;

      // Nom tronqué
      let displayName = item.name;
      if (pdf.getTextWidth(displayName) > 65) {
        while (pdf.getTextWidth(displayName + '...') > 65 && displayName.length > 10) {
          displayName = displayName.slice(0, -1);
        }
        displayName += '...';
      }
      
      pdf.text(displayName, margin + 5, yPosition + 7);
      pdf.text(item.quantity.toString(), margin + 80, yPosition + 7);
      pdf.text(`${item.volume.toFixed(2)}`, margin + 95, yPosition + 7);
      pdf.text(`${itemTotalVolume.toFixed(2)}`, margin + 120, yPosition + 7);
      
      // Options condensées
      const isCarton = item.name.toLowerCase().includes('carton');
      if (isCarton) {
        const packingCount = item.packingOptions?.filter(opt => opt).length || 0;
        const unpackingCount = item.unpackingOptions?.filter(opt => opt).length || 0;
        if (packingCount > 0 || unpackingCount > 0) {
          let optionText = '';
          if (packingCount > 0) optionText += `${packingCount}E`;
          if (unpackingCount > 0) optionText += `${packingCount > 0 ? '/' : ''}${unpackingCount}D`;
          pdf.text(optionText, margin + 145, yPosition + 7);
        }
      } else {
        const disassemblyCount = item.disassemblyOptions?.filter(opt => opt).length || 0;
        if (disassemblyCount > 0) {
          pdf.text(`${disassemblyCount}DR`, margin + 145, yPosition + 7);
        }
      }

      yPosition += 10;
      rowIndex++;
    });

    // Calcul du volume avec marge de sécurité
    let volumeWithMargin = totalVolume;
    if (safetyMargin10) volumeWithMargin += totalVolume * 0.1;
    if (safetyMargin15) volumeWithMargin += totalVolume * 0.15;

    // Total optimisé
    yPosition += 3;
    pdf.setFillColor(...primaryColor);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('TOTAL', margin + 5, yPosition + 6);
    pdf.text(`${volumeWithMargin.toFixed(2)} m³`, margin + 120, yPosition + 6);
    pdf.text(`${selectedItems.reduce((sum, item) => sum + item.quantity, 0)} obj`, margin + 145, yPosition + 6);

    // Affichage des détails de marge si applicable
    if (safetyMargin10 || safetyMargin15) {
      yPosition += 12;
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
      pdf.setTextColor(...secondaryColor);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(`Volume de base: ${totalVolume.toFixed(2)} m³`, margin + 5, yPosition + 5);
      if (safetyMargin10) {
        pdf.text(`+ 10% sécurité: ${(totalVolume * 0.1).toFixed(2)} m³`, margin + 80, yPosition + 5);
      }
      if (safetyMargin15) {
        pdf.text(`+ 15% sécurité: ${(totalVolume * 0.15).toFixed(2)} m³`, margin + 140, yPosition + 5);
      }
      yPosition += 5;
    }

    yPosition += 15;

    // Notes si présentes
    if (notes) {
      if (yPosition > pageHeight - 35) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFillColor(...lightGray);
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 6, 'F');
      pdf.setTextColor(...primaryColor);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('NOTES', margin + 5, yPosition + 4);
      yPosition += 10;
      
      pdf.setTextColor(...secondaryColor);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      const noteLines = pdf.splitTextToSize(notes, pageWidth - 2 * margin - 10);
      pdf.text(noteLines, margin + 5, yPosition);
      yPosition += noteLines.length * 3 + 8;
    }

    // Footer optimisé
    if (yPosition > pageHeight - 25) {
      pdf.addPage();
      yPosition = 20;
    }
    
    yPosition = pageHeight - 20;
    pdf.setFillColor(...secondaryColor);
    pdf.rect(0, yPosition, pageWidth, 20, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${settings?.company_name || 'MatchMove'} - ${settings?.email || 'contact@matchmove.fr'}`, margin, yPosition + 7);
    
    const validityText = 'Validité: 30 jours';
    const validityWidth = pdf.getTextWidth(validityText);
    pdf.text(validityText, pageWidth - margin - validityWidth, yPosition + 7);
    
    pdf.text('matchmove.fr', margin, yPosition + 13);

    return pdf;
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
        const fileName = `${clientName || 'Client'}_inventaire-${clientReference || 'demenagement'}-${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`;
        pdf.save(fileName);
        
        toast({
          title: "PDF généré avec succès",
          description: "L'inventaire professionnel a été exporté en PDF.",
        });
      } else {
        const exportData = await generateProfessionalInventoryTXT();
        
        const blob = new Blob([exportData], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = `${clientName || 'Client'}_inventaire-${clientReference || 'demenagement'}-${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.txt`;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Fichier TXT généré avec succès",
          description: "L'inventaire professionnel a été exporté en format texte.",
        });
      }
    } catch (error) {
      console.error('Error generating export:', error);
      toast({
        title: "Erreur lors de l'export",
        description: "Une erreur est survenue lors de la génération du fichier.",
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
    
    setSessionData('volumeCalculatorData', {
      furniture: furnitureData,
      clientName,
      clientReference,
      clientAddress,
      clientPhone,
      clientEmail,
      notes,
      totalVolume: calculateTotalVolume()
    });
    
    window.location.href = '/truck-optimizer';
  };

  // Calculate total items by flattening subcategories and custom furniture
  const [customFurnitureCount, setCustomFurnitureCount] = useState(0);
  
  const totalItems = furnitureCategories.reduce((total, category) => {
    return total + category.subcategories.reduce((subTotal, subcategory) => {
      return subTotal + subcategory.items.length;
    }, 0);
  }, 0) + customFurnitureCount;

  // Load custom furniture count
  useEffect(() => {
    const loadCustomFurnitureCount = async () => {
      try {
        const { count, error } = await supabase
          .from('custom_furniture')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        setCustomFurnitureCount(count || 0);
      } catch (error) {
        console.error('Error loading custom furniture count:', error);
      }
    };

    loadCustomFurnitureCount();
  }, []);

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
            onCustomFurnitureCountChange={setCustomFurnitureCount}
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
                    safetyMargin10={safetyMargin10}
                    safetyMargin15={safetyMargin15}
                    onSafetyMargin10Change={setSafetyMargin10}
                    onSafetyMargin15Change={setSafetyMargin15}
                  />

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
                    departureCity={extendedFormData.departureCity || ''}
                    setDepartureCity={(value) => setExtendedFormData(prev => ({ ...prev, departureCity: value }))}
                    arrivalAddress={extendedFormData.arrivalAddress || ''}
                    setArrivalAddress={(value) => setExtendedFormData(prev => ({ ...prev, arrivalAddress: value }))}
                    arrivalPostalCode={extendedFormData.arrivalPostalCode || ''}
                    setArrivalPostalCode={(value) => setExtendedFormData(prev => ({ ...prev, arrivalPostalCode: value }))}
                    arrivalCity={extendedFormData.arrivalCity || ''}
                    setArrivalCity={(value) => setExtendedFormData(prev => ({ ...prev, arrivalCity: value }))}
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
                    isInternational={isInternational}
                    setIsInternational={setIsInternational}
                    internationalData={internationalData}
                    setInternationalData={setInternationalData}
                    movingDate={extendedFormData.movingDate || ''}
                    setMovingDate={(value) => setExtendedFormData(prev => ({ ...prev, movingDate: value }))}
                    flexibleDates={extendedFormData.flexibleDates || false}
                    setFlexibleDates={(value) => setExtendedFormData(prev => ({ ...prev, flexibleDates: value }))}
                    dateRangeStart={extendedFormData.dateRangeStart || ''}
                    setDateRangeStart={(value) => setExtendedFormData(prev => ({ ...prev, dateRangeStart: value }))}
                    dateRangeEnd={extendedFormData.dateRangeEnd || ''}
                    setDateRangeEnd={(value) => setExtendedFormData(prev => ({ ...prev, dateRangeEnd: value }))}
                    onSaveInventory={handleSaveClick}
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
                  onClick={handleSaveClick}
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
        open={showHistoryDialog}
        onOpenChange={setShowHistoryDialog}
        onLoadInventory={loadInventoryFromHistory}
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
      />

      <SaveInventoryDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onCreateNew={createNewInventory}
        onUpdateExisting={updateExistingInventory}
        inventoryReference={currentInventoryId ? (clientReference || currentInventoryId) : undefined}
      />
    </div>
  );
};

export default VolumeCalculator;
