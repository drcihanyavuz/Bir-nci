import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AdminPastCompetitions() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: comps } = await supabase
        .from('competitions')
        .select('*')
        .eq('status', 'finished')
        .order('start_time', { ascending: false });

      const { data: results } = await supabase.from('public_results').select('*');

      const enriched = await Promise.all(
        (comps ?? []).map(async (c) => {
          const { count } = await supabase
            .from('participants')
            .select('id', { count: 'exact', head: true })
            .eq('competition_id', c.id);

          const winners = (results ?? [])
            .filter((r) => r.competition_id === c.id)
            .sort((a, b) => a.rank - b.rank);

          return { ...c, participantCount: count ?? 0, winners };
        })
      );

      setCompetitions(enriched);
      setLoading(false);
    };

    load();
  }, []);

  return (
    <div className="page">
      <h1>Geçmiş yarışmalar</h1>

      {loading && <p className="muted" style={{ marginTop: '1rem' }}>Yükleniyor...</p>}

      {!loading && competitions.length === 0 && (
        <div className="empty-state" style={{ marginTop: '1.5rem' }}>
          Henüz tamamlanmış bir yarışma yok.
        </div>
      )}

      {competitions.map((c) => (
        <div className="form-panel" key={c.id} style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h2>{c.title}</h2>
            <span className="muted">{new Date(c.start_time).toLocaleString('tr-TR')}</span>
          </div>
          <p className="muted" style={{ marginTop: '0.25rem' }}>
            {c.participantCount} katılımcı
          </p>

          {c.winners.length > 0 ? (
            <div style={{ marginTop: '0.75rem' }}>
              {c.winners.map((w) => (
                <div className="results-row" key={w.rank}>
                  <span className="rank-badge">{w.rank}.</span>
                  <span style={{ flex: 1 }}>{w.full_name}</span>
                  {w.prize && <span className="gold-text">{w.prize}</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="muted" style={{ marginTop: '0.5rem' }}>Kazanan belirlenmedi.</p>
          )}
        </div>
      ))}
    </div>
  );
}
