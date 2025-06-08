
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";
import { Resend } from "npm:resend@2.0.0";
import jsPDF from "npm:jspdf@2.5.1";

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
  clientPhone?: string;
  departureAddress?: string;
  departurePostalCode?: string;
  departureCity?: string;
  arrivalAddress?: string;
  arrivalPostalCode?: string;
  arrivalCity?: string;
  estimatedVolume?: number;
}

const generatePDF = (emailData: QuoteEmailRequest, settings: any) => {
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
  
  // Informations de la société
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
  const departureAddr = `${emailData.departureAddress || ''} ${emailData.departurePostalCode} ${emailData.departureCity}`.trim();
  doc.text(departureAddr, 25, yPos);
  
  yPos += 10;
  doc.text('Adresse d\'arrivée:', 20, yPos);
  yPos += 7;
  const arrivalAddr = `${emailData.arrivalAddress || ''} ${emailData.arrivalPostalCode} ${emailData.arrivalCity}`.trim();
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
    doc.text(`${emailData.quoteAmount.toFixed(2).replace('.', ',')} € TTC`, 25, yPos + 15);
  }
  
  // Zone de signature
  yPos += 50;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SIGNATURE CLIENT (OBLIGATOIRE)', 20, yPos);
  
  yPos += 10;
  doc.setFont('helvetica', 'normal');
  doc.text('Nom et prénom : ________________________', 20, yPos);
  yPos += 10;
  doc.text('Date : ____________________', 20, yPos);
  yPos += 15;
  doc.text('Signature :', 20, yPos);
  
  // Cadre pour la signature
  doc.setDrawColor(200, 200, 200);
  doc.rect(20, yPos + 5, 80, 30);
  
  // Conditions
  yPos += 45;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Conditions générales:', 20, yPos);
  yPos += 5;
  doc.text('• Ce devis est valable 30 jours à compter de sa date d\'émission', 20, yPos);
  yPos += 4;
  doc.text('• Les prix sont exprimés en euros TTC', 20, yPos);
  yPos += 4;
  doc.text('• Signature requise pour valider la prestation', 20, yPos);
  
  // Pied de page
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text(`Devis généré le ${new Date().toLocaleDateString('fr-FR')}`, 20, 280);
  doc.text(`${settings.company_name} - Solutions de déménagement professionnelles`, 20, 285);
  
  return doc.output('arraybuffer');
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🌟 === DÉBUT ENVOI EMAIL DEVIS ===");
    
    const emailData: QuoteEmailRequest = await req.json();
    console.log(`📧 Email destinataire: ${emailData.clientEmail}`);
    console.log(`💰 Montant devis: ${emailData.quoteAmount}€`);

    // Récupération paramètres de l'entreprise
    console.log("🔍 Récupération configuration entreprise...");
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('*')
      .single();

    if (settingsError || !settings) {
      console.error("❌ Erreur configuration entreprise:", settingsError);
      throw new Error("Configuration entreprise introuvable");
    }

    console.log("✅ Configuration entreprise récupérée");

    // Vérifier si on a une clé Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY non configurée");
    }

    console.log("✅ Clé Resend trouvée");
    const resend = new Resend(resendApiKey);

    // Générer le PDF
    console.log("📄 Génération du PDF...");
    const pdfBuffer = generatePDF(emailData, settings);
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    // Construction du contenu email HTML
    const subject = `Votre devis de déménagement - ${new Date(emailData.desiredDate).toLocaleDateString('fr-FR')}`;
    const fromName = settings.company_name || "MatchMove";
    const fromEmail = "noreply@matchmove.tanjaconnect.com"; // Utilisation du domaine vérifié
    const replyToEmail = settings.company_email || "contact@matchmove.fr";
    
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .container { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .price-box { background: #f0fdf4; border: 2px solid #22c55e; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
        .price { font-size: 32px; color: #22c55e; font-weight: bold; margin: 0; }
        .details { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .detail-row:last-child { border-bottom: none; }
        .signature-box { background: #fff3cd; border: 2px solid #ffc107; border-radius: 10px; padding: 20px; margin: 20px 0; }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${fromName}</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Votre devis de déménagement</p>
        </div>
        
        <div class="content">
            <p style="font-size: 18px; color: #374151;">Bonjour ${emailData.clientName || 'Madame, Monsieur'},</p>
            
            <p>Nous avons le plaisir de vous transmettre votre devis personnalisé pour votre déménagement :</p>
            
            <div class="price-box">
                <div class="price">${emailData.quoteAmount.toLocaleString('fr-FR')} € TTC</div>
                <p style="margin: 10px 0 0 0; color: #16a34a; font-weight: 500;">Devis valable 30 jours</p>
            </div>
            
            <div class="details">
                <h3 style="margin: 0 0 15px 0; color: #1f2937;">📋 Détails du déménagement</h3>
                <div class="detail-row">
                    <span><strong>Date souhaitée :</strong></span>
                    <span>${new Date(emailData.desiredDate).toLocaleDateString('fr-FR')}</span>
                </div>
                ${emailData.departureCity ? `
                <div class="detail-row">
                    <span><strong>Départ :</strong></span>
                    <span>${emailData.departurePostalCode || ''} ${emailData.departureCity}</span>
                </div>` : ''}
                ${emailData.arrivalCity ? `
                <div class="detail-row">
                    <span><strong>Arrivée :</strong></span>
                    <span>${emailData.arrivalPostalCode || ''} ${emailData.arrivalCity}</span>
                </div>` : ''}
                ${emailData.estimatedVolume ? `
                <div class="detail-row">
                    <span><strong>Volume estimé :</strong></span>
                    <span>${emailData.estimatedVolume} m³</span>
                </div>` : ''}
                ${emailData.clientPhone ? `
                <div class="detail-row">
                    <span><strong>Téléphone :</strong></span>
                    <span>${emailData.clientPhone}</span>
                </div>` : ''}
            </div>

            <div class="signature-box">
                <h3 style="margin: 0 0 15px 0; color: #856404;">📎 Document joint important</h3>
                <p style="color: #856404; margin: 0;">
                    <strong>Vous trouverez en pièce jointe votre devis détaillé au format PDF.</strong><br>
                    Pour confirmer votre déménagement, veuillez :<br>
                    • Imprimer le document PDF<br>
                    • Le signer dans l'espace prévu à cet effet<br>
                    • Nous le retourner signé par email
                </p>
            </div>
            
            <p style="color: #374151;">Pour toute question ou pour confirmer votre déménagement, n'hésitez pas à nous contacter :</p>
            <p style="color: #374151;">
                📞 ${settings.company_phone || 'Nous contacter'}<br>
                📧 ${settings.company_email}<br>
                📍 ${settings.company_address || ''}
            </p>
            
            <p style="color: #374151;">Cordialement,<br><strong>L'équipe ${fromName}</strong></p>
        </div>
        
        <div class="footer">
            <p style="margin: 0;">${fromName}</p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">Devis généré automatiquement le ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
    </div>
</body>
</html>`;

    console.log("📤 Envoi email via Resend...");

    // Nom du fichier PDF
    const fileName = `devis_${emailData.clientName?.replace(/\s+/g, '_') || 'client'}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Envoi de l'email avec Resend
    const emailResponse = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`, // Utilisation du domaine vérifié
      to: [emailData.clientEmail],
      replyTo: replyToEmail, // Reply-to utilise l'email de l'entreprise
      subject: subject,
      html: htmlBody,
      attachments: [
        {
          filename: fileName,
          content: pdfBase64,
          type: 'application/pdf',
          disposition: 'attachment'
        }
      ]
    });

    console.log("✅ Email envoyé avec succès!", emailResponse);

    return new Response(JSON.stringify({
      success: true,
      message: 'Email envoyé avec succès avec pièce jointe PDF',
      emailId: emailResponse.data?.id
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("🌟 === ERREUR FINALE ===");
    console.error("❌ Erreur:", error.message);
    console.error("❌ Stack:", error.stack);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || "Erreur lors de l'envoi de l'email"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
