
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

const sendSMTPEmail = async (emailData: QuoteEmailRequest, settings: any) => {
  console.log("🚀 ENVOI EMAIL SMTP SIMPLIFIÉ");
  console.log(`📧 Destinataire: ${emailData.clientEmail}`);
  console.log(`🔧 Serveur: ${settings.smtp_host}:${settings.smtp_port}`);

  if (!settings.smtp_host || !settings.smtp_username || !settings.smtp_password) {
    throw new Error('Configuration SMTP incomplète');
  }

  try {
    let connection;
    
    // Connexion selon le port
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

    const readResponse = async (timeout = 10000) => {
      const buffer = new Uint8Array(1024);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout de lecture")), timeout);
      });
      
      const readPromise = connection.read(buffer);
      const n = await Promise.race([readPromise, timeoutPromise]);
      return decoder.decode(buffer.subarray(0, n || 0));
    };

    const sendCommand = async (command: string) => {
      console.log(`📤 Envoi: ${command.trim()}`);
      await connection.write(encoder.encode(command));
      const response = await readResponse();
      console.log(`📥 Réponse: ${response.trim()}`);
      return response;
    };

    // Handshake SMTP
    const welcome = await readResponse();
    console.log(`📥 Welcome: ${welcome.trim()}`);
    if (!welcome.startsWith('220')) {
      throw new Error(`Erreur welcome: ${welcome.trim()}`);
    }

    // EHLO
    const ehloResponse = await sendCommand(`EHLO ${settings.smtp_host}\r\n`);
    if (!ehloResponse.startsWith('250')) {
      throw new Error(`Erreur EHLO: ${ehloResponse.trim()}`);
    }

    // STARTTLS pour port 587
    if (settings.smtp_port === 587) {
      console.log("🔒 Activation STARTTLS...");
      const tlsResponse = await sendCommand("STARTTLS\r\n");
      if (tlsResponse.startsWith('220')) {
        const tlsConnection = await Deno.startTls(connection, { 
          hostname: settings.smtp_host 
        });
        connection.close();
        connection = tlsConnection;
        
        await sendCommand(`EHLO ${settings.smtp_host}\r\n`);
      }
    }

    // Authentification
    console.log("🔐 Authentification SMTP...");
    
    const authResponse = await sendCommand("AUTH LOGIN\r\n");
    if (!authResponse.startsWith('334')) {
      throw new Error(`Erreur AUTH LOGIN: ${authResponse.trim()}`);
    }

    const usernameB64 = btoa(settings.smtp_username);
    const userResponse = await sendCommand(`${usernameB64}\r\n`);
    if (!userResponse.startsWith('334')) {
      throw new Error(`Erreur username: ${userResponse.trim()}`);
    }

    const passwordB64 = btoa(settings.smtp_password);
    const passResponse = await sendCommand(`${passwordB64}\r\n`);
    if (!passResponse.startsWith('235')) {
      throw new Error(`Erreur authentification: ${passResponse.trim()}`);
    }

    console.log("✅ Authentification réussie!");

    // Envoi de l'email
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

    // Construction du message HTML complet avec le devis
    const subject = `Votre devis de déménagement du ${new Date(emailData.desiredDate).toLocaleDateString('fr-FR')}`;
    const fromName = settings.smtp_from_name || settings.company_name;
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; }
        .header { background-color: #22c55e; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; }
        .highlight { background-color: #f0fdf4; padding: 20px; border-left: 4px solid #22c55e; margin: 20px 0; }
        .quote-details { background-color: #ffffff; border: 2px solid #22c55e; padding: 25px; margin: 20px 0; border-radius: 8px; }
        .price-box { background-color: #f0fdf4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
        .price { font-size: 32px; font-weight: bold; color: #22c55e; }
        .section-title { color: #22c55e; font-size: 18px; font-weight: bold; margin-top: 25px; margin-bottom: 10px; }
        .detail-row { margin: 8px 0; }
        .detail-label { font-weight: bold; color: #666; }
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
        
        <div class="quote-details">
            <h2 style="color: #22c55e; text-align: center; margin-top: 0;">DEVIS DE DÉMÉNAGEMENT</h2>
            
            <div class="section-title">📋 INFORMATIONS CLIENT</div>
            ${emailData.clientName ? `<div class="detail-row"><span class="detail-label">Nom :</span> ${emailData.clientName}</div>` : ''}
            <div class="detail-row"><span class="detail-label">Email :</span> ${emailData.clientEmail}</div>
            ${emailData.clientPhone ? `<div class="detail-row"><span class="detail-label">Téléphone :</span> ${emailData.clientPhone}</div>` : ''}
            
            <div class="section-title">📍 DÉTAILS DU DÉMÉNAGEMENT</div>
            <div class="detail-row"><span class="detail-label">Date souhaitée :</span> ${new Date(emailData.desiredDate).toLocaleDateString('fr-FR')}</div>
            
            ${emailData.departureAddress || emailData.departureCity ? 
              `<div class="detail-row"><span class="detail-label">Adresse de départ :</span> ${emailData.departureAddress || ''} ${emailData.departurePostalCode || ''} ${emailData.departureCity || ''}</div>` : ''}
            
            ${emailData.arrivalAddress || emailData.arrivalCity ? 
              `<div class="detail-row"><span class="detail-label">Adresse d'arrivée :</span> ${emailData.arrivalAddress || ''} ${emailData.arrivalPostalCode || ''} ${emailData.arrivalCity || ''}</div>` : ''}
            
            ${emailData.estimatedVolume ? `<div class="detail-row"><span class="detail-label">Volume estimé :</span> ${emailData.estimatedVolume} m³</div>` : ''}
            
            <div class="price-box">
                <div class="section-title" style="margin-top: 0;">💰 MONTANT DU DEVIS</div>
                <div class="price">${emailData.quoteAmount.toFixed(2).replace('.', ',')} € TTC</div>
            </div>
        </div>
        
        <div class="highlight">
            <h3>✅ POURQUOI CHOISIR ${settings.company_name.toUpperCase()} ?</h3>
            <ul>
                <li>Solutions de déménagement professionnelles et personnalisées</li>
                <li>Équipe expérimentée et matériel de qualité</li>
                <li>Assurance tous risques incluse</li>
                <li>Devis transparent sans surprise</li>
                <li>Service client disponible 6j/7</li>
            </ul>
        </div>
        
        <p><strong>Conditions :</strong></p>
        <ul>
            <li>Ce devis est valable 30 jours à compter de sa date d'émission</li>
            <li>Les prix sont exprimés en euros TTC</li>
            <li>Une confirmation écrite est requise pour valider la prestation</li>
        </ul>
        
        <p>Pour toute question ou pour confirmer votre réservation, n'hésitez pas à nous contacter.</p>
        
        <p>Nous restons à votre disposition pour vous accompagner dans votre projet de déménagement.</p>
        
        <p>Cordialement,<br>L'équipe ${settings.company_name}</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p><strong>📞 Téléphone :</strong> ${settings.company_phone}<br>
            <strong>📧 Email :</strong> ${settings.company_email}<br>
            <strong>📍 Adresse :</strong> ${settings.company_address}</p>
        </div>
    </div>
    
    <div class="footer">
        <p>${settings.company_name} - Solutions de déménagement professionnelles<br>
        Votre satisfaction, notre priorité.</p>
        <p style="font-size: 12px; color: #999;">Devis généré le ${new Date().toLocaleDateString('fr-FR')}</p>
    </div>
</body>
</html>`;

    // Message email simple sans pièce jointe
    let emailMessage = `From: ${fromName} <${fromEmail}>\r\n`;
    emailMessage += `To: ${emailData.clientEmail}\r\n`;
    emailMessage += `Subject: ${subject}\r\n`;
    emailMessage += `MIME-Version: 1.0\r\n`;
    emailMessage += `Content-Type: text/html; charset=utf-8\r\n\r\n`;
    emailMessage += htmlContent + '\r\n';

    // Envoyer le message
    await connection.write(encoder.encode(emailMessage));
    const endResponse = await sendCommand(".\r\n");
    if (!endResponse.startsWith('250')) {
      throw new Error(`Erreur envoi message: ${endResponse.trim()}`);
    }

    await sendCommand("QUIT\r\n");
    connection.close();

    console.log("✅ EMAIL ENVOYÉ AVEC SUCCÈS!");
    return { success: true, method: 'SMTP_HTML' };

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
      message: 'Email envoyé avec succès (format HTML)',
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
