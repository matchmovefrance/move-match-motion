
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";
import jsPDF from "https://esm.sh/jspdf@2.5.1";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface QuoteEmailRequest {
  clientName: string;
  clientEmail: string;
  quoteAmount: number;
  desiredDate: string;
  pdfBase64: string;
  clientPhone?: string;
  departureAddress?: string;
  departurePostalCode?: string;
  departureCity?: string;
  arrivalAddress?: string;
  arrivalPostalCode?: string;
  arrivalCity?: string;
  estimatedVolume?: number;
}

const generatePDFBase64 = async (emailData: QuoteEmailRequest, companySettings: any): Promise<string> => {
  const doc = new jsPDF();
  
  // En-tête avec fond vert
  doc.setFillColor(34, 197, 94);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Titre de l'entreprise
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(companySettings.company_name, 20, 25);
  
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
  doc.text(companySettings.company_name, 140, 60);
  doc.text(`Email: ${companySettings.company_email}`, 140, 67);
  doc.text(`Téléphone: ${companySettings.company_phone}`, 140, 74);
  if (companySettings.company_address) {
    doc.text(`Adresse: ${companySettings.company_address}`, 140, 81);
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
  
  if (emailData.clientName) {
    doc.text(`Nom: ${emailData.clientName}`, 20, yPos);
    yPos += 7;
  }
  
  if (emailData.clientEmail) {
    doc.text(`Email: ${emailData.clientEmail}`, 20, yPos);
    yPos += 7;
  }
  
  if (emailData.clientPhone) {
    doc.text(`Téléphone: ${emailData.clientPhone}`, 20, yPos);
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
  const departureAddr = `${emailData.departureAddress || ''} ${emailData.departurePostalCode || ''} ${emailData.departureCity || ''}`.trim();
  doc.text(departureAddr, 25, yPos);
  
  yPos += 10;
  doc.text('Adresse d\'arrivée:', 20, yPos);
  yPos += 7;
  const arrivalAddr = `${emailData.arrivalAddress || ''} ${emailData.arrivalPostalCode || ''} ${emailData.arrivalCity || ''}`.trim();
  doc.text(arrivalAddr, 25, yPos);
  
  yPos += 10;
  doc.text(`Date souhaitée: ${new Date(emailData.desiredDate).toLocaleDateString('fr-FR')}`, 20, yPos);
  
  if (emailData.estimatedVolume) {
    yPos += 7;
    doc.text(`Volume estimé: ${emailData.estimatedVolume} m³`, 20, yPos);
  }
  
  // Prix
  if (emailData.quoteAmount) {
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
    doc.text(`${emailData.quoteAmount.toFixed(2).replace('.', ',')} €`, 25, yPos + 15);
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
  doc.text(`${companySettings.company_name} - Solutions de déménagement professionnelles`, 20, 285);
  
  // Retourner le PDF en base64
  return doc.output('datauristring').split(',')[1];
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailData: QuoteEmailRequest = await req.json();
    const { clientName, clientEmail, quoteAmount, desiredDate } = emailData;

    console.log(`📧 Envoi d'email de devis pour: ${clientEmail}`);

    // Récupérer les paramètres de l'entreprise
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('*')
      .single();

    if (settingsError) {
      console.error("❌ Erreur lors de la récupération des paramètres:", settingsError);
    }

    const companySettings = settings || {
      company_name: 'MatchMove',
      company_email: 'contact@matchmove.fr',
      company_phone: '+33 1 23 45 67 89',
      company_address: 'France',
      smtp_enabled: false,
      smtp_host: '',
      smtp_port: 587,
      smtp_username: '',
      smtp_password: '',
      smtp_secure: 'tls'
    };

    // Générer le PDF en base64
    const pdfBase64 = emailData.pdfBase64 || await generatePDFBase64(emailData, companySettings);

    // Préparer les données pour le script PHP
    const phpData = {
      clientName,
      clientEmail,
      quoteAmount,
      desiredDate,
      pdfBase64,
      companySettings
    };

    // URL de votre script PHP (vous devrez ajuster cette URL selon votre domaine)
    const phpScriptUrl = 'https://your-domain.com/send-email.php';
    
    console.log("📤 Envoi vers le script PHP:", phpScriptUrl);

    // Appeler le script PHP
    const phpResponse = await fetch(phpScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(phpData)
    });

    const phpResult = await phpResponse.json();

    if (!phpResponse.ok) {
      throw new Error(`Erreur PHP: ${phpResult.error || 'Erreur inconnue'}`);
    }

    console.log("✅ Email envoyé avec succès via PHP:", phpResult);

    return new Response(JSON.stringify({
      success: true,
      message: 'Email envoyé avec succès via PHP',
      method: phpResult.method || 'PHP',
      details: phpResult
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("❌ Error in send-quote-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
