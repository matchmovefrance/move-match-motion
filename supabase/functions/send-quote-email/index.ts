
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

const sendEmailSMTP = async (emailData: QuoteEmailRequest, companySettings: any, pdfBase64: string) => {
  // Vérifier que SMTP est configuré
  if (!companySettings.smtp_host || 
      !companySettings.smtp_username || 
      !companySettings.smtp_password) {
    throw new Error('Configuration SMTP incomplète. Veuillez configurer le SMTP dans les paramètres admin.');
  }

  console.log("📧 Configuration SMTP:", {
    host: companySettings.smtp_host,
    port: companySettings.smtp_port,
    username: companySettings.smtp_username
  });

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

  try {
    // Version simplifiée sans pièce jointe d'abord
    console.log("📤 Envoi de l'email simplifié...");
    
    // Connexion au serveur SMTP
    let conn;
    try {
      conn = await Deno.connect({
        hostname: companySettings.smtp_host,
        port: companySettings.smtp_port,
      });
      console.log("✅ Connexion TCP établie");
    } catch (error) {
      console.error("❌ Erreur connexion TCP:", error);
      throw new Error(`Impossible de se connecter au serveur SMTP: ${error.message}`);
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    try {
      // Pour Gmail et autres serveurs sécurisés, utiliser STARTTLS
      if (companySettings.smtp_port === 587) {
        console.log("🔒 Démarrage TLS...");
        const tlsConn = await Deno.startTls(conn, {
          hostname: companySettings.smtp_host,
        });
        
        // Message SMTP simple
        const subject = `Votre devis de déménagement du ${new Date(emailData.desiredDate).toLocaleDateString('fr-FR')}`;
        const subjectBase64 = btoa(unescape(encodeURIComponent(subject)));
        
        const emailMessage = [
          `EHLO ${companySettings.smtp_host}`,
          `AUTH LOGIN`,
          btoa(companySettings.smtp_username),
          btoa(companySettings.smtp_password),
          `MAIL FROM:<${companySettings.smtp_username}>`,
          `RCPT TO:<${emailData.clientEmail}>`,
          `DATA`,
          `From: ${companySettings.company_name} <${companySettings.smtp_username}>`,
          `To: ${emailData.clientEmail}`,
          `Subject: =?UTF-8?B?${subjectBase64}?=`,
          `MIME-Version: 1.0`,
          `Content-Type: text/html; charset=utf-8`,
          `Content-Transfer-Encoding: quoted-printable`,
          ``,
          htmlContent,
          `.`,
          `QUIT`
        ].join('\r\n');

        await tlsConn.write(encoder.encode(emailMessage));
        
        // Lire la réponse
        const buffer = new Uint8Array(4096);
        const bytesRead = await tlsConn.read(buffer);
        const response = decoder.decode(buffer.subarray(0, bytesRead || 0));
        
        console.log("📧 Réponse SMTP:", response);
        
        tlsConn.close();
        
        if (response.includes('250')) {
          console.log("✅ Email envoyé avec succès");
          return {
            success: true,
            message: 'Email envoyé via SMTP avec succès'
          };
        } else {
          throw new Error(`Réponse SMTP inattendue: ${response}`);
        }
        
      } else {
        // Pour les connexions non-TLS
        const subject = `Votre devis de déménagement du ${new Date(emailData.desiredDate).toLocaleDateString('fr-FR')}`;
        const subjectBase64 = btoa(unescape(encodeURIComponent(subject)));
        
        const emailMessage = [
          `EHLO ${companySettings.smtp_host}`,
          `AUTH LOGIN`,
          btoa(companySettings.smtp_username),
          btoa(companySettings.smtp_password),
          `MAIL FROM:<${companySettings.smtp_username}>`,
          `RCPT TO:<${emailData.clientEmail}>`,
          `DATA`,
          `From: ${companySettings.company_name} <${companySettings.smtp_username}>`,
          `To: ${emailData.clientEmail}`,
          `Subject: =?UTF-8?B?${subjectBase64}?=`,
          `MIME-Version: 1.0`,
          `Content-Type: text/html; charset=utf-8`,
          ``,
          htmlContent,
          `.`,
          `QUIT`
        ].join('\r\n');

        await conn.write(encoder.encode(emailMessage));
        
        const buffer = new Uint8Array(4096);
        const bytesRead = await conn.read(buffer);
        const response = decoder.decode(buffer.subarray(0, bytesRead || 0));
        
        console.log("📧 Réponse SMTP:", response);
        
        conn.close();
        
        if (response.includes('250')) {
          console.log("✅ Email envoyé avec succès");
          return {
            success: true,
            message: 'Email envoyé via SMTP avec succès'
          };
        } else {
          throw new Error(`Réponse SMTP inattendue: ${response}`);
        }
      }
      
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi:", error);
      if (conn) {
        try {
          conn.close();
        } catch (closeError) {
          console.log("Erreur lors de la fermeture:", closeError);
        }
      }
      throw error;
    }

  } catch (error) {
    console.error("❌ Erreur SMTP complète:", error);
    throw new Error(`Erreur envoi email SMTP: ${error.message}`);
  }
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

    // Envoyer l'email via SMTP
    const result = await sendEmailSMTP(emailData, settings, pdfBase64);

    console.log("✅ Email envoyé avec succès");

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
