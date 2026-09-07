import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';

export default function Home() {
  const { signOut } = useAuth();
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
    <>
      <header className="topbar">
        <div className="wordmark">
          Bir<em>İNCİ</em>
        </div>
        <div className="topbar-actions">
          <span className="balance-pill">✦ {profile?.inci_balance ?? '...'}</span>
          <Link to="/buy-inci">İnci satın al</Link>
          {profile?.is_admin && (
            <>
              <Link to="/admin/competitions/new">Admin paneli</Link>
              <Link to="/admin/tiebreak">Ek soru bekleyenler</Link>
            </>
          )}
          <button className="btn btn-ghost" onClick={signOut}>
            Çıkış yap
          </button>
        </div>
      </header>

      <div className="page">
        <h1>Yarışmalar</h1>

        {loading && <p className="muted">Yükleniyor...</p>}

        {!loading && competitions.length === 0 && (
          <div className="empty-state" style={{ marginTop: '1.5rem' }}>
            Şu an planlanmış bir yarışma yok. Yeni bir yarışma eklendiğinde burada görünecek.
          </div>
        )}

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
    </>
  );
}
