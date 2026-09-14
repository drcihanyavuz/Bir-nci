import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useLiveChannel(competitionId, { onReveal, onStats } = {}) {
  const channelRef = useRef(null);
  const onRevealRef = useRef(onReveal);
  const onStatsRef = useRef(onStats);

  useEffect(() => {
    onRevealRef.current = onReveal;
    onStatsRef.current = onStats;
  }, [onReveal, onStats]);

  useEffect(() => {
    if (!competitionId) return undefined;

    const channel = supabase.channel(`live-${competitionId}`, {
      config: { broadcast: { self: true } },
    });

    channel
      .on('broadcast', { event: 'reveal' }, ({ payload }) => {
        onRevealRef.current?.(payload);
      })
      .on('broadcast', { event: 'stats' }, ({ payload }) => {
        onStatsRef.current?.(payload);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [competitionId]);

  const sendReveal = useCallback((payload) => {
    channelRef.current?.send({ type: 'broadcast', event: 'reveal', payload });
  }, []);

  const sendStats = useCallback((payload) => {
    channelRef.current?.send({ type: 'broadcast', event: 'stats', payload });
  }, []);

  return { sendReveal, sendStats };
}
