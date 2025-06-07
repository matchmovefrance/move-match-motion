
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
  console.log(`📧 Configuration SMTP utilisée:`, {
    host: settings.smtp_host,
    port: settings.smtp_port,
    username: settings.smtp_username,
    secure: settings.smtp_secure,
    from_name: settings.smtp_from_name
  });
  
  try {
    let connection;
    
    // Connexion EXACTEMENT comme dans test-smtp
    if (settings.smtp_port === 465) {
      console.log("🔒 Connexion SSL directe sur port 465");
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

    // Workflow SMTP identique au test-smtp
    const welcome = await readResponse();
    if (!welcome.startsWith('220')) {
      throw new Error(`Erreur connexion: ${welcome}`);
    }

    await sendCommand(`EHLO ${settings.smtp_host}\r\n`);
    
    // STARTTLS si port 587
    if (settings.smtp_port === 587) {
      const tlsResponse = await sendCommand("STARTTLS\r\n");
      if (tlsResponse.startsWith('220')) {
        console.log("🔒 Upgrade vers TLS...");
        const tlsConnection = await Deno.startTls(connection, { 
          hostname: settings.smtp_host 
        });
        connection.close();
        connection = tlsConnection;
        await sendCommand(`EHLO ${settings.smtp_host}\r\n`);
      }
    }

    // Authentification LOGIN
    console.log("🔐 Début authentification...");
    await sendCommand("AUTH LOGIN\r\n");
    
    console.log("👤 Envoi du nom d'utilisateur...");
    await sendCommand(`${btoa(settings.smtp_username)}\r\n`);
    
    console.log("🔑 Envoi du mot de passe...");
    const authResult = await sendCommand(`${btoa(settings.smtp_password)}\r\n`);
    
    if (!authResult.startsWith('235')) {
      console.error(`❌ Authentification échouée: ${authResult}`);
      throw new Error(`Auth failed: ${authResult}`);
    }
    
    console.log("✅ Authentification réussie!");

    // Envoi de l'email
    console.log("📬 Début envoi email...");
    await sendCommand(`MAIL FROM:<${settings.smtp_username}>\r\n`);
    await sendCommand(`RCPT TO:<${emailData.clientEmail}>\r\n`);
    await sendCommand("DATA\r\n");

    // Construction du message email
    const subject = `Votre devis de déménagement - ${new Date(emailData.desiredDate).toLocaleDateString('fr-FR')}`;
    const fromName = settings.smtp_from_name || settings.company_name || "MatchMove";
    
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #22c55e; color: white; padding: 20px; text-align: center; border-radius: 8px; }
        .content { padding: 20px; background: #f9f9f9; margin: 20px 0; border-radius: 8px; }
        .price { font-size: 24px; color: #22c55e; font-weight: bold; text-align: center; margin: 20px 0; }
        .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { background: #f5f5f5; padding: 15px; text-align: center; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${settings.company_name || 'MatchMove'}</h1>
        <p>Votre devis de déménagement</p>
    </div>
    <div class="content">
        <p>Bonjour ${emailData.clientName || 'Madame, Monsieur'},</p>
        
        <p>Voici votre devis personnalisé pour votre déménagement :</p>
        
        <div class="details">
            <h3>📋 Détails du déménagement</h3>
            <p><strong>Date souhaitée :</strong> ${new Date(emailData.desiredDate).toLocaleDateString('fr-FR')}</p>
            ${emailData.departureCity ? `<p><strong>Départ :</strong> ${emailData.departurePostalCode} ${emailData.departureCity}</p>` : ''}
            ${emailData.arrivalCity ? `<p><strong>Arrivée :</strong> ${emailData.arrivalPostalCode} ${emailData.arrivalCity}</p>` : ''}
            ${emailData.estimatedVolume ? `<p><strong>Volume estimé :</strong> ${emailData.estimatedVolume} m³</p>` : ''}
            ${emailData.clientPhone ? `<p><strong>Téléphone :</strong> ${emailData.clientPhone}</p>` : ''}
        </div>
        
        <div class="price">${emailData.quoteAmount.toFixed(2)} € TTC</div>
        
        <p><strong>Ce devis est valable 30 jours.</strong></p>
        <p>Pour toute question ou pour confirmer votre déménagement, n'hésitez pas à nous contacter :</p>
        <p>📞 ${settings.company_phone || 'Nous contacter'}</p>
        <p>📧 ${settings.company_email || 'contact@matchmove.fr'}</p>
        
        <p>Cordialement,<br><strong>${settings.company_name || 'MatchMove'}</strong></p>
    </div>
    <div class="footer">
        <p>${settings.company_name || 'MatchMove'} - ${settings.company_email || 'contact@matchmove.fr'}</p>
        <p style="font-size: 12px; color: #666;">Ce devis a été généré automatiquement le ${new Date().toLocaleDateString('fr-FR')}</p>
    </div>
</body>
</html>`;

    // Construction du message SMTP
    const emailMessage = [
      `From: ${fromName} <${settings.smtp_username}>`,
      `To: ${emailData.clientEmail}`,
      `Subject: =?UTF-8?B?${btoa(subject)}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      `Content-Transfer-Encoding: quoted-printable`,
      ``,
      htmlBody,
      ``
    ].join('\r\n');

    await connection.write(encoder.encode(emailMessage));
    const endResult = await sendCommand(".\r\n");
    
    if (!endResult.startsWith('250')) {
      console.error(`❌ Erreur envoi: ${endResult}`);
      throw new Error(`Erreur envoi: ${endResult}`);
    }

    console.log("✅ Email envoyé avec succès!");
    await sendCommand("QUIT\r\n");
    connection.close();

    return { success: true, message: "Email envoyé avec succès" };

  } catch (error) {
    console.error("❌ Erreur complète:", error);
    console.error("❌ Stack trace:", error.stack);
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
    console.log(`📧 Demande envoi devis pour: ${emailData.clientEmail}`);
    console.log(`💰 Montant: ${emailData.quoteAmount}€`);

    // Récupération des paramètres SMTP
    console.log("🔍 Récupération configuration SMTP...");
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('*')
      .single();

    if (settingsError) {
      console.error("❌ Erreur récupération paramètres:", settingsError);
      throw new Error(`Erreur configuration: ${settingsError.message}`);
    }

    if (!settings) {
      console.error("❌ Aucune configuration trouvée");
      throw new Error("Configuration SMTP manquante");
    }

    // Vérification des paramètres obligatoires
    if (!settings.smtp_host || !settings.smtp_username || !settings.smtp_password) {
      console.error("❌ Paramètres SMTP incomplets:", {
        host: !!settings.smtp_host,
        username: !!settings.smtp_username,
        password: !!settings.smtp_password
      });
      throw new Error("Configuration SMTP incomplète");
    }

    console.log("✅ Configuration SMTP récupérée");

    // Envoi de l'email
    const result = await sendQuoteEmail(emailData, settings);

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
    console.error("❌ Type:", typeof error);
    console.error("❌ Message:", error.message);
    console.error("❌ Stack:", error.stack);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || "Erreur inconnue lors de l'envoi de l'email"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
