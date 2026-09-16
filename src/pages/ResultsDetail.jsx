import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function ResultsDetail() {
  const { competitionId } = useParams();
  const [rows, setRows] = useState([]);
  const [questionCount, setQuestionCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: resultRows } = await supabase
        .from('public_results')
        .select('*')
        .eq('competition_id', competitionId)
        .order('rank');
      setRows(resultRows ?? []);

      const { count } = await supabase
        .from('spectator_questions')
        .select('id', { count: 'exact', head: true })
        .eq('competition_id', competitionId);
      setQuestionCount(count ?? null);

      setLoading(false);
    };
    load();
  }, [competitionId]);

  if (loading) return <div className="page">Yükleniyor...</div>;
  if (rows.length === 0) return <div className="page">Bu yarışma için sonuç bulunamadı.</div>;

  const comp = rows[0];

  return (
    <div className="page">
      <p><Link to="/results">← Tüm sonuçlar</Link></p>
      <h1>🏆 {comp.competition_title || 'İsimsiz yarışma'}</h1>
      <p className="muted" style={{ marginTop: '0.5rem' }}>
        {new Date(comp.start_time).toLocaleString('tr-TR')}
      </p>
      <p className="muted">
        {comp.participant_count ?? '—'} katılımcı{questionCount ? ` · ${questionCount} soru` : ''}
      </p>

      <div style={{ marginTop: '1.5rem' }}>
        {rows.map((row) => {
          const medal = row.rank === 1 ? '👑' : row.rank === 2 ? '🥈' : '🥉';
          return (
            <div className="results-row" key={row.rank}>
              <span className="rank-badge">{medal} {row.rank}.</span>
              <span style={{ flex: 1 }}>{row.full_name || 'İsimsiz üye'}</span>
              {row.prize && <span className="gold-text">{row.prize}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
