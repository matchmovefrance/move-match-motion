
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientName, clientEmail, quoteAmount, desiredDate, pdfBase64 }: QuoteEmailRequest = await req.json();

    console.log(`Envoi d'email de devis pour: ${clientEmail}`);

    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background-color: #22c55e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f8f9fa; padding: 15px; text-align: center; color: #666; }
          .highlight { background-color: #f0fdf4; padding: 15px; border-left: 4px solid #22c55e; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MatchMove</h1>
          <p>Solutions de déménagement professionnelles</p>
        </div>
        
        <div class="content">
          <p>Bonjour ${clientName || 'Madame, Monsieur'},</p>
          
          <p>Nous avons le plaisir de vous transmettre votre devis personnalisé pour votre projet de déménagement.</p>
          
          <div class="highlight">
            <h3>📋 DÉTAILS DE VOTRE DEMANDE :</h3>
            <ul>
              <li><strong>Date souhaitée :</strong> ${new Date(desiredDate).toLocaleDateString('fr-FR')}</li>
              <li><strong>Montant du devis :</strong> ${quoteAmount.toFixed(2).replace('.', ',')} € TTC</li>
            </ul>
          </div>
          
          <p>📎 Vous trouverez en pièce jointe votre devis détaillé au format PDF.</p>
          
          <div class="highlight">
            <h3>✅ POURQUOI CHOISIR MATCHMOVE ?</h3>
            <ul>
              <li>Solutions de déménagement professionnelles et personnalisées</li>
              <li>Équipe expérimentée et matériel de qualité</li>
              <li>Assurance tous risques incluse</li>
              <li>Devis transparent sans surprise</li>
              <li>Service client disponible 6j/7</li>
            </ul>
          </div>
          
          <p>Ce devis est valable 30 jours à compter de sa date d'émission. Pour toute question ou pour confirmer votre réservation, n'hésitez pas à nous contacter.</p>
          
          <p>Nous restons à votre disposition pour vous accompagner dans votre projet de déménagement.</p>
          
          <p>Cordialement,<br>L'équipe MatchMove</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p><strong>📞 Téléphone :</strong> +33 1 23 45 67 89<br>
            <strong>📧 Email :</strong> contact@matchmove.fr<br>
            <strong>🌐 Site web :</strong> www.matchmove.fr</p>
          </div>
        </div>
        
        <div class="footer">
          <p>MatchMove SAS - Solutions de déménagement professionnelles<br>
          Votre satisfaction, notre priorité.</p>
        </div>
      </body>
      </html>
    `;

    // Convertir le base64 en buffer pour l'attachement
    const pdfBuffer = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));

    const emailResponse = await resend.emails.send({
      from: "MatchMove déménagements solutions <noreply@matchmove.fr>",
      to: [clientEmail],
      subject: `Votre devis de déménagement du ${new Date(desiredDate).toLocaleDateString('fr-FR')}`,
      html: emailContent,
      attachments: [
        {
          filename: `devis_${clientName?.replace(/\s+/g, '_') || 'client'}_${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    console.log("Email de devis envoyé avec succès:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-quote-email function:", error);
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
