
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
  pdfBase64: string;
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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailData: QuoteEmailRequest = await req.json();
    const { clientName, clientEmail, quoteAmount, desiredDate, pdfBase64 } = emailData;

    console.log(`📧 Envoi d'email de devis pour: ${clientEmail}`);

    // Récupérer les paramètres de l'entreprise
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('*')
      .single();

    if (settingsError) {
      console.error("❌ Erreur lors de la récupération des paramètres:", settingsError);
    }

    const companySettings = settings || {
      company_name: 'MatchMove',
      company_email: 'contact@matchmove.fr',
      company_phone: '+33 1 23 45 67 89',
      company_address: 'France',
      smtp_enabled: false
    };

    // Préparer les données pour le script PHP
    const phpData = {
      clientName,
      clientEmail,
      quoteAmount,
      desiredDate,
      pdfBase64,
      companySettings
    };

    // URL de votre script PHP (à adapter selon votre domaine)
    const phpScriptUrl = `${Deno.env.get("SUPABASE_URL")?.replace('supabase.co', 'lovable.app') || 'http://localhost:3000'}/send-email.php`;
    
    console.log(`📤 Envoi vers script PHP: ${phpScriptUrl}`);

    // Appeler le script PHP
    const phpResponse = await fetch(phpScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(phpData)
    });

    if (!phpResponse.ok) {
      const errorText = await phpResponse.text();
      throw new Error(`Erreur PHP: ${phpResponse.status} - ${errorText}`);
    }

    const result = await phpResponse.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Erreur inconnue du script PHP');
    }

    console.log("✅ Email envoyé avec succès via PHP:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in send-quote-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
