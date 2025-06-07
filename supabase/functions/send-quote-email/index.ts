
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

const handler = async (req: Request): Promise<Response> => {
  console.log("🚀 === DÉBUT FUNCTION SEND-QUOTE-EMAIL ===");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📥 Réception de la requête...");
    
    if (req.method !== "POST") {
      throw new Error("Méthode non autorisée");
    }

    const emailData: QuoteEmailRequest = await req.json();
    console.log(`📧 Données reçues pour: ${emailData.clientEmail}`);
    console.log(`💰 Montant: ${emailData.quoteAmount}€`);

    // Validation des données
    if (!emailData.clientEmail || !emailData.quoteAmount) {
      throw new Error("Email ou montant manquant");
    }

    // Récupération des paramètres SMTP
    console.log("🔍 Récupération config SMTP...");
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('*')
      .single();

    if (settingsError || !settings) {
      console.error("❌ Erreur config:", settingsError);
      throw new Error("Configuration SMTP introuvable");
    }

    console.log(`⚙️ Config trouvée: ${settings.smtp_host}:${settings.smtp_port}`);

    // Validation des paramètres SMTP
    if (!settings.smtp_host || !settings.smtp_username || !settings.smtp_password) {
      throw new Error("Paramètres SMTP incomplets");
    }

    // Envoi de l'email
    console.log("📤 Début envoi email...");
    await sendEmail(emailData, settings);
    
    console.log("✅ Email envoyé avec succès!");
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Email envoyé avec succès'
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("💥 ERREUR:", error.message);
    console.error("📍 Stack:", error.stack);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || "Erreur inconnue"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

const sendEmail = async (emailData: QuoteEmailRequest, settings: any) => {
  console.log("🔌 Connexion SMTP...");
  
  let conn;
  try {
    // Connexion selon le type de sécurité
    if (settings.smtp_port === 465) {
      console.log("🔒 Connexion SSL/465");
      conn = await Deno.connectTls({
        hostname: settings.smtp_host,
        port: 465,
      });
    } else {
      console.log("🔌 Connexion TCP standard");
      conn = await Deno.connect({
        hostname: settings.smtp_host,
        port: settings.smtp_port,
      });
    }

    const reader = conn.readable.getReader();
    const writer = conn.writable.getWriter();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Fonction pour lire les réponses
    const readResponse = async (): Promise<string> => {
      const { value } = await reader.read();
      const response = decoder.decode(value);
      console.log(`📨 <--`, response.trim());
      return response;
    };

    // Fonction pour envoyer des commandes
    const sendCommand = async (command: string): Promise<string> => {
      console.log(`📤 -->`, command.trim());
      await writer.write(encoder.encode(command));
      return await readResponse();
    };

    // Processus SMTP
    console.log("👋 Lecture bannière...");
    let response = await readResponse();
    if (!response.startsWith('220')) {
      throw new Error(`Bannière invalide: ${response}`);
    }

    // EHLO
    response = await sendCommand(`EHLO ${settings.smtp_host}\r\n`);
    if (!response.startsWith('250')) {
      throw new Error(`EHLO échoué: ${response}`);
    }

    // STARTTLS si port 587
    if (settings.smtp_port === 587) {
      console.log("🔐 STARTTLS...");
      response = await sendCommand("STARTTLS\r\n");
      if (response.startsWith('220')) {
        // Fermer les streams actuels
        await reader.cancel();
        await writer.close();
        
        // Upgrade vers TLS
        const tlsConn = await Deno.startTls(conn, { hostname: settings.smtp_host });
        const tlsReader = tlsConn.readable.getReader();
        const tlsWriter = tlsConn.writable.getWriter();
        
        // Nouveau EHLO après TLS
        await tlsWriter.write(encoder.encode(`EHLO ${settings.smtp_host}\r\n`));
        const { value } = await tlsReader.read();
        console.log("📨 EHLO après TLS:", decoder.decode(value).trim());
        
        // Continuer avec les connexions TLS
        Object.assign(reader, tlsReader);
        Object.assign(writer, tlsWriter);
      }
    }

    // Authentification
    console.log("🔑 AUTH LOGIN...");
    response = await sendCommand("AUTH LOGIN\r\n");
    if (!response.startsWith('334')) {
      throw new Error(`AUTH LOGIN échoué: ${response}`);
    }

    // Username en base64
    const usernameB64 = btoa(settings.smtp_username);
    response = await sendCommand(`${usernameB64}\r\n`);
    if (!response.startsWith('334')) {
      throw new Error(`Username rejeté: ${response}`);
    }

    // Password en base64
    const passwordB64 = btoa(settings.smtp_password);
    response = await sendCommand(`${passwordB64}\r\n`);
    if (!response.startsWith('235')) {
      throw new Error(`Mot de passe rejeté: ${response}`);
    }

    console.log("✅ Authentification réussie");

    // Envoi du message
    console.log("📮 Envoi du message...");
    
    response = await sendCommand(`MAIL FROM:<${settings.smtp_username}>\r\n`);
    if (!response.startsWith('250')) {
      throw new Error(`MAIL FROM échoué: ${response}`);
    }

    response = await sendCommand(`RCPT TO:<${emailData.clientEmail}>\r\n`);
    if (!response.startsWith('250')) {
      throw new Error(`RCPT TO échoué: ${response}`);
    }

    response = await sendCommand("DATA\r\n");
    if (!response.startsWith('354')) {
      throw new Error(`DATA échoué: ${response}`);
    }

    // Construction du message HTML
    const subject = `Devis MatchMove - ${new Date(emailData.desiredDate).toLocaleDateString('fr-FR')}`;
    const fromName = settings.smtp_from_name || "MatchMove";
    
    const message = `From: ${fromName} <${settings.smtp_username}>
To: ${emailData.clientEmail}
Subject: ${subject}
MIME-Version: 1.0
Content-Type: text/html; charset=utf-8

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

    // Envoi du contenu
    await writer.write(encoder.encode(message));
    response = await sendCommand("\r\n.\r\n");
    if (!response.startsWith('250')) {
      throw new Error(`Envoi du message échoué: ${response}`);
    }

    // Fermeture
    await sendCommand("QUIT\r\n");
    await reader.cancel();
    await writer.close();
    conn.close();

    console.log("🎉 Email envoyé avec succès!");

  } catch (error) {
    console.error("❌ Erreur SMTP:", error);
    if (conn) {
      try { conn.close(); } catch {}
    }
    throw error;
  }
};

serve(handler);
