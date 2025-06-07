
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
  pdfBase64?: string;
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

const sendEmailSMTP = async (emailData: QuoteEmailRequest, companySettings: any, pdfBase64: string) => {
  // Vérifier que SMTP est configuré
  if (!companySettings.smtp_enabled || 
      !companySettings.smtp_host || 
      !companySettings.smtp_username || 
      !companySettings.smtp_password) {
    throw new Error('Configuration SMTP incomplète. Veuillez configurer le SMTP dans les paramètres admin.');
  }

  console.log("📧 Configuration SMTP:", {
    host: companySettings.smtp_host,
    port: companySettings.smtp_port,
    username: companySettings.smtp_username,
    secure: companySettings.smtp_secure
  });

  // Préparer le contenu HTML de l'email
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #22c55e; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background-color: #f8f9fa; padding: 15px; text-align: center; color: #666; }
        .highlight { background-color: #f0fdf4; padding: 15px; border-left: 4px solid #22c55e; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${companySettings.company_name}</h1>
        <p>Solutions de déménagement professionnelles</p>
    </div>
    
    <div class="content">
        <p>Bonjour ${emailData.clientName || 'Madame, Monsieur'},</p>
        
        <p>Nous avons le plaisir de vous transmettre votre devis personnalisé pour votre projet de déménagement.</p>
        
        <div class="highlight">
            <h3>📋 DÉTAILS DE VOTRE DEMANDE :</h3>
            <ul>
                <li><strong>Date souhaitée :</strong> ${new Date(emailData.desiredDate).toLocaleDateString('fr-FR')}</li>
                <li><strong>Montant du devis :</strong> ${emailData.quoteAmount.toFixed(2).replace('.', ',')} € TTC</li>
            </ul>
        </div>
        
        <p>📎 Vous trouverez en pièce jointe votre devis détaillé au format PDF.</p>
        
        <p>Ce devis est valable 30 jours à compter de sa date d'émission.</p>
        
        <p>Cordialement,<br>L'équipe ${companySettings.company_name}</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p><strong>📞 Téléphone :</strong> ${companySettings.company_phone}<br>
            <strong>📧 Email :</strong> ${companySettings.company_email}<br>
            <strong>📍 Adresse :</strong> ${companySettings.company_address}</p>
        </div>
    </div>
    
    <div class="footer">
        <p>${companySettings.company_name} - Solutions de déménagement professionnelles</p>
    </div>
</body>
</html>`;

  // Configuration de l'email pour SMTP
  const boundary = '----=_NextPart_' + Math.random().toString(36).substr(2, 9);
  
  const emailBody = [
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    `From: ${companySettings.company_name} <${companySettings.smtp_username}>`,
    `To: ${emailData.clientEmail}`,
    `Subject: =?UTF-8?B?${btoa(`Votre devis de déménagement du ${new Date(emailData.desiredDate).toLocaleDateString('fr-FR')}`)}?=`,
    `MIME-Version: 1.0`,
    '',
    `--${boundary}`,
    `Content-Type: multipart/alternative; boundary="${boundary}_alt"`,
    '',
    `--${boundary}_alt`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: quoted-printable`,
    '',
    htmlContent,
    '',
    `--${boundary}_alt--`,
    '',
    `--${boundary}`,
    `Content-Type: application/pdf; name="devis.pdf"`,
    `Content-Transfer-Encoding: base64`,
    `Content-Disposition: attachment; filename="devis_${emailData.clientName?.replace(/[^a-zA-Z0-9]/g, '_') || 'client'}_${new Date().toISOString().split('T')[0]}.pdf"`,
    '',
    pdfBase64,
    '',
    `--${boundary}--`
  ].join('\r\n');

  // Utiliser un service SMTP via API (comme SendGrid, Mailgun, etc.)
  // Ici on utilise une approche générique avec fetch
  const smtpApiUrl = `https://api.smtp2go.com/v3/email/send`;
  
  const smtpPayload = {
    api_key: companySettings.smtp_password, // Utiliser le mot de passe SMTP comme clé API
    to: [emailData.clientEmail],
    sender: companySettings.smtp_username,
    subject: `Votre devis de déménagement du ${new Date(emailData.desiredDate).toLocaleDateString('fr-FR')}`,
    html_body: htmlContent,
    attachments: [{
      filename: `devis_${emailData.clientName?.replace(/[^a-zA-Z0-9]/g, '_') || 'client'}_${new Date().toISOString().split('T')[0]}.pdf`,
      fileblob: pdfBase64,
      mimetype: 'application/pdf'
    }]
  };

  console.log("📤 Envoi via SMTP API");
  
  const response = await fetch(smtpApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(smtpPayload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Erreur SMTP:", errorText);
    throw new Error(`Erreur SMTP: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log("✅ Email envoyé via SMTP:", result);
  
  return result;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailData: QuoteEmailRequest = await req.json();
    const { clientName, clientEmail, quoteAmount, desiredDate } = emailData;

    console.log(`📧 Traitement envoi email pour: ${clientEmail}`);

    // Récupérer les paramètres de l'entreprise (OBLIGATOIRE)
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('*')
      .single();

    if (settingsError) {
      console.error("❌ Erreur lors de la récupération des paramètres:", settingsError);
      throw new Error("Impossible de récupérer les paramètres de l'entreprise");
    }

    if (!settings) {
      throw new Error("Aucune configuration d'entreprise trouvée");
    }

    // Vérifier la configuration SMTP
    if (!settings.smtp_enabled || !settings.smtp_host || !settings.smtp_username || !settings.smtp_password) {
      throw new Error("Configuration SMTP incomplète. Veuillez configurer le SMTP dans les paramètres admin.");
    }

    console.log("✅ Configuration SMTP trouvée et validée");

    // Générer le PDF
    const pdfBase64 = emailData.pdfBase64 || await generatePDFBase64(emailData, settings);

    // Envoyer l'email via SMTP
    const result = await sendEmailSMTP(emailData, settings, pdfBase64);

    console.log("✅ Email envoyé avec succès via SMTP");

    return new Response(JSON.stringify({
      success: true,
      message: 'Email envoyé avec succès via SMTP',
      method: 'SMTP',
      details: result
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("❌ Erreur dans send-quote-email:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        method: 'SMTP'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
