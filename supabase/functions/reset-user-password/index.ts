
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  userId: string;
  userEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, userEmail }: PasswordResetRequest = await req.json();

    console.log(`Password reset requested for user: ${userId} (${userEmail})`);

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Generate a new temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
    
    console.log(`Generated temporary password for ${userEmail}`);

    // Update the user's password using admin privileges
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: tempPassword
    });

    if (error) {
      console.error('Password reset error:', error);
      throw error;
    }

    console.log('Password updated successfully for user:', userId);

    return new Response(JSON.stringify({
      success: true,
      tempPassword: tempPassword,
      message: `Password reset successfully for ${userEmail}`
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in reset-user-password function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
