import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useCountdownTo } from '../hooks/useCountdownTo';

export default function JoinCompetition() {
  const { competitionId } = useParams();
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [competition, setCompetition] = useState(null);
  const navigate = useNavigate();
  const countdown = useCountdownTo(competition?.start_time);

  useEffect(() => {
    supabase
      .from('competitions')
      .select('id, title, start_time, status, entry_cost_inci, max_participants')
      .eq('id', competitionId)
      .single()
      .then(({ data }) => setCompetition(data));
  }, [competitionId]);

  const handleJoin = async () => {
    setError('');
    setJoining(true);

    const { error } = await supabase.rpc('join_competition', {
      p_competition_id: competitionId,
    });

    setJoining(false);

    if (error) {
      setError(error.message);
      return;
    }

    navigate(`/competitions/${competitionId}`);
  };

  const closed = competition && ['finished', 'cancelled'].includes(competition.status);

  return (
    <div className="stage">
      <h1>{competition?.title || 'Yarışmaya katıl'}</h1>
      <p className="muted" style={{ margin: '1rem 0 0.5rem' }}>
        Herkes aynı anda yarışır. Şimdi katılın, geri sayım bitince oda otomatik başlar.
      </p>
      {competition?.status === 'scheduled' && (
        <div className="stage-countdown" style={{ margin: '1.25rem 0' }}>
          {formatClock(countdown)}
        </div>
      )}
      <p className="muted" style={{ marginBottom: '2rem' }}>
        Katılım bedeli: {competition?.entry_cost_inci ?? '...'} inci
        {competition?.max_participants ? ` · Kontenjan: ${competition.max_participants}` : ''}
      </p>
      <button className="btn btn-primary" onClick={handleJoin} disabled={joining || closed}>
        {joining ? 'Katılınıyor...' : closed ? 'Bu yarışma kapandı' : 'Katıl ve odada bekle'}
      </button>
      {error && <p className="status-banner is-error">{error}</p>}
    </div>
  );
}

function formatClock(totalSeconds) {
  if (totalSeconds === null) return '...';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
