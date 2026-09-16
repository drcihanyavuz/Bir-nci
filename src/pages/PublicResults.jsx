import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function PublicResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('public_results')
      .select('*')
      .then(({ data }) => {
        setResults(data ?? []);
        setLoading(false);
      });
  }, []);

  // Yarışmaya göre grupla
  const grouped = results.reduce((acc, row) => {
    (acc[row.competition_id] ??= {
      title: row.competition_title,
      start_time: row.start_time,
      participantCount: row.participant_count,
      rows: [],
    });
    acc[row.competition_id].rows.push(row);
    return acc;
  }, {});

  return (
    <div className="page">
      <h1>🏆 Yarışma sonuçları</h1>

      {loading && <p className="muted" style={{ marginTop: '1rem' }}>Yükleniyor...</p>}

      {!loading && Object.keys(grouped).length === 0 && (
        <div className="empty-state" style={{ marginTop: '1.5rem' }}>
          Henüz tamamlanmış bir yarışma yok.
        </div>
      )}

      {Object.entries(grouped).map(([competitionId, comp]) => (
        <div key={competitionId} className="form-panel" style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2>{comp.title || 'İsimsiz yarışma'}</h2>
            <Link to={`/results/${competitionId}`} className="btn btn-ghost">
              Detaylar
            </Link>
          </div>
          <p className="muted" style={{ marginTop: '0.25rem' }}>
            {new Date(comp.start_time).toLocaleString('tr-TR')} · {comp.participantCount ?? '—'} katılımcı
          </p>

          <div style={{ marginTop: '0.75rem' }}>
            {comp.rows
              .sort((a, b) => a.rank - b.rank)
              .map((row) => {
                const medal = row.rank === 1 ? '👑' : row.rank === 2 ? '🥈' : '🥉';
                return (
                  <div className="results-row" key={row.rank}>
                    <span className="rank-badge">{medal} {row.rank}.</span>
                    <span style={{ flex: 1 }}>{row.full_name || 'İsimsiz üye'}</span>
                    {row.prize && <span className="gold-text">{row.prize}</span>}
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
