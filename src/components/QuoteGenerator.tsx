
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
}

const QuoteGenerator = ({ client }: QuoteGeneratorProps) => {
  const generatePDF = async () => {
    // Récupérer les paramètres de l'entreprise depuis la base de données
    const { data: companySettings } = await supabase
      .from('company_settings' as any)
      .select('*')
      .single();

    const settings = companySettings || {
      company_name: 'MatchMove',
      company_email: 'contact@matchmove.fr',
      company_phone: '+33 1 23 45 67 89',
      company_address: 'France'
    };

    const doc = new jsPDF();
    
    // Couleurs vertes
    const primaryColor = '#22c55e'; // vert
    const secondaryColor = '#64748b'; // gris
    
    // En-tête avec fond vert
    doc.setFillColor(34, 197, 94); // vert
    doc.rect(0, 0, 210, 40, 'F');
    
    // Titre de l'entreprise
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.company_name, 20, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Solutions de déménagement', 20, 32);
    
    // Titre du document
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('DEVIS DE DÉMÉNAGEMENT', 20, 60);
    
    // Informations de la société (mise à jour avec les paramètres)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(settings.company_name, 140, 60);
    doc.text(`Email: ${settings.company_email}`, 140, 67);
    doc.text(`Téléphone: ${settings.company_phone}`, 140, 74);
    if (settings.company_address) {
      doc.text(`Adresse: ${settings.company_address}`, 140, 81);
    }
    
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
    
    // Détails du déménagement
    yPos += 10;
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
    
    // Prix
    if (client.quote_amount) {
      yPos += 20;
      
      // Encadré pour le prix avec fond vert clair
      doc.setFillColor(240, 253, 244);
      doc.rect(20, yPos - 5, 170, 25, 'F');
      doc.setDrawColor(34, 197, 94);
      doc.rect(20, yPos - 5, 170, 25);
      
      doc.setTextColor(34, 197, 94);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('MONTANT DU DEVIS', 25, yPos + 5);
      
      doc.setFontSize(20);
      doc.text(`${client.quote_amount.toFixed(2).replace('.', ',')} €`, 25, yPos + 15);
    }
    
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
    doc.text(`${settings.company_name} - Solutions de déménagement professionnelles`, 20, 285);
    
    // Télécharger le PDF
    const fileName = `devis_${client.name?.replace(/\s+/g, '_') || 'client'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
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
