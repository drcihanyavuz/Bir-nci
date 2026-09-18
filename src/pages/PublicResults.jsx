import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { SkeletonList } from '../components/Skeleton';

// Her yarışmada en fazla 3 kazanan olduğu için, ~20 yarışmalık bir
// "sayfa" yaklaşık 60 satıra denk gelir.
const ROWS_PER_PAGE = 60;

export default function PublicResults() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadPage = async (from) => {
    const { data } = await supabase
      .from('public_results')
      .select('*')
      .range(from, from + ROWS_PER_PAGE - 1);

    setHasMore((data ?? []).length === ROWS_PER_PAGE);
    return data ?? [];
  };

  useEffect(() => {
    loadPage(0).then((data) => {
      setRows(data);
      setLoading(false);
    });
  }, []);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const more = await loadPage(rows.length);
    setRows((prev) => [...prev, ...more]);
    setLoadingMore(false);
  };

  // Yarışmaya göre grupla
  const grouped = rows.reduce((acc, row) => {
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

      {loading && <SkeletonList count={4} />}

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

      {!loading && hasMore && (
        <button className="btn btn-ghost" onClick={handleLoadMore} disabled={loadingMore} style={{ marginTop: '1rem' }}>
          {loadingMore ? 'Yükleniyor...' : 'Daha fazla göster'}
        </button>
      )}
    </div>
  );
}
