// supabase/functions/delete-account/index.ts
//
// Bir üyenin KENDİ hesabını silmesi için. Güvenlik: hangi hesabın
// silineceği asla istek gövdesinden alınmaz — sadece isteği yapan
// kişinin kendi JWT'sinden (Authorization header) çözülen kimliği
// kullanılır. Böylece biri başkasının hesabını silmeye çalışamaz.

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Giriş yapmalısınız' }), { status: 401, headers: corsHeaders });
    }

    // İsteği yapan kişinin kim olduğunu, kendi token'ından doğrula
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Oturum doğrulanamadı' }), { status: 401, headers: corsHeaders });
    }

    // Admin hesapları kendi kendini silemesin (yanlışlıkla tüm
    // yönetimi kaybetmeyi önlemek için)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Admin hesaplar bu şekilde silinemez.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), { status: 400, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
