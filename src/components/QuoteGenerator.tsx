
import jsPDF from 'jspdf';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

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
  const [fullClientData, setFullClientData] = useState<any>(null);

  useEffect(() => {
    loadFullClientData();
  }, [client.id]);

  const loadFullClientData = async () => {
    try {
      console.log('🔄 Chargement des données complètes du client ID:', client.id);
      const { data, error } = await supabase
        .from('client_requests')
        .select('*')
        .eq('id', client.id)
        .single();

      if (error) {
        console.error('❌ Erreur chargement client:', error);
        return;
      }

      console.log('✅ Données complètes du client chargées:', {
        id: data.id,
        name: data.name,
        departure_address: data.departure_address,
        departure_city: data.departure_city,
        departure_postal_code: data.departure_postal_code,
        arrival_address: data.arrival_address,
        arrival_city: data.arrival_city,
        arrival_postal_code: data.arrival_postal_code
      });

      setFullClientData(data);
    } catch (error) {
      console.error('❌ Erreur chargement données client:', error);
    }
  };

  const generatePDF = () => {
    console.log('🎯 Génération PDF avec adresses complètes de la base de données');
    
    if (!client.quote_amount || !client.name) {
      console.error('❌ Données essentielles manquantes');
      return;
    }

    const clientData = fullClientData || client;
    console.log('📋 Données client utilisées pour PDF:', {
      departure_address: clientData.departure_address,
      departure_city: clientData.departure_city,
      departure_postal_code: clientData.departure_postal_code,
      arrival_address: clientData.arrival_address,
      arrival_city: clientData.arrival_city,
      arrival_postal_code: clientData.arrival_postal_code
    });

    const supplierInfo = supplier || {
      company_name: "Amini Transport",
      contact_name: "Service Commercial",
      email: "contact@amini-transport.fr",
      phone: "01 23 45 67 89"
    };

    const doc = new jsPDF();
    const pageWidth = 210;
    const margin = 20;
    let yPos = 25;
    
    // === EN-TÊTE ===
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('DEVIS DE DÉMÉNAGEMENT', margin, yPos);
    
    // Numéro et date
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const quoteNumber = `DEV-${Date.now().toString().slice(-6)}`;
    doc.text(`N° ${quoteNumber}`, margin, yPos + 8);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 60, yPos + 8);
    
    yPos += 20;
    
    // === INFORMATIONS ENTREPRISE ===
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ENTREPRISE', margin, yPos);
    
    yPos += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(supplierInfo.company_name, margin, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    yPos += 6;
    doc.text(`Contact: ${supplierInfo.contact_name}`, margin, yPos);
    yPos += 5;
    doc.text(`Email: ${supplierInfo.email}`, margin, yPos);
    yPos += 5;
    doc.text(`Téléphone: ${supplierInfo.phone}`, margin, yPos);
    
    yPos += 15;
    
    // === INFORMATIONS CLIENT ===
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENT', margin, yPos);
    
    yPos += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(client.name, margin, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    yPos += 6;
    if (client.email) {
      doc.text(`Email: ${client.email}`, margin, yPos);
      yPos += 5;
    }
    if (client.phone) {
      doc.text(`Téléphone: ${client.phone}`, margin, yPos);
      yPos += 5;
    }
    
    yPos += 10;
    
    // === ADRESSES DE DÉMÉNAGEMENT ===
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ADRESSES DE DÉMÉNAGEMENT', margin, yPos);
    
    yPos += 10;
    
    // ADRESSE DE DÉPART
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ADRESSE DE DÉPART', margin, yPos);
    
    yPos += 6;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    // Afficher l'adresse complète depuis la DB
    if (clientData.departure_address) {
      doc.text(clientData.departure_address, margin, yPos);
      yPos += 5;
    }
    doc.text(`${clientData.departure_postal_code} ${clientData.departure_city}`, margin, yPos);
    yPos += 5;
    if (clientData.departure_country && clientData.departure_country !== 'France') {
      doc.text(clientData.departure_country, margin, yPos);
      yPos += 5;
    }
    
    yPos += 8;
    
    // ADRESSE D'ARRIVÉE
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ADRESSE D\'ARRIVÉE', margin, yPos);
    
    yPos += 6;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    // Afficher l'adresse complète depuis la DB
    if (clientData.arrival_address) {
      doc.text(clientData.arrival_address, margin, yPos);
      yPos += 5;
    }
    doc.text(`${clientData.arrival_postal_code} ${clientData.arrival_city}`, margin, yPos);
    yPos += 5;
    if (clientData.arrival_country && clientData.arrival_country !== 'France') {
      doc.text(clientData.arrival_country, margin, yPos);
      yPos += 5;
    }
    
    yPos += 12;
    
    // === DÉTAILS DU DÉMÉNAGEMENT ===
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DÉTAILS DU DÉMÉNAGEMENT', margin, yPos);
    
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    doc.setFont('helvetica', 'bold');
    doc.text('Date souhaitée:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(client.desired_date).toLocaleDateString('fr-FR'), margin + 40, yPos);
    
    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Volume estimé:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(client.estimated_volume ? `${client.estimated_volume} m³` : 'Non spécifié', margin + 40, yPos);
    
    yPos += 15;
    
    // === MONTANT TOTAL ===
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('MONTANT TOTAL TTC', margin, yPos);
    
    yPos += 8;
    doc.setFontSize(18);
    doc.text(`${client.quote_amount.toFixed(2)} €`, margin, yPos);
    
    yPos += 18;
    
    // === COORDONNÉES BANCAIRES ===
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('COORDONNÉES BANCAIRES', margin, yPos);
    
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    if (supplier?.bank_details) {
      doc.setFont('helvetica', 'bold');
      doc.text('Titulaire:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(supplier.bank_details.account_holder, margin + 30, yPos);
      
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('IBAN:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(supplier.bank_details.iban, margin + 25, yPos);
      
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('BIC:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(supplier.bank_details.bic, margin + 20, yPos);
      
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Banque:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(supplier.bank_details.bank_name, margin + 28, yPos);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.text('RIB: Non renseigné', margin, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Les coordonnées bancaires seront communiquées lors de la confirmation.', margin, yPos);
    }
    
    yPos += 15;
    
    // === CONDITIONS ===
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('• Devis valable 30 jours à compter de la date d\'émission', margin, yPos);
    yPos += 5;
    doc.text('• Paiement par virement bancaire uniquement', margin, yPos);
    yPos += 5;
    doc.text('• Confirmation écrite requise pour validation du devis', margin, yPos);
    
    // === PIED DE PAGE ===
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`${supplierInfo.company_name} - Devis généré le ${new Date().toLocaleDateString('fr-FR')}`, margin, 285);
    
    // Télécharger
    const fileName = `devis_${supplierInfo.company_name.replace(/\s+/g, '_')}_${client.name?.replace(/\s+/g, '_') || 'client'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    console.log('✅ PDF généré avec adresses complètes de la base de données:', fileName);
    console.log('📋 Adresses utilisées:', {
      departure: clientData.departure_address ? `${clientData.departure_address}, ${clientData.departure_postal_code} ${clientData.departure_city}` : `${clientData.departure_postal_code} ${clientData.departure_city}`,
      arrival: clientData.arrival_address ? `${clientData.arrival_address}, ${clientData.arrival_postal_code} ${clientData.arrival_city}` : `${clientData.arrival_postal_code} ${clientData.arrival_city}`
    });
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
