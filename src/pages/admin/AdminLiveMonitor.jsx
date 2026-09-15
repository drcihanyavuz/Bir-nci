import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AdminLiveMonitor() {
  const [competitions, setCompetitions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    supabase
      .from('competitions')
      .select('*')
      .in('status', ['scheduled', 'active', 'awaiting_tiebreak'])
      .order('start_time')
      .then(({ data }) => setCompetitions(data ?? []));
  }, []);

  const loadParticipants = async (competitionId) => {
    const { data } = await supabase
      .from('participants')
      .select('id, is_eliminated, joined_at, profiles(full_name)')
      .eq('competition_id', competitionId)
      .order('is_eliminated')
      .order('joined_at');
    setParticipants(data ?? []);
  };

  useEffect(() => {
    if (!selectedId) return;
    loadParticipants(selectedId);

    const channel = supabase
      .channel(`live-monitor-${selectedId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants', filter: `competition_id=eq.${selectedId}` },
        () => loadParticipants(selectedId)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [selectedId]);

  const activeCount = participants.filter((p) => !p.is_eliminated).length;

  return (
    <div className="page-wide">
      <h1>Canlı izleme</h1>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
        {competitions.map((c) => (
          <button
            key={c.id}
            className={`btn ${selectedId === c.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSelectedId(c.id)}
          >
            {c.title}
          </button>
        ))}
        {competitions.length === 0 && <p className="muted">Şu an izlenecek bir yarışma yok.</p>}
      </div>

      {selectedId && (
        <>
          <p className="muted" style={{ marginTop: '1.5rem' }}>
            {activeCount} kişi hâlâ yarışıyor / toplam {participants.length} katılımcı
          </p>

          <div style={{ marginTop: '1rem' }}>
            {participants.map((p) => (
              <div className="list-row" key={p.id}>
                <span>{p.profiles?.full_name ?? 'İsimsiz'}</span>
                <span className={p.is_eliminated ? 'muted' : 'gold-text'}>
                  {p.is_eliminated ? 'Elendi' : 'Yarışıyor'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
