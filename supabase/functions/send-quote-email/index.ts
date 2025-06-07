
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";

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

const sendEmailWithResend = async (emailData: QuoteEmailRequest, companySettings: any, pdfBase64: string) => {
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

  const resendApiUrl = 'https://api.resend.com/emails';
  
  // Utiliser l'adresse email configurée dans les paramètres SMTP
  const fromEmail = companySettings.smtp_username || 'noreply@resend.dev';
  
  const emailPayload = {
    from: `${companySettings.company_name} <${fromEmail}>`,
    to: [emailData.clientEmail],
    subject: `Votre devis de déménagement du ${new Date(emailData.desiredDate).toLocaleDateString('fr-FR')}`,
    html: htmlContent,
    attachments: [{
      filename: `devis_${emailData.clientName?.replace(/[^a-zA-Z0-9]/g, '_') || 'client'}_${new Date().toISOString().split('T')[0]}.pdf`,
      content: pdfBase64,
      type: 'application/pdf',
      disposition: 'attachment'
    }]
  };

  console.log("📤 Envoi via Resend API avec email:", fromEmail);
  
  const response = await fetch(resendApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`
    },
    body: JSON.stringify(emailPayload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Erreur Resend:", errorText);
    throw new Error(`Erreur envoi email: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log("✅ Email envoyé via Resend:", result);
  
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

    // Récupérer les paramètres de l'entreprise
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

    console.log("✅ Configuration entreprise trouvée");

    // Utiliser le PDF fourni ou générer un PDF simple
    let pdfBase64 = emailData.pdfBase64;
    if (!pdfBase64) {
      const pdfContent = `Devis de déménagement
Client: ${emailData.clientName}
Email: ${emailData.clientEmail}
Date: ${new Date(emailData.desiredDate).toLocaleDateString('fr-FR')}
Montant: ${emailData.quoteAmount}€`;
      
      pdfBase64 = btoa(pdfContent);
    }

    // Envoyer l'email
    const result = await sendEmailWithResend(emailData, settings, pdfBase64);

    console.log("✅ Email envoyé avec succès");

    return new Response(JSON.stringify({
      success: true,
      message: 'Email envoyé avec succès',
      method: 'Resend',
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
        method: 'Resend'
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
