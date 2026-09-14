import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AdminLiveMonitor() {
  const [competitions, setCompetitions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeCount, setActiveCount] = useState(null);
  const [totalCount, setTotalCount] = useState(null);
  const [showList, setShowList] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    supabase
      .from('competitions')
      .select('*')
      .in('status', ['scheduled', 'active', 'awaiting_tiebreak'])
      .order('start_time')
      .then(({ data }) => setCompetitions(data ?? []));
  }, []);

  useEffect(() => {
    if (!selectedId) return undefined;

    const refreshCounts = async () => {
      const [{ data: active }, { count }] = await Promise.all([
        supabase.rpc('get_active_participant_count', { p_competition_id: selectedId }),
        supabase
          .from('participants')
          .select('id', { count: 'exact', head: true })
          .eq('competition_id', selectedId),
      ]);
      setActiveCount(typeof active === 'number' ? active : null);
      setTotalCount(count ?? null);
    };

    refreshCounts();
    const interval = setInterval(refreshCounts, 4000);
    return () => clearInterval(interval);
  }, [selectedId]);

  const loadParticipants = async () => {
    setLoadingList(true);
    setShowList(true);
    const { data } = await supabase
      .from('participants')
      .select('id, is_eliminated, joined_at, profiles(full_name)')
      .eq('competition_id', selectedId)
      .eq('is_eliminated', false)
      .order('joined_at')
      .limit(100);
    setParticipants(data ?? []);
    setLoadingList(false);
  };

  return (
    <div className="page-wide">
      <h1>Canlı izleme</h1>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
        {competitions.map((c) => (
          <button
            key={c.id}
            className={`btn ${selectedId === c.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => {
              setSelectedId(c.id);
              setShowList(false);
              setParticipants([]);
            }}
          >
            {c.title}
          </button>
        ))}
        {competitions.length === 0 && <p className="muted">Şu an izlenecek bir yarışma yok.</p>}
      </div>

      {selectedId && (
        <>
          <p className="muted" style={{ marginTop: '1.5rem' }}>
            {activeCount ?? '...'} kişi hâlâ yarışıyor / toplam {totalCount ?? '...'} katılımcı
          </p>
          <p className="muted">
            Bin kişilik odada isim listesi canlı tutulmaz; sayılar birkaç saniyede bir yenilenir.
          </p>
          <button className="btn btn-ghost" style={{ marginTop: '0.75rem' }} onClick={loadParticipants}>
            Hayatta kalan ilk 100 kişiyi göster
          </button>

          {showList && (
            <div style={{ marginTop: '1rem' }}>
              {loadingList && <p className="muted">Yükleniyor...</p>}
              {participants.map((p) => (
                <div className="list-row" key={p.id}>
                  <span>{p.profiles?.full_name ?? 'İsimsiz'}</span>
                  <span className="gold-text">Yarışıyor</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
