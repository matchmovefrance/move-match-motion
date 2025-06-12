
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
    console.log('🎯 Génération PDF - Design optimisé une page A4');
    
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
    const margin = 15;
    let yPos = 20;
    
    // === EN-TÊTE SIMPLE ===
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('DEVIS DE DÉMÉNAGEMENT', margin, yPos);
    
    // Numéro et date
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const quoteNumber = `DEV-${Date.now().toString().slice(-6)}`;
    doc.text(`N° ${quoteNumber}`, margin, yPos + 6);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 50, yPos + 6);
    
    // Ligne de séparation
    doc.setLineWidth(0.3);
    doc.line(margin, yPos + 10, pageWidth - margin, yPos + 10);
    
    yPos += 18;
    
    // === INFORMATIONS ENTREPRISE ===
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ENTREPRISE', margin, yPos);
    
    yPos += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(supplierInfo.company_name, margin, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    yPos += 4;
    doc.text(`Contact: ${supplierInfo.contact_name}`, margin, yPos);
    yPos += 3;
    doc.text(`Email: ${supplierInfo.email}`, margin, yPos);
    yPos += 3;
    doc.text(`Téléphone: ${supplierInfo.phone}`, margin, yPos);
    
    yPos += 12;
    
    // === INFORMATIONS CLIENT ===
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENT', margin, yPos);
    
    yPos += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(client.name, margin, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    yPos += 4;
    if (client.email) {
      doc.text(`Email: ${client.email}`, margin, yPos);
      yPos += 3;
    }
    if (client.phone) {
      doc.text(`Téléphone: ${client.phone}`, margin, yPos);
      yPos += 3;
    }
    
    yPos += 8;
    
    // === ADRESSES DE DÉMÉNAGEMENT ===
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ADRESSES DE DÉMÉNAGEMENT', margin, yPos);
    
    yPos += 8;
    
    // ADRESSE DE DÉPART
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ADRESSE DE DÉPART', margin, yPos);
    
    yPos += 4;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Construire l'adresse de départ complète depuis la DB
    if (client.departure_address) {
      doc.text(client.departure_address, margin, yPos);
      yPos += 3;
    }
    doc.text(`${client.departure_postal_code} ${client.departure_city}`, margin, yPos);
    yPos += 3;
    if (client.departure_country && client.departure_country !== 'France') {
      doc.text(client.departure_country, margin, yPos);
      yPos += 3;
    }
    
    yPos += 5;
    
    // ADRESSE D'ARRIVÉE
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ADRESSE D\'ARRIVÉE', margin, yPos);
    
    yPos += 4;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Construire l'adresse d'arrivée complète depuis la DB
    if (client.arrival_address) {
      doc.text(client.arrival_address, margin, yPos);
      yPos += 3;
    }
    doc.text(`${client.arrival_postal_code} ${client.arrival_city}`, margin, yPos);
    yPos += 3;
    if (client.arrival_country && client.arrival_country !== 'France') {
      doc.text(client.arrival_country, margin, yPos);
      yPos += 3;
    }
    
    yPos += 10;
    
    // === DÉTAILS DU DÉMÉNAGEMENT ===
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DÉTAILS DU DÉMÉNAGEMENT', margin, yPos);
    
    yPos += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    doc.setFont('helvetica', 'bold');
    doc.text('Date souhaitée:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(client.desired_date).toLocaleDateString('fr-FR'), margin + 35, yPos);
    
    yPos += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('Volume estimé:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(client.estimated_volume ? `${client.estimated_volume} m³` : 'Non spécifié', margin + 35, yPos);
    
    yPos += 12;
    
    // === MONTANT TOTAL ===
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('MONTANT TOTAL TTC', margin, yPos);
    
    yPos += 6;
    doc.setFontSize(16);
    doc.text(`${client.quote_amount.toFixed(2)} €`, margin, yPos);
    
    yPos += 15;
    
    // === COORDONNÉES BANCAIRES ===
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('COORDONNÉES BANCAIRES', margin, yPos);
    
    yPos += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    if (supplier?.bank_details) {
      doc.setFont('helvetica', 'bold');
      doc.text('Titulaire:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(supplier.bank_details.account_holder, margin + 25, yPos);
      
      yPos += 3;
      doc.setFont('helvetica', 'bold');
      doc.text('IBAN:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(supplier.bank_details.iban, margin + 18, yPos);
      
      yPos += 3;
      doc.setFont('helvetica', 'bold');
      doc.text('BIC:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(supplier.bank_details.bic, margin + 15, yPos);
      
      yPos += 3;
      doc.setFont('helvetica', 'bold');
      doc.text('Banque:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(supplier.bank_details.bank_name, margin + 22, yPos);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.text('RIB: Non renseigné', margin, yPos);
      yPos += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Les coordonnées bancaires seront communiquées lors de la confirmation.', margin, yPos);
    }
    
    yPos += 12;
    
    // === CONDITIONS ===
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('• Devis valable 30 jours à compter de la date d\'émission', margin, yPos);
    yPos += 3;
    doc.text('• Paiement par virement bancaire uniquement', margin, yPos);
    yPos += 3;
    doc.text('• Confirmation écrite requise pour validation du devis', margin, yPos);
    
    // === PIED DE PAGE ===
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text(`${supplierInfo.company_name} - Devis généré le ${new Date().toLocaleDateString('fr-FR')}`, margin, 285);
    
    // Télécharger
    const fileName = `devis_${supplierInfo.company_name.replace(/\s+/g, '_')}_${client.name?.replace(/\s+/g, '_') || 'client'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    console.log('✅ PDF généré optimisé une page avec adresses complètes:', fileName);
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
