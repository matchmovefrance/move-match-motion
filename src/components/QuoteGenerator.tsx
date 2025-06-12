
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
    console.log('🎯 Génération PDF - Design professionnel amélioré');
    
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
    // Fond bleu pour l'en-tête
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 50, 'F');
    
    // Titre principal en blanc
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('DEVIS DE DÉMÉNAGEMENT', 20, 25);
    
    // Numéro de devis et date
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const quoteNumber = `DEV-${Date.now().toString().slice(-6)}`;
    doc.text(`N° ${quoteNumber}`, 20, 40);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 120, 40);
    
    yPos = 70;
    
    // === SECTION PRESTATAIRE (Encadré) ===
    doc.setFillColor(248, 250, 252);
    doc.rect(15, yPos - 5, 180, 35, 'F');
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.rect(15, yPos - 5, 180, 35);
    
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESTATAIRE SÉLECTIONNÉ', 20, yPos + 5);
    
    // Nom du prestataire en évidence
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(supplierInfo.company_name, 20, yPos + 15);
    
    // Coordonnées du prestataire
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(`Contact: ${supplierInfo.contact_name} | ${supplierInfo.email} | ${supplierInfo.phone}`, 20, yPos + 25);
    
    yPos += 50;
    
    // === SECTION CLIENT ===
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMATIONS CLIENT', 20, yPos);
    
    yPos += 10;
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
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
    
    // === DÉTAILS DU DÉMÉNAGEMENT ===
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DÉTAILS DU DÉMÉNAGEMENT', 20, yPos);
    
    yPos += 15;
    
    // Tableau des détails
    const tableData = [
      ['Départ', `${client.departure_postal_code} ${client.departure_city}`],
      ['Arrivée', `${client.arrival_postal_code} ${client.arrival_city}`],
      ['Date souhaitée', new Date(client.desired_date).toLocaleDateString('fr-FR')],
      ['Volume estimé', client.estimated_volume ? `${client.estimated_volume} m³` : 'Non spécifié']
    ];
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    tableData.forEach((row, index) => {
      const rowY = yPos + (index * 8);
      
      // Fond alterné pour les lignes
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(20, rowY - 3, 170, 8, 'F');
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text(row[0] + ':', 25, rowY + 2);
      doc.setFont('helvetica', 'normal');
      doc.text(row[1], 80, rowY + 2);
    });
    
    yPos += 50;
    
    // === MONTANT - SECTION SÉPARÉE ET MISE EN VALEUR ===
    doc.setFillColor(34, 197, 94);
    doc.rect(15, yPos, 180, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('MONTANT TOTAL TTC', 25, yPos + 15);
    
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(`${client.quote_amount.toFixed(2)} €`, 25, yPos + 28);
    
    yPos += 55;
    
    // === COORDONNÉES BANCAIRES ===
    if (supplier?.bank_details) {
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('COORDONNÉES BANCAIRES', 20, yPos);
      
      yPos += 15;
      
      // Encadré pour les coordonnées bancaires
      doc.setFillColor(248, 250, 252);
      doc.rect(15, yPos - 5, 180, 40, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.rect(15, yPos - 5, 180, 40);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      
      const bankData = [
        ['Titulaire du compte', supplier.bank_details.account_holder],
        ['IBAN', supplier.bank_details.iban],
        ['BIC', supplier.bank_details.bic],
        ['Banque', supplier.bank_details.bank_name]
      ];
      
      bankData.forEach((row, index) => {
        const rowY = yPos + (index * 8);
        doc.setFont('helvetica', 'bold');
        doc.text(row[0] + ':', 20, rowY);
        doc.setFont('helvetica', 'normal');
        doc.text(row[1], 85, rowY);
      });
      
      yPos += 50;
    }
    
    // === INSTRUCTIONS DE PAIEMENT - SECTION SÉPARÉE ===
    yPos += 10;
    
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CONDITIONS ET INSTRUCTIONS', 20, yPos);
    
    yPos += 10;
    
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const instructions = [
      '• Devis valable 30 jours à compter de la date d\'émission',
      '• Paiement par virement bancaire uniquement',
      '• Confirmation écrite requise pour validation du devis',
      '• Merci d\'indiquer le numéro de devis lors du paiement',
      '• Prix incluant toutes les prestations mentionnées'
    ];
    
    instructions.forEach((instruction, index) => {
      doc.text(instruction, 20, yPos + (index * 6));
    });
    
    // === PIED DE PAGE ===
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${supplierInfo.company_name} - Devis généré le ${new Date().toLocaleDateString('fr-FR')}`, 20, 285);
    
    // Télécharger
    const fileName = `devis_${supplierInfo.company_name.replace(/\s+/g, '_')}_${client.name?.replace(/\s+/g, '_') || 'client'}_${new Date().toISOString().split('T')[0]}.pdf`;
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
