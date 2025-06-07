
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
  console.log("📧 Début envoi email SMTP");
  console.log(`🔧 Configuration: ${settings.smtp_host}:${settings.smtp_port} (Secure: ${settings.smtp_secure})`);
  
  // Validation des paramètres SMTP
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
    console.log(`📤 Envoi email vers: ${emailData.clientEmail}`);

    // Connexion SMTP avec support TLS/SSL
    let conn;
    const connectOptions: any = {
      hostname: settings.smtp_host,
      port: settings.smtp_port,
    };

    // Si le port est 465 (SSL) ou smtp_secure est true, utiliser TLS
    if (settings.smtp_port === 465 || settings.smtp_secure) {
      connectOptions.transport = 'tls';
    }

    try {
      conn = await Deno.connect(connectOptions);
      console.log("✅ Connexion SMTP établie");
    } catch (error) {
      console.error("❌ Erreur connexion SMTP:", error);
      throw new Error(`Impossible de se connecter au serveur SMTP: ${error.message}`);
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Helper pour envoyer et lire les réponses SMTP
    const sendCommand = async (command: string): Promise<string> => {
      console.log(`📤 SMTP: ${command.trim()}`);
      await conn.write(encoder.encode(command));
      
      const buffer = new Uint8Array(1024);
      const n = await conn.read(buffer);
      const response = decoder.decode(buffer.subarray(0, n || 0));
      console.log(`📥 SMTP: ${response.trim()}`);
      
      if (response.startsWith('4') || response.startsWith('5')) {
        throw new Error(`Erreur SMTP: ${response.trim()}`);
      }
      
      return response;
    };

    try {
      // Lecture du message de bienvenue
      const buffer = new Uint8Array(1024);
      const n = await conn.read(buffer);
      const welcome = decoder.decode(buffer.subarray(0, n || 0));
      console.log(`📥 SMTP Welcome: ${welcome.trim()}`);

      // EHLO/HELO
      await sendCommand(`EHLO ${settings.smtp_host}\r\n`);
      
      // STARTTLS si nécessaire (port 587 ou demandé explicitement)
      if (settings.smtp_port === 587 || (settings.smtp_secure && settings.smtp_port !== 465)) {
        console.log("🔒 Activation STARTTLS...");
        await sendCommand("STARTTLS\r\n");
        
        // Upgrader la connexion vers TLS
        const tlsConn = await Deno.startTls(conn, { hostname: settings.smtp_host });
        conn.close();
        conn = tlsConn;
        
        // Nouveau EHLO après TLS
        await sendCommand(`EHLO ${settings.smtp_host}\r\n`);
      }
      
      // Authentification
      if (settings.smtp_username && settings.smtp_password) {
        console.log("🔐 Authentification SMTP...");
        
        if (settings.smtp_auth_method === 'PLAIN') {
          const authString = btoa(`\0${settings.smtp_username}\0${settings.smtp_password}`);
          await sendCommand("AUTH PLAIN\r\n");
          await sendCommand(`${authString}\r\n`);
        } else {
          // LOGIN par défaut
          await sendCommand("AUTH LOGIN\r\n");
          
          const usernameB64 = btoa(settings.smtp_username);
          await sendCommand(`${usernameB64}\r\n`);
          
          const passwordB64 = btoa(settings.smtp_password);
          await sendCommand(`${passwordB64}\r\n`);
        }
      }

      // Envoi de l'email
      const fromEmail = settings.smtp_username;
      const fromName = settings.smtp_from_name || settings.company_name;
      const replyTo = settings.smtp_reply_to || settings.company_email;

      await sendCommand(`MAIL FROM:<${fromEmail}>\r\n`);
      await sendCommand(`RCPT TO:<${emailData.clientEmail}>\r\n`);
      await sendCommand("DATA\r\n");

      // Construction de l'email avec boundary pour multipart
      const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36)}`;
      
      let emailMessage = `From: ${fromName} <${fromEmail}>\r\n`;
      emailMessage += `To: ${emailData.clientEmail}\r\n`;
      emailMessage += `Reply-To: ${replyTo}\r\n`;
      emailMessage += `Subject: ${subject}\r\n`;
      emailMessage += `MIME-Version: 1.0\r\n`;
      
      if (emailData.pdfBase64) {
        emailMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
        
        // Partie HTML
        emailMessage += `--${boundary}\r\n`;
        emailMessage += `Content-Type: text/html; charset=utf-8\r\n`;
        emailMessage += `Content-Transfer-Encoding: 8bit\r\n\r\n`;
        emailMessage += htmlContent + '\r\n';
        
        // Partie PDF
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

      await conn.write(encoder.encode(emailMessage));
      await sendCommand(".\r\n");
      await sendCommand("QUIT\r\n");

      console.log("✅ Email envoyé avec succès");
      return { success: true, method: 'SMTP_UNIVERSAL' };

    } catch (error) {
      console.error("❌ Erreur lors des commandes SMTP:", error);
      throw error;
    } finally {
      try {
        conn.close();
      } catch (e) {
        console.log("Connexion déjà fermée");
      }
    }

  } catch (error) {
    console.error("❌ Erreur envoi email SMTP:", error);
    
    // Fallback: envoi sans PDF
    if (emailData.pdfBase64) {
      console.log("🔄 Tentative sans PDF...");
      const emailDataWithoutPdf = { ...emailData };
      delete emailDataWithoutPdf.pdfBase64;
      return await sendEmailSMTP(emailDataWithoutPdf, settings);
    }
    
    throw error;
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailData: QuoteEmailRequest = await req.json();
    console.log(`📧 Traitement envoi email pour: ${emailData.clientEmail}`);

    // Récupérer les paramètres de l'entreprise
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('*')
      .single();

    if (settingsError || !settings) {
      console.error("❌ Erreur configuration:", settingsError);
      throw new Error("Configuration d'entreprise non trouvée");
    }

    console.log("✅ Configuration entreprise récupérée");

    // Envoyer l'email
    const result = await sendEmailSMTP(emailData, settings);

    return new Response(JSON.stringify({
      success: true,
      message: 'Email envoyé avec succès',
      method: result.method,
      recipient: emailData.clientEmail
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("❌ Erreur dans send-quote-email:", error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      message: 'Erreur lors de l\'envoi de l\'email'
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
