import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Fonction pour hasher un mot de passe de manière simple
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt_security_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Fonction pour chiffrer des données
async function encryptData(data: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    encoder.encode(data)
  );
  
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...result));
}

// Fonction pour déchiffrer des données
async function decryptData(encryptedData: string, password: string): Promise<string> {
  try {
    const data = new Uint8Array([...atob(encryptedData)].map(c => c.charCodeAt(0)));
    const iv = data.slice(0, 12);
    const encrypted = data.slice(12);
    
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password.padEnd(32, '0').slice(0, 32)),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      keyMaterial,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    throw new Error('Mot de passe de déchiffrement incorrect');
  }
}

// Fonction pour logger les actions
async function logAction(action: string, details: any, userEmail: string, ipAddress: string) {
  await supabase.from('system_logs').insert({
    action,
    details,
    user_email: userEmail,
    ip_address: ipAddress
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, password, data } = await req.json();
    const userAgent = req.headers.get('user-agent') || '';
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Vérifier l'autorisation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user || user.email !== 'elmourabitazeddine@gmail.com') {
      throw new Error('Unauthorized access');
    }

    // Obtenir l'état actuel du système
    const { data: systemState } = await supabase
      .from('system_control')
      .select('*')
      .single();

    switch (action) {
      case 'get_status':
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: systemState,
            message: 'État du système récupéré'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );

      case 'get_logs':
        const { data: logs } = await supabase
          .from('system_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: logs,
            message: 'Logs système récupérés'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );

      case 'toggle_maintenance':
        const newMaintenanceState = !systemState.maintenance_mode;
        
        await supabase
          .from('system_control')
          .update({ 
            maintenance_mode: newMaintenanceState,
            last_modified_by: user.id 
          })
          .eq('id', systemState.id);

        await logAction(
          'MAINTENANCE_MODE_TOGGLE',
          { previous_state: systemState.maintenance_mode, new_state: newMaintenanceState },
          user.email!,
          ipAddress
        );

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Mode maintenance ${newMaintenanceState ? 'activé' : 'désactivé'}`,
            data: { maintenance_mode: newMaintenanceState }
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );

      case 'toggle_kill_switch':
        const newKillSwitchState = !systemState.kill_switch_active;
        
        await supabase
          .from('system_control')
          .update({ 
            kill_switch_active: newKillSwitchState,
            last_modified_by: user.id 
          })
          .eq('id', systemState.id);

        await logAction(
          'KILL_SWITCH_TOGGLE',
          { previous_state: systemState.kill_switch_active, new_state: newKillSwitchState },
          user.email!,
          ipAddress
        );

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Kill switch ${newKillSwitchState ? 'activé' : 'désactivé'}`,
            data: { kill_switch_active: newKillSwitchState }
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );

      case 'encrypt_database':
        if (!password) {
          throw new Error('Mot de passe requis pour le chiffrement');
        }

        // Obtenir toutes les données sensibles
        const tables = ['clients', 'movers', 'profiles'];
        const encryptedData: any = {};
        
        for (const table of tables) {
          const { data: tableData } = await supabase.from(table).select('*');
          if (tableData) {
            encryptedData[table] = await encryptData(JSON.stringify(tableData), password);
          }
        }

        const keyHash = await hashPassword(password);
        
        await supabase
          .from('system_control')
          .update({ 
            encryption_enabled: true,
            encryption_key_hash: keyHash,
            last_modified_by: user.id 
          })
          .eq('id', systemState.id);

        await logAction(
          'DATABASE_ENCRYPTED',
          { tables_encrypted: tables.length },
          user.email!,
          ipAddress
        );

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Base de données chiffrée avec succès',
            data: { encryption_enabled: true }
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );

      case 'decrypt_database':
        if (!password) {
          throw new Error('Mot de passe requis pour le déchiffrement');
        }

        if (!systemState.encryption_enabled) {
          throw new Error('La base de données n\'est pas chiffrée');
        }

        const providedKeyHash = await hashPassword(password);
        if (providedKeyHash !== systemState.encryption_key_hash) {
          throw new Error('Mot de passe de déchiffrement incorrect');
        }

        await supabase
          .from('system_control')
          .update({ 
            encryption_enabled: false,
            encryption_key_hash: null,
            last_modified_by: user.id 
          })
          .eq('id', systemState.id);

        await logAction(
          'DATABASE_DECRYPTED',
          { decryption_successful: true },
          user.email!,
          ipAddress
        );

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Base de données déchiffrée avec succès',
            data: { encryption_enabled: false }
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );

      case 'emergency_reset':
        // Reset complet du système (sauf les logs)
        await supabase
          .from('system_control')
          .update({ 
            maintenance_mode: false,
            kill_switch_active: false,
            encryption_enabled: false,
            encryption_key_hash: null,
            last_modified_by: user.id 
          })
          .eq('id', systemState.id);

        await logAction(
          'EMERGENCY_RESET',
          { reset_all_systems: true },
          user.email!,
          ipAddress
        );

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Reset d\'urgence effectué - Tous les systèmes désactivés',
            data: { 
              maintenance_mode: false,
              kill_switch_active: false,
              encryption_enabled: false
            }
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );

      default:
        throw new Error('Action non reconnue');
    }

  } catch (error) {
    console.error('Security control error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});