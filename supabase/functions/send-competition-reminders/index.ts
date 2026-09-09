// supabase/functions/send-competition-reminders/index.ts
//
// pg_cron (ya da Supabase Dashboard'daki Cron Jobs) tarafından her
// birkaç dakikada bir tetiklenmesi için tasarlandı. Başlangıcına 15
// dakikadan az kalmış ve daha önce hatırlatma gönderilmemiş
// yarışmaları bulur, katılımcılara Web Push bildirimi gönderir.

import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';

Deno.serve(async () => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  webpush.setVapidDetails(
    'mailto:destek@birincim.vercel.app',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!
  );

  const { data: targets, error } = await supabaseAdmin.rpc('get_push_reminder_targets');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!targets || targets.length === 0) {
    return new Response(JSON.stringify({ message: 'Hatırlatılacak yarışma yok' }));
  }

  const sentCompetitionIds = new Set<string>();

  for (const target of targets) {
    const subscription = {
      endpoint: target.endpoint,
      keys: { p256dh: target.p256dh, auth: target.auth_key },
    };

    const payload = JSON.stringify({
      title: `${target.competition_title} birazdan başlıyor!`,
      body: 'Hazır olmak için uygulamayı açmayı unutmayın.',
    });

    try {
      await webpush.sendNotification(subscription, payload);
    } catch (err) {
      // Abonelik artık geçersizse (tarayıcı silinmiş vb.) sessizce geç
      console.error('push gönderilemedi:', err);
    }

    if (!sentCompetitionIds.has(target.competition_id)) {
      sentCompetitionIds.add(target.competition_id);
      await supabaseAdmin.rpc('mark_reminder_sent', { p_competition_id: target.competition_id });
    }
  }

  return new Response(JSON.stringify({ sent: targets.length }));
});
