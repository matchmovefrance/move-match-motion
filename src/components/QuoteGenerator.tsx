
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
    if (!client.quote_amount || !supplier) {
      console.error('Données manquantes pour la génération du PDF');
      return;
    }

    console.log('🎯 Génération PDF personnalisé instantané...');
    
    const doc = new jsPDF();
    
    // Couleurs du prestataire
    const primaryColor = '#1f2937';
    const accentColor = '#3b82f6';
    
    // En-tête avec informations du prestataire
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, 210, 50, 'F');
    
    // Logo/Nom du prestataire
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(supplier.company_name, 20, 30);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('DEVIS DE DÉMÉNAGEMENT', 20, 42);
    
    // Informations du prestataire dans l'en-tête
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(`Contact: ${supplier.contact_name}`, 130, 25);
    doc.text(`Email: ${supplier.email}`, 130, 32);
    doc.text(`Téléphone: ${supplier.phone}`, 130, 39);
    
    // Numéro de devis et date
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Devis N° ${Date.now().toString().slice(-6)}`, 20, 65);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 20, 72);
    
    // Ligne de séparation
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(1);
    doc.line(20, 80, 190, 80);
    
    // Informations client
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENT', 20, 95);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    let yPos = 105;
    
    if (client.name) {
      doc.setFont('helvetica', 'bold');
      doc.text(`${client.name}`, 20, yPos);
      doc.setFont('helvetica', 'normal');
      yPos += 7;
    }
    
    if (client.email) {
      doc.text(`Email: ${client.email}`, 20, yPos);
      yPos += 7;
    }
    
    if (client.phone) {
      doc.text(`Téléphone: ${client.phone}`, 20, yPos);
      yPos += 7;
    }
    
    // Détails du déménagement
    yPos += 10;
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DÉTAILS DU DÉMÉNAGEMENT', 20, yPos);
    
    yPos += 15;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    // Encadré pour les adresses
    doc.setFillColor(248, 250, 252);
    doc.rect(20, yPos - 5, 170, 50, 'F');
    doc.setDrawColor(59, 130, 246);
    doc.rect(20, yPos - 5, 170, 50);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Adresse de départ:', 25, yPos + 5);
    doc.setFont('helvetica', 'normal');
    const departureAddr = `${client.departure_address || ''} ${client.departure_postal_code} ${client.departure_city}`.trim();
    doc.text(departureAddr, 25, yPos + 12);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Adresse d\'arrivée:', 25, yPos + 25);
    doc.setFont('helvetica', 'normal');
    const arrivalAddr = `${client.arrival_address || ''} ${client.arrival_postal_code} ${client.arrival_city}`.trim();
    doc.text(arrivalAddr, 25, yPos + 32);
    
    yPos += 60;
    
    // Informations supplémentaires
    doc.text(`Date souhaitée: ${new Date(client.desired_date).toLocaleDateString('fr-FR')}`, 20, yPos);
    yPos += 7;
    
    if (client.estimated_volume) {
      doc.text(`Volume estimé: ${client.estimated_volume} m³`, 20, yPos);
      yPos += 7;
    }
    
    // Détail des prix
    yPos += 15;
    
    if (supplierPrice && matchMoveMargin !== undefined) {
      // Encadré pour le détail des prix
      doc.setFillColor(248, 250, 252);
      doc.rect(20, yPos - 5, 170, 50, 'F');
      doc.setDrawColor(59, 130, 246);
      doc.rect(20, yPos - 5, 170, 50);
      
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DÉTAIL DU PRIX', 25, yPos + 8);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Prix de base: ${supplierPrice.toFixed(2).replace('.', ',')} €`, 25, yPos + 18);
      
      const marginAmount = (supplierPrice * matchMoveMargin) / 100;
      doc.text(`Marge de service (${matchMoveMargin}%): ${marginAmount.toFixed(2).replace('.', ',')} €`, 25, yPos + 25);
      
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL: ${client.quote_amount.toFixed(2).replace('.', ',')} € TTC`, 25, yPos + 35);
      
      yPos += 55;
    } else {
      yPos += 10;
    }
    
    // Prix total en évidence
    doc.setFillColor(31, 41, 55);
    doc.rect(20, yPos, 170, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('MONTANT TOTAL TTC', 25, yPos + 12);
    
    doc.setFontSize(24);
    doc.text(`${client.quote_amount.toFixed(2).replace('.', ',')} €`, 25, yPos + 24);
    
    yPos += 40;
    
    // Coordonnées bancaires du prestataire
    if (supplier.bank_details) {
      yPos += 10;
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('COORDONNÉES BANCAIRES', 20, yPos);
      
      yPos += 10;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      doc.text(`Titulaire: ${supplier.bank_details.account_holder}`, 20, yPos);
      yPos += 5;
      doc.text(`IBAN: ${supplier.bank_details.iban}`, 20, yPos);
      yPos += 5;
      doc.text(`BIC: ${supplier.bank_details.bic}`, 20, yPos);
      yPos += 5;
      doc.text(`Banque: ${supplier.bank_details.bank_name}`, 20, yPos);
      yPos += 10;
    }
    
    // Conditions
    if (yPos < 250) {
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Conditions:', 20, yPos);
      yPos += 5;
      doc.text('• Ce devis est valable 30 jours à compter de sa date d\'émission', 20, yPos);
      yPos += 4;
      doc.text('• Les prix sont exprimés en euros TTC', 20, yPos);
      yPos += 4;
      doc.text('• Une confirmation écrite est requise pour valider la prestation', 20, yPos);
      yPos += 4;
      doc.text('• Paiement par virement bancaire aux coordonnées ci-dessus', 20, yPos);
    }
    
    // Pied de page
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text(`${supplier.company_name} - ${supplier.email} - ${supplier.phone}`, 20, 285);
    doc.text(`Devis généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 20, 290);
    
    // Télécharger le PDF instantanément
    const fileName = `devis_${client.name?.replace(/\s+/g, '_') || 'client'}_${supplier.company_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    console.log('✅ PDF personnalisé généré et téléchargé:', fileName);
  };

  return (
    <Button
      onClick={generatePDF}
      variant="outline"
      size="sm"
      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
      disabled={!client.quote_amount || !supplier}
      title={!client.quote_amount ? "Aucun montant de devis renseigné" : !supplier ? "Informations prestataire manquantes" : "Télécharger le devis personnalisé en PDF"}
    >
      <FileDown className="h-4 w-4" />
    </Button>
  );
};

export default QuoteGenerator;
