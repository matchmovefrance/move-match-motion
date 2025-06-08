
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";
import { Resend } from "npm:resend@2.0.0";

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

// Fonction pour générer le PDF du devis
const generateQuotePDF = (emailData: QuoteEmailRequest, settings: any): string => {
  // Simuler la génération d'un PDF basique en base64
  // En production, vous pourriez utiliser une vraie librairie PDF comme jsPDF ou Puppeteer
  const pdfContent = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 500
>>
stream
BT
/F1 12 Tf
50 750 Td
(${settings.company_name || 'MatchMove'}) Tj
0 -20 Td
(DEVIS DE DEMENAGEMENT) Tj
0 -40 Td
(Client: ${emailData.clientName}) Tj
0 -20 Td
(Email: ${emailData.clientEmail}) Tj
0 -20 Td
(Date souhaitee: ${new Date(emailData.desiredDate).toLocaleDateString('fr-FR')}) Tj
0 -20 Td
(Depart: ${emailData.departurePostalCode || ''} ${emailData.departureCity || ''}) Tj
0 -20 Td
(Arrivee: ${emailData.arrivalPostalCode || ''} ${emailData.arrivalCity || ''}) Tj
0 -40 Td
(MONTANT: ${emailData.quoteAmount.toFixed(2)} EUR TTC) Tj
0 -40 Td
(Devis valable 30 jours) Tj
0 -20 Td
(Date d'emission: ${new Date().toLocaleDateString('fr-FR')}) Tj
0 -40 Td
(Signature client: ________________) Tj
0 -20 Td
(Date de signature: ________________) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000826 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
899
%%EOF`;

  // Convertir en base64
  return btoa(pdfContent);
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

    // Générer le PDF du devis
    console.log("📄 Génération du PDF...");
    const pdfBase64 = generateQuotePDF(emailData, settings);
    const pdfBuffer = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));

    // Configuration email avec domaine vérifié et informations entreprise
    const subject = `Votre devis de déménagement - ${new Date(emailData.desiredDate).toLocaleDateString('fr-FR')}`;
    const fromName = settings.company_name || "MatchMove";
    const fromEmail = "noreply@matchmove.tanjaconnect.com"; // Domaine vérifié pour l'envoi
    const replyToEmail = settings.company_email || "contact@matchmove.fr"; // Email de l'entreprise pour les réponses
    const companyPhone = settings.company_phone || "Nous contacter";
    const companyAddress = settings.company_address || "";
    
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
        .footer { background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; }
        .important-note { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .important-note h3 { color: #92400e; margin: 0 0 10px 0; }
        .important-note p { color: #92400e; margin: 0; }
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

            <div class="important-note">
                <h3>📎 DEVIS EN PIÈCE JOINTE</h3>
                <p><strong>Vous trouverez le devis détaillé en pièce jointe de cet email.</strong></p>
                <p style="margin-top: 10px;"><strong>Pour confirmer votre réservation :</strong></p>
                <p style="margin-top: 5px;">1. Signez le devis en pièce jointe</p>
                <p>2. Renvoyez-nous le devis signé par email à : <strong>${replyToEmail}</strong></p>
                <p>3. Nous vous confirmerons votre réservation sous 24h</p>
            </div>
            
            <p style="color: #374151;">Pour toute question ou pour confirmer votre déménagement, n'hésitez pas à nous contacter :</p>
            <p style="color: #374151;">
                📞 ${companyPhone}<br>
                📧 ${replyToEmail}
                ${companyAddress ? `<br>📍 ${companyAddress}` : ''}
            </p>
            
            <p style="color: #374151;">Cordialement,<br><strong>${fromName}</strong></p>
        </div>
        
        <div class="footer">
            <p style="margin: 0;">${fromName} - ${replyToEmail}</p>
            ${companyPhone !== 'Nous contacter' ? `<p style="margin: 5px 0 0 0;">Tél: ${companyPhone}</p>` : ''}
            <p style="margin: 5px 0 0 0; font-size: 12px;">Devis généré automatiquement le ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
    </div>
</body>
</html>`;

    console.log("📤 Envoi email via Resend...");

    // Nom du fichier PDF
    const fileName = `devis_${emailData.clientName?.replace(/[^a-zA-Z0-9]/g, '_') || 'client'}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Envoi de l'email avec Resend et pièce jointe
    const emailResponse = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`, // Utilisation du domaine vérifié pour l'envoi
      to: [emailData.clientEmail],
      reply_to: replyToEmail, // Utilisation de l'email de l'entreprise pour les réponses
      subject: subject,
      html: htmlBody,
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
          content_type: 'application/pdf'
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
