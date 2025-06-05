
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
    const { email, password, role = 'agent', company_name } = await req.json();
    
    console.log('Creating user with email:', email);

    if (!email || !password) {
      console.error('Missing email or password');
      return new Response(
        JSON.stringify({ success: false, error: 'Email et mot de passe requis' }),
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

    console.log('Creating user account...');

    // Create user with admin privileges
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password.trim(),
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: role,
        company_name: company_name || null
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      
      let errorMessage = 'Erreur lors de la création du compte';
      if (authError.message?.includes('already registered')) {
        errorMessage = 'Un utilisateur avec cette adresse email existe déjà';
      } else if (authError.message?.includes('password')) {
        errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      } else if (authError.message) {
        errorMessage = authError.message;
      }
      
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    if (!authData.user) {
      console.error('No user data returned');
      return new Response(
        JSON.stringify({ success: false, error: 'Aucune donnée utilisateur retournée' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log('User created successfully:', authData.user.id);

    // Create or update profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: email.trim().toLowerCase(),
        role: role,
        company_name: company_name || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      // Don't fail the entire operation for profile errors
      console.log('Continuing despite profile error...');
    } else {
      console.log('Profile created/updated successfully');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Utilisateur ${email} créé avec succès`,
        user_id: authData.user.id
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
