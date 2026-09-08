import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useProfile } from '../hooks/useProfile';

export default function CompetitionList() {
  const { profile } = useProfile();
  const [competitions, setCompetitions] = useState([]);
  const [myParticipantRows, setMyParticipantRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: comps } = await supabase
        .from('competitions')
        .select('*')
        .in('status', ['scheduled', 'active', 'awaiting_tiebreak'])
        .order('start_time');

      const { data: myRows } = await supabase
        .from('participants')
        .select('competition_id');

      setCompetitions(comps ?? []);
      setMyParticipantRows(myRows ?? []);
      setLoading(false);
    };

    load();
  }, []);

  const hasJoined = (competitionId) =>
    myParticipantRows.some((r) => r.competition_id === competitionId);

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Yarışmalar</h1>
        <span className="balance-pill">✦ {profile?.inci_balance ?? '...'} inci</span>
      </div>

      {profile?.is_admin && (
        <p style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <Link to="/admin/competitions/new">Admin paneli</Link>
          <Link to="/admin/tiebreak">Ek soru bekleyenler</Link>
          <Link to="/admin/chat">Mesajlar</Link>
          <Link to="/admin/survey">Anket yönetimi</Link>
          <Link to="/admin/packages">İnci paketleri</Link>
        </p>
      )}

      {loading && <p className="muted" style={{ marginTop: '1.5rem' }}>Yükleniyor...</p>}

      {!loading && competitions.length === 0 && (
        <div className="empty-state" style={{ marginTop: '1.5rem' }}>
          Şu an planlanmış bir yarışma yok. Yeni bir yarışma eklendiğinde burada görünecek.
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        {competitions.map((c) => (
          <div className="list-row" key={c.id}>
            <div>
              <div className="list-row-title">{c.title}</div>
              <div className="list-row-meta">
                {new Date(c.start_time).toLocaleString('tr-TR')} · {c.entry_cost_inci} inci
              </div>
            </div>
            {hasJoined(c.id) ? (
              <Link to={`/competitions/${c.id}`} className="btn btn-primary">
                Odaya git
              </Link>
            ) : (
              <Link to={`/competitions/${c.id}/join`} className="btn btn-ghost">
                Katıl
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
