import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

export default function AdminTiebreak() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await supabase
      .from('competitions')
      .select('*')
      .eq('status', 'awaiting_tiebreak')
      .order('start_time');
    setCompetitions(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleStart = async (competitionId) => {
    setError('');
    setStarting(competitionId);

    const { error } = await supabase.rpc('start_tiebreak_question', {
      p_competition_id: competitionId,
    });

    setStarting(null);

    if (error) {
      setError(error.message);
      return;
    }

    load();
  };

  return (
    <div className="page">
      <h1>Ek soru bekleyen yarışmalar</h1>

      {loading && <p className="muted">Yükleniyor...</p>}

      {!loading && competitions.length === 0 && (
        <div className="empty-state" style={{ marginTop: '1.5rem' }}>
          Şu an ek soru bekleyen bir yarışma yok.
        </div>
      )}

      {error && <p className="status-banner is-error">{error}</p>}

      {competitions.map((c) => (
        <div className="list-row" key={c.id}>
          <div className="list-row-title">{c.title}</div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to={`/admin/competitions/${c.id}/questions`} className="btn btn-ghost">
              Soru ekle
            </Link>
            <button
              className="btn btn-primary"
              onClick={() => handleStart(c.id)}
              disabled={starting === c.id}
            >
              {starting === c.id ? 'Başlatılıyor...' : 'Eklenen soruyu başlat'}
            </button>
          </div>
        </div>
      ))}

      <p className="muted" style={{ marginTop: '2rem' }}>
        Bir yarışma bu listede göründüğünde, önce "soru ekle"den yeni bir eleme sorusu
        ekleyin, sonra "eklenen soruyu başlat"a basın.
      </p>
    </div>
  );
}
