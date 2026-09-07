import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useCompetition(competitionId) {
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase
      .from('competitions')
      .select('*')
      .eq('id', competitionId)
      .single()
      .then(({ data }) => {
        if (active) {
          setCompetition(data);
          setLoading(false);
        }
      });

    const channel = supabase
      .channel(`competition-${competitionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'competitions',
          filter: `id=eq.${competitionId}`,
        },
        (payload) => {
          if (active) setCompetition(payload.new);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [competitionId]);

  return { competition, loading };
}
