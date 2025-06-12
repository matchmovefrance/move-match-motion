
import jsPDF from 'jspdf';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClientRequest {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  departure_address: string | null;
  departure_city: string;
  departure_postal_code: string;
  departure_country: string | null;
  arrival_address: string | null;
  arrival_city: string;
  arrival_postal_code: string;
  arrival_country: string | null;
  desired_date: string;
  estimated_volume: number | null;
  quote_amount: number | null;
}

interface QuoteGeneratorProps {
  client: ClientRequest;
  supplier?: {
    company_name: string;
    contact_name: string;
    email: string;
    phone: string;
    bank_details?: {
      iban: string;
      bic: string;
      bank_name: string;
      account_holder: string;
    };
  };
  supplierPrice?: number;
  matchMoveMargin?: number;
}

const QuoteGenerator = ({ client, supplier, supplierPrice, matchMoveMargin }: QuoteGeneratorProps) => {
  const generatePDF = () => {
    console.log('🎯 Génération PDF - Design professionnel A4');
    
    if (!client.quote_amount || !client.name) {
      console.error('❌ Données essentielles manquantes');
      return;
    }

    const supplierInfo = supplier || {
      company_name: "Amini Transport",
      contact_name: "Service Commercial",
      email: "contact@amini-transport.fr",
      phone: "01 23 45 67 89"
    };

    const doc = new jsPDF();
    const pageWidth = 210;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = 25;
    
    // === EN-TÊTE PROFESSIONNEL ===
    // Bandeau bleu
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Titre principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('DEVIS DE DÉMÉNAGEMENT', margin, 18);
    
    // Numéro et date
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const quoteNumber = `DEV-${Date.now().toString().slice(-6)}`;
    doc.text(`N° ${quoteNumber}`, margin, 28);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 50, 28);
    
    yPos = 50;
    
    // === INFORMATIONS ENTREPRISE ===
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, yPos, contentWidth, 35, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPos, contentWidth, 35);
    
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(supplierInfo.company_name, margin + 5, yPos + 12);
    
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Contact: ${supplierInfo.contact_name}`, margin + 5, yPos + 20);
    doc.text(`Email: ${supplierInfo.email}`, margin + 5, yPos + 26);
    doc.text(`Téléphone: ${supplierInfo.phone}`, margin + 5, yPos + 32);
    
    yPos += 45;
    
    // === INFORMATIONS CLIENT ===
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMATIONS CLIENT', margin, yPos);
    
    yPos += 8;
    doc.setFillColor(254, 249, 195);
    doc.rect(margin, yPos, contentWidth, 25, 'F');
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPos, contentWidth, 25);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(client.name, margin + 5, yPos + 8);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    let clientInfoY = yPos + 14;
    if (client.email) {
      doc.text(`Email: ${client.email}`, margin + 5, clientInfoY);
      clientInfoY += 5;
    }
    if (client.phone) {
      doc.text(`Téléphone: ${client.phone}`, margin + 5, clientInfoY);
    }
    
    yPos += 35;
    
    // === ADRESSES DE DÉMÉNAGEMENT ===
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ADRESSES DE DÉMÉNAGEMENT', margin, yPos);
    
    yPos += 10;
    
    // ADRESSE DE DÉPART
    doc.setFillColor(220, 252, 231);
    doc.rect(margin, yPos, contentWidth/2 - 2, 40, 'F');
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(0.8);
    doc.rect(margin, yPos, contentWidth/2 - 2, 40);
    
    doc.setTextColor(21, 128, 61);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DÉPART', margin + 5, yPos + 8);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    let departureText = '';
    if (client.departure_address) {
      departureText += client.departure_address + '\n';
    }
    departureText += `${client.departure_postal_code} ${client.departure_city}`;
    if (client.departure_country && client.departure_country !== 'France') {
      departureText += '\n' + client.departure_country;
    }
    
    const departureLines = departureText.split('\n');
    departureLines.forEach((line, index) => {
      if (line.trim()) {
        doc.text(line.trim(), margin + 5, yPos + 16 + (index * 5));
      }
    });
    
    // ADRESSE D'ARRIVÉE
    doc.setFillColor(254, 226, 226);
    doc.rect(margin + contentWidth/2 + 2, yPos, contentWidth/2 - 2, 40, 'F');
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(0.8);
    doc.rect(margin + contentWidth/2 + 2, yPos, contentWidth/2 - 2, 40);
    
    doc.setTextColor(185, 28, 28);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ARRIVÉE', margin + contentWidth/2 + 7, yPos + 8);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    let arrivalText = '';
    if (client.arrival_address) {
      arrivalText += client.arrival_address + '\n';
    }
    arrivalText += `${client.arrival_postal_code} ${client.arrival_city}`;
    if (client.arrival_country && client.arrival_country !== 'France') {
      arrivalText += '\n' + client.arrival_country;
    }
    
    const arrivalLines = arrivalText.split('\n');
    arrivalLines.forEach((line, index) => {
      if (line.trim()) {
        doc.text(line.trim(), margin + contentWidth/2 + 7, yPos + 16 + (index * 5));
      }
    });
    
    yPos += 50;
    
    // === DÉTAILS DU DÉMÉNAGEMENT ===
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DÉTAILS DU DÉMÉNAGEMENT', margin, yPos);
    
    yPos += 8;
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, yPos, contentWidth, 20, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPos, contentWidth, 20);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    doc.setFont('helvetica', 'bold');
    doc.text('Date souhaitée:', margin + 5, yPos + 8);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(client.desired_date).toLocaleDateString('fr-FR'), margin + 45, yPos + 8);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Volume estimé:', margin + 5, yPos + 15);
    doc.setFont('helvetica', 'normal');
    doc.text(client.estimated_volume ? `${client.estimated_volume} m³` : 'Non spécifié', margin + 45, yPos + 15);
    
    yPos += 30;
    
    // === MONTANT TOTAL ===
    doc.setFillColor(34, 197, 94);
    doc.rect(margin, yPos, contentWidth, 25, 'F');
    doc.setDrawColor(21, 128, 61);
    doc.setLineWidth(1);
    doc.rect(margin, yPos, contentWidth, 25);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('MONTANT TOTAL TTC', margin + 5, yPos + 10);
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(`${client.quote_amount.toFixed(2)} €`, margin + 5, yPos + 20);
    
    yPos += 35;
    
    // === COORDONNÉES BANCAIRES ===
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('COORDONNÉES BANCAIRES', margin, yPos);
    
    yPos += 8;
    doc.setFillColor(255, 247, 237);
    doc.rect(margin, yPos, contentWidth, 35, 'F');
    doc.setDrawColor(251, 146, 60);
    doc.setLineWidth(0.8);
    doc.rect(margin, yPos, contentWidth, 35);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    if (supplier?.bank_details) {
      doc.setFont('helvetica', 'bold');
      doc.text('Titulaire du compte:', margin + 5, yPos + 8);
      doc.setFont('helvetica', 'normal');
      doc.text(supplier.bank_details.account_holder, margin + 50, yPos + 8);
      
      doc.setFont('helvetica', 'bold');
      doc.text('IBAN:', margin + 5, yPos + 15);
      doc.setFont('helvetica', 'normal');
      doc.text(supplier.bank_details.iban, margin + 25, yPos + 15);
      
      doc.setFont('helvetica', 'bold');
      doc.text('BIC:', margin + 5, yPos + 22);
      doc.setFont('helvetica', 'normal');
      doc.text(supplier.bank_details.bic, margin + 20, yPos + 22);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Banque:', margin + 5, yPos + 29);
      doc.setFont('helvetica', 'normal');
      doc.text(supplier.bank_details.bank_name, margin + 30, yPos + 29);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(120, 113, 108);
      doc.text('RIB: (non renseigné)', margin + 5, yPos + 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Les coordonnées bancaires seront communiquées lors de la confirmation du devis.', margin + 5, yPos + 20);
    }
    
    yPos += 45;
    
    // === CONDITIONS ===
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('• Devis valable 30 jours à compter de la date d\'émission', margin, yPos);
    doc.text('• Paiement par virement bancaire uniquement', margin, yPos + 5);
    doc.text('• Confirmation écrite requise pour validation du devis', margin, yPos + 10);
    
    // === PIED DE PAGE ===
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`${supplierInfo.company_name} - Devis généré le ${new Date().toLocaleDateString('fr-FR')}`, margin, 285);
    
    // Télécharger
    const fileName = `devis_${supplierInfo.company_name.replace(/\s+/g, '_')}_${client.name?.replace(/\s+/g, '_') || 'client'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    console.log('✅ PDF généré avec design professionnel:', fileName);
  };

  const hasRequiredClientData = !!(client.quote_amount && client.name);
  
  return (
    <Button
      onClick={generatePDF}
      variant="outline"
      size="sm"
      className={`
        transition-all duration-200 
        ${!hasRequiredClientData
          ? 'text-gray-400 border-gray-200 cursor-not-allowed opacity-50' 
          : 'text-blue-600 border-blue-200 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-300'
        }
      `}
      disabled={!hasRequiredClientData}
      title={hasRequiredClientData ? "Télécharger le devis en PDF" : "Données manquantes pour générer le PDF"}
    >
      <FileDown className="h-4 w-4" />
    </Button>
  );
};

export default QuoteGenerator;
