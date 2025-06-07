
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

const sendEmailSMTP = async (emailData: QuoteEmailRequest, settings: any) => {
  console.log("📧 DÉBUT ENVOI EMAIL SMTP");
  console.log(`🔧 Configuration: ${settings.smtp_host}:${settings.smtp_port}`);
  
  // Validation
  if (!settings.smtp_host || !settings.smtp_username || !settings.smtp_password) {
    throw new Error('Configuration SMTP incomplète');
  }

  const subject = `Votre devis de déménagement du ${new Date(emailData.desiredDate).toLocaleDateString('fr-FR')}`;
  
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
        <h1>${settings.smtp_from_name || settings.company_name}</h1>
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

  try {
    console.log(`📤 Connexion à ${settings.smtp_host}:${settings.smtp_port}`);

    // Connexion SMTP - EXACTEMENT comme dans test-smtp
    let conn;
    if (settings.smtp_port === 465 || (settings.smtp_secure && settings.smtp_port !== 587)) {
      console.log("🔒 Connexion TLS directe (port 465)");
      conn = await Deno.connectTls({
        hostname: settings.smtp_host,
        port: settings.smtp_port,
      });
    } else {
      console.log("🔌 Connexion TCP normale");
      conn = await Deno.connect({
        hostname: settings.smtp_host,
        port: settings.smtp_port,
      });
    }

    console.log("✅ Connexion établie");

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Helper pour lire les réponses
    const readResponse = async (): Promise<string> => {
      const buffer = new Uint8Array(1024);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout lecture")), 10000);
      });
      
      const readPromise = conn.read(buffer);
      const n = await Promise.race([readPromise, timeoutPromise]);
      return decoder.decode(buffer.subarray(0, n || 0));
    };

    // 1. Lire le welcome
    const welcome = await readResponse();
    console.log(`📥 Welcome: ${welcome.trim()}`);
    if (!welcome.startsWith('220')) {
      throw new Error(`Erreur welcome: ${welcome.trim()}`);
    }

    // 2. EHLO
    await conn.write(encoder.encode(`EHLO ${settings.smtp_host}\r\n`));
    const ehlo = await readResponse();
    console.log(`📥 EHLO: ${ehlo.trim()}`);
    if (!ehlo.startsWith('250')) {
      throw new Error(`Erreur EHLO: ${ehlo.trim()}`);
    }

    // 3. STARTTLS si port 587
    if (settings.smtp_port === 587 && settings.smtp_secure) {
      console.log("🔒 STARTTLS...");
      await conn.write(encoder.encode("STARTTLS\r\n"));
      const starttls = await readResponse();
      console.log(`📥 STARTTLS: ${starttls.trim()}`);
      
      if (starttls.startsWith('220')) {
        const tlsConn = await Deno.startTls(conn, { hostname: settings.smtp_host });
        conn.close();
        conn = tlsConn;
        
        // EHLO après TLS
        await conn.write(encoder.encode(`EHLO ${settings.smtp_host}\r\n`));
        const ehloTls = await readResponse();
        console.log(`📥 EHLO TLS: ${ehloTls.trim()}`);
      }
    }

    // 4. Authentification - EXACTEMENT comme test-smtp
    console.log("🔐 Authentification...");
    
    await conn.write(encoder.encode("AUTH LOGIN\r\n"));
    const authLogin = await readResponse();
    console.log(`📥 AUTH LOGIN: ${authLogin.trim()}`);
    if (!authLogin.startsWith('334')) {
      throw new Error(`Erreur AUTH LOGIN: ${authLogin.trim()}`);
    }

    // Username
    const usernameB64 = btoa(settings.smtp_username);
    await conn.write(encoder.encode(`${usernameB64}\r\n`));
    const userResp = await readResponse();
    console.log(`📥 Username: ${userResp.trim()}`);
    if (!userResp.startsWith('334')) {
      throw new Error(`Erreur username: ${userResp.trim()}`);
    }

    // Password
    const passwordB64 = btoa(settings.smtp_password);
    await conn.write(encoder.encode(`${passwordB64}\r\n`));
    const passResp = await readResponse();
    console.log(`📥 Password: ${passResp.trim()}`);
    if (!passResp.startsWith('235')) {
      throw new Error(`Erreur password: ${passResp.trim()}`);
    }

    console.log("✅ Authentification réussie");

    // 5. Envoi email
    const fromEmail = settings.smtp_username;
    
    // MAIL FROM
    await conn.write(encoder.encode(`MAIL FROM:<${fromEmail}>\r\n`));
    const mailFrom = await readResponse();
    console.log(`📥 MAIL FROM: ${mailFrom.trim()}`);
    if (!mailFrom.startsWith('250')) {
      throw new Error(`Erreur MAIL FROM: ${mailFrom.trim()}`);
    }

    // RCPT TO
    await conn.write(encoder.encode(`RCPT TO:<${emailData.clientEmail}>\r\n`));
    const rcptTo = await readResponse();
    console.log(`📥 RCPT TO: ${rcptTo.trim()}`);
    if (!rcptTo.startsWith('250')) {
      throw new Error(`Erreur RCPT TO: ${rcptTo.trim()}`);
    }

    // DATA
    await conn.write(encoder.encode("DATA\r\n"));
    const dataResp = await readResponse();
    console.log(`📥 DATA: ${dataResp.trim()}`);
    if (!dataResp.startsWith('354')) {
      throw new Error(`Erreur DATA: ${dataResp.trim()}`);
    }

    // Construction email
    const fromName = settings.smtp_from_name || settings.company_name;
    let emailContent = `From: ${fromName} <${fromEmail}>\r\n`;
    emailContent += `To: ${emailData.clientEmail}\r\n`;
    emailContent += `Subject: ${subject}\r\n`;
    emailContent += `MIME-Version: 1.0\r\n`;
    
    if (emailData.pdfBase64) {
      const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36)}`;
      emailContent += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
      
      // HTML
      emailContent += `--${boundary}\r\n`;
      emailContent += `Content-Type: text/html; charset=utf-8\r\n\r\n`;
      emailContent += htmlContent + '\r\n';
      
      // PDF
      emailContent += `--${boundary}\r\n`;
      emailContent += `Content-Type: application/pdf\r\n`;
      emailContent += `Content-Transfer-Encoding: base64\r\n`;
      emailContent += `Content-Disposition: attachment; filename="devis.pdf"\r\n\r\n`;
      emailContent += emailData.pdfBase64 + '\r\n';
      emailContent += `--${boundary}--\r\n`;
    } else {
      emailContent += `Content-Type: text/html; charset=utf-8\r\n\r\n`;
      emailContent += htmlContent + '\r\n';
    }

    // Envoyer le contenu
    await conn.write(encoder.encode(emailContent));
    await conn.write(encoder.encode(".\r\n"));
    
    const endResp = await readResponse();
    console.log(`📥 END: ${endResp.trim()}`);
    if (!endResp.startsWith('250')) {
      throw new Error(`Erreur envoi: ${endResp.trim()}`);
    }

    // QUIT
    await conn.write(encoder.encode("QUIT\r\n"));
    const quitResp = await readResponse();
    console.log(`📥 QUIT: ${quitResp.trim()}`);

    conn.close();
    console.log("✅ EMAIL ENVOYÉ AVEC SUCCÈS");
    
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
    const result = await sendEmailSMTP(emailData, settings);

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
