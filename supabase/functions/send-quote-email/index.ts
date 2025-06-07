
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

    // Test de connexion EXACT comme dans test-smtp
    let conn;
    try {
      // Utiliser la MÊME logique que test-smtp qui fonctionne
      if (settings.smtp_port === 465 || (settings.smtp_secure && settings.smtp_port !== 587)) {
        console.log("🔒 Connexion TLS directe...");
        conn = await Deno.connectTls({
          hostname: settings.smtp_host,
          port: settings.smtp_port,
        });
      } else {
        console.log("🔌 Connexion TCP normale...");
        conn = await Deno.connect({
          hostname: settings.smtp_host,
          port: settings.smtp_port,
        });
      }

      console.log("✅ Connexion SMTP établie");
    } catch (error) {
      console.error("❌ Erreur connexion SMTP:", error);
      throw new Error(`Impossible de se connecter au serveur SMTP: ${error.message}`);
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Helper EXACT comme dans test-smtp
    const readResponse = async (): Promise<string> => {
      const buffer = new Uint8Array(1024);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout de lecture")), 10000);
      });
      
      const readPromise = conn.read(buffer);
      const n = await Promise.race([readPromise, timeoutPromise]);
      return decoder.decode(buffer.subarray(0, n || 0));
    };

    try {
      // 1. Lire le message de bienvenue
      const welcome = await readResponse();
      console.log(`📥 SMTP Welcome: ${welcome.trim()}`);

      if (!welcome.startsWith('220')) {
        throw new Error(`Réponse SMTP inattendue: ${welcome.trim()}`);
      }

      // 2. EHLO
      await conn.write(encoder.encode(`EHLO ${settings.smtp_host}\r\n`));
      const ehloResponse = await readResponse();
      console.log(`📥 EHLO: ${ehloResponse.trim()}`);

      if (!ehloResponse.startsWith('250')) {
        throw new Error(`Erreur EHLO: ${ehloResponse.trim()}`);
      }

      // 3. STARTTLS si port 587
      if (settings.smtp_port === 587 && settings.smtp_secure) {
        console.log("🔒 Activation STARTTLS...");
        await conn.write(encoder.encode("STARTTLS\r\n"));
        const startTlsResponse = await readResponse();
        console.log(`📥 STARTTLS: ${startTlsResponse.trim()}`);
        
        if (startTlsResponse.startsWith('220')) {
          // Upgrader la connexion vers TLS
          const tlsConn = await Deno.startTls(conn, { hostname: settings.smtp_host });
          conn.close();
          conn = tlsConn;
          
          // Nouveau EHLO après TLS
          await conn.write(encoder.encode(`EHLO ${settings.smtp_host}\r\n`));
          const ehloTlsResponse = await readResponse();
          console.log(`📥 EHLO après TLS: ${ehloTlsResponse.trim()}`);
        }
      }

      // 4. Authentification EXACTE comme test-smtp
      console.log("🔐 Authentification SMTP...");
      
      if (settings.smtp_auth_method === 'PLAIN') {
        const authString = btoa(`\0${settings.smtp_username}\0${settings.smtp_password}`);
        await conn.write(encoder.encode("AUTH PLAIN\r\n"));
        const authPlainResponse = await readResponse();
        console.log(`📥 AUTH PLAIN: ${authPlainResponse.trim()}`);
        
        await conn.write(encoder.encode(`${authString}\r\n`));
        const authFinalResponse = await readResponse();
        console.log(`📥 AUTH Final: ${authFinalResponse.trim()}`);
        
        if (!authFinalResponse.startsWith('235')) {
          throw new Error(`Erreur authentification: ${authFinalResponse.trim()}`);
        }
      } else {
        // LOGIN par défaut - EXACT comme test-smtp
        await conn.write(encoder.encode("AUTH LOGIN\r\n"));
        const authResponse = await readResponse();
        console.log(`📥 AUTH LOGIN: ${authResponse.trim()}`);

        if (!authResponse.startsWith('334')) {
          throw new Error(`Erreur AUTH LOGIN: ${authResponse.trim()}`);
        }

        // Username
        const usernameB64 = btoa(settings.smtp_username);
        console.log(`🔑 Envoi username: ${settings.smtp_username}`);
        await conn.write(encoder.encode(`${usernameB64}\r\n`));
        const userResponse = await readResponse();
        console.log(`📥 Username Response: ${userResponse.trim()}`);

        if (!userResponse.startsWith('334')) {
          throw new Error(`Erreur username: ${userResponse.trim()}`);
        }

        // Password
        const passwordB64 = btoa(settings.smtp_password);
        console.log(`🔑 Envoi password`);
        await conn.write(encoder.encode(`${passwordB64}\r\n`));
        const passResponse = await readResponse();
        console.log(`📥 Password Response: ${passResponse.trim()}`);

        if (!passResponse.startsWith('235')) {
          throw new Error(`Erreur authentification: ${passResponse.trim()}`);
        }
      }

      console.log("✅ Authentification réussie");

      // 5. Envoi de l'email
      const fromEmail = settings.smtp_username;
      const fromName = settings.smtp_from_name || settings.company_name;

      // MAIL FROM
      await conn.write(encoder.encode(`MAIL FROM:<${fromEmail}>\r\n`));
      const mailFromResponse = await readResponse();
      console.log(`📥 MAIL FROM: ${mailFromResponse.trim()}`);

      // RCPT TO
      await conn.write(encoder.encode(`RCPT TO:<${emailData.clientEmail}>\r\n`));
      const rcptToResponse = await readResponse();
      console.log(`📥 RCPT TO: ${rcptToResponse.trim()}`);

      // DATA
      await conn.write(encoder.encode("DATA\r\n"));
      const dataResponse = await readResponse();
      console.log(`📥 DATA: ${dataResponse.trim()}`);

      // Construction de l'email
      const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36)}`;
      
      let emailMessage = `From: ${fromName} <${fromEmail}>\r\n`;
      emailMessage += `To: ${emailData.clientEmail}\r\n`;
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

      // Fin du message
      await conn.write(encoder.encode(".\r\n"));
      const endResponse = await readResponse();
      console.log(`📥 End Response: ${endResponse.trim()}`);

      // QUIT
      await conn.write(encoder.encode("QUIT\r\n"));
      const quitResponse = await readResponse();
      console.log(`📥 QUIT: ${quitResponse.trim()}`);

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
