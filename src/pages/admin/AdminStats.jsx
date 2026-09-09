import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AdminStats() {
  const [stats, setStats] = useState(null);
  const [topParticipants, setTopParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { count: memberCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      const { data: payments } = await supabase
        .from('payments')
        .select('amount_paid')
        .eq('status', 'completed');

      const totalRevenue = (payments ?? []).reduce((sum, p) => sum + Number(p.amount_paid), 0);

      const { count: competitionCount } = await supabase
        .from('competitions')
        .select('id', { count: 'exact', head: true });

      const { data: participantRows } = await supabase
        .from('participants')
        .select('user_id, profiles(full_name)');

      const counts = {};
      for (const row of participantRows ?? []) {
        const key = row.user_id;
        if (!counts[key]) counts[key] = { name: row.profiles?.full_name ?? 'Bilinmeyen üye', count: 0 };
        counts[key].count += 1;
      }
      const top = Object.values(counts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({ memberCount, totalRevenue, competitionCount });
      setTopParticipants(top);
      setLoading(false);
    };

    load();
  }, []);

  if (loading) return <div className="page">Yükleniyor...</div>;

  return (
    <div className="page">
      <h1>İstatistikler</h1>

      <div className="panel-grid" style={{ marginTop: '1.5rem' }}>
        <div className="form-panel">
          <p className="muted">Toplam üye</p>
          <h2 className="gold-text">{stats.memberCount}</h2>
        </div>
        <div className="form-panel">
          <p className="muted">Toplam gelir</p>
          <h2 className="gold-text">{stats.totalRevenue.toFixed(2)} TL</h2>
        </div>
        <div className="form-panel">
          <p className="muted">Toplam yarışma</p>
          <h2 className="gold-text">{stats.competitionCount}</h2>
        </div>
      </div>

      <h2 style={{ marginTop: '2rem' }}>En aktif yarışmacılar</h2>
      {topParticipants.length === 0 && (
        <p className="muted" style={{ marginTop: '0.5rem' }}>Henüz veri yok.</p>
      )}
      {topParticipants.map((p, i) => (
        <div className="results-row" key={i}>
          <span className="rank-badge">{i + 1}.</span>
          <span style={{ flex: 1 }}>{p.name}</span>
          <span className="muted">{p.count} yarışma</span>
        </div>
      ))}
    </div>
  );
}
