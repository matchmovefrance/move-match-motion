
import jsPDF from 'jspdf';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

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

interface CompanySettingsData {
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
}

const QuoteGenerator = ({ client, supplier, supplierPrice, matchMoveMargin }: QuoteGeneratorProps) => {
  const generatePDF = () => {
    if (!client.quote_amount) {
      console.error('Aucun montant de devis disponible');
      return;
    }

    console.log('🎯 Génération PDF instantanée...');
    
    const doc = new jsPDF();
    
    // Couleurs vertes
    const primaryColor = '#22c55e';
    
    // En-tête avec fond vert
    doc.setFillColor(34, 197, 94);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Titre de l'entreprise
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('MatchMove', 20, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Solutions de déménagement', 20, 32);
    
    // Titre du document
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('DEVIS DE DÉMÉNAGEMENT', 20, 60);
    
    // Informations de la société
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('MatchMove', 140, 60);
    doc.text('Email: contact@matchmove.fr', 140, 67);
    doc.text('Téléphone: +33 1 23 45 67 89', 140, 74);
    doc.text('Adresse: France', 140, 81);
    
    // Ligne de séparation
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 90, 190, 90);
    
    // Informations client
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMATIONS CLIENT', 20, 105);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    let yPos = 115;
    
    if (client.name) {
      doc.text(`Nom: ${client.name}`, 20, yPos);
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
    
    // Informations prestataire (si disponible)
    if (supplier) {
      yPos += 10;
      doc.setTextColor(34, 197, 94);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PRESTATAIRE SÉLECTIONNÉ', 20, yPos);
      
      yPos += 10;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      doc.text(`Entreprise: ${supplier.company_name}`, 20, yPos);
      yPos += 7;
      doc.text(`Contact: ${supplier.contact_name}`, 20, yPos);
      yPos += 7;
      doc.text(`Email: ${supplier.email}`, 20, yPos);
      yPos += 7;
      doc.text(`Téléphone: ${supplier.phone}`, 20, yPos);
      yPos += 7;
      
      // Coordonnées bancaires (si disponibles)
      if (supplier.bank_details) {
        yPos += 5;
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(9);
        doc.text(`IBAN: ${supplier.bank_details.iban}`, 20, yPos);
        yPos += 4;
        doc.text(`BIC: ${supplier.bank_details.bic}`, 20, yPos);
        yPos += 4;
        doc.text(`Banque: ${supplier.bank_details.bank_name}`, 20, yPos);
        yPos += 4;
        doc.text(`Titulaire: ${supplier.bank_details.account_holder}`, 20, yPos);
      }
    }
    
    // Détails du déménagement
    yPos += 15;
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DÉTAILS DU DÉMÉNAGEMENT', 20, yPos);
    
    yPos += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    // Adresses
    doc.text('Adresse de départ:', 20, yPos);
    yPos += 7;
    const departureAddr = `${client.departure_address || ''} ${client.departure_postal_code} ${client.departure_city}`.trim();
    doc.text(departureAddr, 25, yPos);
    
    yPos += 10;
    doc.text('Adresse d\'arrivée:', 20, yPos);
    yPos += 7;
    const arrivalAddr = `${client.arrival_address || ''} ${client.arrival_postal_code} ${client.arrival_city}`.trim();
    doc.text(arrivalAddr, 25, yPos);
    
    yPos += 10;
    doc.text(`Date souhaitée: ${new Date(client.desired_date).toLocaleDateString('fr-FR')}`, 20, yPos);
    
    if (client.estimated_volume) {
      yPos += 7;
      doc.text(`Volume estimé: ${client.estimated_volume} m³`, 20, yPos);
    }
    
    // Détail des prix (si disponible)
    if (supplierPrice && matchMoveMargin !== undefined) {
      yPos += 20;
      
      // Encadré pour le détail des prix
      doc.setFillColor(248, 250, 252);
      doc.rect(20, yPos - 5, 170, 35, 'F');
      doc.setDrawColor(34, 197, 94);
      doc.rect(20, yPos - 5, 170, 35);
      
      doc.setTextColor(34, 197, 94);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DÉTAIL DU PRIX', 25, yPos + 5);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Prix prestataire: ${supplierPrice.toFixed(2).replace('.', ',')} €`, 25, yPos + 15);
      
      const marginAmount = (supplierPrice * matchMoveMargin) / 100;
      doc.text(`Marge MatchMove (${matchMoveMargin}%): ${marginAmount.toFixed(2).replace('.', ',')} €`, 25, yPos + 22);
      
      yPos += 35;
    }
    
    // Prix total
    yPos += 10;
    
    // Encadré pour le prix total avec fond vert clair
    doc.setFillColor(240, 253, 244);
    doc.rect(20, yPos - 5, 170, 25, 'F');
    doc.setDrawColor(34, 197, 94);
    doc.rect(20, yPos - 5, 170, 25);
    
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('MONTANT TOTAL TTC', 25, yPos + 5);
    
    doc.setFontSize(20);
    doc.text(`${client.quote_amount.toFixed(2).replace('.', ',')} €`, 25, yPos + 15);
    
    // Conditions
    yPos += 40;
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Conditions générales:', 20, yPos);
    yPos += 5;
    doc.text('• Ce devis est valable 30 jours à compter de sa date d\'émission', 20, yPos);
    yPos += 4;
    doc.text('• Les prix sont exprimés en euros TTC', 20, yPos);
    yPos += 4;
    doc.text('• Une confirmation écrite est requise pour valider la prestation', 20, yPos);
    
    // Pied de page
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text(`Devis généré le ${new Date().toLocaleDateString('fr-FR')}`, 20, 280);
    doc.text('MatchMove - Solutions de déménagement professionnelles', 20, 285);
    
    // Télécharger le PDF instantanément
    const fileName = `devis_${client.name?.replace(/\s+/g, '_') || 'client'}_${supplier?.company_name?.replace(/\s+/g, '_') || 'prestataire'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    console.log('✅ PDF généré et téléchargé:', fileName);
  };

  return (
    <Button
      onClick={generatePDF}
      variant="outline"
      size="sm"
      className="text-green-600 hover:text-green-700"
      disabled={!client.quote_amount}
      title={!client.quote_amount ? "Aucun montant de devis renseigné" : "Télécharger le devis en PDF"}
    >
      <FileDown className="h-4 w-4" />
    </Button>
  );
};

export default QuoteGenerator;
