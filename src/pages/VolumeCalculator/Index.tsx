import { useState, useEffect } from 'react';
import { Calculator, RotateCcw, Download, Package, FileText, Send, FileDown, History, Search } from 'lucide-react';
import matchmoveLogo from '@/assets/matchmove-logo.png';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FurnitureSelector from './components/FurnitureSelector';
import VolumeDisplay from './components/VolumeDisplay';
import { ExtendedClientForm } from './components/ExtendedClientForm';
import { InventoryHistoryDialog } from './components/InventoryHistoryDialog';
import { FurnitureItem, SelectedItem } from './types';
import { furnitureCategories } from './data/furnitureData';
import { useGoogleMapsDistance } from '@/hooks/useGoogleMapsDistance';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
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
  const [isExtendedForm, setIsExtendedForm] = useState(false);
  const [extendedFormData, setExtendedFormData] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');

  const calculateTotalVolume = () => {
    return selectedItems.reduce((total, item) => {
      let itemTotal = 0;
      for (let i = 0; i < item.quantity; i++) {
        let unitVolume = item.volume;
        // Appliquer la réduction de volume si démontage/remontage est activé pour cet item
        if (item.disassemblyOptions?.[i]) {
          unitVolume = unitVolume / 2;
        }
        itemTotal += unitVolume;
      }
      return total + itemTotal;
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

  const handleAddItem = (item: FurnitureItem & { disassemblyOptions?: boolean[]; packingOptions?: boolean[] }, quantity: number) => {
    const existingIndex = selectedItems.findIndex(selected => selected.id === item.id);
    
    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity = quantity;
      updated[existingIndex].disassemblyOptions = item.disassemblyOptions || updated[existingIndex].disassemblyOptions;
      updated[existingIndex].packingOptions = item.packingOptions || updated[existingIndex].packingOptions;
      setSelectedItems(updated);
    } else if (quantity > 0) {
      setSelectedItems([...selectedItems, {
        ...item,
        quantity,
        disassemblyOptions: item.disassemblyOptions || Array(quantity).fill(false),
        packingOptions: item.packingOptions || Array(quantity).fill(false)
      }]);
    }
  };

  const handleUpdateItemOptions = (itemId: string, index: number, optionType: 'disassembly' | 'packing', value: boolean) => {
    setSelectedItems(items => items.map(item => {
      if (item.id === itemId) {
        const updated = { ...item };
        if (optionType === 'disassembly') {
          updated.disassemblyOptions = [...(item.disassemblyOptions || [])];
          updated.disassemblyOptions[index] = value;
        } else {
          updated.packingOptions = [...(item.packingOptions || [])];
          updated.packingOptions[index] = value;
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
        departure_location_type: extendedFormData.departureLocationType,
        departure_floor: extendedFormData.departureFloor,
        departure_has_elevator: extendedFormData.departureHasElevator,
        departure_elevator_size: extendedFormData.departureElevatorSize,
        departure_has_freight_elevator: extendedFormData.departureHasFreightElevator,
        departure_carrying_distance: extendedFormData.departureCarryingDistance,
        departure_parking_needed: extendedFormData.departureParkingNeeded,
        arrival_location_type: extendedFormData.arrivalLocationType,
        arrival_floor: extendedFormData.arrivalFloor,
        arrival_has_elevator: extendedFormData.arrivalHasElevator,
        arrival_elevator_size: extendedFormData.arrivalElevatorSize,
        arrival_has_freight_elevator: extendedFormData.arrivalHasFreightElevator,
        arrival_carrying_distance: extendedFormData.arrivalCarryingDistance,
        arrival_parking_needed: extendedFormData.arrivalParkingNeeded,
        total_volume: totalVolume,
        total_weight: totalWeight,
        selected_items: selectedItems as any,
        created_by: user.id,
      };

      const { error } = await supabase
        .from('inventories')
        .insert(inventoryData);

      if (error) throw error;

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

  const generateProfessionalInventoryContent = async () => {
    const settings = await loadCompanySettings();
    const totalVolume = calculateTotalVolume();
    const totalWeight = calculateTotalWeight();
    const currentDate = new Date().toLocaleDateString('fr-FR');
    const truck = getTruckRecommendation(totalVolume);
    
    return {
      settings,
      totalVolume,
      totalWeight,
      currentDate,
      truck,
      selectedItems
    };
  };

  const generateProfessionalInventoryTXT = async () => {
    const data = await generateProfessionalInventoryContent();
    const { settings, totalVolume, totalWeight, currentDate, truck } = data;
    
    // En-tête professionnel
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
Adresse de départ    : ${clientAddress || 'Non renseignée'}
Téléphone           : ${clientPhone || 'Non renseigné'}
Email               : ${clientEmail || 'Non renseigné'}
Date d'établissement : ${currentDate}

RÉSUMÉ TECHNIQUE
──────────────────────────────────────────────────────
Volume total estimé  : ${totalVolume.toFixed(2)} m³
Nombre d'objets      : ${selectedItems.reduce((sum, item) => sum + item.quantity, 0)}
Types différents     : ${selectedItems.length}
Site web            : matchmove.fr

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
    const data = await generateProfessionalInventoryContent();
    const { settings, totalVolume, totalWeight, currentDate, truck } = data;
    
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;
    let yPosition = 20;

    // Colors
    const primaryColor: [number, number, number] = [41, 128, 185]; // Blue
    const secondaryColor: [number, number, number] = [52, 73, 94]; // Dark gray
    const lightGray: [number, number, number] = [245, 245, 245];

    // Header section
    const headerHeight = 60;
    
    // Background for header
    pdf.setFillColor(...lightGray);
    pdf.rect(0, 0, pageWidth, headerHeight, 'F');

    // Add logo
    try {
      pdf.addImage(matchmoveLogo, 'PNG', margin, yPosition, 50, 25);
    } catch (error) {
      console.log('Logo not loaded:', error);
    }

    // Company information (top right)
    pdf.setFontSize(10);
    pdf.setTextColor(...secondaryColor);
    const companyInfo = [
      settings?.company_name || 'MatchMove',
      settings?.address || 'France',
      settings?.phone || '+33 1 23 45 67 89',
      settings?.email || 'contact@matchmove.fr',
      'matchmove.fr'
    ];
    
    let rightX = pageWidth - margin;
    let companyY = yPosition;
    companyInfo.forEach((info, index) => {
      const textWidth = pdf.getTextWidth(info);
      pdf.text(info, rightX - textWidth, companyY + (index * 4));
    });

    yPosition = headerHeight + 20;

    // Title
    pdf.setFontSize(18);
    pdf.setTextColor(...primaryColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INVENTAIRE PROFESSIONNEL DE DÉMÉNAGEMENT', margin, yPosition);
    yPosition += 15;

    // Client information section
    pdf.setFillColor(...primaryColor);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INFORMATIONS CLIENT', margin + 5, yPosition + 6);
    yPosition += 15;

    pdf.setTextColor(...secondaryColor);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    const clientInfoLeft = [
      `Nom: ${clientName || 'Non renseigné'}`,
      `Référence: ${clientReference || `INV-${Date.now()}`}`,
      `Date: ${currentDate}`
    ];
    
    const clientInfoRight = [
      `Adresse: ${clientAddress || 'Non renseignée'}`,
      `Téléphone: ${clientPhone || 'Non renseigné'}`,
      `Email: ${clientEmail || 'Non renseigné'}`
    ];

    clientInfoLeft.forEach((info, index) => {
      pdf.text(info, margin + 5, yPosition + (index * 5));
    });

    clientInfoRight.forEach((info, index) => {
      pdf.text(info, pageWidth / 2 + 10, yPosition + (index * 5));
    });

    yPosition += 25;

    // Summary section
    pdf.setFillColor(...lightGray);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 20, 'F');
    
    pdf.setFontSize(12);
    pdf.setTextColor(...primaryColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RÉSUMÉ', margin + 5, yPosition + 8);
    
    pdf.setFontSize(10);
    pdf.setTextColor(...secondaryColor);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Volume total: ${totalVolume.toFixed(2)} m³`, margin + 5, yPosition + 15);
    pdf.text(`Objets: ${selectedItems.reduce((sum, item) => sum + item.quantity, 0)}`, pageWidth / 2, yPosition + 8);
    pdf.text(`Véhicule: ${truck.type}`, pageWidth / 2, yPosition + 15);
    
    yPosition += 30;

    // Inventory table header
    pdf.setFillColor(...primaryColor);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    
    // Table headers
    const col1Width = 10; // Icon
    const col2Width = 65; // Nom
    const col3Width = 20; // Qté
    const col4Width = 25; // Volume unit
    const col5Width = 25; // Volume total
    const col6Width = 45; // Options
    
    pdf.text('•', margin + 5, yPosition + 7);
    pdf.text('ARTICLE', margin + col1Width + 5, yPosition + 7);
    pdf.text('QTE', margin + col1Width + col2Width + 5, yPosition + 7);
    pdf.text('VOL. UNIT', margin + col1Width + col2Width + col3Width + 5, yPosition + 7);
    pdf.text('VOL. TOTAL', margin + col1Width + col2Width + col3Width + col4Width + 5, yPosition + 7);
    pdf.text('OPTIONS', margin + col1Width + col2Width + col3Width + col4Width + col5Width + 5, yPosition + 7);
    
    yPosition += 10;

    // Table content
    pdf.setTextColor(...secondaryColor);
    pdf.setFont('helvetica', 'normal');
    
    let rowIndex = 0;
    selectedItems.forEach((item) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }

      // Alternating row colors
      if (rowIndex % 2 === 0) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin, yPosition, pageWidth - 2 * margin, 15, 'F');
      }

      // Calculate total volume for this item including disassembly options
      let itemTotalVolume = 0;
      for (let i = 0; i < item.quantity; i++) {
        let unitVolume = item.volume;
        if (item.disassemblyOptions?.[i]) unitVolume = unitVolume / 2;
        itemTotalVolume += unitVolume;
      }

      // Item row - simple bullet point instead of complex icons
      pdf.text('•', margin + 5, yPosition + 10);
      
      // Truncate name if too long
      let displayName = item.name;
      if (pdf.getTextWidth(displayName) > col2Width - 5) {
        while (pdf.getTextWidth(displayName + '...') > col2Width - 5 && displayName.length > 10) {
          displayName = displayName.slice(0, -1);
        }
        displayName += '...';
      }
      pdf.text(displayName, margin + col1Width + 5, yPosition + 10);
      
      pdf.text(item.quantity.toString(), margin + col1Width + col2Width + 8, yPosition + 10);
      pdf.text(`${item.volume.toFixed(2)} m³`, margin + col1Width + col2Width + col3Width + 5, yPosition + 10);
      pdf.text(`${itemTotalVolume.toFixed(2)} m³`, margin + col1Width + col2Width + col3Width + col4Width + 5, yPosition + 10);
      
      // Options summary
      const isCarton = item.name.toLowerCase().includes('carton');
      const optionsCount = isCarton 
        ? item.packingOptions?.filter(opt => opt).length || 0
        : item.disassemblyOptions?.filter(opt => opt).length || 0;
      
      if (optionsCount > 0) {
        const optionText = isCarton ? `${optionsCount} emb/déb` : `${optionsCount} dém/rem`;
        pdf.text(optionText, margin + col1Width + col2Width + col3Width + col4Width + col5Width + 5, yPosition + 10);
      }

      yPosition += 15;
      rowIndex++;
    });

    // Total line
    yPosition += 5;
    pdf.setFillColor(...primaryColor);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 12, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TOTAL GÉNÉRAL', margin + 5, yPosition + 8);
    pdf.text(`${totalVolume.toFixed(2)} m³`, margin + col1Width + col2Width + col3Width + col4Width + 5, yPosition + 8);
    pdf.text(`${selectedItems.reduce((sum, item) => sum + item.quantity, 0)} objets`, margin + col1Width + col2Width + col3Width + col4Width + col5Width + 5, yPosition + 8);

    yPosition += 20;

    // Notes section if any
    if (notes) {
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFillColor(...lightGray);
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
      pdf.setTextColor(...primaryColor);
      pdf.setFont('helvetica', 'bold');
      pdf.text('NOTES PARTICULIÈRES', margin + 5, yPosition + 6);
      yPosition += 15;
      
      pdf.setTextColor(...secondaryColor);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      const noteLines = pdf.splitTextToSize(notes, pageWidth - 2 * margin - 10);
      pdf.text(noteLines, margin + 5, yPosition);
      yPosition += noteLines.length * 4 + 10;
    }

    // Footer
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = 20;
    }
    
    yPosition = pageHeight - 30;
    pdf.setFillColor(...secondaryColor);
    pdf.rect(0, yPosition, pageWidth, 30, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Document généré par ${settings?.company_name || 'MatchMove'}`, margin, yPosition + 10);
    pdf.text(`Contact: ${settings?.email || 'contact@matchmove.fr'}`, margin, yPosition + 16);
    pdf.text(`Site web: matchmove.fr`, margin, yPosition + 22);
    
    const validityText = 'Validité de l\'estimation: 30 jours';
    const validityWidth = pdf.getTextWidth(validityText);
    pdf.text(validityText, pageWidth - margin - validityWidth, yPosition + 16);

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
        const fileName = `inventaire-${clientReference || clientName || 'demenagement'}-${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`;
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
        const fileName = `inventaire-${clientReference || clientName || 'demenagement'}-${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.txt`;
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
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher un meuble..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <FurnitureSelector
                  onAddItem={handleAddItem}
                  selectedItems={selectedItems}
                  onUpdateItemOptions={handleUpdateItemOptions}
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
            />


            {/* Information client */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Information client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={!isExtendedForm ? "default" : "outline"}
                    onClick={() => setIsExtendedForm(false)}
                    className="flex-1"
                    size="sm"
                  >
                    Simple
                  </Button>
                  <Button
                    variant={isExtendedForm ? "default" : "outline"}
                    onClick={() => setIsExtendedForm(true)}
                    className="flex-1"
                    size="sm"
                  >
                    Complet
                  </Button>
                </div>

                {!isExtendedForm ? (
                  <div className="space-y-3">
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
                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                        Notes particulières
                      </label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Accès difficile, objets fragiles, etc."
                        rows={2}
                      />
                    </div>
                  </div>
                ) : (
                  <ExtendedClientForm
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
                    departureFloor={extendedFormData.departureFloor || 0}
                    setDepartureFloor={(value) => setExtendedFormData(prev => ({ ...prev, departureFloor: value }))}
                    departureHasElevator={extendedFormData.departureHasElevator || false}
                    setDepartureHasElevator={(value) => setExtendedFormData(prev => ({ ...prev, departureHasElevator: value }))}
                    departureElevatorSize={extendedFormData.departureElevatorSize || ''}
                    setDepartureElevatorSize={(value) => setExtendedFormData(prev => ({ ...prev, departureElevatorSize: value }))}
                    departureHasFreightElevator={extendedFormData.departureHasFreightElevator || false}
                    setDepartureHasFreightElevator={(value) => setExtendedFormData(prev => ({ ...prev, departureHasFreightElevator: value }))}
                    departureCarryingDistance={extendedFormData.departureCarryingDistance || 0}
                    setDepartureCarryingDistance={(value) => setExtendedFormData(prev => ({ ...prev, departureCarryingDistance: value }))}
                    departureParkingNeeded={extendedFormData.departureParkingNeeded || false}
                    setDepartureParkingNeeded={(value) => setExtendedFormData(prev => ({ ...prev, departureParkingNeeded: value }))}
                    arrivalLocationType={extendedFormData.arrivalLocationType || 'appartement'}
                    setArrivalLocationType={(value) => setExtendedFormData(prev => ({ ...prev, arrivalLocationType: value }))}
                    arrivalFloor={extendedFormData.arrivalFloor || 0}
                    setArrivalFloor={(value) => setExtendedFormData(prev => ({ ...prev, arrivalFloor: value }))}
                    arrivalHasElevator={extendedFormData.arrivalHasElevator || false}
                    setArrivalHasElevator={(value) => setExtendedFormData(prev => ({ ...prev, arrivalHasElevator: value }))}
                    arrivalElevatorSize={extendedFormData.arrivalElevatorSize || ''}
                    setArrivalElevatorSize={(value) => setExtendedFormData(prev => ({ ...prev, arrivalElevatorSize: value }))}
                    arrivalHasFreightElevator={extendedFormData.arrivalHasFreightElevator || false}
                    setArrivalHasFreightElevator={(value) => setExtendedFormData(prev => ({ ...prev, arrivalHasFreightElevator: value }))}
                    arrivalCarryingDistance={extendedFormData.arrivalCarryingDistance || 0}
                    setArrivalCarryingDistance={(value) => setExtendedFormData(prev => ({ ...prev, arrivalCarryingDistance: value }))}
                    arrivalParkingNeeded={extendedFormData.arrivalParkingNeeded || false}
                    setArrivalParkingNeeded={(value) => setExtendedFormData(prev => ({ ...prev, arrivalParkingNeeded: value }))}
                  />
                )}
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
          setSelectedItems(inventory.selectedItems || []);
          toast({
            title: "Inventaire chargé",
            description: "L'inventaire a été chargé avec succès",
          });
        }}
      />
    </div>
  );
};

export default VolumeCalculator;
