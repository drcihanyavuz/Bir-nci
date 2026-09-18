import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { SkeletonList } from '../components/Skeleton';

const PAGE_SIZE = 50;

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadPage = async (from) => {
    const { data } = await supabase
      .from('public_leaderboard')
      .select('*')
      .order('points', { ascending: false })
      .order('full_name', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    setHasMore((data ?? []).length === PAGE_SIZE);
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

  return (
    <div className="page">
      <h1>Liderlik Tablosu</h1>
      <p className="muted" style={{ marginTop: '0.5rem' }}>
        Tüm yarışmalar boyunca verilen doğru cevapların toplamına göre.
      </p>

      {loading && <SkeletonList count={8} />}

      {!loading && (
        <div style={{ marginTop: '1.5rem' }}>
          {rows.map((row, index) => {
            const crown = index === 0 ? '👑 ' : index === 1 ? '🥈 ' : index === 2 ? '🥉 ' : '';
            return (
              <div className="results-row" key={row.user_id ?? index}>
                <span className="rank-badge">{index + 1}.</span>
                <span style={{ flex: 1 }}>{crown}{row.full_name || 'İsimsiz üye'}</span>
                <span className="gold-text">{row.points} puan</span>
              </div>
            );
          })}

          {hasMore && (
            <button className="btn btn-ghost" onClick={handleLoadMore} disabled={loadingMore} style={{ marginTop: '1rem' }}>
              {loadingMore ? 'Yükleniyor...' : 'Daha fazla göster'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
