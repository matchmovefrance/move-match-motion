
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, userEmail } = await req.json();
    
    console.log('Resetting password for user:', userId, userEmail);

    if (!userId || !userEmail) {
      console.error('Missing userId or userEmail');
      return new Response(
        JSON.stringify({ success: false, error: 'ID utilisateur et email requis' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Create Supabase admin client
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

    // Generate a secure temporary password
    const tempPassword = generateSecurePassword();
    
    console.log('Generated secure temp password, updating user...');

    // Update user password using admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        password: tempPassword,
        email_confirm: true // Ensure email remains confirmed
      }
    );

    if (authError) {
      console.error('Error updating password:', authError);
      return new Response(
        JSON.stringify({ success: false, error: `Erreur lors de la mise à jour du mot de passe: ${authError.message}` }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    if (!authData.user) {
      console.error('No user data returned after password update');
      return new Response(
        JSON.stringify({ success: false, error: 'Aucune donnée utilisateur retournée après la mise à jour' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log('Password reset successfully for user:', authData.user.email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        tempPassword: tempPassword,
        message: `Mot de passe réinitialisé pour ${userEmail}. L'utilisateur peut maintenant se connecter avec ce nouveau mot de passe.`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erreur interne du serveur' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// Function to generate a secure password
function generateSecurePassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  
  // Ensure at least one of each type
  password += "A"; // Uppercase
  password += "a"; // Lowercase  
  password += "1"; // Number
  password += "!"; // Special char
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
