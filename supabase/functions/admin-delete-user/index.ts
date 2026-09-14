// supabase/functions/admin-delete-user/index.ts
//
// Admin panelinden bir üyenin hesabını tamamen silmek için.
// auth.users'ı silmek Supabase'in kendi Auth yönetim API'sini
// gerektiriyor (service role ile), bu yüzden bir Edge Function
// gerekiyor. profiles ve ilişkili tüm veriler (participants,
// answers, chat_messages vb.) "on delete cascade" ile otomatik silinir.

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Giriş yapmalısınız' }), { status: 401, headers: jsonHeaders });
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Geçersiz oturum' }), { status: 401, headers: jsonHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Çağıranın gerçekten admin olduğunu doğrula
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return new Response(JSON.stringify({ error: 'Bu işlem için yetkiniz yok' }), { status: 403, headers: jsonHeaders });
    }

    const { target_user_id } = await req.json();

    if (!target_user_id) {
      return new Response(JSON.stringify({ error: 'target_user_id gerekli' }), { status: 400, headers: jsonHeaders });
    }

    if (target_user_id === user.id) {
      return new Response(JSON.stringify({ error: 'Kendi hesabınızı silemezsiniz' }), { status: 400, headers: jsonHeaders });
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(target_user_id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: jsonHeaders });
    }

    return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: jsonHeaders });
  }
});
