import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Not: Bu hook önceden Supabase Realtime (WebSocket) kullanıyordu.
// 1000+ eşzamanlı oyuncuda Supabase'in eşzamanlı bağlantı sınırına
// (ücretsiz planda 200) takılmamak için, her 2 saniyede bir normal
// bir sorguyla durumu kontrol eden (polling) yönteme çevrildi. Sunucu
// tarafı zaten cron ile ilerlediği için 2 saniyelik gecikme oyunu
// etkilemiyor.
export function useCompetition(competitionId) {
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!competitionId) return;
    let active = true;

    const fetchCompetition = () => {
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
    };

    fetchCompetition();
    const interval = setInterval(fetchCompetition, 2000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [competitionId]);

  return { competition, loading };
}
