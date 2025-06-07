
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

const sendSMTPEmail = async (emailData: QuoteEmailRequest, settings: any) => {
  console.log("🚀 DÉMARRAGE ENVOI EMAIL SMTP");
  console.log(`📧 Destinataire: ${emailData.clientEmail}`);
  console.log(`🔧 Serveur: ${settings.smtp_host}:${settings.smtp_port}`);

  // Validation basique
  if (!settings.smtp_host || !settings.smtp_username || !settings.smtp_password) {
    throw new Error('Configuration SMTP incomplète');
  }

  try {
    // 1. Connexion selon le port
    let connection;
    if (settings.smtp_port === 465) {
      console.log("🔒 Connexion SSL directe (port 465)");
      connection = await Deno.connectTls({
        hostname: settings.smtp_host,
        port: settings.smtp_port,
      });
    } else {
      console.log("🔌 Connexion TCP (port 587)");
      connection = await Deno.connect({
        hostname: settings.smtp_host,
        port: settings.smtp_port,
      });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Helper pour lire les réponses SMTP
    const readSMTPResponse = async () => {
      const buffer = new Uint8Array(1024);
      const bytesRead = await connection.read(buffer);
      if (!bytesRead) throw new Error("Connexion fermée par le serveur");
      return decoder.decode(buffer.subarray(0, bytesRead));
    };

    const sendCommand = async (command: string) => {
      console.log(`📤 Envoi: ${command.trim()}`);
      await connection.write(encoder.encode(command));
      const response = await readSMTPResponse();
      console.log(`📥 Réponse: ${response.trim()}`);
      return response;
    };

    // 2. Handshake SMTP
    const welcome = await readSMTPResponse();
    console.log(`📥 Welcome: ${welcome.trim()}`);
    if (!welcome.startsWith('220')) {
      throw new Error(`Erreur welcome: ${welcome.trim()}`);
    }

    // 3. EHLO
    const ehloResponse = await sendCommand(`EHLO ${settings.smtp_host}\r\n`);
    if (!ehloResponse.startsWith('250')) {
      throw new Error(`Erreur EHLO: ${ehloResponse.trim()}`);
    }

    // 4. STARTTLS pour port 587
    if (settings.smtp_port === 587) {
      console.log("🔒 Activation STARTTLS...");
      const tlsResponse = await sendCommand("STARTTLS\r\n");
      if (tlsResponse.startsWith('220')) {
        const tlsConnection = await Deno.startTls(connection, { 
          hostname: settings.smtp_host 
        });
        connection.close();
        connection = tlsConnection;
        
        // EHLO après TLS
        await sendCommand(`EHLO ${settings.smtp_host}\r\n`);
      }
    }

    // 5. Authentification
    console.log("🔐 Authentification SMTP...");
    
    const authResponse = await sendCommand("AUTH LOGIN\r\n");
    if (!authResponse.startsWith('334')) {
      throw new Error(`Erreur AUTH LOGIN: ${authResponse.trim()}`);
    }

    // Username en base64
    const usernameB64 = btoa(settings.smtp_username);
    const userResponse = await sendCommand(`${usernameB64}\r\n`);
    if (!userResponse.startsWith('334')) {
      throw new Error(`Erreur username: ${userResponse.trim()}`);
    }

    // Password en base64
    const passwordB64 = btoa(settings.smtp_password);
    const passResponse = await sendCommand(`${passwordB64}\r\n`);
    if (!passResponse.startsWith('235')) {
      throw new Error(`Erreur authentification: ${passResponse.trim()}`);
    }

    console.log("✅ Authentification réussie!");

    // 6. Envoi de l'email
    const fromEmail = settings.smtp_username;
    
    const mailFromResponse = await sendCommand(`MAIL FROM:<${fromEmail}>\r\n`);
    if (!mailFromResponse.startsWith('250')) {
      throw new Error(`Erreur MAIL FROM: ${mailFromResponse.trim()}`);
    }

    const rcptToResponse = await sendCommand(`RCPT TO:<${emailData.clientEmail}>\r\n`);
    if (!rcptToResponse.startsWith('250')) {
      throw new Error(`Erreur RCPT TO: ${rcptToResponse.trim()}`);
    }

    const dataResponse = await sendCommand("DATA\r\n");
    if (!dataResponse.startsWith('354')) {
      throw new Error(`Erreur DATA: ${dataResponse.trim()}`);
    }

    // 7. Construction du message
    const subject = `Votre devis de déménagement du ${new Date(emailData.desiredDate).toLocaleDateString('fr-FR')}`;
    const fromName = settings.smtp_from_name || settings.company_name;
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background-color: #22c55e; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background-color: #f8f9fa; padding: 15px; text-align: center; color: #666; }
        .highlight { background-color: #f0fdf4; padding: 15px; border-left: 4px solid #22c55e; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${settings.company_name}</h1>
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
        
        <p>Cordialement,<br>L'équipe ${settings.company_name}</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p><strong>📞 Téléphone :</strong> ${settings.company_phone}<br>
            <strong>📧 Email :</strong> ${settings.company_email}<br>
            <strong>📍 Adresse :</strong> ${settings.company_address}</p>
        </div>
    </div>
    
    <div class="footer">
        <p>${settings.company_name} - Solutions de déménagement professionnelles</p>
    </div>
</body>
</html>`;

    let emailMessage = `From: ${fromName} <${fromEmail}>\r\n`;
    emailMessage += `To: ${emailData.clientEmail}\r\n`;
    emailMessage += `Subject: ${subject}\r\n`;
    emailMessage += `MIME-Version: 1.0\r\n`;

    if (emailData.pdfBase64) {
      const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36)}`;
      emailMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
      
      // Corps HTML
      emailMessage += `--${boundary}\r\n`;
      emailMessage += `Content-Type: text/html; charset=utf-8\r\n\r\n`;
      emailMessage += htmlContent + '\r\n';
      
      // Pièce jointe PDF
      emailMessage += `--${boundary}\r\n`;
      emailMessage += `Content-Type: application/pdf\r\n`;
      emailMessage += `Content-Transfer-Encoding: base64\r\n`;
      emailMessage += `Content-Disposition: attachment; filename="devis.pdf"\r\n\r\n`;
      emailMessage += emailData.pdfBase64 + '\r\n';
      emailMessage += `--${boundary}--\r\n`;
    } else {
      emailMessage += `Content-Type: text/html; charset=utf-8\r\n\r\n`;
      emailMessage += htmlContent + '\r\n';
    }

    // Envoyer le message et terminer
    await connection.write(encoder.encode(emailMessage));
    const endResponse = await sendCommand(".\r\n");
    if (!endResponse.startsWith('250')) {
      throw new Error(`Erreur envoi message: ${endResponse.trim()}`);
    }

    await sendCommand("QUIT\r\n");
    connection.close();

    console.log("✅ EMAIL ENVOYÉ AVEC SUCCÈS!");
    return { success: true, method: 'SMTP_DIRECT' };

  } catch (error) {
    console.error("❌ Erreur SMTP:", error);
    throw error;
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailData: QuoteEmailRequest = await req.json();
    console.log(`📧 DEMANDE ENVOI EMAIL: ${emailData.clientEmail}`);

    // Récupérer settings
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('*')
      .single();

    if (settingsError || !settings) {
      console.error("❌ Erreur settings:", settingsError);
      throw new Error("Configuration manquante");
    }

    console.log("✅ Settings récupérés");

    // Envoyer email
    const result = await sendSMTPEmail(emailData, settings);

    return new Response(JSON.stringify({
      success: true,
      message: 'Email envoyé avec succès',
      method: result.method,
      recipient: emailData.clientEmail
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ ERREUR HANDLER:", error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      message: 'Erreur envoi email'
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
