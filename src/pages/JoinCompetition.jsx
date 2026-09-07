import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function JoinCompetition() {
  const { competitionId } = useParams();
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();

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

  return (
    <div className="stage">
      <h1>Yarışmaya katıl</h1>
      <p className="muted" style={{ margin: '1rem 0 2rem' }}>
        Katılım için gerekli inci bakiyeniz otomatik olarak düşülecek.
      </p>
      <button className="btn btn-primary" onClick={handleJoin} disabled={joining}>
        {joining ? 'Katılınıyor...' : 'Katıl'}
      </button>
      {error && <p className="status-banner is-error">{error}</p>}
    </div>
  );
}
