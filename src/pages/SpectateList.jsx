import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function SpectateList() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('competitions')
      .select('*')
      .in('status', ['scheduled', 'active', 'awaiting_tiebreak'])
      .order('start_time')
      .then(({ data }) => {
        setCompetitions(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="page">
      <h1>Yarışmayı izle</h1>
      <p className="muted" style={{ marginTop: '0.5rem' }}>
        Katılmasanız da soruları ve doğru cevapları canlı takip edebilirsiniz.
      </p>

      {loading && <p className="muted" style={{ marginTop: '1rem' }}>Yükleniyor...</p>}

      {!loading && competitions.length === 0 && (
        <div className="empty-state" style={{ marginTop: '1.5rem' }}>
          Şu an izlenebilecek bir yarışma yok.
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        {competitions.map((c) => (
          <div className="list-row" key={c.id}>
            <div>
              <div className="list-row-title">{c.title}</div>
              <div className="list-row-meta">
                {new Date(c.start_time).toLocaleString('tr-TR')}
              </div>
            </div>
            <Link to={`/spectate/${c.id}`} className="btn btn-ghost">
              İzle
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
