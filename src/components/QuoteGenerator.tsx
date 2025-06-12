
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
    console.log('🎯 Génération PDF - Adresses exactes et organisation');
    
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
    let yPos = 30;
    
    // === EN-TÊTE PRINCIPAL ===
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('DEVIS DE DÉMÉNAGEMENT', 20, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const quoteNumber = `DEV-${Date.now().toString().slice(-6)}`;
    doc.text(`N° ${quoteNumber}`, 20, 40);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 120, 40);
    
    yPos = 70;
    
    // === SECTION PRESTATAIRE ===
    doc.setFillColor(248, 250, 252);
    doc.rect(15, yPos - 5, 180, 40, 'F');
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.rect(15, yPos - 5, 180, 40);
    
    // Nom du prestataire en titre
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(supplierInfo.company_name, 20, yPos + 10);
    
    // Coordonnées du prestataire
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(`Contact: ${supplierInfo.contact_name}`, 20, yPos + 20);
    doc.text(`Email: ${supplierInfo.email}`, 20, yPos + 28);
    doc.text(`Téléphone: ${supplierInfo.phone}`, 20, yPos + 36);
    
    yPos += 55;
    
    // === SECTION CLIENT ===
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENT', 20, yPos);
    
    yPos += 10;
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(client.name, 20, yPos);
    
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    
    if (client.email) {
      doc.text(`Email: ${client.email}`, 20, yPos);
      yPos += 6;
    }
    if (client.phone) {
      doc.text(`Téléphone: ${client.phone}`, 20, yPos);
      yPos += 6;
    }
    
    yPos += 15;
    
    // === ADRESSES COMPLÈTES ===
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ADRESSES DE DÉMÉNAGEMENT', 20, yPos);
    
    yPos += 15;
    
    // Adresse de départ
    doc.setFillColor(220, 252, 231);
    doc.rect(15, yPos - 5, 180, 25, 'F');
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(0.3);
    doc.rect(15, yPos - 5, 180, 25);
    
    doc.setTextColor(22, 163, 74);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DÉPART:', 20, yPos + 5);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Construire l'adresse de départ complète
    let departureLines = [];
    if (client.departure_address) {
      departureLines.push(client.departure_address);
    }
    departureLines.push(`${client.departure_postal_code} ${client.departure_city}`);
    if (client.departure_country && client.departure_country !== 'France') {
      departureLines.push(client.departure_country);
    }
    
    departureLines.forEach((line, index) => {
      doc.text(line, 20, yPos + 12 + (index * 5));
    });
    
    yPos += 35;
    
    // Adresse d'arrivée
    doc.setFillColor(254, 226, 226);
    doc.rect(15, yPos - 5, 180, 25, 'F');
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(0.3);
    doc.rect(15, yPos - 5, 180, 25);
    
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ARRIVÉE:', 20, yPos + 5);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Construire l'adresse d'arrivée complète
    let arrivalLines = [];
    if (client.arrival_address) {
      arrivalLines.push(client.arrival_address);
    }
    arrivalLines.push(`${client.arrival_postal_code} ${client.arrival_city}`);
    if (client.arrival_country && client.arrival_country !== 'France') {
      arrivalLines.push(client.arrival_country);
    }
    
    arrivalLines.forEach((line, index) => {
      doc.text(line, 20, yPos + 12 + (index * 5));
    });
    
    yPos += 40;
    
    // === DÉTAILS DU DÉMÉNAGEMENT ===
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DÉTAILS DU DÉMÉNAGEMENT', 20, yPos);
    
    yPos += 15;
    
    // Tableau des détails
    const details = [
      ['Date souhaitée:', new Date(client.desired_date).toLocaleDateString('fr-FR')],
      ['Volume estimé:', client.estimated_volume ? `${client.estimated_volume} m³` : 'Non spécifié']
    ];
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    details.forEach((detail, index) => {
      const rowY = yPos + (index * 8);
      
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(20, rowY - 3, 170, 8, 'F');
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text(detail[0], 25, rowY + 2);
      doc.setFont('helvetica', 'normal');
      doc.text(detail[1], 80, rowY + 2);
    });
    
    yPos += 30;
    
    // === MONTANT TOTAL ===
    doc.setFillColor(34, 197, 94);
    doc.rect(15, yPos, 180, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('MONTANT TOTAL TTC', 25, yPos + 12);
    
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(`${client.quote_amount.toFixed(2)} €`, 25, yPos + 24);
    
    yPos += 45;
    
    // === COORDONNÉES BANCAIRES ===
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('COORDONNÉES BANCAIRES', 20, yPos);
    
    yPos += 15;
    
    // Encadré pour les coordonnées bancaires
    doc.setFillColor(248, 250, 252);
    doc.rect(15, yPos - 5, 180, 35, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(15, yPos - 5, 180, 35);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    if (supplier?.bank_details) {
      const bankData = [
        ['Titulaire:', supplier.bank_details.account_holder],
        ['IBAN:', supplier.bank_details.iban],
        ['BIC:', supplier.bank_details.bic],
        ['Banque:', supplier.bank_details.bank_name]
      ];
      
      bankData.forEach((row, index) => {
        const rowY = yPos + (index * 6);
        doc.setFont('helvetica', 'bold');
        doc.text(row[0], 20, rowY);
        doc.setFont('helvetica', 'normal');
        doc.text(row[1], 60, rowY);
      });
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text('RIB: (non renseigné)', 20, yPos + 5);
      doc.text('Les coordonnées bancaires seront communiquées', 20, yPos + 12);
      doc.text('lors de la confirmation du devis.', 20, yPos + 18);
    }
    
    yPos += 50;
    
    // === VALIDITÉ ===
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('• Devis valable 30 jours à compter de la date d\'émission', 20, yPos);
    doc.text('• Paiement par virement bancaire uniquement', 20, yPos + 6);
    doc.text('• Confirmation écrite requise pour validation du devis', 20, yPos + 12);
    
    // === PIED DE PAGE ===
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${supplierInfo.company_name} - Devis généré le ${new Date().toLocaleDateString('fr-FR')}`, 20, 285);
    
    // Télécharger
    const fileName = `devis_${supplierInfo.company_name.replace(/\s+/g, '_')}_${client.name?.replace(/\s+/g, '_') || 'client'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    console.log('✅ PDF généré avec adresses exactes:', fileName);
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
