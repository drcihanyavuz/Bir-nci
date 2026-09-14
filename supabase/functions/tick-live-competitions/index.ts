// supabase/functions/tick-live-competitions/index.ts
//
// Canlı yarışmanın saatini istemcilerden bağımsız yürütür.
// Supabase Dashboard → Edge Functions → Schedules ile her 1 saniyede bir çağırın.
// Gerekirse CRON_SECRET ortam değişkeni ve x-cron-secret başlığı ekleyin.

import { createClient } from 'npm:@supabase/supabase-js@2';

const REVEAL_MS = 20_000;

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && req.headers.get('x-cron-secret') !== cronSecret) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: competitions, error } = await supabaseAdmin
    .from('competitions')
    .select('id, status, start_time, current_question_id, first_question_reveal_at')
    .in('status', ['scheduled', 'active']);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const now = Date.now();
  const ran: string[] = [];

  for (const competition of competitions ?? []) {
    if (competition.status === 'scheduled' && new Date(competition.start_time).getTime() <= now) {
      await supabaseAdmin.rpc('auto_start_competition', { p_competition_id: competition.id });
      ran.push(`start:${competition.id}`);
      continue;
    }

    if (competition.status === 'active' && !competition.current_question_id) {
      const revealAt = competition.first_question_reveal_at
        ? new Date(competition.first_question_reveal_at).getTime()
        : 0;
      if (revealAt <= now) {
        await supabaseAdmin.rpc('reveal_first_question', { p_competition_id: competition.id });
        ran.push(`lobby:${competition.id}`);
      }
      continue;
    }

    if (competition.status === 'active' && competition.current_question_id) {
      const { data: question } = await supabaseAdmin
        .from('questions')
        .select('id, question_ends_at')
        .eq('id', competition.current_question_id)
        .single();

      if (!question?.question_ends_at) continue;

      const endsAt = new Date(question.question_ends_at).getTime();

      if (now >= endsAt && now < endsAt + 3000) {
        const { data: reveal } = await supabaseAdmin.rpc('get_question_reveal', {
          p_question_id: question.id,
        });

        if (reveal) {
          const channel = supabaseAdmin.channel(`live-${competition.id}`);
          const joined = await new Promise<boolean>((resolve) => {
            const timeout = setTimeout(() => resolve(false), 1500);
            channel.subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                clearTimeout(timeout);
                resolve(true);
              }
            });
          });

          if (joined) {
            await channel.send({
              type: 'broadcast',
              event: 'reveal',
              payload: { questionId: question.id, rows: reveal },
            });
            const { data: activeCount } = await supabaseAdmin.rpc('get_active_participant_count', {
              p_competition_id: competition.id,
            });
            await channel.send({
              type: 'broadcast',
              event: 'stats',
              payload: { activeCount },
            });
          }

          await supabaseAdmin.removeChannel(channel);
        }
      }

      if (now >= endsAt + REVEAL_MS) {
        await supabaseAdmin.rpc('advance_competition', { p_competition_id: competition.id });
        ran.push(`advance:${competition.id}`);
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, ran }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
