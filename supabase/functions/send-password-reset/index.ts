
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  tempPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, tempPassword }: PasswordResetRequest = await req.json();

    console.log(`Password reset requested for: ${email}`);

    // For now, we'll just log the password since we don't have Resend configured
    // In production, you would use Resend or another email service
    console.log(`New temporary password for ${email}: ${tempPassword}`);

    // Mock successful email sending
    const emailResponse = {
      id: `mock-${Date.now()}`,
      email: email,
      status: "sent"
    };

    console.log("Password reset email sent successfully (mock):", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
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
