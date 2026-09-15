import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useCompetition } from '../hooks/useCompetition';
import { useSpectatorQuestion } from '../hooks/useSpectatorQuestion';

function isVideoUrl(url) {
  return /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url || '');
}

export default function Spectate() {
  const { competitionId } = useParams();
  const { competition, loading } = useCompetition(competitionId);
  const question = useSpectatorQuestion(competition?.current_question_id);

  const [secondsLeft, setSecondsLeft] = useState(null);
  const [revealData, setRevealData] = useState(null);

  useEffect(() => {
    setRevealData(null);
  }, [question?.id]);

  useEffect(() => {
    if (!question?.question_ends_at) {
      setSecondsLeft(null);
      return;
    }

    const endsAt = new Date(question.question_ends_at).getTime();

    const tick = () => {
      const remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setSecondsLeft(remaining);

      if (remaining === 0 && !revealData) {
        supabase.rpc('get_question_reveal', { p_question_id: question.id }).then(({ data, error }) => {
          if (data && !error) setRevealData(data);
        });
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [question, revealData]);

  if (loading) return <div className="stage"><p className="muted">Yükleniyor...</p></div>;
  if (!competition) return <div className="stage"><h2>Yarışma bulunamadı</h2></div>;

  if (competition.status === 'scheduled') {
    return (
      <div className="stage">
        <h1>{competition.title}</h1>
        <p className="muted" style={{ marginTop: '1rem' }}>
          Yarışma henüz başlamadı. Başlangıç: {new Date(competition.start_time).toLocaleString('tr-TR')}
        </p>
      </div>
    );
  }

  if (competition.status === 'cancelled') {
    return (
      <div className="stage">
        <h1>Bu yarışma iptal edildi</h1>
      </div>
    );
  }

  if (competition.status === 'awaiting_tiebreak') {
    return (
      <div className="stage">
        <h1>Ek soru bekleniyor</h1>
        <p className="muted" style={{ marginTop: '1rem' }}>Yarışmacılar arasında eşitlik oldu, yeni bir soru geliyor.</p>
      </div>
    );
  }

  if (competition.status === 'finished') {
    return (
      <div className="stage">
        <div className="gold-text font-display" style={{ fontSize: '3rem' }}>Yarışma bitti</div>
        <p className="muted" style={{ marginTop: '1rem' }}>Sonuçları "Yarışma sonuçları" sayfasından görebilirsiniz.</p>
      </div>
    );
  }

  if (competition.status === 'active' && !question) {
    return (
      <div className="stage">
        <h1>{competition.title}</h1>
        <p className="muted" style={{ marginTop: '0.5rem' }}>İlk soru birazdan geliyor...</p>
      </div>
    );
  }

  if (competition.status === 'active' && question) {
    const isRevealing = !!revealData;
    const voteFor = (opt) => revealData?.find((r) => r.option_letter === opt)?.vote_count ?? 0;
    const totalVotes = revealData?.reduce((s, r) => s + Number(r.vote_count), 0) ?? 0;
    const correctOption = revealData?.[0]?.correct_option;

    return (
      <div className="stage">
        <p className="muted">{competition.title} · İzleyici modu</p>

        <div className="room-topbar">
          <div className="room-topbar-item room-topbar-item-big">
            <span className="label">Soru</span>
            <span className="value">{question.order_index}</span>
          </div>
        </div>

        <div className="room-central-countdown">{isRevealing ? '' : (secondsLeft ?? '...')}</div>

        {question.image_url && (
          isVideoUrl(question.image_url) ? (
            <video src={question.image_url} className="room-media" autoPlay muted loop playsInline />
          ) : (
            <img src={question.image_url} alt="Soru görseli" className="room-media" />
          )
        )}

        <h1 className="stage-question">{question.text}</h1>

        <div className="room-options">
          {['a', 'b', 'c', 'd'].map((opt) => {
            if (!isRevealing) {
              return (
                <div key={opt} className="option-btn" style={{ cursor: 'default' }}>
                  <span className="option-letter">{opt.toUpperCase()}</span>
                  {question[`option_${opt}`]}
                </div>
              );
            }
            const votes = voteFor(opt);
            const pct = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);
            const isCorrect = correctOption === opt;
            return (
              <div key={opt} className={`reveal-row ${isCorrect ? 'is-correct' : ''}`}>
                <div className="reveal-fill" style={{ width: `${pct}%` }} />
                <div className="reveal-content">
                  <span>
                    <span className="option-letter">{opt.toUpperCase()}</span>
                    {question[`option_${opt}`]}
                  </span>
                  <span className="muted">{votes} kişi ({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return <div className="stage"><p className="muted">Yükleniyor...</p></div>;
}
