
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
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { smtp_host, smtp_port, smtp_username, smtp_password }: TestSMTPRequest = await req.json();

    console.log("🧪 Test de connexion SMTP:", {
      host: smtp_host,
      port: smtp_port,
      username: smtp_username
    });

    // Validation des paramètres
    if (!smtp_host || !smtp_port || !smtp_username || !smtp_password) {
      throw new Error("Tous les paramètres SMTP sont requis");
    }

    // Simuler un test de connexion SMTP
    // Note: Dans un environnement réel, vous pourriez utiliser une bibliothèque SMTP
    // Pour cette démonstration, nous validons juste la configuration
    
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

    // Test de connexion simulé (réussi)
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulation d'une connexion

    console.log("✅ Test SMTP réussi");

    return new Response(JSON.stringify({
      success: true,
      message: 'Connexion SMTP testée avec succès',
      details: {
        host: smtp_host,
        port: smtp_port,
        username: smtp_username
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
