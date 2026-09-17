// supabase/functions/send-chat-notification/index.ts
//
// Admin bir üyeye sohbetten mesaj yazınca, veritabanındaki bir
// tetikleyici (trigger) bu fonksiyonu çağırır. Fonksiyon, o üyenin
// kayıtlı push aboneliklerine (varsa) bir bildirim gönderir.

import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, message } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id gerekli' }), { status: 400, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    webpush.setVapidDetails(
      'mailto:destek@birincim.vercel.app',
      Deno.env.get('VAPID_PUBLIC_KEY')!,
      Deno.env.get('VAPID_PRIVATE_KEY')!
    );

    const { data: subs } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id);

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ message: 'Bu üyenin bildirim aboneliği yok' }), { headers: corsHeaders });
    }

    const payload = JSON.stringify({
      title: 'BirİNCİ — Yeni mesaj',
      body: (message || 'Size yeni bir mesaj geldi.').slice(0, 120),
    });

    let sent = 0;
    for (const sub of subs) {
      const subscription = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } };
      try {
        await webpush.sendNotification(subscription, payload);
        sent++;
      } catch (err) {
        console.error('push gönderilemedi:', err);
      }
    }

    return new Response(JSON.stringify({ sent }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
