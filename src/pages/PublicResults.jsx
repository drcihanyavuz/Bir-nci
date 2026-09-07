import { useEffect, useState } from 'react';
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
    (acc[row.competition_id] ??= { title: row.competition_title, start_time: row.start_time, rows: [] });
    acc[row.competition_id].rows.push(row);
    return acc;
  }, {});

  return (
    <div className="page">
      <h1>Yarışma sonuçları</h1>

      {loading && <p className="muted" style={{ marginTop: '1rem' }}>Yükleniyor...</p>}

      {!loading && Object.keys(grouped).length === 0 && (
        <div className="empty-state" style={{ marginTop: '1.5rem' }}>
          Henüz tamamlanmış bir yarışma yok.
        </div>
      )}

      {Object.values(grouped).map((comp) => (
        <div key={comp.title + comp.start_time} style={{ marginTop: '2rem' }}>
          <h2>{comp.title}</h2>
          <p className="muted">{new Date(comp.start_time).toLocaleString('tr-TR')}</p>

          <div style={{ marginTop: '0.75rem' }}>
            {comp.rows
              .sort((a, b) => a.rank - b.rank)
              .map((row) => (
                <div className="results-row" key={row.rank}>
                  <span className="rank-badge">{row.rank}.</span>
                  <span style={{ flex: 1 }}>{row.full_name}</span>
                  {row.prize && <span className="gold-text">{row.prize}</span>}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
