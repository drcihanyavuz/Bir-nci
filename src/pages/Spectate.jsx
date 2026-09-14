import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useCompetition } from '../hooks/useCompetition';
import { useSpectatorQuestion } from '../hooks/useSpectatorQuestion';
import { useCountdownTo } from '../hooks/useCountdownTo';
import { useLiveChannel } from '../hooks/useLiveChannel';
import { getCoordinatorKey, scheduleCoordinatedCall } from '../lib/liveCoordinator';

const REVEAL_DURATION_SECONDS = 20;

function isVideoUrl(url) {
  return /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url || '');
}

export default function Spectate() {
  const { competitionId } = useParams();
  const { competition, loading } = useCompetition(competitionId);
  const question = useSpectatorQuestion(competition?.current_question_id);
  const coordKey = getCoordinatorKey();

  const [revealData, setRevealData] = useState(null);
  const revealQuestionId = useRef(null);
  const latestQuestionId = useRef(null);
  latestQuestionId.current = question?.id ?? null;

  const startCountdown = useCountdownTo(
    competition?.status === 'scheduled' ? competition.start_time : null
  );
  const lobbyCountdown = useCountdownTo(
    competition?.status === 'active' && !competition?.current_question_id
      ? competition.first_question_reveal_at
      : null
  );
  const secondsLeft = useCountdownTo(question?.question_ends_at);
  const revealEndsAt = question?.question_ends_at
    ? new Date(new Date(question.question_ends_at).getTime() + REVEAL_DURATION_SECONDS * 1000).toISOString()
    : null;
  const revealCountdown = useCountdownTo(secondsLeft === 0 ? revealEndsAt : null);

  const handleReveal = useCallback((payload) => {
    if (!payload?.questionId || payload.questionId !== latestQuestionId.current) return;
    if (payload.rows) {
      revealQuestionId.current = payload.questionId;
      setRevealData(payload.rows);
    }
  }, []);

  const { sendReveal } = useLiveChannel(competitionId, { onReveal: handleReveal });

  useEffect(() => {
    setRevealData(null);
    revealQuestionId.current = null;
  }, [question?.id]);

  useEffect(() => {
    if (!question?.id || !question.question_ends_at) return undefined;
    const wait = Math.max(0, new Date(question.question_ends_at).getTime() - Date.now());
    let cancelInner = () => {};
    const startTimer = setTimeout(() => {
      cancelInner = scheduleCoordinatedCall(`${coordKey}:${question.id}:spectate-reveal`, async () => {
        if (revealQuestionId.current === question.id) return;
        const { data, error } = await supabase.rpc('get_question_reveal', {
          p_question_id: question.id,
        });
        if (!data || error) return;
        revealQuestionId.current = question.id;
        setRevealData(data);
        sendReveal({ questionId: question.id, rows: data });
      });
    }, wait);
    return () => {
      clearTimeout(startTimer);
      cancelInner();
    };
  }, [question?.id, question?.question_ends_at, coordKey, sendReveal]);

  if (loading) return <div className="stage"><p className="muted">Yükleniyor...</p></div>;
  if (!competition) return <div className="stage"><h2>Yarışma bulunamadı</h2></div>;

  if (competition.status === 'scheduled') {
    return (
      <div className="stage">
        <h1>{competition.title}</h1>
        <p className="muted" style={{ marginTop: '1rem' }}>
          Yarışma henüz başlamadı. Başlangıç: {new Date(competition.start_time).toLocaleString('tr-TR')}
        </p>
        <div className="stage-countdown" style={{ marginTop: '1.5rem' }}>
          {formatClock(startCountdown)}
        </div>
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
        {lobbyCountdown !== null && (
          <div className="stage-countdown" style={{ marginTop: '1.5rem' }}>{lobbyCountdown}</div>
        )}
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

        <div className="room-central-countdown">
          {isRevealing ? revealCountdown : (secondsLeft ?? '...')}
        </div>
        {isRevealing && (
          <p style={{ textAlign: 'center', marginTop: '-0.75rem', fontWeight: 700, letterSpacing: '0.03em' }}>
            SIRADAKİ SORU GELİYOR
          </p>
        )}

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
