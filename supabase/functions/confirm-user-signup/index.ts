
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
    const { userEmail } = await req.json();
    
    console.log('Confirming user signup for:', userEmail);

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

    // Confirm the user's email automatically
    const { data: userData, error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
      (await supabaseAdmin.from('profiles').select('id').eq('email', userEmail).single()).data?.id || '',
      { email_confirm: true }
    );

    if (confirmError) {
      console.error('Error confirming user:', confirmError);
      
      // Try alternative method - get user by email and confirm
      const { data: users, error: getUserError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (getUserError) {
        throw getUserError;
      }
      
      const user = users.users.find(u => u.email === userEmail);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      const { error: confirmError2 } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      );
      
      if (confirmError2) {
        throw confirmError2;
      }
    }

    console.log('User email confirmed successfully for:', userEmail);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User email confirmed successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in confirm-user-signup function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to confirm user signup' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
