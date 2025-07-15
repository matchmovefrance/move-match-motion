import jsPDF from 'jspdf';
import { SelectedItem } from '../types';

export const optimizePDFGeneration = (
  pdf: jsPDF,
  selectedItems: SelectedItem[],
  margin: number,
  yPosition: number,
  primaryColor: [number, number, number],
  secondaryColor: [number, number, number]
): number => {
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  
  // Optimized inventory table header with dimensions
  pdf.setFillColor(...primaryColor);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 10, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  
  // Optimized column widths
  const col1Width = 8;   // Icon (réduit)
  const col2Width = 50;  // Nom (réduit)
  const col3Width = 15;  // Qté (réduit)
  const col4Width = 20;  // Volume unit (réduit)
  const col5Width = 20;  // Volume total (réduit)
  const col6Width = 35;  // Dimensions (nouveau)
  const col7Width = 40;  // Options (réduit)
  
  pdf.text('•', margin + 3, yPosition + 7);
  pdf.text('ARTICLE', margin + col1Width + 2, yPosition + 7);
  pdf.text('QTE', margin + col1Width + col2Width + 2, yPosition + 7);
  pdf.text('VOL.U', margin + col1Width + col2Width + col3Width + 2, yPosition + 7);
  pdf.text('VOL.T', margin + col1Width + col2Width + col3Width + col4Width + 2, yPosition + 7);
  pdf.text('DIMENSIONS', margin + col1Width + col2Width + col3Width + col4Width + col5Width + 2, yPosition + 7);
  pdf.text('OPTS', margin + col1Width + col2Width + col3Width + col4Width + col5Width + col6Width + 2, yPosition + 7);
  
  yPosition += 10;

  // Optimized table content
  pdf.setTextColor(...secondaryColor);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7); // Police plus petite pour économiser l'espace
  
  let rowIndex = 0;
  selectedItems.forEach((item) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 40) { // Marge réduite
      pdf.addPage();
      yPosition = 20;
      
      // Re-draw optimized table header on new page
      pdf.setFillColor(...primaryColor);
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 10, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      
      pdf.text('•', margin + 3, yPosition + 7);
      pdf.text('ARTICLE', margin + col1Width + 2, yPosition + 7);
      pdf.text('QTE', margin + col1Width + col2Width + 2, yPosition + 7);
      pdf.text('VOL.U', margin + col1Width + col2Width + col3Width + 2, yPosition + 7);
      pdf.text('VOL.T', margin + col1Width + col2Width + col3Width + col4Width + 2, yPosition + 7);
      pdf.text('DIMENSIONS', margin + col1Width + col2Width + col3Width + col4Width + col5Width + 2, yPosition + 7);
      pdf.text('OPTS', margin + col1Width + col2Width + col3Width + col4Width + col5Width + col6Width + 2, yPosition + 7);
      
      yPosition += 10;
      pdf.setTextColor(...secondaryColor);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
    }

    // Optimized alternating row colors (plus léger)
    if (rowIndex % 2 === 0) {
      pdf.setFillColor(252, 252, 252); // Couleur plus légère
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 12, 'F'); // Hauteur réduite
    }

    const itemTotalVolume = item.volume * item.quantity;

    // Optimized item row
    pdf.text('•', margin + 3, yPosition + 8);
    
    // Truncate name more aggressively
    let displayName = item.name;
    if (pdf.getTextWidth(displayName) > col2Width - 3) {
      while (pdf.getTextWidth(displayName + '..') > col2Width - 3 && displayName.length > 8) {
        displayName = displayName.slice(0, -1);
      }
      displayName += '..';
    }
    pdf.text(displayName, margin + col1Width + 2, yPosition + 8);
    
    pdf.text(item.quantity.toString(), margin + col1Width + col2Width + 2, yPosition + 8);
    pdf.text(`${item.volume.toFixed(2)}`, margin + col1Width + col2Width + col3Width + 2, yPosition + 8);
    pdf.text(`${itemTotalVolume.toFixed(2)}`, margin + col1Width + col2Width + col3Width + col4Width + 2, yPosition + 8);
    
    // Afficher les dimensions si disponibles
    const dimensions = item.dimensions || '-';
    let displayDimensions = dimensions;
    if (pdf.getTextWidth(displayDimensions) > col6Width - 3) {
      displayDimensions = dimensions.length > 12 ? dimensions.slice(0, 10) + '..' : dimensions;
    }
    pdf.text(displayDimensions, margin + col1Width + col2Width + col3Width + col4Width + col5Width + 2, yPosition + 8);
    
    // Optimized options (format très compact)
    const disassemblyCount = item.disassemblyOptions?.filter(Boolean).length || 0;
    const packingCount = item.packingOptions?.filter(Boolean).length || 0;
    const unpackingCount = item.unpackingOptions?.filter(Boolean).length || 0;
    
    const services = [];
    if (disassemblyCount > 0) services.push(`D${disassemblyCount}`);
    if (packingCount > 0) services.push(`E${packingCount}`);
    if (unpackingCount > 0) services.push(`DE${unpackingCount}`);
    
    const optionsText = services.length > 0 ? services.join(',') : '-';
    pdf.text(optionsText, margin + col1Width + col2Width + col3Width + col4Width + col5Width + col6Width + 2, yPosition + 8);
    
    yPosition += 12; // Espacement réduit
    rowIndex++;
  });

  return yPosition;
};

// Légende pour les options compactes
export const addOptionsLegend = (
  pdf: jsPDF,
  margin: number,
  yPosition: number,
  secondaryColor: [number, number, number]
): number => {
  pdf.setFontSize(6);
  pdf.setTextColor(...secondaryColor);
  pdf.setFont('helvetica', 'italic');
  
  yPosition += 5;
  pdf.text('Légende - OPTS: D=Démontage, E=Emballage, DE=Déballage', margin, yPosition);
  pdf.text('Dimensions en cm: Longueur × Profondeur × Hauteur', margin, yPosition + 4);
  
  return yPosition + 10;
};