/**
 * Edge Function: accept-invitation
 *
 * Fix para Bug #1 (RLS violation 42501):
 * El cliente anon no puede hacer INSERT en profiles para un usuario recién creado
 * porque la RLS policy lo bloquea antes de que la sesión esté completamente establecida.
 *
 * Esta función corre con el service_role key de Supabase, que bypasea RLS,
 * permitiendo crear el perfil del usuario invitado de forma segura.
 *
 * Flujo:
 * 1. Valida el token de invitación
 * 2. Crea el usuario en auth.users (admin)
 * 3. Crea el perfil en profiles (service_role, sin RLS)
 * 4. Actualiza la invitación a 'accepted'
 * 5. Enlaza partner_id de ambos usuarios
 * 6. Devuelve { userId } al cliente
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token, password, name } = await req.json();

    if (!token || !password || !name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: token, password, name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cliente con service_role — bypasea RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Buscar y validar la invitación
    const { data: invitation, error: invErr } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (invErr || !invitation) {
      return new Response(
        JSON.stringify({ error: 'Invitation not found or already used' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (invitation.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'This invitation has already been used' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar expiración
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'This invitation has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Crear usuario en auth.users (admin)
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true, // auto-confirmar email para el usuario invitado
    });

    if (authErr || !authData.user) {
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${authErr?.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUserId = authData.user.id;

    // 3. Crear perfil en profiles (service_role bypasea RLS — FIX del bug 42501)
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUserId,
        email: invitation.email,
        name,
        partner_id: invitation.inviter_id,
      });

    if (profileErr) {
      // Rollback: eliminar usuario creado
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: `Failed to create profile: ${profileErr.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Actualizar invitación a 'accepted'
    await supabaseAdmin
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('token', token);

    // 5. Enlazar partner_id del invitador
    await supabaseAdmin
      .from('profiles')
      .update({ partner_id: newUserId })
      .eq('id', invitation.inviter_id);

    // 6. Responder con userId
    return new Response(
      JSON.stringify({
        userId: newUserId,
        email: invitation.email,
        partnerId: invitation.inviter_id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Unexpected error in accept-invitation:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
