import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export function useMyParticipant(competitionId) {
  const { user } = useAuth();
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;

    supabase
      .from('participants')
      .select('*')
      .eq('competition_id', competitionId)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) {
          setParticipant(data);
          setLoading(false);
        }
      });

    const channel = supabase
      .channel(`participant-${competitionId}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'participants',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (active && payload.new.competition_id === competitionId) {
            setParticipant(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [competitionId, user]);

  return { participant, loading };
}
