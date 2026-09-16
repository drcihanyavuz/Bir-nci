import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

// Not: Realtime yerine polling — bkz. useCompetition.js'teki açıklama.
export function useMyParticipant(competitionId) {
  const { user } = useAuth();
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !competitionId) return;
    let active = true;

    const fetchParticipant = () => {
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
    };

    fetchParticipant();
    const interval = setInterval(fetchParticipant, 2000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [competitionId, user]);

  return { participant, loading };
}
