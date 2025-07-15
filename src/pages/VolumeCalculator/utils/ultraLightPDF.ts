import jsPDF from 'jspdf';
import { SelectedItem } from '../types';

// Générateur PDF ultra-léger - maximum 150KB
export const generateUltraLightPDF = (
  selectedItems: SelectedItem[],
  totalVolume: number,
  settings: any,
  movingDate: string,
  extendedFormData: any,
  notes: string
): jsPDF => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true // Compression activée
  });

  let y = 20;
  const margin = 15;
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;

  // Configuration fixe pour éviter les redondances
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);

  // En-tête minimal
  pdf.setFontSize(14);
  pdf.text('INVENTAIRE VOLUME - MATCHMOVE', margin, y);
  y += 10;

  pdf.setFontSize(9);
  pdf.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, margin, y);
  pdf.text(`Volume: ${totalVolume.toFixed(2)} m³`, pageWidth - 50, y);
  y += 8;

  // Informations client (compactes)
  if (extendedFormData?.client_name) {
    pdf.text(`Client: ${extendedFormData.client_name}`, margin, y);
    y += 5;
  }
  if (extendedFormData?.departure_postal_code && extendedFormData?.arrival_postal_code) {
    pdf.text(`Trajet: ${extendedFormData.departure_postal_code} → ${extendedFormData.arrival_postal_code}`, margin, y);
    y += 8;
  }

  // Ligne séparatrice simple
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Tableau ultra-simplifié (texte pur, pas de rectangles)
  pdf.setFontSize(8);
  
  // En-tête tableau
  pdf.text('ARTICLE', margin, y);
  pdf.text('QTE', margin + 70, y);
  pdf.text('VOL', margin + 90, y);
  pdf.text('DIM', margin + 110, y);
  pdf.text('OPT', margin + 150, y);
  y += 6;

  // Ligne séparatrice
  pdf.line(margin, y, pageWidth - margin, y);
  y += 4;

  // Contenu tableau (sans couleurs ni rectangles)
  selectedItems.forEach((item, index) => {
    // Vérifier si nouvelle page nécessaire
    if (y > pageHeight - 30) {
      pdf.addPage();
      y = 20;
      
      // Re-dessiner l'en-tête du tableau
      pdf.setFontSize(8);
      pdf.text('ARTICLE', margin, y);
      pdf.text('QTE', margin + 70, y);
      pdf.text('VOL', margin + 90, y);
      pdf.text('DIM', margin + 110, y);
      pdf.text('OPT', margin + 150, y);
      y += 6;
      pdf.line(margin, y, pageWidth - margin, y);
      y += 4;
    }

    // Nom tronqué
    let name = item.name;
    if (name.length > 25) {
      name = name.substring(0, 22) + '...';
    }
    pdf.text(name, margin, y);
    
    // Quantité
    pdf.text(item.quantity.toString(), margin + 70, y);
    
    // Volume total
    pdf.text((item.volume * item.quantity).toFixed(2), margin + 90, y);
    
    // Dimensions (format compact)
    const dim = item.dimensions || '-';
    const shortDim = dim.length > 15 ? dim.substring(0, 12) + '...' : dim;
    pdf.text(shortDim, margin + 110, y);
    
    // Options (ultra-compact)
    const options = [];
    if (item.disassemblyOptions?.some(Boolean)) options.push('D');
    if (item.packingOptions?.some(Boolean)) options.push('E');
    if (item.unpackingOptions?.some(Boolean)) options.push('DE');
    pdf.text(options.join(',') || '-', margin + 150, y);
    
    y += 4;
  });

  // Total
  y += 6;
  pdf.line(margin, y, pageWidth - margin, y);
  y += 6;
  pdf.setFontSize(10);
  pdf.text(`TOTAL: ${totalVolume.toFixed(2)} m³ | ${selectedItems.reduce((sum, item) => sum + item.quantity, 0)} objets`, margin, y);
  y += 8;

  // Notes (si présentes)
  if (notes && notes.trim()) {
    y += 5;
    pdf.setFontSize(8);
    pdf.text('NOTES:', margin, y);
    y += 4;
    
    // Diviser le texte en lignes
    const noteLines = pdf.splitTextToSize(notes, pageWidth - 2 * margin);
    noteLines.forEach((line: string) => {
      if (y > pageHeight - 20) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(line, margin, y);
      y += 4;
    });
  }

  // Pied de page minimal
  y += 10;
  if (y > pageHeight - 20) {
    pdf.addPage();
    y = 20;
  }
  pdf.setFontSize(7);
  pdf.text('Généré par MatchMove - contact@matchmove.fr', margin, y);

  return pdf;
};

// Fonction pour calculer la taille estimée du PDF
export const estimatePDFSize = (selectedItems: SelectedItem[]): string => {
  const baseSize = 5; // KB pour la structure de base
  const itemSize = 0.1; // KB par item
  const estimatedSize = baseSize + (selectedItems.length * itemSize);
  return `${estimatedSize.toFixed(0)} KB`;
};