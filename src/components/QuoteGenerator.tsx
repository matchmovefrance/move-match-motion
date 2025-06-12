
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
    console.log('🎯 Génération PDF - Design propre et simple');
    
    if (!client.quote_amount || !client.name) {
      console.error('❌ Données essentielles manquantes');
      return;
    }

    const supplierInfo = supplier || {
      company_name: "Prestataire de déménagement",
      contact_name: "Service Commercial",
      email: "contact@prestataire.fr",
      phone: "01 23 45 67 89"
    };

    const doc = new jsPDF();
    let yPos = 20;
    
    // === EN-TÊTE SIMPLE ===
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('DEVIS DE DÉMÉNAGEMENT', 20, yPos);
    
    yPos += 15;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Devis n° ${Date.now().toString().slice(-6)}`, 20, yPos);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 120, yPos);
    
    yPos += 25;
    
    // Ligne de séparation
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    
    yPos += 20;
    
    // === PRESTATAIRE ===
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESTATAIRE', 20, yPos);
    
    yPos += 15;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(supplierInfo.company_name, 20, yPos);
    
    yPos += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    
    doc.text(`Contact: ${supplierInfo.contact_name}`, 20, yPos);
    yPos += 7;
    doc.text(`Email: ${supplierInfo.email}`, 20, yPos);
    yPos += 7;
    doc.text(`Téléphone: ${supplierInfo.phone}`, 20, yPos);
    
    yPos += 25;
    
    // === CLIENT ===
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENT', 20, yPos);
    
    yPos += 15;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(client.name, 20, yPos);
    
    yPos += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    
    if (client.email) {
      doc.text(`Email: ${client.email}`, 20, yPos);
      yPos += 7;
    }
    if (client.phone) {
      doc.text(`Téléphone: ${client.phone}`, 20, yPos);
      yPos += 7;
    }
    
    yPos += 20;
    
    // === DÉTAILS DÉMÉNAGEMENT ===
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DÉTAILS DU DÉMÉNAGEMENT', 20, yPos);
    
    yPos += 15;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    
    // Départ
    doc.setFont('helvetica', 'bold');
    doc.text('Départ:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    const departureText = `${client.departure_postal_code} ${client.departure_city}`;
    doc.text(departureText, 60, yPos);
    
    yPos += 10;
    
    // Arrivée
    doc.setFont('helvetica', 'bold');
    doc.text('Arrivée:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    const arrivalText = `${client.arrival_postal_code} ${client.arrival_city}`;
    doc.text(arrivalText, 60, yPos);
    
    yPos += 10;
    
    // Date
    doc.setFont('helvetica', 'bold');
    doc.text('Date souhaitée:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(client.desired_date).toLocaleDateString('fr-FR'), 80, yPos);
    
    yPos += 10;
    
    // Volume
    if (client.estimated_volume) {
      doc.setFont('helvetica', 'bold');
      doc.text('Volume estimé:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`${client.estimated_volume} m³`, 80, yPos);
      yPos += 10;
    }
    
    yPos += 20;
    
    // === MONTANT ===
    doc.setFillColor(37, 99, 235);
    doc.rect(20, yPos - 5, 170, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('MONTANT TOTAL TTC', 25, yPos + 8);
    
    doc.setFontSize(24);
    doc.text(`${client.quote_amount.toFixed(2)} €`, 25, yPos + 20);
    
    yPos += 45;
    
    // === COORDONNÉES BANCAIRES ===
    if (supplier?.bank_details) {
      yPos += 10;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('COORDONNÉES BANCAIRES', 20, yPos);
      
      yPos += 15;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Titulaire:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(supplier.bank_details.account_holder, 70, yPos);
      
      yPos += 10;
      
      doc.setFont('helvetica', 'bold');
      doc.text('IBAN:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(supplier.bank_details.iban, 70, yPos);
      
      yPos += 10;
      
      doc.setFont('helvetica', 'bold');
      doc.text('BIC:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(supplier.bank_details.bic, 70, yPos);
      
      yPos += 10;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Banque:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(supplier.bank_details.bank_name, 70, yPos);
      
      yPos += 20;
    }
    
    // === INSTRUCTIONS DE PAIEMENT ===
    if (yPos < 250) {
      yPos += 10;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('INSTRUCTIONS DE PAIEMENT', 20, yPos);
      
      yPos += 12;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      
      doc.text('• Devis valable 30 jours à compter de la date d\'émission', 20, yPos);
      yPos += 7;
      doc.text('• Paiement par virement bancaire uniquement', 20, yPos);
      yPos += 7;
      doc.text('• Confirmation écrite requise pour validation du devis', 20, yPos);
      yPos += 7;
      doc.text('• Merci d\'indiquer le numéro de devis lors du paiement', 20, yPos);
    }
    
    // === PIED DE PAGE ===
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text(`${supplierInfo.company_name} - ${supplierInfo.email} - ${supplierInfo.phone}`, 20, 285);
    doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')}`, 20, 290);
    
    // Télécharger
    const fileName = `devis_${client.name?.replace(/\s+/g, '_') || 'client'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    console.log('✅ PDF généré avec succès:', fileName);
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
