// supabase/functions/send-competition-reminders/index.ts
//
// pg_cron tarafından her birkaç dakikada bir tetiklenmesi için tasarlandı.
// Başlangıcına 15 dakikadan az kalmış ve daha önce hatırlatma
// gönderilmemiş yarışmaları bulur, katılımcılara Resend üzerinden
// e-posta gönderir, sonra o yarışmayı "hatırlatma gönderildi" olarak işaretler.

import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async () => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const resendApiKey = Deno.env.get('RESEND_API_KEY');

  const { data: targets, error } = await supabaseAdmin.rpc('get_upcoming_reminder_targets');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!targets || targets.length === 0) {
    return new Response(JSON.stringify({ message: 'Hatırlatılacak yarışma yok' }));
  }

  // Aynı yarışmayı tekrar tekrar işaretlememek için grupla
  const sentCompetitionIds = new Set<string>();

  for (const target of targets) {
    if (resendApiKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'BirİNCİ <bildirim@birincim.vercel.app>',
          to: target.email,
          subject: `${target.competition_title} birazdan başlıyor!`,
          html: `<p>Merhaba ${target.full_name},</p>
                 <p><strong>${target.competition_title}</strong> adlı yarışma birazdan başlıyor.
                 Hazır olmak için uygulamayı açmayı unutmayın!</p>`,
        }),
      });
    }

    if (!sentCompetitionIds.has(target.competition_id)) {
      sentCompetitionIds.add(target.competition_id);
      await supabaseAdmin.rpc('mark_reminder_sent', { p_competition_id: target.competition_id });
    }
  }

  return new Response(JSON.stringify({ sent: targets.length }));
});
