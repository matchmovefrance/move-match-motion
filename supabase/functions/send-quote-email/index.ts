
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
  clientPhone?: string;
  departureAddress?: string;
  departurePostalCode?: string;
  departureCity?: string;
  arrivalAddress?: string;
  arrivalPostalCode?: string;
  arrivalCity?: string;
  estimatedVolume?: number;
}

const sendEmailViaSMTP = async (emailData: QuoteEmailRequest, settings: any) => {
  console.log(`📧 Tentative d'envoi à: ${emailData.clientEmail}`);
  console.log(`⚙️ Host: ${settings.smtp_host}, Port: ${settings.smtp_port}`);
  
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  let connection;
  
  try {
    // Connexion selon le port
    if (settings.smtp_port === 465) {
      console.log("🔒 Connexion SSL directe...");
      connection = await Deno.connectTls({
        hostname: settings.smtp_host,
        port: settings.smtp_port,
      });
    } else {
      console.log("🔌 Connexion TCP standard...");
      connection = await Deno.connect({
        hostname: settings.smtp_host,
        port: settings.smtp_port,
      });
    }

    const readResponse = async () => {
      const buffer = new Uint8Array(4096);
      const n = await connection.read(buffer);
      const response = decoder.decode(buffer.subarray(0, n || 0));
      console.log(`📨 Reçu: ${response.trim()}`);
      return response;
    };

    const sendCommand = async (command: string) => {
      console.log(`📤 Envoi: ${command.trim()}`);
      await connection.write(encoder.encode(command));
      return await readResponse();
    };

    // Lecture du message de bienvenue
    const welcome = await readResponse();
    if (!welcome.startsWith('220')) {
      throw new Error(`Connexion refusée: ${welcome}`);
    }

    // EHLO
    const ehloResponse = await sendCommand(`EHLO ${settings.smtp_host}\r\n`);
    if (!ehloResponse.startsWith('250')) {
      throw new Error(`EHLO failed: ${ehloResponse}`);
    }

    // STARTTLS si port 587
    if (settings.smtp_port === 587) {
      console.log("🔐 Initialisation STARTTLS...");
      const startTlsResponse = await sendCommand("STARTTLS\r\n");
      if (startTlsResponse.startsWith('220')) {
        const tlsConn = await Deno.startTls(connection, { 
          hostname: settings.smtp_host 
        });
        connection.close();
        connection = tlsConn;
        
        // Nouveau EHLO après TLS
        await sendCommand(`EHLO ${settings.smtp_host}\r\n`);
      }
    }

    // Authentification
    console.log("🔑 Authentification...");
    let authResponse = await sendCommand("AUTH LOGIN\r\n");
    if (!authResponse.startsWith('334')) {
      throw new Error(`AUTH LOGIN failed: ${authResponse}`);
    }

    // Username
    const usernameB64 = btoa(settings.smtp_username);
    authResponse = await sendCommand(`${usernameB64}\r\n`);
    if (!authResponse.startsWith('334')) {
      throw new Error(`Username rejected: ${authResponse}`);
    }

    // Password
    const passwordB64 = btoa(settings.smtp_password);
    authResponse = await sendCommand(`${passwordB64}\r\n`);
    if (!authResponse.startsWith('235')) {
      throw new Error(`Password rejected: ${authResponse}`);
    }

    console.log("✅ Authentification réussie!");

    // Envoi du mail
    await sendCommand(`MAIL FROM:<${settings.smtp_username}>\r\n`);
    await sendCommand(`RCPT TO:<${emailData.clientEmail}>\r\n`);
    await sendCommand("DATA\r\n");

    // Construction du message
    const subject = `Devis MatchMove - ${new Date(emailData.desiredDate).toLocaleDateString('fr-FR')}`;
    const fromName = settings.smtp_from_name || "MatchMove";
    
    const emailContent = `From: ${fromName} <${settings.smtp_username}>
To: ${emailData.clientEmail}
Subject: ${subject}
MIME-Version: 1.0
Content-Type: text/html; charset=utf-8
Content-Transfer-Encoding: 8bit

<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">${settings.company_name || 'MatchMove'}</h1>
    <p style="margin: 10px 0 0 0; font-size: 18px;">Votre devis de déménagement</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e5e5e5;">
    <p style="font-size: 18px;">Bonjour ${emailData.clientName},</p>
    
    <p>Nous avons le plaisir de vous transmettre votre devis personnalisé :</p>
    
    <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
      <div style="font-size: 32px; color: #22c55e; font-weight: bold;">${emailData.quoteAmount.toLocaleString('fr-FR')} € TTC</div>
      <p style="margin: 10px 0 0 0; color: #16a34a;">Devis valable 30 jours</p>
    </div>
    
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0;">📋 Détails du déménagement</h3>
      <p><strong>Date souhaitée :</strong> ${new Date(emailData.desiredDate).toLocaleDateString('fr-FR')}</p>
      ${emailData.departureCity ? `<p><strong>Départ :</strong> ${emailData.departurePostalCode || ''} ${emailData.departureCity}</p>` : ''}
      ${emailData.arrivalCity ? `<p><strong>Arrivée :</strong> ${emailData.arrivalPostalCode || ''} ${emailData.arrivalCity}</p>` : ''}
      ${emailData.estimatedVolume ? `<p><strong>Volume estimé :</strong> ${emailData.estimatedVolume} m³</p>` : ''}
    </div>
    
    <p>Pour toute question, n'hésitez pas à nous contacter :</p>
    <p>📞 ${settings.company_phone || 'Nous contacter'}<br>📧 ${settings.company_email || 'contact@matchmove.fr'}</p>
    
    <p>Cordialement,<br><strong>${settings.company_name || 'MatchMove'}</strong></p>
  </div>
</body>
</html>
`;

    await connection.write(encoder.encode(emailContent));
    const endResponse = await sendCommand("\r\n.\r\n");
    
    if (!endResponse.startsWith('250')) {
      throw new Error(`Envoi échoué: ${endResponse}`);
    }

    await sendCommand("QUIT\r\n");
    connection.close();

    console.log("🎉 Email envoyé avec succès!");
    return { success: true };

  } catch (error) {
    console.error("❌ Erreur SMTP:", error);
    if (connection) {
      try { connection.close(); } catch {}
    }
    throw error;
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 === DÉBUT ENVOI EMAIL ===");
    
    const emailData: QuoteEmailRequest = await req.json();
    console.log(`📧 Destinataire: ${emailData.clientEmail}`);
    console.log(`💰 Montant: ${emailData.quoteAmount}€`);

    // Récupération config SMTP
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('*')
      .single();

    if (settingsError || !settings) {
      console.error("❌ Config SMTP introuvable:", settingsError);
      throw new Error("Configuration SMTP non trouvée");
    }

    // Validation
    if (!settings.smtp_host || !settings.smtp_username || !settings.smtp_password) {
      throw new Error("Paramètres SMTP incomplets");
    }

    console.log("✅ Configuration valide, envoi en cours...");

    await sendEmailViaSMTP(emailData, settings);

    return new Response(JSON.stringify({
      success: true,
      message: 'Email envoyé avec succès'
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("💥 ERREUR FINALE:", error.message);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
