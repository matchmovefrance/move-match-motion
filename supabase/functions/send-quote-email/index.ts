
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
  
  try {
    // Connexion exactement comme dans test-smtp
    let connection;
    
    if (settings.smtp_port === 465) {
      console.log("🔒 Connexion SSL directe");
      connection = await Deno.connectTls({
        hostname: settings.smtp_host,
        port: settings.smtp_port,
      });
    } else {
      console.log("🔌 Connexion TCP puis STARTTLS");
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
      return decoder.decode(buffer.subarray(0, n || 0));
    };

    const sendCommand = async (command: string) => {
      console.log(`📤 ${command.trim()}`);
      await connection.write(encoder.encode(command));
      const response = await readResponse();
      console.log(`📥 ${response.trim()}`);
      return response;
    };

    // Workflow SMTP identique au test
    const welcome = await readResponse();
    if (!welcome.startsWith('220')) {
      throw new Error(`Erreur connexion: ${welcome}`);
    }

    await sendCommand(`EHLO ${settings.smtp_host}\r\n`);
    
    // STARTTLS si port 587
    if (settings.smtp_port === 587) {
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

    // Auth LOGIN
    await sendCommand("AUTH LOGIN\r\n");
    await sendCommand(`${btoa(settings.smtp_username)}\r\n`);
    const authResult = await sendCommand(`${btoa(settings.smtp_password)}\r\n`);
    
    if (!authResult.startsWith('235')) {
      throw new Error(`Auth failed: ${authResult}`);
    }

    // Envoi email
    await sendCommand(`MAIL FROM:<${settings.smtp_username}>\r\n`);
    await sendCommand(`RCPT TO:<${emailData.clientEmail}>\r\n`);
    await sendCommand("DATA\r\n");

    // Email HTML simple
    const subject = `Votre devis de déménagement - ${new Date(emailData.desiredDate).toLocaleDateString('fr-FR')}`;
    const fromName = settings.smtp_from_name || settings.company_name;
    
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
        .header { background: #22c55e; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .price { font-size: 24px; color: #22c55e; font-weight: bold; }
        .footer { background: #f5f5f5; padding: 15px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${settings.company_name}</h1>
        <p>Votre devis de déménagement</p>
    </div>
    <div class="content">
        <p>Bonjour ${emailData.clientName || 'Madame, Monsieur'},</p>
        
        <p>Voici votre devis personnalisé :</p>
        
        <div style="border: 2px solid #22c55e; padding: 15px; margin: 15px 0;">
            <h3>📋 Détails du déménagement</h3>
            <p><strong>Date souhaitée :</strong> ${new Date(emailData.desiredDate).toLocaleDateString('fr-FR')}</p>
            ${emailData.departureCity ? `<p><strong>Départ :</strong> ${emailData.departureCity}</p>` : ''}
            ${emailData.arrivalCity ? `<p><strong>Arrivée :</strong> ${emailData.arrivalCity}</p>` : ''}
            ${emailData.estimatedVolume ? `<p><strong>Volume :</strong> ${emailData.estimatedVolume} m³</p>` : ''}
            
            <div style="text-align: center; margin: 20px 0;">
                <div class="price">${emailData.quoteAmount.toFixed(2)} € TTC</div>
                <p>Montant du devis</p>
            </div>
        </div>
        
        <p>Ce devis est valable 30 jours.</p>
        <p>Pour toute question : ${settings.company_phone}</p>
        
        <p>Cordialement,<br>${settings.company_name}</p>
    </div>
    <div class="footer">
        <p>${settings.company_name} - ${settings.company_email}</p>
    </div>
</body>
</html>`;

    let emailMessage = `From: ${fromName} <${settings.smtp_username}>\r\n`;
    emailMessage += `To: ${emailData.clientEmail}\r\n`;
    emailMessage += `Subject: ${subject}\r\n`;
    emailMessage += `MIME-Version: 1.0\r\n`;
    emailMessage += `Content-Type: text/html; charset=utf-8\r\n\r\n`;
    emailMessage += htmlBody + '\r\n';

    await connection.write(encoder.encode(emailMessage));
    const endResult = await sendCommand(".\r\n");
    
    if (!endResult.startsWith('250')) {
      throw new Error(`Erreur envoi: ${endResult}`);
    }

    await sendCommand("QUIT\r\n");
    connection.close();

    console.log("✅ Email envoyé avec succès!");
    return { success: true };

  } catch (error) {
    console.error("❌ Erreur:", error);
    throw error;
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailData: QuoteEmailRequest = await req.json();
    console.log(`📧 Demande envoi devis: ${emailData.clientEmail}`);

    // Settings
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('*')
      .single();

    if (settingsError || !settings) {
      throw new Error("Configuration SMTP manquante");
    }

    // Envoi
    await sendQuoteEmail(emailData, settings);

    return new Response(JSON.stringify({
      success: true,
      message: 'Devis envoyé par email avec succès'
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ ERREUR:", error);
    
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
