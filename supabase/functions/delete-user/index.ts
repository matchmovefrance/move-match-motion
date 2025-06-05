
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
    const { userId } = await req.json();
    
    console.log('Deleting user:', userId);

    if (!userId) {
      console.error('Missing userId');
      return new Response(
        JSON.stringify({ success: false, error: 'ID utilisateur requis' }),
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

    console.log('Starting user deletion process...');

    // Delete user data in the correct order to avoid foreign key constraints
    
    // 1. Delete match_actions
    const { error: matchActionsError } = await supabaseAdmin
      .from('match_actions')
      .delete()
      .eq('user_id', userId);

    if (matchActionsError) {
      console.error('Error deleting match actions:', matchActionsError);
    }

    // 2. Delete public_links
    const { error: publicLinksError } = await supabaseAdmin
      .from('public_links')
      .delete()
      .eq('created_by', userId);

    if (publicLinksError) {
      console.error('Error deleting public links:', publicLinksError);
    }

    // 3. Delete move_matches related to user's moves and requests
    const { data: userMoves } = await supabaseAdmin
      .from('confirmed_moves')
      .select('id')
      .eq('created_by', userId);

    const { data: userRequests } = await supabaseAdmin
      .from('client_requests')
      .select('id')
      .eq('created_by', userId);

    if (userMoves && userMoves.length > 0) {
      const moveIds = userMoves.map(move => move.id);
      await supabaseAdmin
        .from('move_matches')
        .delete()
        .in('move_id', moveIds);
    }

    if (userRequests && userRequests.length > 0) {
      const requestIds = userRequests.map(req => req.id);
      await supabaseAdmin
        .from('move_matches')
        .delete()
        .in('client_request_id', requestIds);
    }

    // 4. Delete confirmed_moves
    const { error: movesError } = await supabaseAdmin
      .from('confirmed_moves')
      .delete()
      .eq('created_by', userId);

    if (movesError) {
      console.error('Error deleting confirmed moves:', movesError);
    }

    // 5. Delete trucks (related to user's movers)
    const { data: userMovers } = await supabaseAdmin
      .from('movers')
      .select('id')
      .eq('created_by', userId);

    if (userMovers && userMovers.length > 0) {
      const moverIds = userMovers.map(mover => mover.id);
      await supabaseAdmin
        .from('trucks')
        .delete()
        .in('mover_id', moverIds);
    }

    // 6. Delete movers
    const { error: moversError } = await supabaseAdmin
      .from('movers')
      .delete()
      .eq('created_by', userId);

    if (moversError) {
      console.error('Error deleting movers:', moversError);
    }

    // 7. Delete client_requests
    const { error: requestsError } = await supabaseAdmin
      .from('client_requests')
      .delete()
      .eq('created_by', userId);

    if (requestsError) {
      console.error('Error deleting client requests:', requestsError);
    }

    // 8. Delete clients
    const { error: clientsError } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('created_by', userId);

    if (clientsError) {
      console.error('Error deleting clients:', clientsError);
    }

    // 9. Delete service_providers
    const { error: providersError } = await supabaseAdmin
      .from('service_providers')
      .delete()
      .eq('created_by', userId);

    if (providersError) {
      console.error('Error deleting service providers:', providersError);
    }

    // 10. Delete profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
    }

    console.log('User data deleted successfully, now deleting auth user...');

    // 11. Finally, delete the auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      return new Response(
        JSON.stringify({ success: false, error: `Erreur lors de la suppression de l'authentification: ${authError.message}` }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log('User deleted completely from auth system');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Utilisateur supprimé avec succès de tous les systèmes'
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
