import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('public_leaderboard')
      .select('*')
      .order('points', { ascending: false })
      .order('full_name', { ascending: true })
      .then(({ data }) => {
        setRows(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="page">
      <h1>Liderlik Tablosu</h1>
      <p className="muted" style={{ marginTop: '0.5rem' }}>
        Tüm yarışmalar boyunca verilen doğru cevapların toplamına göre.
      </p>

      {loading && <p className="muted" style={{ marginTop: '1rem' }}>Yükleniyor...</p>}

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
        </div>
      )}
    </div>
  );
}
