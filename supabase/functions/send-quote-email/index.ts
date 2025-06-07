
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

const sendQuoteEmail = async (emailData: QuoteEmailRequest, settings: any) => {
  console.log(`🚀 Envoi email de devis à: ${emailData.clientEmail}`);
  console.log(`📧 Configuration SMTP:`, {
    host: settings.smtp_host,
    port: settings.smtp_port,
    username: settings.smtp_username,
    secure: settings.smtp_secure
  });
  
  try {
    let connection;
    
    // Connexion identique au test-smtp qui fonctionne
    if (settings.smtp_port === 465) {
      console.log("🔒 Connexion SSL sur port 465");
      connection = await Deno.connectTls({
        hostname: settings.smtp_host,
        port: settings.smtp_port,
      });
    } else {
      console.log("🔌 Connexion TCP puis STARTTLS sur port", settings.smtp_port);
      connection = await Deno.connect({
        hostname: settings.smtp_host,
        port: settings.smtp_port,
      });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readResponse = async () => {
      const buffer = new Uint8Array(1024);
      const n = await connection.read(buffer);
      const response = decoder.decode(buffer.subarray(0, n || 0));
      console.log(`📥 ${response.trim()}`);
      return response;
    };

    const sendCommand = async (command: string) => {
      console.log(`📤 ${command.trim()}`);
      await connection.write(encoder.encode(command));
      return await readResponse();
    };

    // Protocol SMTP exactement comme test-smtp
    console.log("🔗 Initialisation connexion SMTP...");
    const welcome = await readResponse();
    if (!welcome.startsWith('220')) {
      throw new Error(`Erreur connexion SMTP: ${welcome}`);
    }

    console.log("👋 Envoi EHLO...");
    await sendCommand(`EHLO ${settings.smtp_host}\r\n`);
    
    // STARTTLS si port 587
    if (settings.smtp_port === 587) {
      console.log("🔒 Demande STARTTLS...");
      const tlsResponse = await sendCommand("STARTTLS\r\n");
      if (tlsResponse.startsWith('220')) {
        console.log("🔒 Upgrade vers TLS...");
        const tlsConnection = await Deno.startTls(connection, { 
          hostname: settings.smtp_host 
        });
        connection.close();
        connection = tlsConnection;
        console.log("🔒 TLS établi, nouvel EHLO...");
        await sendCommand(`EHLO ${settings.smtp_host}\r\n`);
      } else {
        console.error("❌ STARTTLS échoué:", tlsResponse);
        throw new Error(`STARTTLS failed: ${tlsResponse}`);
      }
    }

    // Authentification LOGIN identique au test
    console.log("🔐 Début authentification LOGIN...");
    const authStartResponse = await sendCommand("AUTH LOGIN\r\n");
    if (!authStartResponse.startsWith('334')) {
      throw new Error(`AUTH LOGIN failed: ${authStartResponse}`);
    }
    
    console.log("👤 Envoi username...");
    const usernameResponse = await sendCommand(`${btoa(settings.smtp_username)}\r\n`);
    if (!usernameResponse.startsWith('334')) {
      throw new Error(`Username failed: ${usernameResponse}`);
    }
    
    console.log("🔑 Envoi password...");
    const passwordResponse = await sendCommand(`${btoa(settings.smtp_password)}\r\n`);
    if (!passwordResponse.startsWith('235')) {
      console.error(`❌ Authentification échouée: ${passwordResponse}`);
      throw new Error(`Password failed: ${passwordResponse}`);
    }
    
    console.log("✅ Authentification réussie!");

    // Envoi de l'email
    console.log("📬 Début envoi email...");
    await sendCommand(`MAIL FROM:<${settings.smtp_username}>\r\n`);
    await sendCommand(`RCPT TO:<${emailData.clientEmail}>\r\n`);
    await sendCommand("DATA\r\n");

    // Construction email HTML
    const subject = `Votre devis de déménagement - ${new Date(emailData.desiredDate).toLocaleDateString('fr-FR')}`;
    const fromName = settings.smtp_from_name || settings.company_name || "MatchMove";
    
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${settings.company_name || 'MatchMove'}</h1>
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
            
            <p style="color: #374151;">Pour toute question ou pour confirmer votre déménagement, n'hésitez pas à nous contacter :</p>
            <p style="color: #374151;">
                📞 ${settings.company_phone || 'Nous contacter'}<br>
                📧 ${settings.company_email || 'contact@matchmove.fr'}
            </p>
            
            <p style="color: #374151;">Cordialement,<br><strong>${settings.company_name || 'MatchMove'}</strong></p>
        </div>
        
        <div class="footer">
            <p style="margin: 0;">${settings.company_name || 'MatchMove'} - ${settings.company_email || 'contact@matchmove.fr'}</p>
            <p style="margin: 5px 0 0 0; font-size: 12px;">Devis généré automatiquement le ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
    </div>
</body>
</html>`;

    // Construction message SMTP avec encodage UTF-8 correct
    const emailMessage = [
      `From: ${fromName} <${settings.smtp_username}>`,
      `To: ${emailData.clientEmail}`,
      `Subject: =?UTF-8?B?${btoa(subject)}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      htmlBody,
      ``
    ].join('\r\n');

    console.log("📤 Envoi du contenu email...");
    await connection.write(encoder.encode(emailMessage));
    
    console.log("🏁 Finalisation envoi...");
    const endResult = await sendCommand(".\r\n");
    
    if (!endResult.startsWith('250')) {
      console.error(`❌ Erreur envoi final: ${endResult}`);
      throw new Error(`Erreur envoi final: ${endResult}`);
    }

    console.log("✅ Email envoyé avec succès!");
    await sendCommand("QUIT\r\n");
    connection.close();

    return { success: true, message: "Email envoyé avec succès" };

  } catch (error) {
    console.error("❌ Erreur envoi email:", error);
    throw error;
  }
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

    // Récupération paramètres SMTP
    console.log("🔍 Récupération configuration SMTP...");
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('*')
      .single();

    if (settingsError || !settings) {
      console.error("❌ Erreur configuration SMTP:", settingsError);
      throw new Error("Configuration SMTP introuvable");
    }

    // Validation paramètres SMTP obligatoires
    const requiredFields = ['smtp_host', 'smtp_username', 'smtp_password'];
    const missingFields = requiredFields.filter(field => !settings[field]);
    
    if (missingFields.length > 0) {
      console.error("❌ Paramètres SMTP manquants:", missingFields);
      throw new Error(`Paramètres SMTP manquants: ${missingFields.join(', ')}`);
    }

    console.log("✅ Configuration SMTP valide");

    // Envoi email
    await sendQuoteEmail(emailData, settings);

    console.log("🌟 === EMAIL ENVOYÉ AVEC SUCCÈS ===");
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Devis envoyé par email avec succès'
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
