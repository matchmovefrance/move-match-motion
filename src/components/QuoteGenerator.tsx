
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
    console.log('🎯 Génération PDF - Design professionnel');
    console.log('Client:', client);
    console.log('Supplier:', supplier);
    
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
    
    // === EN-TÊTE PROFESSIONNEL ===
    // Fond bleu élégant
    doc.setFillColor(37, 99, 235); // blue-600
    doc.rect(0, 0, 210, 60, 'F');
    
    // Nom du prestataire - grand et élégant
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text(supplierInfo.company_name, 20, 35);
    
    // Sous-titre
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('DEVIS DE DÉMÉNAGEMENT', 20, 50);
    
    // === COORDONNÉES PRESTATAIRE ===
    doc.setFillColor(248, 250, 252); // gray-50
    doc.rect(140, 10, 60, 40, 'F');
    doc.setDrawColor(229, 231, 235); // gray-200
    doc.rect(140, 10, 60, 40);
    
    doc.setTextColor(55, 65, 81); // gray-700
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTACT', 145, 18);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(supplierInfo.contact_name, 145, 25);
    doc.text(supplierInfo.email, 145, 30);
    doc.text(supplierInfo.phone, 145, 35);
    
    // === INFORMATIONS DEVIS ===
    let yPos = 80;
    
    // Numéro et date
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`DEVIS N° ${Date.now().toString().slice(-6)}`, 20, yPos);
    
    doc.setTextColor(107, 114, 128); // gray-500
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date d'émission: ${new Date().toLocaleDateString('fr-FR')}`, 20, yPos + 8);
    
    // Ligne de séparation élégante
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(20, yPos + 15, 190, yPos + 15);
    
    yPos += 30;
    
    // === CLIENT ===
    doc.setTextColor(17, 24, 39); // gray-900
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENT', 20, yPos);
    
    yPos += 15;
    
    // Encadré client
    doc.setFillColor(249, 250, 251); // gray-50
    doc.rect(20, yPos - 5, 170, 35, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.rect(20, yPos - 5, 170, 35);
    
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(client.name, 25, yPos + 5);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    if (client.email) {
      doc.text(`Email: ${client.email}`, 25, yPos + 15);
    }
    if (client.phone) {
      doc.text(`Téléphone: ${client.phone}`, 25, yPos + 22);
    }
    
    yPos += 50;
    
    // === DÉTAILS DÉMÉNAGEMENT ===
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DÉTAILS DU DÉMÉNAGEMENT', 20, yPos);
    
    yPos += 15;
    
    // Encadré déménagement
    doc.setFillColor(239, 246, 255); // blue-50
    doc.rect(20, yPos - 5, 170, 50, 'F');
    doc.setDrawColor(37, 99, 235);
    doc.rect(20, yPos - 5, 170, 50);
    
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    
    // Départ
    doc.text('DÉPART:', 25, yPos + 8);
    doc.setFont('helvetica', 'normal');
    const departureAddr = `${client.departure_address || ''} ${client.departure_postal_code} ${client.departure_city}`.trim();
    doc.text(departureAddr, 25, yPos + 16);
    
    // Arrivée
    doc.setFont('helvetica', 'bold');
    doc.text('ARRIVÉE:', 25, yPos + 28);
    doc.setFont('helvetica', 'normal');
    const arrivalAddr = `${client.arrival_address || ''} ${client.arrival_postal_code} ${client.arrival_city}`.trim();
    doc.text(arrivalAddr, 25, yPos + 36);
    
    yPos += 65;
    
    // Date et volume
    doc.setFontSize(11);
    doc.text(`📅 Date souhaitée: ${new Date(client.desired_date).toLocaleDateString('fr-FR')}`, 20, yPos);
    if (client.estimated_volume) {
      doc.text(`📦 Volume estimé: ${client.estimated_volume} m³`, 20, yPos + 8);
    }
    
    yPos += 25;
    
    // === MONTANT TOTAL ===
    // Grand encadré pour le prix
    doc.setFillColor(37, 99, 235);
    doc.rect(20, yPos, 170, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('MONTANT TOTAL TTC', 25, yPos + 15);
    
    doc.setFontSize(28);
    doc.text(`${client.quote_amount.toFixed(2).replace('.', ',')} €`, 25, yPos + 28);
    
    yPos += 50;
    
    // === COORDONNÉES BANCAIRES ===
    if (supplier?.bank_details) {
      yPos += 10;
      
      // Titre RIB
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('COORDONNÉES BANCAIRES', 20, yPos);
      
      yPos += 15;
      
      // Encadré RIB
      doc.setFillColor(254, 249, 195); // yellow-50
      doc.rect(20, yPos - 5, 170, 40, 'F');
      doc.setDrawColor(245, 158, 11); // amber-500
      doc.rect(20, yPos - 5, 170, 40);
      
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      
      doc.text('Titulaire du compte:', 25, yPos + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(supplier.bank_details.account_holder, 70, yPos + 5);
      
      doc.setFont('helvetica', 'bold');
      doc.text('IBAN:', 25, yPos + 13);
      doc.setFont('helvetica', 'normal');
      doc.text(supplier.bank_details.iban, 45, yPos + 13);
      
      doc.setFont('helvetica', 'bold');
      doc.text('BIC:', 25, yPos + 21);
      doc.setFont('helvetica', 'normal');
      doc.text(supplier.bank_details.bic, 40, yPos + 21);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Banque:', 25, yPos + 29);
      doc.setFont('helvetica', 'normal');
      doc.text(supplier.bank_details.bank_name, 50, yPos + 29);
      
      yPos += 50;
    }
    
    // === CONDITIONS ===
    if (yPos < 250) {
      yPos += 10;
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('CONDITIONS:', 20, yPos);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      yPos += 8;
      doc.text('• Devis valable 30 jours', 20, yPos);
      yPos += 5;
      doc.text('• Prix TTC - Paiement par virement bancaire', 20, yPos);
      yPos += 5;
      doc.text('• Confirmation écrite requise pour validation', 20, yPos);
    }
    
    // === PIED DE PAGE ===
    doc.setTextColor(156, 163, 175); // gray-400
    doc.setFontSize(8);
    doc.text(`${supplierInfo.company_name} • ${supplierInfo.email} • ${supplierInfo.phone}`, 20, 285);
    doc.text(`Devis généré le ${new Date().toLocaleDateString('fr-FR')} par MatchMove`, 20, 290);
    
    // Télécharger
    const fileName = `devis_${client.name?.replace(/\s+/g, '_') || 'client'}_${supplierInfo.company_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    console.log('✅ PDF professionnel généré:', fileName);
  };

  const hasRequiredClientData = !!(client.quote_amount && client.name);
  const isDisabled = !hasRequiredClientData;
  
  const getTooltipMessage = () => {
    if (!client.quote_amount) return "Aucun montant de devis renseigné";
    if (!client.name) return "Nom du client manquant";
    return "Télécharger le devis en PDF";
  };

  return (
    <Button
      onClick={generatePDF}
      variant="outline"
      size="sm"
      className={`
        transition-all duration-200 
        ${isDisabled 
          ? 'text-gray-400 border-gray-200 cursor-not-allowed opacity-50' 
          : 'text-blue-600 border-blue-200 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-300 active:bg-blue-100'
        }
      `}
      disabled={isDisabled}
      title={getTooltipMessage()}
    >
      <FileDown className="h-4 w-4" />
    </Button>
  );
};

export default QuoteGenerator;
