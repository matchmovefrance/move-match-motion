
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TestSMTPRequest {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_secure?: boolean;
  smtp_auth_method?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      smtp_host, 
      smtp_port, 
      smtp_username, 
      smtp_password,
      smtp_secure = true,
      smtp_auth_method = 'LOGIN'
    }: TestSMTPRequest = await req.json();

    console.log("🧪 Test de connexion SMTP:", {
      host: smtp_host,
      port: smtp_port,
      username: smtp_username,
      secure: smtp_secure,
      auth_method: smtp_auth_method
    });

    // Validation des paramètres
    if (!smtp_host || !smtp_port || !smtp_username || !smtp_password) {
      throw new Error("Tous les paramètres SMTP sont requis");
    }

    // Vérification basique du format d'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(smtp_username)) {
      throw new Error("Le nom d'utilisateur SMTP doit être une adresse email valide");
    }

    // Vérification du port
    if (smtp_port < 1 || smtp_port > 65535) {
      throw new Error("Le port SMTP doit être entre 1 et 65535");
    }

    // Vérification de l'hôte
    if (!smtp_host.includes('.')) {
      throw new Error("L'hôte SMTP ne semble pas valide");
    }

    // Test de connexion réel
    console.log(`🔌 Tentative de connexion à ${smtp_host}:${smtp_port}`);

    const connectOptions: any = {
      hostname: smtp_host,
      port: smtp_port,
    };

    // Si le port est 465 (SSL) ou smtp_secure est true, utiliser TLS
    if (smtp_port === 465 || smtp_secure) {
      connectOptions.transport = 'tls';
    }

    let conn;
    try {
      conn = await Deno.connect(connectOptions);
      console.log("✅ Connexion TCP établie");

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      // Lire le message de bienvenue
      const buffer = new Uint8Array(1024);
      const n = await conn.read(buffer);
      const welcome = decoder.decode(buffer.subarray(0, n || 0));
      console.log(`📥 Welcome: ${welcome.trim()}`);

      if (!welcome.startsWith('220')) {
        throw new Error(`Réponse SMTP inattendue: ${welcome.trim()}`);
      }

      // Test EHLO
      await conn.write(encoder.encode(`EHLO test.client\r\n`));
      const ehloBuffer = new Uint8Array(1024);
      const ehloN = await conn.read(ehloBuffer);
      const ehloResponse = decoder.decode(ehloBuffer.subarray(0, ehloN || 0));
      console.log(`📥 EHLO: ${ehloResponse.trim()}`);

      conn.close();
      console.log("✅ Test de connexion SMTP réussi");

    } catch (error) {
      if (conn) {
        try {
          conn.close();
        } catch (e) {
          // Ignorer les erreurs de fermeture
        }
      }
      throw new Error(`Erreur de connexion SMTP: ${error.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Connexion SMTP testée avec succès sur ${smtp_host}:${smtp_port}`,
      details: {
        host: smtp_host,
        port: smtp_port,
        username: smtp_username,
        secure: smtp_secure,
        auth_method: smtp_auth_method
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("❌ Erreur test SMTP:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
